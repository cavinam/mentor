import { api } from '@/lib/api';
import type { SpecialRequest } from '@/components/mentor/bookings/SpecialRequestsField';

export interface CreateBookingDTO {
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
  meetingRoomId?: string;
  equipments?: Array<{ equipmentId: string }>;
  specialRequests?: SpecialRequest[];
}

export interface Booking {
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
  cancellationRemark?: string;
  userId: string;
  meetingRoomId?: string;
  departmentId: string;
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
    description?: string;
  };
  department?: {
    id: string;
    name: string;
  };
  approvals?: Array<{
    id: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    approver: {
      id: string;
      fullName: string;
      role: string;
    };
  }>;
  meetingEquipments?: Array<{
    equipment: {
      id: string;
      name: string;
      type: string;
    };
  }>;
  specialRequests?: SpecialRequest[];
  createdAt: string;
  updatedAt: string;
}

export interface BookingListResponse {
  success: boolean;
  data: Booking[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface BookingDetailResponse {
  success: boolean;
  data: Booking;
}

export const bookingService = {
  // Get all bookings with optional filters
  getAll: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    roomId?: string;
    departmentId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<BookingListResponse> => {
    const response = await api.get('/meetings', { params });
    return response.data;
  },

  // Get current user's bookings
  getMyBookings: async (): Promise<BookingListResponse> => {
    const response = await api.get('/meetings/my-bookings');
    return response.data;
  },

  // Get booking by ID
  getById: async (id: string): Promise<BookingDetailResponse> => {
    const response = await api.get(`/meetings/${id}`);
    return response.data;
  },

  // Create a new booking
  create: async (data: CreateBookingDTO): Promise<BookingDetailResponse> => {
    const response = await api.post('/meetings', data);
    return response.data;
  },

  // Update a booking
  update: async (id: string, data: Partial<CreateBookingDTO>): Promise<BookingDetailResponse> => {
    const response = await api.put(`/meetings/${id}`, data);
    return response.data;
  },

  // Delete a booking
  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/meetings/${id}`);
    return response.data;
  },

  // Cancel a booking
  cancel: async (id: string, remark: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.post(`/meetings/${id}/cancel`, { remark });
    return response.data;
  },
};
