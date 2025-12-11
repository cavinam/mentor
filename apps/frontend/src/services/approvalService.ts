import { api } from '@/lib/api';

export interface ApprovalMeeting {
  id: string;
  agenda: string;
  gtimName?: string;
  visitorName?: string;
  companyName?: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  request?: string;
  isGenbaVisit: boolean;
  overallStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELED' | 'PARTIALLY_APPROVED';
  user?: {
    id: string;
    userId: string;
    fullName: string;
    email: string;
  };
  meetingRoom?: {
    id: string;
    name: string;
    location?: string;
  };
  department?: {
    id: string;
    name: string;
  };
  meetingEquipments?: Array<{
    equipment: {
      id: string;
      name: string;
    };
  }>;
}

export interface PendingApproval {
  id: string;
  meetingId: string;
  approverId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedAt?: string;
  remark?: string;
  createdAt: string;
  meeting: ApprovalMeeting;
}

export interface ApprovalHistory {
  id: string;
  meetingId: string;
  approverId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedAt?: string;
  remark?: string;
  createdAt: string;
  meeting: ApprovalMeeting;
}

export interface PendingApprovalsResponse {
  success: boolean;
  data: PendingApproval[];
}

export interface ApprovalHistoryResponse {
  success: boolean;
  data: ApprovalHistory[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApprovalActionResponse {
  success: boolean;
  data: {
    success: boolean;
    newStatus: string;
  };
  message: string;
}

export const approvalService = {
  // Get pending approvals for current user
  getPendingApprovals: async (): Promise<PendingApprovalsResponse> => {
    const response = await api.get('/approvals/pending');
    return response.data;
  },

  // Get approval history
  getApprovalHistory: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<ApprovalHistoryResponse> => {
    const response = await api.get('/approvals/history', { params });
    return response.data;
  },

  // Get approvals for a specific meeting
  getMeetingApprovals: async (meetingId: string) => {
    const response = await api.get(`/approvals/meeting/${meetingId}`);
    return response.data;
  },

  // Approve a meeting
  approve: async (meetingId: string): Promise<ApprovalActionResponse> => {
    const response = await api.post(`/approvals/${meetingId}/approve`);
    return response.data;
  },

  // Reject a meeting
  reject: async (meetingId: string, remark: string): Promise<ApprovalActionResponse> => {
    const response = await api.post(`/approvals/${meetingId}/reject`, { remark });
    return response.data;
  },
};
