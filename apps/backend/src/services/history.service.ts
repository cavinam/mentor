import { prisma } from '../config/database';

export const historyService = {
  log: async (data: {
    userId?: string;
    meetingId?: string;
    equipmentId?: string;
    action: string;
    details?: any;
  }) => {
    await prisma.history.create({
      data: {
        userId: data.userId,
        meetingId: data.meetingId,
        equipmentId: data.equipmentId,
        action: data.action,
        details: data.details,
      },
    });
  },

  getAll: async (params: any) => {
    const { page = 1, limit = 10, userId, meetingId, action } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (meetingId) {
      where.meetingId = meetingId;
    }

    if (action) {
      where.action = { contains: action, mode: 'insensitive' };
    }

    const [history, total] = await Promise.all([
      prisma.history.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              role: true,
            },
          },
          meeting: {
            select: {
              id: true,
              agenda: true,
            },
          },
          equipment: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.history.count({ where }),
    ]);

    return {
      data: history,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  getByMeetingId: async (meetingId: string) => {
    const history = await prisma.history.findMany({
      where: { meetingId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return history;
  },

  getByUserId: async (userId: string) => {
    const history = await prisma.history.findMany({
      where: { userId },
      include: {
        meeting: {
          select: {
            id: true,
            agenda: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return history;
  },

  // Get company visits for a specific month
  getCompanyVisits: async (params: {
    month: number;
    year: number;
    companyName?: string;
    page?: number;
    limit?: number;
  }) => {
    const { month, year, companyName, page = 1, limit = 50 } = params;
    const skip = (page - 1) * limit;

    // Calculate start and end date for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Last day of month

    const where: any = {
      isDeleted: false,
      companyName: { not: null },
      startDate: {
        gte: startDate,
        lte: endDate,
      },
      overallStatus: {
        in: ['APPROVED', 'PARTIALLY_APPROVED'],
      },
    };

    // Add company name filter if provided
    if (companyName) {
      where.companyName = {
        contains: companyName,
        mode: 'insensitive',
      };
    }

    const [meetings, total] = await Promise.all([
      prisma.meeting.findMany({
        where,
        select: {
          id: true,
          agenda: true,
          companyName: true,
          visitorName: true,
          gtimName: true,
          startDate: true,
          endDate: true,
          startTime: true,
          endTime: true,
          isGenbaVisit: true,
          overallStatus: true,
          user: {
            select: {
              id: true,
              fullName: true,
            },
          },
          department: {
            select: {
              id: true,
              name: true,
            },
          },
          meetingRoom: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { startDate: 'asc' },
      }),
      prisma.meeting.count({ where }),
    ]);

    // Group by company name to get aggregated data
    const companyMap = new Map<string, {
      companyName: string;
      visitCount: number;
      visits: typeof meetings;
    }>();

    meetings.forEach((meeting) => {
      const company = meeting.companyName || 'Unknown';
      if (!companyMap.has(company)) {
        companyMap.set(company, {
          companyName: company,
          visitCount: 0,
          visits: [],
        });
      }
      const data = companyMap.get(company)!;
      data.visitCount++;
      data.visits.push(meeting);
    });

    return {
      data: {
        meetings,
        companies: Array.from(companyMap.values()),
        summary: {
          totalVisits: total,
          uniqueCompanies: companyMap.size,
          month,
          year,
        },
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },
};
