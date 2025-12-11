import { prisma } from '../config/database';
import { CreateEquipmentDTO } from '../types/api.types';

export const equipmentService = {
  getAll: async () => {
    const equipment = await prisma.equipment.findMany({
      orderBy: { name: 'asc' },
    });

    return equipment;
  },

  getById: async (id: string) => {
    const equipment = await prisma.equipment.findUnique({
      where: { id },
    });

    if (!equipment) {
      throw new Error('Equipment not found');
    }

    return equipment;
  },

  checkAvailability: async (params: {
    equipmentId: string;
    startDate: string;
    endDate: string;
    excludeMeetingId?: string;
  }) => {
    const { equipmentId, startDate, endDate, excludeMeetingId } = params;

    // Get equipment
    const equipment = await prisma.equipment.findUnique({
      where: { id: equipmentId },
    });

    if (!equipment) {
      throw new Error('Equipment not found');
    }

    // Find overlapping bookings
    const overlappingBookings = await prisma.meetingEquipment.findMany({
      where: {
        equipmentId,
        ...(excludeMeetingId && { meetingId: { not: excludeMeetingId } }),
        meeting: {
          isDeleted: false,
          overallStatus: {
            not: 'CANCELED',
          },
          OR: [
            {
              AND: [
                { startDate: { lte: new Date(endDate) } },
                { endDate: { gte: new Date(startDate) } },
              ],
            },
          ],
        },
      },
      include: {
        meeting: true,
      },
    });

    return {
      isAvailable: overlappingBookings.length === 0,
      conflictingMeetings: overlappingBookings.length > 0 ? overlappingBookings : [],
    };
  },

  create: async (data: CreateEquipmentDTO) => {
    const equipment = await prisma.equipment.create({
      data,
    });

    return equipment;
  },

  update: async (id: string, data: Partial<CreateEquipmentDTO>) => {
    const equipment = await prisma.equipment.update({
      where: { id },
      data,
    });

    return equipment;
  },

  delete: async (id: string) => {
    await prisma.equipment.delete({
      where: { id },
    });
  },
};
