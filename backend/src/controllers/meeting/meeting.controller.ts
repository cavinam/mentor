import { Request, Response, NextFunction } from "express";
import prisma from "../../utils/prisma";
import {
  UserRole,
  BookingStatus,
  ApprovalStatus,
  Prisma,
} from "@prisma/client";

import { sendEmail } from "../../utils/email";

export const createMeeting = async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "User not authenticated." });
    }
    const {
      departmentId,
      meetingRoomId,
      isGenbaVisit,
      gtimName,
      visitorName,
      companyName,
      startDate,
      endDate,
      startTime,
      endTime,
      agenda,
      equipmentIds,
      equipmentQuantities,
      request,
    } = req.body;

    const userId = req.user.id;

    // --- Validasi Awal: Pastikan equipmentQuantities ada dan ukurannya sesuai
    if (
      equipmentIds &&
      equipmentQuantities &&
      equipmentIds.length !== equipmentQuantities.length
    ) {
      return res.status(400).json({
        message: "Jumlah 'equipmentIds' dan 'equipmentQuantities' harus sama.",
      });
    }

    // --- LOGIKA CEK BENTROKAN JADWAL RUANGAN ---
    if (!isGenbaVisit && meetingRoomId) {
      const conflictingMeetings = await prisma.meeting.findMany({
        where: {
          meetingRoomId,
          isDeleted: false,
          overallStatus: {
            in: [BookingStatus.PENDING, BookingStatus.APPROVED],
          },
          AND: {
            startDate: { lte: new Date(endDate) },
            endDate: { gte: new Date(startDate) },
          },
          OR: [
            {
              startTime: { lte: endTime },
              endTime: { gte: startTime },
            },
            {
              startTime: { lte: startTime },
              endTime: { gte: endTime },
            },
          ],
        },
      });

      if (conflictingMeetings.length > 0) {
        return res
          .status(409)
          .json({ message: "Ruang rapat sudah dipesan pada waktu tersebut." });
      }
    }
    // --- AKHIR LOGIKA CEK BENTROKAN RUANGAN ---

    // --- LOGIKA TAMBAHAN UNTUK CEK KETERSEDIAAN PERALATAN ---
    const conflictMessages: string[] = []; // Array baru untuk menampung pesan error

    if (equipmentIds && equipmentIds.length > 0) {
      for (let i = 0; i < equipmentIds.length; i++) {
        const equipmentId = equipmentIds[i];
        const requestedQuantity = equipmentQuantities[i] || 1;

        const equipment = await prisma.equipment.findUnique({
          where: { id: equipmentId },
        });

        if (!equipment) {
          conflictMessages.push(
            `Peralatan dengan ID ${equipmentId} tidak ditemukan.`
          );
          continue; // Lanjutkan ke peralatan berikutnya
        }

        const conflictingBookings = await prisma.meetingEquipment.findMany({
          where: {
            equipmentId,
            meeting: {
              isDeleted: false,
              overallStatus: {
                in: [
                  BookingStatus.PENDING,
                  BookingStatus.APPROVED,
                  BookingStatus.PARTIALLY_APPROVED,
                ],
              },
              AND: [
                { startDate: { lte: new Date(endDate) } },
                { endDate: { gte: new Date(startDate) } },
                {
                  OR: [
                    {
                      startTime: { lte: endTime },
                      endTime: { gte: startTime },
                    },
                    {
                      startTime: { lte: startTime },
                      endTime: { gte: endTime },
                    },
                  ],
                },
              ],
            },
          },
        });

        const bookedQuantity = conflictingBookings.reduce(
          (sum, booking) => sum + booking.quantity,
          0
        );
        const availableQuantity = equipment.quantity - bookedQuantity;

        if (requestedQuantity > availableQuantity) {
          conflictMessages.push(
            `Peralatan '${equipment.name}' tidak tersedia sebanyak ${requestedQuantity} unit pada waktu tersebut. Tersisa: ${availableQuantity} unit.`
          );
        }
      }
    }

    // Cek apakah ada pesan error yang terkumpul
    if (conflictMessages.length > 0) {
      return res.status(409).json({
        message: "Gagal membuat meeting karena konflik ketersediaan.",
        conflicts: conflictMessages,
      });
    }
    // --- AKHIR LOGIKA CEK KETERSEDIAAN PERALATAN ---

    // Buat entri Meeting baru
    const newMeeting = await prisma.meeting.create({
      data: {
        agenda,
        gtimName,
        visitorName,
        companyName: companyName ?? "",
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        startTime,
        endTime,
        request,
        isGenbaVisit: isGenbaVisit ?? false,
        overallStatus: BookingStatus.PENDING,
        user: { connect: { id: userId } },
        department: { connect: { id: departmentId } },
        meetingRoom: meetingRoomId
          ? { connect: { id: meetingRoomId } }
          : undefined,
      },
    });

    if (equipmentIds && equipmentIds.length > 0) {
      const equipmentData = equipmentIds.map(
        (equipmentId: string, index: number) => ({
          meetingId: newMeeting.id,
          equipmentId: equipmentId,
          quantity: equipmentQuantities[index] || 1,
        })
      );
      await prisma.meetingEquipment.createMany({
        data: equipmentData,
      });
    }

    const approvers = await prisma.user.findMany({
      where: {
        OR: [
          { role: UserRole.ADMIN },
          { role: UserRole.HRGA_MANAGER },
          {
            role: UserRole.SECTION_HEAD,
            departmentId: departmentId,
          },
        ],
      },
      select: { id: true, email: true, fullName: true, role: true },
    });

    const approvalData = approvers.map((approver) => ({
      meetingId: newMeeting.id,
      approverId: approver.id,
      status: ApprovalStatus.PENDING,
    }));

    await prisma.meetingApproval.createMany({
      data: approvalData,
    });

    // Send email notification to Section Head and HRGA Manager
    for (const approver of approvers) {
      if (
        approver.role === UserRole.SECTION_HEAD ||
        approver.role === UserRole.HRGA_MANAGER
      ) {
        const subject = "New Meeting Booking Approval Needed";
        const html = `
            <p>Dear ${approver.fullName},</p>
            <p>A new meeting booking requires your approval.</p>
            <p>Meeting Agenda: ${newMeeting.agenda}</p>
            <p>Please <a href="http://mentor.gtim.local:80/approvals">log in to the system</a> to review and approve the booking.</p>
            <p>Thank you.</p>
          `;
        try {
          await sendEmail(approver.email, subject, html);
        } catch (error) {
          console.error("Failed to send approval email to", approver.email);
        }
      }
    }

    await prisma.history.create({
      data: {
        userId,
        meetingId: newMeeting.id,
        action: "Meeting created",
        details: { newMeetingId: newMeeting.id },
      },
    });

    return res.status(201).json(newMeeting);
  } catch (error: any) {
    console.error("Error creating meeting:", error);
    return res
      .status(500)
      .json({ message: "Failed to create meeting.", error: error.message });
  }
};
// Mendapatkan daftar semua booking (khusus ADMIN, SECTION_HEAD, HRGA_MANAGER)
export const getAllMeetings = async (req: Request, res: Response) => {
  try {
    const meetings = await prisma.meeting.findMany({
      where: {
        isDeleted: false,
      },
      select: {
        id: true,
        agenda: true,
        gtimName: true,
        visitorName: true,
        companyName: true,
        startDate: true,
        endDate: true,
        startTime: true,
        endTime: true,
        request: true,
        isGenbaVisit: true,
        overallStatus: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: { fullName: true, email: true },
        },
        department: {
          select: { id: true, name: true },
        },
        meetingRoom: {
          select: { name: true },
        },
        meetingEquipments: {
          include: {
            equipment: {
              select: { name: true, type: true },
            },
          },
        },
        approvals: {
          include: {
            approver: {
              select: { fullName: true, role: true },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json(meetings);
  } catch (error: any) {
    console.error("Error fetching meetings:", error);
    return res
      .status(500)
      .json({ message: "Failed to fetch meetings.", error: error.message });
  }
};
export const getMyMeetings = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const userDepartmentId = (req.user as any)?.departmentId;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated." });
    }

    // If user is SECTION_HEAD, return meetings filtered by department
    if (req.user?.role === "SECTION_HEAD" && userDepartmentId) {
      const meetings = await prisma.meeting.findMany({
        where: {
          isDeleted: false,
          departmentId: userDepartmentId,
          // Remove userId filter to show all meetings in the department for SECTION_HEAD
          // userId: userId,
        },
        select: {
          id: true,
          agenda: true,
          gtimName: true,
          visitorName: true,
          companyName: true,
          startDate: true,
          endDate: true,
          startTime: true,
          endTime: true,
          request: true,
          isGenbaVisit: true,
          overallStatus: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: { fullName: true, email: true },
          },
          department: {
            select: { id: true, name: true },
          },
          meetingRoom: {
            select: { name: true },
          },
          meetingEquipments: {
            include: {
              equipment: {
                select: { name: true, type: true },
              },
            },
          },
          approvals: {
            include: {
              approver: {
                select: { fullName: true, role: true },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return res.status(200).json(meetings);
    }

    // For other roles, return meetings created by the user
    const meetings = await prisma.meeting.findMany({
      where: {
        isDeleted: false,
        userId,
      },
      select: {
        id: true,
        agenda: true,
        gtimName: true,
        visitorName: true,
        companyName: true,
        startDate: true,
        endDate: true,
        startTime: true,
        endTime: true,
        request: true,
        isGenbaVisit: true,
        overallStatus: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: { fullName: true, email: true },
        },
        department: {
          select: { id: true, name: true },
        },
        meetingRoom: {
          select: { name: true },
        },
        meetingEquipments: {
          include: {
            equipment: {
              select: { name: true, type: true },
            },
          },
        },
        approvals: {
          include: {
            approver: {
              select: { fullName: true, role: true },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json(meetings);
  } catch (error: any) {
    console.error("Error fetching my meetings:", error);
    return res.status(500).json({
      message: "Failed to fetch my meetings.",
      error: error.message,
    });
  }
};

// Mendapatkan detail booking berdasarkan ID (semua role, tapi dibatasi)
export const getMeetingById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const meeting = await prisma.meeting.findUnique({
      where: {
        id,
        isDeleted: false,
      },
      select: {
        id: true,
        agenda: true,
        gtimName: true,
        visitorName: true,
        companyName: true,
        startDate: true,
        endDate: true,
        startTime: true,
        endTime: true,
        request: true,
        isGenbaVisit: true,
        overallStatus: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        user: {
          select: { fullName: true, email: true },
        },
        department: {
          select: { name: true },
        },
        meetingRoom: {
          select: { name: true },
        },
        meetingEquipments: {
          include: {
            equipment: {
              select: { name: true, type: true },
            },
          },
        },
        approvals: {
          include: {
            approver: {
              select: { fullName: true, role: true },
            },
          },
        },
      },
    });

    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found." });
    }

    // Hanya USER yang membuat booking atau ADMIN/APPROVER yang bisa melihat detail
    if (userRole === UserRole.USER && meeting.userId !== userId) {
      return res.status(403).json({
        message:
          "Akses ditolak, Anda tidak memiliki izin untuk melihat booking ini.",
      });
    }

    return res.status(200).json(meeting);
  } catch (error: any) {
    console.error("Error fetching meeting:", error);
    return res
      .status(500)
      .json({ message: "Failed to fetch meeting.", error: error.message });
  }
};

export const updateMeeting = async (req: Request, res: Response) => {
  try {
    const { meetingId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated." });
    }

    const {
      departmentId,
      meetingRoomId,
      startDate,
      endDate,
      startTime,
      endTime,
      agenda,
      equipmentIds,
      equipmentQuantities,
      request,
      allDay,
      visitorName,
      companyName,
      gtimName,
    } = req.body;

    const existingMeeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: {
        user: true,
        approvals: true,
      },
    });

    if (!existingMeeting) {
      return res.status(404).json({ message: "Meeting not found." });
    }

    const isOwner = existingMeeting.user.id === userId;
    const isAdmin =
      req.user?.role === UserRole.ADMIN ||
      req.user?.role === UserRole.HRGA_MANAGER ||
      req.user?.role === UserRole.SECTION_HEAD;

    if (!isOwner && !isAdmin) {
      return res
        .status(403)
        .json({ message: "You are not authorized to update this meeting." });
    }

    const isTimeOrRoomChanged =
      (startDate &&
        new Date(startDate).toISOString() !==
          existingMeeting.startDate?.toISOString()) ||
      (endDate &&
        new Date(endDate).toISOString() !==
          existingMeeting.endDate?.toISOString()) ||
      (startTime && startTime !== existingMeeting.startTime) ||
      (endTime && endTime !== existingMeeting.endTime) ||
      (meetingRoomId && meetingRoomId !== existingMeeting.meetingRoomId);

    const conflictMessages: string[] = [];
    const checkStartDate = startDate
      ? new Date(startDate)
      : existingMeeting.startDate;
    const checkEndDate = endDate ? new Date(endDate) : existingMeeting.endDate;
    const checkStartTime = startTime ?? existingMeeting.startTime;
    const checkEndTime = endTime ?? existingMeeting.endTime;

    // Cek konflik ruangan
    if (meetingRoomId) {
      const conflictingMeetings = await prisma.meeting.findMany({
        where: {
          meetingRoomId,
          isDeleted: false,
          NOT: { id: meetingId },
          overallStatus: {
            in: [BookingStatus.PENDING, BookingStatus.APPROVED],
          },
          AND: [
            { startDate: { lte: checkEndDate } },
            { endDate: { gte: checkStartDate } },
            {
              OR: [
                {
                  startTime: { lte: checkEndTime },
                  endTime: { gte: checkStartTime },
                },
                {
                  startTime: { gte: checkStartTime },
                  endTime: { lte: checkEndTime },
                },
              ],
            },
          ],
        },
      });

      if (conflictingMeetings.length > 0) {
        conflictMessages.push("Ruang rapat sudah dipesan pada waktu tersebut.");
      }
    }

    // Cek konflik peralatan
    if (equipmentIds && equipmentIds.length > 0) {
      for (let i = 0; i < equipmentIds.length; i++) {
        const equipmentId = equipmentIds[i];
        const requestedQuantity = equipmentQuantities?.[i] || 1;

        const equipment = await prisma.equipment.findUnique({
          where: { id: equipmentId },
        });

        if (!equipment) {
          conflictMessages.push(
            `Peralatan dengan ID ${equipmentId} tidak ditemukan.`
          );
          continue;
        }

        const conflictingBookings = await prisma.meetingEquipment.findMany({
          where: {
            equipmentId,
            meeting: {
              isDeleted: false,
              NOT: { id: meetingId },
              overallStatus: {
                in: [
                  BookingStatus.PENDING,
                  BookingStatus.APPROVED,
                  BookingStatus.PARTIALLY_APPROVED,
                ],
              },
              AND: [
                { startDate: { lte: checkEndDate } },
                { endDate: { gte: checkStartDate } },
                {
                  OR: [
                    {
                      startTime: { lte: checkEndTime },
                      endTime: { gte: checkStartTime },
                    },
                    {
                      startTime: { gte: checkStartTime },
                      endTime: { lte: checkEndTime },
                    },
                  ],
                },
              ],
            },
          },
        });

        const bookedQuantity = conflictingBookings.reduce(
          (sum, booking) => sum + booking.quantity,
          0
        );
        const availableQuantity = equipment.quantity - bookedQuantity;

        if (requestedQuantity > availableQuantity) {
          conflictMessages.push(
            `Peralatan '${equipment.name}' tidak tersedia sebanyak ${requestedQuantity} unit pada waktu tersebut. Tersisa: ${availableQuantity} unit.`
          );
        }
      }
    }

    if (conflictMessages.length > 0) {
      return res.status(409).json({
        message: "Gagal memperbarui meeting karena konflik ketersediaan.",
        conflicts: conflictMessages,
      });
    }

    // Perbarui entri meeting di database dengan data yang sudah ada
    const shouldResetToPending =
      existingMeeting.overallStatus === BookingStatus.APPROVED ||
      isTimeOrRoomChanged;

    const updatedMeeting = await prisma.meeting.update({
      where: { id: meetingId },
      data: {
        agenda: agenda ?? existingMeeting.agenda,
        request: request ?? existingMeeting.request,
        startDate: startDate ? new Date(startDate) : existingMeeting.startDate,
        endDate: endDate ? new Date(endDate) : existingMeeting.endDate,
        startTime: startTime ?? existingMeeting.startTime,
        endTime: endTime ?? existingMeeting.endTime,
        allDay: allDay ?? existingMeeting.allDay,
        visitorName: visitorName ?? existingMeeting.visitorName,
        companyName: companyName ?? existingMeeting.companyName,
        gtimName: gtimName ?? existingMeeting.gtimName,
        isGenbaVisit: req.body.isGenbaVisit ?? existingMeeting.isGenbaVisit,

        // Allow meeting room even for genba visits
        meetingRoom: meetingRoomId
          ? { connect: { id: meetingRoomId } }
          : undefined,

        department: departmentId
          ? { connect: { id: departmentId } }
          : undefined,

        overallStatus: shouldResetToPending
          ? BookingStatus.PENDING
          : existingMeeting.overallStatus,
      },
    });

    if (equipmentIds) {
      await prisma.meetingEquipment.deleteMany({
        where: { meetingId: meetingId },
      });
      const equipmentData = equipmentIds.map(
        (equipmentId: string, index: number) => ({
          meetingId: updatedMeeting.id,
          equipmentId: equipmentId,
          quantity: equipmentQuantities?.[index] || 1,
        })
      );
      await prisma.meetingEquipment.createMany({
        data: equipmentData,
      });
    }

    if (shouldResetToPending) {
      await prisma.meetingApproval.updateMany({
        where: { meetingId: meetingId },
        data: { status: ApprovalStatus.PENDING },
      });
    }

    await prisma.history.create({
      data: {
        userId,
        meetingId: updatedMeeting.id,
        action: "Meeting updated",
        details: { oldMeeting: existingMeeting, newMeeting: updatedMeeting },
      },
    });

    // Send email notification for meeting update
    try {
      const meetingDetails = await prisma.meeting.findUnique({
        where: { id: meetingId },
        include: {
          user: { select: { fullName: true, email: true } },
          department: { select: { id: true, name: true } },
          meetingRoom: { select: { name: true } },
        },
      });

      if (meetingDetails) {
        // Get HRGA Manager, Section Head from the department, and Admin users
        const notificationRecipients = await prisma.user.findMany({
          where: {
            OR: [
              { role: UserRole.HRGA_MANAGER },
              { role: UserRole.ADMIN },
              {
                role: UserRole.SECTION_HEAD,
                departmentId: meetingDetails.departmentId,
              },
            ],
          },
          select: { id: true, email: true, fullName: true, role: true },
        });

        const updaterName = meetingDetails.user?.fullName || "Unknown User";
        const subject = "Meeting Updated Notification";
        const html = `
          <p>Dear Team,</p>
          <p>A meeting has been updated in the system.</p>
          <p><strong>Meeting Details:</strong></p>
          <ul>
            <li><strong>Agenda:</strong> ${meetingDetails.agenda}</li>
            <li><strong>Department:</strong> ${
              meetingDetails.department?.name
            }</li>
            <li><strong>Meeting Room:</strong> ${
              meetingDetails.meetingRoom?.name || "Genba Visit"
            }</li>
            <li><strong>Updated by:</strong> ${updaterName}</li>
            <li><strong>Update Date:</strong> ${new Date().toLocaleDateString()}</li>
          </ul>
          <p>Please review the updated meeting details in the system at <a href="http://mentor.gtim.local:80/manage">http://mentor.gtim.local:80/manage</a>.</p>
          <p>Thank you.</p>
        `;

        // Send email to all recipients
        for (const recipient of notificationRecipients) {
          try {
            await sendEmail(recipient.email, subject, html);
          } catch (emailError) {
            console.error(
              "Failed to send update email to",
              recipient.email,
              emailError
            );
          }
        }
      }
    } catch (emailError) {
      console.error("Error sending update notifications:", emailError);
      // Don't fail the update if email fails
    }

    return res.status(200).json(updatedMeeting);
  } catch (error: any) {
    console.error("Error updating meeting:", error);
    return res
      .status(500)
      .json({ message: "Failed to update meeting.", error: error.message });
  }
};

// Mendapatkan daftar booking yang perlu disetujui oleh user yang login
export const getPendingApprovals = async (req: Request, res: Response) => {
  try {
    const approverId = req.user?.id;
    const userDepartmentId = (req.user as any)?.departmentId;
    const userRole = req.user?.role;

    const pendingMeetings = await prisma.meetingApproval.findMany({
      where: {
        approverId,
        // Remove filter on approval status to include all approvals for relevant meetings
        meeting: {
          overallStatus: {
            in:
              userRole === UserRole.ADMIN ||
              userRole === UserRole.HRGA_MANAGER ||
              userRole === UserRole.SECTION_HEAD
                ? [
                    BookingStatus.PENDING,
                    BookingStatus.PARTIALLY_APPROVED,
                    BookingStatus.REJECTED,
                  ]
                : [BookingStatus.PENDING, BookingStatus.REJECTED],
          },
          isDeleted: false,
          // Add department filter for SECTION_HEAD
          ...(userRole === UserRole.SECTION_HEAD && userDepartmentId
            ? { departmentId: userDepartmentId }
            : {}),
        },
      },
      select: {
        meeting: {
          select: {
            id: true,
            agenda: true,
            gtimName: true,
            visitorName: true,
            companyName: true,
            startDate: true,
            endDate: true,
            startTime: true,
            endTime: true,
            request: true,
            isGenbaVisit: true,
            overallStatus: true,
            createdAt: true,
            updatedAt: true,
            user: {
              select: { fullName: true, email: true },
            },
            department: {
              select: { id: true, name: true },
            },
            meetingRoom: {
              select: { name: true },
            },
            meetingEquipments: {
              include: {
                equipment: {
                  select: { name: true, type: true },
                },
              },
            },
            approvals: {
              include: {
                approver: {
                  select: { fullName: true, role: true },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Mengembalikan data meeting saja, bukan MeetingApproval
    const meetings = pendingMeetings.map((approval) => approval.meeting);

    return res.status(200).json(meetings);
  } catch (error: any) {
    console.error("Error fetching pending approvals:", error);
    return res.status(500).json({
      message: "Failed to fetch pending approvals.",
      error: error.message,
    });
  }
};

// Fungsi untuk menyetujui atau menolak booking
export const approveOrRejectMeeting = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // ID dari booking meeting
    const { status, remark } = req.body; // 'APPROVED' atau 'REJECTED', and remark for rejection
    const approverId = req.user?.id;
    const approverRole = req.user?.role;

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return res.status(400).json({
        message: "Status tidak valid. Gunakan 'APPROVED' atau 'REJECTED'.",
      });
    }

    let meetingApproval = null;

    if (approverRole === UserRole.ADMIN) {
      // Admin can approve/reject any meeting without explicit approval record
      meetingApproval = await prisma.meetingApproval.findFirst({
        where: {
          meetingId: id,
        },
        include: {
          meeting: {
            include: {
              user: true,
              approvals: true,
            },
          },
        },
      });
      if (!meetingApproval) {
        // If no approval records exist, fetch meeting for logging
        const meeting = await prisma.meeting.findUnique({
          where: { id },
          include: { user: true, approvals: true },
        });
        if (!meeting) {
          return res.status(404).json({ message: "Meeting not found." });
        }
        meetingApproval = {
          meeting,
        };
      }
    } else {
      meetingApproval = await prisma.meetingApproval.findUnique({
        where: {
          meetingId_approverId: {
            meetingId: id,
            approverId: approverId!,
          },
        },
        include: {
          meeting: {
            include: {
              user: true,
              approvals: true,
            },
          },
        },
      });

      if (!meetingApproval) {
        return res
          .status(404)
          .json({ message: "Persetujuan tidak ditemukan untuk user ini." });
      }

      if (approverRole === UserRole.SECTION_HEAD) {
        const userDepartmentId = meetingApproval.meeting.user.departmentId;
        const approverDepartment = await prisma.user.findUnique({
          where: { id: approverId },
          select: { departmentId: true },
        });
        if (userDepartmentId !== approverDepartment?.departmentId) {
          return res.status(403).json({
            message:
              "Akses ditolak. Anda hanya dapat menyetujui booking dari departemen Anda.",
          });
        }
      }
    }

    // Update or create approval record for admin if needed
    if (approverRole === UserRole.ADMIN) {
      // Check if approval record exists for admin
      const existingApproval = await prisma.meetingApproval.findUnique({
        where: {
          meetingId_approverId: {
            meetingId: id,
            approverId: approverId!,
          },
        },
      });
      if (existingApproval) {
        await prisma.meetingApproval.update({
          where: {
            meetingId_approverId: {
              meetingId: id,
              approverId: approverId!,
            },
          },
          data: {
            status: status as ApprovalStatus,
            approvedAt: new Date(),
            remark: remark || null,
          },
        });
      } else {
        // Create approval record for admin
        await prisma.meetingApproval.create({
          data: {
            meetingId: id,
            approverId: approverId!,
            status: status as ApprovalStatus,
            approvedAt: new Date(),
            remark: remark || null,
          },
        });
      }
    } else {
      await prisma.meetingApproval.update({
        where: {
          meetingId_approverId: {
            meetingId: id,
            approverId: approverId!,
          },
        },
        data: {
          status: status as ApprovalStatus,
          approvedAt: new Date(),
          remark: remark || null,
        },
      });
    }

    // --- LOGIKA PEMBARUAN STATUS KESELURUHAN (overallStatus) ---
    // Ambil ulang semua persetujuan setelah persetujuan saat ini diperbarui
    let newOverallStatus: BookingStatus;

    if (
      approverRole === UserRole.ADMIN ||
      approverRole === UserRole.HRGA_MANAGER
    ) {
      // If admin or HRGA manager approves/rejects, override all approvals and set overallStatus directly
      newOverallStatus =
        status === "APPROVED" ? BookingStatus.APPROVED : BookingStatus.REJECTED;

      // Update all approvals to match admin/HRGA manager decision
      await prisma.meetingApproval.updateMany({
        where: { meetingId: id },
        data: { status: status as ApprovalStatus },
      });
    } else {
      const allApprovals = await prisma.meetingApproval.findMany({
        where: { meetingId: id },
      });

      const isRejected = allApprovals.some(
        (approval) => approval.status === ApprovalStatus.REJECTED
      );
      const allApproved = allApprovals.every(
        (approval) => approval.status === ApprovalStatus.APPROVED
      );
      const someApproved = allApprovals.some(
        (approval) => approval.status === ApprovalStatus.APPROVED
      );

      if (isRejected) {
        newOverallStatus = BookingStatus.REJECTED;
      } else if (allApproved) {
        newOverallStatus = BookingStatus.APPROVED;
      } else if (someApproved) {
        newOverallStatus = BookingStatus.PARTIALLY_APPROVED;
      } else {
        newOverallStatus = BookingStatus.PENDING;
      }
    }

    await prisma.meeting.update({
      where: { id },
      data: { overallStatus: newOverallStatus },
    });

    await prisma.history.create({
      data: {
        userId: approverId,
        meetingId: id,
        action: `Meeting ${status.toLowerCase()} by ${approverRole}`,
        details: { newStatus: status, approverRole: approverRole, remark },
      },
    });

    // Send immediate email notification for rejection (not just when final status is REJECTED)
    if (status === "REJECTED") {
      // Get meeting details for email
      const meeting = await prisma.meeting.findUnique({
        where: { id },
        include: {
          user: { select: { email: true, fullName: true } },
          approvals: {
            include: {
              approver: {
                select: { role: true, email: true, fullName: true },
              },
            },
          },
        },
      });

      if (meeting) {
        const userEmail = meeting.user?.email;
        const userName = meeting.user?.fullName || "User";
        const adminApprovers = meeting.approvals
          .filter((a) => a.approver.role === UserRole.ADMIN)
          .map((a) => a.approver.email);

        // Get the current approver's name for the email
        const currentApprover = meeting.approvals.find(
          (a) => a.approverId === approverId
        );
        const approverName =
          currentApprover?.approver?.fullName || "Unknown Approver";

        const subject = "Meeting Rejected Notification";
        const html = `
          <p>Dear ${userName},</p>
          <p>Your meeting booking with agenda "${
            meeting.agenda
          }" has been rejected by ${approverName}.</p>
          <p><strong>Reason:</strong> ${
            remark || "No specific reason provided"
          }</p>
          <p>If you have any questions about this rejection, please contact your supervisor or the meeting approver.</p>
          <p>You can view your meetings at <a href="http://mentor.gtim.local:80/manage">http://mentor.gtim.local:80/manage</a>.</p>
          <p>Thank you.</p>
        `;

        try {
          if (userEmail) {
            await sendEmail(userEmail, subject, html);
          }
          // Send email to admins
          for (const adminEmail of adminApprovers) {
            await sendEmail(adminEmail, subject, html);
          }
        } catch (error) {
          console.error("Failed to send immediate rejection email:", error);
        }
      }
    }

    // Send email notification when meeting is fully approved
    if (newOverallStatus === BookingStatus.APPROVED) {
      // Get user and admin emails
      const meeting = await prisma.meeting.findUnique({
        where: { id },
        include: {
          user: { select: { email: true, fullName: true } },
          approvals: {
            include: {
              approver: {
                select: { role: true, email: true, fullName: true },
              },
            },
          },
        },
      });

      if (meeting) {
        // Use email from user data as receiver
        const userEmail = meeting.user?.email;
        const userName = meeting.user?.fullName || "User";
        const adminApprovers = meeting.approvals
          .filter((a) => a.approver.role === UserRole.ADMIN)
          .map((a) => a.approver.email);

        const subject = "Meeting Approved Notification";
        const html = `
          <p>Dear ${userName},</p>
          <p>Your meeting booking with agenda "${meeting.agenda}" has been fully approved.</p>
          <p>You can view your approved meetings at <a href="http://mentor.gtim.local:80/manage">http://mentor.gtim.local:80/manage</a>.</p>
          <p>Thank you.</p>
        `;

        try {
          if (userEmail) {
            // Send email to user
            await sendEmail(userEmail, subject, html);
          }
          // Send email to admins
          for (const adminEmail of adminApprovers) {
            await sendEmail(adminEmail, subject, html);
          }
        } catch (error) {
          console.error("Failed to send final approval email:", error);
        }
      }
    }

    return res
      .status(200)
      .json({ message: `Meeting berhasil ${status.toLowerCase()}.` });
  } catch (error: any) {
    console.error("Error approving/rejecting meeting:", error);
    return res.status(500).json({
      message: "Failed to approve/reject meeting.",
      error: error.message,
    });
  }
};

// ===============================================
// CANCEL MEETING
// ===============================================
export const cancelMeeting = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { remark } = req.body; // Remark for cancellation
    const userId = req.user?.id; // ID user yang membatalkan meeting
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated." });
    }

    const meeting = await prisma.meeting.findUnique({
      where: { id },
    });

    if (!meeting) {
      return res.status(404).json({ message: "Meeting tidak ditemukan." });
    }

    // --- LOGIKA OTORISASI YANG DIPERBAIKI ---
    // Hanya pemilik meeting, ADMIN, atau HRGA_MANAGER yang bisa membatalkan
    const isOwner = meeting.userId === userId;
    const isAdminOrHRGA =
      userRole === UserRole.ADMIN || userRole === UserRole.HRGA_MANAGER;

    if (!isOwner && !isAdminOrHRGA) {
      return res.status(403).json({
        message:
          "Akses ditolak. Anda hanya bisa membatalkan meeting Anda sendiri kecuali Anda Admin.",
      });
    }

    // --- VALIDASI TAMBAHAN ---
    // Pastikan meeting bisa dibatalkan (belum berakhir)
    const now = new Date();
    const meetingEndDate = new Date(meeting.endDate);
    meetingEndDate.setHours(
      parseInt(meeting.endTime.split(":")[0]),
      parseInt(meeting.endTime.split(":")[1])
    );

    if (now > meetingEndDate) {
      return res.status(400).json({
        message: "Tidak dapat membatalkan meeting yang sudah selesai.",
      });
    }

    if (meeting.overallStatus === BookingStatus.CANCELED) {
      return res.status(400).json({
        message: "Meeting ini sudah dibatalkan sebelumnya.",
      });
    }

    // Perbarui status meeting menjadi CANCELED
    const canceledMeeting = await prisma.meeting.update({
      where: { id },
      data: { overallStatus: BookingStatus.CANCELED },
    });

    // Opsional: Buat entri history
    await prisma.history.create({
      data: {
        userId: userId,
        meetingId: id,
        action: "Meeting canceled",
        details: { newStatus: BookingStatus.CANCELED, remark },
      },
    });

    // Send email notification based on who is cancelling
    try {
      const meetingDetails = await prisma.meeting.findUnique({
        where: { id },
        include: {
          user: { select: { fullName: true, email: true } },
          department: { select: { id: true, name: true } },
        },
      });

      if (meetingDetails) {
        let notificationRecipients;
        let subject;
        let html;

        const cancelerName = meetingDetails.user?.fullName || "Unknown User";

        // Different notification logic based on who is cancelling
        if (userRole === UserRole.USER) {
          // When USER cancels meeting → send to ADMIN, HRGA MANAGER, and SECTION HEAD
          notificationRecipients = await prisma.user.findMany({
            where: {
              OR: [
                { role: UserRole.HRGA_MANAGER },
                { role: UserRole.ADMIN },
                {
                  role: UserRole.SECTION_HEAD,
                  departmentId: meetingDetails.departmentId,
                },
              ],
            },
            select: { id: true, email: true, fullName: true, role: true },
          });

          subject = "Meeting Cancellation Notification";
          html = `
            <p>Dear Team,</p>
            <p>A meeting has been cancelled by a user in the system.</p>
            <p><strong>Meeting Details:</strong></p>
            <ul>
              <li><strong>Agenda:</strong> ${meetingDetails.agenda}</li>
              <li><strong>Department:</strong> ${
                meetingDetails.department?.name
              }</li>
              <li><strong>Cancelled by:</strong> ${cancelerName} (User)</li>
              <li><strong>Cancellation Date:</strong> ${new Date().toLocaleDateString()}</li>
              ${remark ? `<li><strong>Reason:</strong> ${remark}</li>` : ""}
            </ul>
            <p>Please update your records accordingly. You can view all meetings at <a href="http://mentor.gtim.local:80/manage">http://mentor.gtim.local:80/manage</a>.</p>
            <p>Thank you.</p>
          `;
        } else if (userRole === UserRole.SECTION_HEAD) {
          // When SECTION HEAD cancels meeting → send to ADMIN, HRGA MANAGER, and the USER who created the meeting
          notificationRecipients = await prisma.user.findMany({
            where: {
              OR: [
                { role: UserRole.HRGA_MANAGER },
                { role: UserRole.ADMIN },
                { id: meetingDetails.userId }, // The user who created the meeting
              ],
            },
            select: { id: true, email: true, fullName: true, role: true },
          });

          subject = "Meeting Cancellation Notification";
          html = `
            <p>Dear Team,</p>
            <p>A meeting has been cancelled by the Section Head in the system.</p>
            <p><strong>Meeting Details:</strong></p>
            <ul>
              <li><strong>Agenda:</strong> ${meetingDetails.agenda}</li>
              <li><strong>Department:</strong> ${
                meetingDetails.department?.name
              }</li>
              <li><strong>Cancelled by:</strong> ${cancelerName} (Section Head)</li>
              <li><strong>Cancellation Date:</strong> ${new Date().toLocaleDateString()}</li>
              ${remark ? `<li><strong>Reason:</strong> ${remark}</li>` : ""}
            </ul>
            <p>Please update your records accordingly. You can view all meetings at <a href="http://mentor.gtim.local:80/manage">http://mentor.gtim.local:80/manage</a>.</p>
            <p>Thank you.</p>
          `;
        } else {
          // For ADMIN or HRGA_MANAGER, use the original logic
          notificationRecipients = await prisma.user.findMany({
            where: {
              OR: [
                { role: UserRole.HRGA_MANAGER },
                { role: UserRole.ADMIN },
                {
                  role: UserRole.SECTION_HEAD,
                  departmentId: meetingDetails.departmentId,
                },
              ],
            },
            select: { id: true, email: true, fullName: true, role: true },
          });

          subject = "Meeting Cancellation Notification";
          html = `
            <p>Dear Team,</p>
            <p>A meeting has been cancelled in the system.</p>
            <p><strong>Meeting Details:</strong></p>
            <ul>
              <li><strong>Agenda:</strong> ${meetingDetails.agenda}</li>
              <li><strong>Department:</strong> ${
                meetingDetails.department?.name
              }</li>
              <li><strong>Cancelled by:</strong> ${cancelerName}</li>
              <li><strong>Cancellation Date:</strong> ${new Date().toLocaleDateString()}</li>
              ${remark ? `<li><strong>Reason:</strong> ${remark}</li>` : ""}
            </ul>
            <p>Please update your records accordingly. You can view all meetings at <a href="http://mentor.gtim.local:80/manage">http://mentor.gtim.local:80/manage</a>.</p>
            <p>Thank you.</p>
          `;
        }

        // Send email to all recipients
        for (const recipient of notificationRecipients) {
          try {
            await sendEmail(recipient.email, subject, html);
          } catch (emailError) {
            console.error(
              "Failed to send cancellation email to",
              recipient.email,
              emailError
            );
          }
        }
      }
    } catch (emailError) {
      console.error("Error sending cancellation notifications:", emailError);
      // Don't fail the cancellation if email fails
    }

    return res.status(200).json({
      message: "Meeting berhasil dibatalkan.",
      meeting: canceledMeeting,
    });
  } catch (error: any) {
    console.error("Error canceling meeting:", error);
    return res
      .status(500)
      .json({ message: "Gagal membatalkan meeting.", error: error.message });
  }
};

// Endpoint ini HANYA boleh diakses oleh ADMIN dan HRGA_MANAGER
export const forceUpdateMeetingStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { newStatus }: { newStatus: BookingStatus } = req.body;

    // 1. Validasi Input: Pastikan status yang dikirim valid
    const validStatuses = Object.values(BookingStatus);
    if (!newStatus || !validStatuses.includes(newStatus)) {
      return res
        .status(400)
        .json({ message: "Status yang diberikan tidak valid." });
    }

    // 2. Cek apakah meeting ada
    const existingMeeting = await prisma.meeting.findUnique({
      where: { id },
    });

    if (!existingMeeting) {
      return res.status(404).json({ message: "Meeting tidak ditemukan." });
    }

    // 3. Update status meeting secara paksa
    const updatedMeeting = await prisma.meeting.update({
      where: { id },
      data: {
        overallStatus: newStatus,
      },
    });

    // 4. Jika status diubah menjadi APPROVED, kita juga bisa memperbarui persetujuan
    if (newStatus === BookingStatus.APPROVED) {
      // Tandai semua persetujuan sebagai APPROVED
      await prisma.meetingApproval.updateMany({
        where: { meetingId: id },
        data: { status: ApprovalStatus.APPROVED },
      });
    } else if (newStatus === BookingStatus.REJECTED) {
      // Tandai semua persetujuan sebagai REJECTED
      await prisma.meetingApproval.updateMany({
        where: { meetingId: id },
        data: { status: ApprovalStatus.REJECTED },
      });
    }

    // 5. Buat entri history
    await prisma.history.create({
      data: {
        userId: req.user?.id, // ID Admin yang melakukan perubahan
        meetingId: updatedMeeting.id,
        action: `Meeting status updated by admin from ${existingMeeting.overallStatus} to ${newStatus}`,
        details: { oldMeeting: existingMeeting, newMeeting: updatedMeeting },
      },
    });

    return res.status(200).json(updatedMeeting);
  } catch (error: any) {
    console.error("Error force updating meeting status:", error);
    return res
      .status(500)
      .json({ message: "Gagal memperbarui status meeting." });
  }
};

type MeetingWithRelations = Prisma.MeetingGetPayload<{
  include: {
    user: { select: { fullName: true } };
    meetingRoom: { select: { id: true; name: true } };
    department: { select: { id: true; name: true } };
    meetingEquipments: {
      include: {
        equipment: true;
      };
    };
  };
}>;

export const getCalendarEvents = async (req: Request, res: Response) => {
  try {
    // Remove department filter to show all meetings
    // const userDepartmentId = (req.user as any)?.departmentId;

    // Definisi tipe data yang lebih solid
    type CalendarMeeting = Prisma.MeetingGetPayload<{
      include: {
        user: { select: { fullName: true } };
        meetingRoom: { select: { id: true; name: true } };
        department: { select: { id: true; name: true } };
        meetingEquipments: {
          include: {
            equipment: true;
          };
        };
      };
    }>;

    const meetings: CalendarMeeting[] = await prisma.meeting.findMany({
      where: {
        isDeleted: false,
        overallStatus: {
          in: [
            BookingStatus.APPROVED,
            BookingStatus.PARTIALLY_APPROVED,
            BookingStatus.PENDING,
          ],
        },
        // departmentId: userDepartmentId, // Removed filter by user's department
      },
      include: {
        user: { select: { fullName: true } },
        meetingRoom: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
        meetingEquipments: {
          include: {
            equipment: true,
          },
        },
      },
    });

    // Cek jika tidak ada meeting yang ditemukan dan kirim array kosong
    if (!meetings || meetings.length === 0) {
      return res.status(200).json([]);
    }

    const toLocalDateTimeString = (d: Date, t: string) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const time = t && t.length === 5 ? `${t}:00` : t; // HH:mm -> HH:mm:ss
      return `${yyyy}-${mm}-${dd}T${time}`; // string lokal tanpa 'Z'
    };

    const calendarEvents = meetings.map((meeting) => ({
      id: meeting.id,
      title: meeting.agenda,
      start: toLocalDateTimeString(meeting.startDate, meeting.startTime),
      end: toLocalDateTimeString(meeting.endDate, meeting.endTime),
      // Tambahkan field mentah untuk menghindari drift waktu di UI
      startDate: `${meeting.startDate.getFullYear()}-${String(
        meeting.startDate.getMonth() + 1
      ).padStart(2, "0")}-${String(meeting.startDate.getDate()).padStart(
        2,
        "0"
      )}`,
      endDate: `${meeting.endDate.getFullYear()}-${String(
        meeting.endDate.getMonth() + 1
      ).padStart(2, "0")}-${String(meeting.endDate.getDate()).padStart(
        2,
        "0"
      )}`,
      startTime: meeting.startTime,
      endTime: meeting.endTime,
      status: meeting.overallStatus,
      departmentId: meeting.department?.id,
      departmentName: meeting.department?.name,
      meetingRoomId: meeting.meetingRoom?.id,
      meetingRoomName: meeting.meetingRoom?.name,
      userName: meeting.user?.fullName,
      gtimName: meeting.gtimName,
      visitorName: meeting.visitorName,
      companyName: meeting.companyName,
      agenda: meeting.agenda,
      request: meeting.request,
      allDay: meeting.allDay,
      isGenbaVisit: meeting.isGenbaVisit ?? !meeting.meetingRoomId,
      createdAt: meeting.createdAt,
      equipment: meeting.meetingEquipments.map((me) => ({
        name: me.equipment.name,
        quantity: me.quantity,
      })),
    }));

    return res.status(200).json(calendarEvents);
  } catch (error: any) {
    console.error("Error fetching calendar events:", error);
    return res.status(500).json({ message: "Gagal mengambil data kalender." });
  }
};
