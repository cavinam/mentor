import { prisma } from '../config/database';
import { CreateDepartmentDTO } from '../types/api.types';

export const departmentService = {
  getAll: async () => {
    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: { users: true, meetings: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return departments;
  },

  getById: async (id: string) => {
    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            userId: true,
            fullName: true,
            role: true,
            email: true,
          },
        },
        _count: {
          select: { meetings: true },
        },
      },
    });

    if (!department) {
      throw new Error('Department not found');
    }

    return department;
  },

  create: async (data: CreateDepartmentDTO) => {
    const department = await prisma.department.create({
      data,
    });

    return department;
  },

  update: async (id: string, data: Partial<CreateDepartmentDTO>) => {
    const department = await prisma.department.update({
      where: { id },
      data,
    });

    return department;
  },

  delete: async (id: string) => {
    await prisma.department.delete({
      where: { id },
    });
  },
};
