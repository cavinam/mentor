import { prisma } from '../config/database';
import { hashPassword } from '../utils/password';
import { CreateUserDTO, UpdateUserDTO, PaginationParams } from '../types/api.types';
// import { AppError } from '../middlewares/errorHandler';

export const userService = {
  getAll: async (params: PaginationParams & { search?: string; role?: string; departmentId?: string }) => {
    const { page = 1, limit = 10, search, role, departmentId } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { userId: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          userId: true,
          email: true,
          fullName: true,
          role: true,
          departmentId: true,
          department: {
            select: {
              id: true,
              name: true,
            },
          },
          createdAt: true,
          updatedAt: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  getById: async (id: string) => {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        email: true,
        fullName: true,
        role: true,
        departmentId: true,
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  },

  create: async (data: CreateUserDTO) => {
    // Hash password
    const hashedPassword = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
      select: {
        id: true,
        userId: true,
        email: true,
        fullName: true,
        role: true,
        departmentId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  },

  update: async (id: string, data: UpdateUserDTO) => {
    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        userId: true,
        email: true,
        fullName: true,
        role: true,
        departmentId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  },

  delete: async (id: string) => {
    // Check if user has created any meetings
    const meetingsCount = await prisma.meeting.count({
      where: { userId: id },
    });

    if (meetingsCount > 0) {
      throw new Error(`Cannot delete user: User has ${meetingsCount} meeting(s). Please reassign or delete the meetings first.`);
    }

    // Use transaction to delete related records and then the user
    await prisma.$transaction(async (tx) => {
      // Delete department approvers where user is the approver
      await tx.departmentApprover.deleteMany({
        where: { userId: id },
      });

      // Delete meeting approvals where user is the approver
      await tx.meetingApproval.deleteMany({
        where: { approverId: id },
      });

      // Set userId to null in history records (preserve history but remove user reference)
      await tx.history.updateMany({
        where: { userId: id },
        data: { userId: null },
      });

      // Finally delete the user
      await tx.user.delete({
        where: { id },
      });
    });
  },

  getStats: async () => {
    const [total, admins, sectionHeads, hrgaManagers, regularUsers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.user.count({ where: { role: 'SECTION_HEAD' } }),
      prisma.user.count({ where: { role: 'HRGA_MANAGER' } }),
      prisma.user.count({ where: { role: 'USER' } }),
    ]);

    return {
      total,
      admins,
      sectionHeads,
      hrgaManagers,
      regularUsers,
    };
  },
};
