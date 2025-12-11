import { prisma } from '../config/database';
import { ApprovalStatus, BookingStatus, UserRole } from '@prisma/client';
import { historyService } from './history.service';
import { emailService } from './email.service';

// Type for approval records
type ApprovalRecord = { status: string };

export const approvalService = {
  getPendingForUser: async (userId: string, userRole: UserRole, _departmentId?: string) => {
    // ADMIN can see all pending approvals
    // SECTION_HEAD and HRGA_MANAGER can only see their assigned approvals
    const whereClause = userRole === UserRole.ADMIN
      ? {
        status: ApprovalStatus.PENDING,
        meeting: {
          isDeleted: false,
        },
      }
      : {
        approverId: userId,
        status: ApprovalStatus.PENDING,
        meeting: {
          isDeleted: false,
        },
      };

    const approvals = await prisma.meetingApproval.findMany({
      where: whereClause,
      include: {
        meeting: {
          include: {
            user: true,
            meetingRoom: true,
            department: true,
            meetingEquipments: {
              include: { equipment: true },
            },
            approvals: {
              include: {
                approver: {
                  select: {
                    id: true,
                    role: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // For ADMIN role, deduplicate by meetingId - show only one approval per meeting
    // Prioritize showing Section Head approval first (as it should be processed first)
    if (userRole === UserRole.ADMIN) {
      const meetingMap = new Map<string, typeof approvals[0]>();

      for (const approval of approvals) {
        const meetingId = approval.meeting.id;
        const existing = meetingMap.get(meetingId);

        if (!existing) {
          // First approval for this meeting
          meetingMap.set(meetingId, approval);
        } else {
          // Check if current approval is from Section Head (prioritize it)
          const currentApproverRecord = approval.meeting.approvals?.find(
            (a) => a.id === approval.id
          );
          const existingApproverRecord = existing.meeting.approvals?.find(
            (a) => a.id === existing.id
          );

          // Prefer Section Head approval over HRGA Manager
          if (currentApproverRecord?.approver?.role === UserRole.SECTION_HEAD && existingApproverRecord?.approver?.role !== UserRole.SECTION_HEAD) {
            meetingMap.set(meetingId, approval);
          }
        }
      }

      return Array.from(meetingMap.values());
    }

    // For HRGA_MANAGER role, filter out approvals for meetings where:
    // - The department is NOT HRGA or Expatriate (these go directly to HRGA Manager)
    // - Section Head approval still exists and is PENDING
    if (userRole === UserRole.HRGA_MANAGER) {
      return approvals.filter((approval) => {
        const meeting = approval.meeting;
        const departmentName = meeting.department?.name?.toUpperCase() || '';

        // HRGA and Expatriate departments bypass Section Head
        if (departmentName === 'HRGA' || departmentName === 'EXPATRIATE') {
          return true;
        }

        // For other departments, only show if Section Head has already approved
        const sectionHeadApproval = meeting.approvals?.find(
          (a: { approver: { role: UserRole }, status: ApprovalStatus }) => a.approver?.role === UserRole.SECTION_HEAD
        );

        // If no Section Head approval exists, or Section Head has already approved, show the meeting
        if (!sectionHeadApproval || sectionHeadApproval.status === ApprovalStatus.APPROVED) {
          return true;
        }

        // Section Head approval is still pending, don't show to HRGA Manager
        return false;
      });
    }

    return approvals;
  },

  getHistoryForUser: async (userId: string, userRole: UserRole, _departmentId?: string, params?: any) => {
    const { page = 1, limit = 10 } = params || {};
    const skip = (page - 1) * limit;

    // ADMIN can see all approval history
    const whereClause = userRole === UserRole.ADMIN
      ? { status: { not: ApprovalStatus.PENDING } }
      : { approverId: userId, status: { not: ApprovalStatus.PENDING } };

    const [approvals, total] = await Promise.all([
      prisma.meetingApproval.findMany({
        where: whereClause,
        include: {
          meeting: {
            include: {
              user: true,
              meetingRoom: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { approvedAt: 'desc' },
      }),
      prisma.meetingApproval.count({
        where: whereClause,
      }),
    ]);

    return {
      data: approvals,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  getByMeetingId: async (meetingId: string) => {
    const approvals = await prisma.meetingApproval.findMany({
      where: { meetingId },
      include: {
        approver: {
          select: {
            id: true,
            fullName: true,
            role: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return approvals;
  },

  approve: async (meetingId: string, approverId: string, userRole: UserRole, remark?: string) => {
    // ADMIN can approve any pending request for the meeting
    // Other roles can only approve their assigned requests
    const whereClause: any = {
      meetingId,
      status: ApprovalStatus.PENDING,
    };

    if (userRole !== UserRole.ADMIN) {
      whereClause.approverId = approverId;
    }

    // Get approver info for email notification
    const approver = await prisma.user.findUnique({
      where: { id: approverId },
      select: { fullName: true },
    });

    // Update approval record
    const approval = await prisma.meetingApproval.updateMany({
      where: whereClause,
      data: {
        status: ApprovalStatus.APPROVED,
        approvedAt: new Date(),
        remark: remark || (userRole === UserRole.ADMIN ? 'Approved by Admin' : undefined),
      },
    });

    if (approval.count === 0) {
      throw new Error('Approval record not found or already processed');
    }

    // Check if all approvals are done
    const allApprovals = await prisma.meetingApproval.findMany({
      where: { meetingId },
    });

    const allApproved = allApprovals.every((a: ApprovalRecord) => a.status === ApprovalStatus.APPROVED);
    const hasRejection = allApprovals.some((a: ApprovalRecord) => a.status === ApprovalStatus.REJECTED);

    let newStatus: BookingStatus;
    if (hasRejection) {
      newStatus = BookingStatus.REJECTED;
    } else if (allApproved) {
      newStatus = BookingStatus.APPROVED;
    } else {
      newStatus = BookingStatus.PARTIALLY_APPROVED;
    }

    // Update meeting status
    await prisma.meeting.update({
      where: { id: meetingId },
      data: { overallStatus: newStatus },
    });

    // Log history
    await historyService.log({
      userId: approverId,
      meetingId,
      action: 'Meeting approved',
      details: {
        remark,
        role: userRole,
        overridden: userRole === UserRole.ADMIN,
      },
    });

    // Send email notifications based on approval flow
    const approverName = approver?.fullName || 'Approver';

    if (userRole === UserRole.SECTION_HEAD) {
      // Section Head approved -> notify HRGA Manager
      emailService.sendSectionHeadApprovedNotification(meetingId, approverName).catch((err) => {
        console.error('Failed to send section head approved email:', err);
      });
    } else if (userRole === UserRole.HRGA_MANAGER || (userRole === UserRole.ADMIN && allApproved)) {
      // HRGA Manager approved (or Admin approved all) -> notify Admin and User
      emailService.sendHRGAApprovedNotification(meetingId).catch((err) => {
        console.error('Failed to send HRGA approved email:', err);
      });
    }

    return { success: true, newStatus };
  },

  reject: async (meetingId: string, approverId: string, userRole: UserRole, remark: string) => {
    // ADMIN can reject any pending request for the meeting
    const whereClause: any = {
      meetingId,
      status: ApprovalStatus.PENDING,
    };

    if (userRole !== UserRole.ADMIN) {
      whereClause.approverId = approverId;
    }

    // Update approval record
    const approval = await prisma.meetingApproval.updateMany({
      where: whereClause,
      data: {
        status: ApprovalStatus.REJECTED,
        approvedAt: new Date(),
        remark: remark || (userRole === UserRole.ADMIN ? 'Rejected by Admin' : undefined),
      },
    });

    if (approval.count === 0) {
      throw new Error('Approval record not found or already processed');
    }

    // Update meeting status to REJECTED
    await prisma.meeting.update({
      where: { id: meetingId },
      data: { overallStatus: BookingStatus.REJECTED },
    });

    // Log history
    await historyService.log({
      userId: approverId,
      meetingId,
      action: 'Meeting rejected',
      details: {
        remark,
        role: userRole,
        overridden: userRole === UserRole.ADMIN,
      },
    });

    // Send email notification to user about rejection
    emailService.sendMeetingRejectedNotification(meetingId, approverId, userRole, remark).catch((err) => {
      console.error('Failed to send meeting rejected email:', err);
    });

    return { success: true, newStatus: BookingStatus.REJECTED };
  },
};

