import { api } from '@/lib/api';

export interface CompanyVisit {
    id: string;
    agenda: string;
    companyName: string | null;
    visitorName: string | null;
    gtimName: string | null;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    isGenbaVisit: boolean;
    overallStatus: string;
    user: {
        id: string;
        fullName: string;
    };
    department: {
        id: string;
        name: string;
    };
    meetingRoom: {
        id: string;
        name: string;
    } | null;
}

export interface CompanyAggregate {
    companyName: string;
    visitCount: number;
    visits: CompanyVisit[];
}

export interface CompanyVisitsResponse {
    success: boolean;
    data: {
        meetings: CompanyVisit[];
        companies: CompanyAggregate[];
        summary: {
            totalVisits: number;
            uniqueCompanies: number;
            month: number;
            year: number;
        };
    };
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export const historyService = {
    // Get company visits for a specific month
    getCompanyVisits: async (params?: {
        month?: number;
        year?: number;
        companyName?: string;
        page?: number;
        limit?: number;
    }): Promise<CompanyVisitsResponse> => {
        const response = await api.get('/history/company-visits', { params });
        return response.data;
    },
};
