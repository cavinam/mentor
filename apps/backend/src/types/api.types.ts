import { UserRole } from '@prisma/client';
import { SpecialRequestInput } from './specialRequest';

// API Response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// DTOs (Data Transfer Objects)
export interface LoginDTO {
  email: string;
  password: string;
}

export interface CreateUserDTO {
  userId: string;
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  departmentId?: string;
}

export interface UpdateUserDTO {
  email?: string;
  fullName?: string;
  role?: UserRole;
  departmentId?: string;
}

export interface CreateMeetingDTO {
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
  specialRequests?: SpecialRequestInput[];
}

export interface CreateRoomDTO {
  name: string;
  location: string;
  description?: string;
}

export interface CreateEquipmentDTO {
  name: string;
  description?: string;
}

export interface CreateDepartmentDTO {
  name: string;
}

export interface ApprovalActionDTO {
  status: 'APPROVED' | 'REJECTED';
  remark?: string;
}
