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

  // Check availability of all rooms for a given date/time range
  checkAllAvailability: async (params: {
    date: string;
    startTime: string;
    endTime: string;
  }) => {
    const { date, startTime, endTime } = params;
    const checkDate = new Date(date);

    // Get all rooms
    const allRooms = await prisma.meetingRoom.findMany({
      orderBy: { name: 'asc' },
    });

    // Get all meetings on that date that are not canceled/rejected/deleted
    const meetingsOnDate = await prisma.meeting.findMany({
      where: {
        startDate: { lte: checkDate },
        endDate: { gte: checkDate },
        isDeleted: false,
        overallStatus: {
          notIn: ['CANCELED', 'REJECTED'],
        },
        meetingRoomId: { not: null },
      },
      include: {
        meetingRoom: true,
        user: {
          select: { fullName: true },
        },
        department: {
          select: { name: true },
        },
      },
    });

    // Check availability for each room
    const roomsWithAvailability = allRooms.map((room) => {
      // Find meetings in this room on the date
      const roomMeetings = meetingsOnDate.filter(
        (m) => m.meetingRoomId === room.id
      );

      // Check for time conflicts
      const conflictingMeetings = roomMeetings.filter((meeting) => {
        if (meeting.allDay) return true;

        const meetingStart = meeting.startTime;
        const meetingEnd = meeting.endTime;

        // Check overlap
        return (
          (startTime >= meetingStart && startTime < meetingEnd) ||
          (endTime > meetingStart && endTime <= meetingEnd) ||
          (startTime <= meetingStart && endTime >= meetingEnd)
        );
      });

      return {
        ...room,
        isAvailable: conflictingMeetings.length === 0,
        conflictingMeetings: conflictingMeetings.map((m) => ({
          id: m.id,
          agenda: m.agenda,
          startTime: m.startTime,
          endTime: m.endTime,
          bookedBy: m.user?.fullName || 'Unknown',
          department: m.department?.name || '-',
        })),
      };
    });

    return {
      date,
      startTime,
      endTime,
      rooms: roomsWithAvailability,
      availableCount: roomsWithAvailability.filter((r) => r.isAvailable).length,
      totalCount: roomsWithAvailability.length,
    };
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
          notIn: ['CANCELED', 'REJECTED'],
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
