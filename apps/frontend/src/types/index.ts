// Enums matching Prisma schema
export enum UserRole {
  ADMIN = 'ADMIN',
  SECTION_HEAD = 'SECTION_HEAD',
  HRGA_MANAGER = 'HRGA_MANAGER',
  USER = 'USER',
}

export enum BookingStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELED = 'CANCELED',
  PARTIALLY_APPROVED = 'PARTIALLY_APPROVED',
}

export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum EquipmentType {
  PROJECTOR = 'PROJECTOR',
  SPEAKER = 'SPEAKER',
  CAMERA = 'CAMERA',
  HEADPHONE = 'HEADPHONE',
  OTHER = 'OTHER',
}

// Types
export interface User {
  id: string;
  userId: string;
  email: string;
  fullName: string;
  role: UserRole;
  departmentId?: string;
  department?: Department;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface MeetingRoom {
  id: string;
  name: string;
  capacity: number;
  location?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Equipment {
  id: string;
  name: string;
  type: EquipmentType;
  quantity: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Meeting {
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
  overallStatus: BookingStatus;
  userId: string;
  user?: User;
  meetingRoomId?: string;
  meetingRoom?: MeetingRoom;
  departmentId: string;
  department?: Department;
  approvals?: MeetingApproval[];
  meetingEquipments?: MeetingEquipment[];
  createdAt: string;
  updatedAt: string;
}

export interface MeetingApproval {
  id: string;
  meetingId: string;
  approverId: string;
  approver?: User;
  status: ApprovalStatus;
  approvedAt?: string;
  remark?: string;
  createdAt: string;
}

export interface MeetingEquipment {
  meetingId: string;
  equipmentId: string;
  equipment?: Equipment;
  quantity: number;
  createdAt: string;
}

export interface History {
  id: string;
  userId?: string;
  user?: User;
  meetingId?: string;
  meeting?: Meeting;
  equipmentId?: string;
  equipment?: Equipment;
  action: string;
  details?: any;
  createdAt: string;
}

export interface DepartmentApprover {
  id: string;
  departmentId: string;
  userId: string;
  approverRole: string;
  department: Department;
  user: User;
  createdAt: string;
}

export interface DepartmentApprovers {
  department: Department;
  level1: DepartmentApprover | null;
  level2: DepartmentApprover | null;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  userId: string;
  email: string;
  fullName: string;
  role: UserRole;
  departmentId?: string;
  token: string;
}
