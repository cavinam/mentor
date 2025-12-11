import { prisma } from '../config/database';
import { CreateRoomDTO } from '../types/api.types';

export const roomService = {
  getAll: async () => {
    const rooms = await prisma.meetingRoom.findMany({
      include: {
        _count: {
          select: { meetings: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return rooms;
  },

  getById: async (id: string) => {
    const room = await prisma.meetingRoom.findUnique({
      where: { id },
    });

    if (!room) {
      throw new Error('Meeting room not found');
    }

    return room;
  },

  checkAvailability: async (params: {
    roomId: string;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    excludeMeetingId?: string;
  }) => {
    const { roomId, startDate, endDate, startTime, endTime, excludeMeetingId } = params;

    // Find conflicting meetings
    const conflictingMeetings = await prisma.meeting.findMany({
      where: {
        meetingRoomId: roomId,
        isDeleted: false,
        overallStatus: {
          not: 'CANCELED',
        },
        ...(excludeMeetingId && { id: { not: excludeMeetingId } }),
        OR: [
          {
            AND: [
              { startDate: { lte: new Date(endDate) } },
              { endDate: { gte: new Date(startDate) } },
            ],
          },
        ],
      },
    });

    // Check time overlap
    const hasConflict = conflictingMeetings.some((meeting) => {
      if (meeting.allDay) return true;
      
      // Simple time overlap check
      const requestStartTime = startTime;
      const requestEndTime = endTime;
      const meetingStartTime = meeting.startTime;
      const meetingEndTime = meeting.endTime;

      return (
        (requestStartTime >= meetingStartTime && requestStartTime < meetingEndTime) ||
        (requestEndTime > meetingStartTime && requestEndTime <= meetingEndTime) ||
        (requestStartTime <= meetingStartTime && requestEndTime >= meetingEndTime)
      );
    });

    return {
      isAvailable: !hasConflict,
      conflictingMeetings: hasConflict ? conflictingMeetings : [],
    };
  },

  create: async (data: CreateRoomDTO) => {
    const room = await prisma.meetingRoom.create({
      data,
    });

    return room;
  },

  update: async (id: string, data: Partial<CreateRoomDTO>) => {
    const room = await prisma.meetingRoom.update({
      where: { id },
      data,
    });

    return room;
  },

  delete: async (id: string) => {
    await prisma.meetingRoom.delete({
      where: { id },
    });
  },
};
