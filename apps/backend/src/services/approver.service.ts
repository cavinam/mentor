import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

export class ApproverService {
  // Get all department approvers
  async getAllApprovers() {
    return await prisma.departmentApprover.findMany({
      include: {
        department: true,
        user: {
          select: {
            id: true,
            userId: true,
            email: true,
            fullName: true,
            role: true,
          },
        },
      },
      orderBy: [
        { department: { name: 'asc' } },
        { approverRole: 'asc' },
      ],
    });
  }

  // Get approvers by department
  async getApproversByDepartment(departmentId: string) {
    return await prisma.departmentApprover.findMany({
      where: { departmentId },
      include: {
        user: {
          select: {
            id: true,
            userId: true,
            email: true,
            fullName: true,
            role: true,
          },
        },
      },
    });
  }

  // Add approver to department
  async addApprover(departmentId: string, userId: string, approverRole: UserRole) {
    // Validate user role
    if (approverRole !== 'SECTION_HEAD' && approverRole !== 'HRGA_MANAGER') {
      throw new Error('Approver role must be SECTION_HEAD or HRGA_MANAGER');
    }

    // Check if user exists and has appropriate role
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.role !== approverRole) {
      throw new Error(`User role (${user.role}) does not match approver role (${approverRole})`);
    }

    // Check if department exists
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
    });

    if (!department) {
      throw new Error('Department not found');
    }

    // Create department approver
    return await prisma.departmentApprover.create({
      data: {
        departmentId,
        userId,
        approverRole,
      },
      include: {
        department: true,
        user: {
          select: {
            id: true,
            userId: true,
            email: true,
            fullName: true,
            role: true,
          },
        },
      },
    });
  }

  // Remove approver from department
  async removeApprover(approverId: string) {
    const approver = await prisma.departmentApprover.findUnique({
      where: { id: approverId },
    });

    if (!approver) {
      throw new Error('Approver not found');
    }

    return await prisma.departmentApprover.delete({
      where: { id: approverId },
    });
  }

  // Get potential approvers (users with SECTION_HEAD or HRGA_MANAGER role)
  async getPotentialApprovers() {
    return await prisma.user.findMany({
      where: {
        role: {
          in: ['SECTION_HEAD', 'HRGA_MANAGER'],
        },
      },
      select: {
        id: true,
        userId: true,
        email: true,
        fullName: true,
        role: true,
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        fullName: 'asc',
      },
    });
  }

  // Get approvers for a specific meeting (based on department and approval level)
  async getApproversForMeeting(departmentId: string, approvalLevel: 'SECTION_HEAD' | 'HRGA_MANAGER') {
    return await prisma.departmentApprover.findMany({
      where: {
        departmentId,
        approverRole: approvalLevel,
      },
      include: {
        user: {
          select: {
            id: true,
            userId: true,
            email: true,
            fullName: true,
            role: true,
          },
        },
      },
    });
  }
}
