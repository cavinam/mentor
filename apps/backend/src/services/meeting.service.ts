import { prisma } from '../config/database';
import { CreateMeetingDTO } from '../types/api.types';
import { historyService } from './history.service';
import { roomService } from './room.service';
import { equipmentService } from './equipment.service';
import { emailService } from './email.service';

export const meetingService = {
  getAll: async (params: any) => {
    const { page = 1, limit = 10, status, roomId, departmentId, startDate, endDate } = params;
    const skip = (page - 1) * limit;

    const where: any = {
      isDeleted: false,
    };

    if (status) {
      where.overallStatus = status;
    }

    if (roomId) {
      where.meetingRoomId = roomId;
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (startDate && endDate) {
      where.startDate = { gte: new Date(startDate) };
      where.endDate = { lte: new Date(endDate) };
    }

    const [meetings, total] = await Promise.all([
      prisma.meeting.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              userId: true,
              fullName: true,
              email: true,
            },
          },
          meetingRoom: true,
          department: true,
          approvals: {
            include: {
              approver: {
                select: {
                  id: true,
                  fullName: true,
                  role: true,
                },
              },
            },
          },
          meetingEquipments: {
            include: {
              equipment: true,
            },
          },
          specialRequests: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.meeting.count({ where }),
    ]);

    return {
      data: meetings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  getById: async (id: string) => {
    const meeting = await prisma.meeting.findUnique({
      where: { id },
      include: {
        user: true,
        meetingRoom: true,
        department: true,
        approvals: {
          include: {
            approver: true,
          },
        },
        meetingEquipments: {
          include: {
            equipment: true,
          },
        },
        specialRequests: true,
      },
    });

    if (!meeting) {
      throw new Error('Meeting not found');
    }

    return meeting;
  },

  getByUserId: async (userId: string) => {
    const meetings = await prisma.meeting.findMany({
      where: {
        userId,
        isDeleted: false,
      },
      include: {
        meetingRoom: true,
        department: true,
        approvals: true,
      },
      orderBy: { startDate: 'desc' },
    });

    return meetings;
  },

  create: async (data: CreateMeetingDTO & { userId: string; departmentId?: string }) => {
    const { equipments, specialRequests, userId, departmentId, meetingRoomId, startDate, endDate, startTime, endTime, ...meetingData } = data;

    // VALIDATION: Prevent backdate booking
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset to start of day
    const bookingStartDate = new Date(startDate);
    bookingStartDate.setHours(0, 0, 0, 0);

    if (bookingStartDate < today) {
      throw new Error('Tidak dapat membuat booking untuk tanggal yang sudah lewat');
    }

    // Get user's department if departmentId not provided
    let finalDepartmentId = departmentId;
    if (!finalDepartmentId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { departmentId: true }
      });

      if (!user?.departmentId) {
        throw new Error('User must have a department');
      }

      finalDepartmentId = user.departmentId;
    }

    // Get approvers for this department
    const departmentApprovers = await prisma.departmentApprover.findMany({
      where: { departmentId: finalDepartmentId },
      include: {
        user: {
          select: { id: true, role: true }
        }
      }
    });

    // Create approval records data
    const approvalRecords = departmentApprovers.map((approver: { userId: string }) => ({
      approverId: approver.userId
    }));

    // VALIDATION: Check meeting room availability if room is selected
    if (meetingRoomId) {
      const roomAvailability = await roomService.checkAvailability({
        roomId: meetingRoomId,
        startDate,
        endDate,
        startTime: startTime || '00:00',
        endTime: endTime || '23:59',
      });

      if (!roomAvailability.isAvailable) {
        const conflictDetails = roomAvailability.conflictingMeetings
          .map((m: any) => `${m.agenda} (${m.startDate} ${m.startTime}-${m.endTime})`)
          .join(', ');
        throw new Error(`Meeting room is not available. Conflicting meetings: ${conflictDetails}`);
      }
    }

    // VALIDATION: Check equipment availability if equipment is requested
    if (equipments && equipments.length > 0) {
      for (const eq of equipments) {
        const equipmentAvailability = await equipmentService.checkAvailability({
          equipmentId: eq.equipmentId,
          startDate,
          endDate,
        });

        if (!equipmentAvailability.isAvailable) {
          const equipment = await prisma.equipment.findUnique({
            where: { id: eq.equipmentId },
            select: { name: true }
          });
          const conflictDetails = equipmentAvailability.conflictingMeetings
            .map((m: any) => `${m.meeting.agenda} (${m.meeting.startDate} ${m.meeting.startTime}-${m.meeting.endTime})`)
            .join(', ');
          throw new Error(
            `Equipment "${equipment?.name}" is not available. Conflicting meetings: ${conflictDetails}`
          );
        }
      }
    }

    // Convert date strings to DateTime
    const startDateTime = new Date(startDate);
    const endDateTime = new Date(endDate);

    // Create meeting with approvals
    const meeting = await prisma.meeting.create({
      data: {
        ...meetingData,
        startDate: startDateTime,
        endDate: endDateTime,
        startTime: startTime || '00:00',
        endTime: endTime || '23:59',
        // Connect user relation
        user: {
          connect: { id: userId }
        },
        // Connect department relation (required)
        department: {
          connect: { id: finalDepartmentId }
        },
        // Connect meeting room if provided
        ...(meetingRoomId && {
          meetingRoom: {
            connect: { id: meetingRoomId }
          }
        }),
        // Create approval records from department approvers
        ...(approvalRecords.length > 0 && {
          approvals: {
            create: approvalRecords,
          },
        }),
        // Create meeting equipment relations
        ...(equipments && equipments.length > 0 && {
          meetingEquipments: {
            create: equipments.map((eq) => ({
              equipmentId: eq.equipmentId,
            })),
          },
        }),
        // Create special requests
        ...(specialRequests && specialRequests.length > 0 && {
          specialRequests: {
            create: specialRequests.map((req) => ({
              type: req.type,
              quantity: req.quantity,
              notes: req.notes,
              description: req.description,
            })),
          },
        }),
      },
      include: {
        meetingRoom: true,
        approvals: true,
        meetingEquipments: {
          include: { equipment: true },
        },
        specialRequests: true,
      },
    });

    // Log history
    await historyService.log({
      userId: data.userId,
      meetingId: meeting.id,
      action: 'Meeting created',
      details: { agenda: meeting.agenda },
    });

    // Send email notification to Section Head
    emailService.sendMeetingCreatedNotification(meeting.id).catch((err) => {
      console.error('Failed to send meeting created email:', err);
    });

    return meeting;
  },

  update: async (id: string, data: Partial<CreateMeetingDTO>) => {
    const { equipments, specialRequests, meetingRoomId, startDate, endDate, startTime, endTime, ...meetingData } = data;

    // Get existing meeting data
    const existingMeeting = await prisma.meeting.findUnique({
      where: { id },
      select: { startDate: true, endDate: true, startTime: true, endTime: true }
    });

    if (!existingMeeting) {
      throw new Error('Meeting not found');
    }

    // Use provided dates or fallback to existing
    const finalStartDate = startDate || existingMeeting.startDate.toISOString().split('T')[0];
    const finalEndDate = endDate || existingMeeting.endDate.toISOString().split('T')[0];
    const finalStartTime = startTime || existingMeeting.startTime;
    const finalEndTime = endTime || existingMeeting.endTime;

    // VALIDATION: Prevent backdate booking
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset to start of day
    const bookingStartDate = new Date(finalStartDate);
    bookingStartDate.setHours(0, 0, 0, 0);

    if (bookingStartDate < today) {
      throw new Error('Tidak dapat mengubah booking ke tanggal yang sudah lewat');
    }

    // VALIDATION: Check meeting room availability if room is being changed/selected
    if (meetingRoomId) {
      const roomAvailability = await roomService.checkAvailability({
        roomId: meetingRoomId,
        startDate: finalStartDate,
        endDate: finalEndDate,
        startTime: finalStartTime,
        endTime: finalEndTime,
        excludeMeetingId: id, // Exclude current meeting from conflict check
      });

      if (!roomAvailability.isAvailable) {
        const conflictDetails = roomAvailability.conflictingMeetings
          .map((m: any) => `${m.agenda} (${m.startDate} ${m.startTime}-${m.endTime})`)
          .join(', ');
        throw new Error(`Meeting room is not available. Conflicting meetings: ${conflictDetails}`);
      }
    }

    // VALIDATION: Check equipment availability if equipment is being changed
    if (equipments && equipments.length > 0) {
      for (const eq of equipments) {
        const equipmentAvailability = await equipmentService.checkAvailability({
          equipmentId: eq.equipmentId,
          startDate: finalStartDate,
          endDate: finalEndDate,
          excludeMeetingId: id, // Exclude current meeting from conflict check
        });

        if (!equipmentAvailability.isAvailable) {
          const equipment = await prisma.equipment.findUnique({
            where: { id: eq.equipmentId },
            select: { name: true }
          });
          const conflictDetails = equipmentAvailability.conflictingMeetings
            .map((m: any) => `${m.meeting.agenda} (${m.meeting.startDate} ${m.meeting.startTime}-${m.meeting.endTime})`)
            .join(', ');
          throw new Error(
            `Equipment "${equipment?.name}" is not available. Conflicting meetings: ${conflictDetails}`
          );
        }
      }
    }

    // Delete existing equipment and special requests, then recreate
    await prisma.meetingEquipment.deleteMany({
      where: { meetingId: id },
    });

    await prisma.specialRequest.deleteMany({
      where: { meetingId: id },
    });

    const meeting = await prisma.meeting.update({
      where: { id },
      data: {
        ...meetingData,
        // Update date and time fields
        startDate: new Date(finalStartDate),
        endDate: new Date(finalEndDate),
        startTime: finalStartTime,
        endTime: finalEndTime,
        // Update meeting room connection if provided
        ...(meetingRoomId !== undefined && {
          meetingRoom: meetingRoomId ? {
            connect: { id: meetingRoomId }
          } : {
            disconnect: true
          }
        }),
        // Recreate meeting equipment relations
        ...(equipments && equipments.length > 0 && {
          meetingEquipments: {
            create: equipments.map((eq) => ({
              equipmentId: eq.equipmentId,
            })),
          },
        }),
        // Recreate special requests
        ...(specialRequests && specialRequests.length > 0 && {
          specialRequests: {
            create: specialRequests.map((req) => ({
              type: req.type,
              quantity: req.quantity,
              notes: req.notes,
              description: req.description,
            })),
          },
        }),
      },
      include: {
        meetingRoom: true,
        approvals: true,
        meetingEquipments: {
          include: { equipment: true },
        },
        specialRequests: true,
      },
    });

    return meeting;
  },

  delete: async (id: string, userId: string) => {
    // Soft delete
    await prisma.meeting.update({
      where: { id },
      data: { isDeleted: true },
    });

    // Log history
    await historyService.log({
      userId,
      meetingId: id,
      action: 'Meeting deleted',
    });
  },

  cancel: async (id: string, userId: string, remark: string) => {
    await prisma.meeting.update({
      where: { id },
      data: {
        overallStatus: 'CANCELED',
        cancellationRemark: remark
      },
    });

    // Log history
    await historyService.log({
      userId,
      meetingId: id,
      action: 'Meeting canceled',
    });

    // Send email notification to Section Head
    emailService.sendMeetingCanceledNotification(id, remark).catch((err) => {
      console.error('Failed to send meeting canceled email:', err);
    });
  },
};
