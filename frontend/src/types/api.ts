// API Response types
export interface ApiMeeting {
  id: string | number;
  agenda?: string;
  request?: string;
  department?: { id?: string; name?: string } | null;
  meetingRoom?: { id?: string; name?: string } | null;
  user?: { fullName?: string; email?: string };
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  meetingEquipments?: {
    equipment: { name: string; type?: string; quantity?: number };
    quantity: number;
  }[];
  overallStatus?: string;
  gtimName?: string;
  companyName?: string;
  visitorName?: string;
  createdAt?: string;
  approvals?: Array<{
    id: string;
    status: string;
    remark?: string;
    approver: { id: string; fullName?: string };
  }>;
}

export interface ApiEquipment {
  id: string;
  name: string;
  type?: string;
  quantity?: number;
}

export interface ApiUser {
  id: string;
  fullName?: string;
  email?: string;
  role?: string;
  departmentId?: string;
  department?: { id?: string; name?: string };
}

// Form types
export interface MeetingFormData {
  id?: string;
  agenda?: string;
  start?: Date | null;
  end?: Date | null;
  meetingRoomId?: string;
  departmentId?: string;
  equipment?: { id: string; name: string; quantity: number }[];
  gtimName?: string;
  visitorName?: string;
  companyName?: string;
  request?: string;
  isGenbaVisit?: boolean;
}

// Event handler types
export interface ChangeEvent<T = Element> {
  target: {
    name: string;
    value: string | boolean | number;
    type?: string;
    checked?: boolean;
  };
}

// Utility types
export type MeetingStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "PARTIALLY_APPROVED"
  | "CANCELED";
export type UserRole = "ADMIN" | "HRGA_MANAGER" | "SECTION_HEAD" | "USER";

// JWT and API response types
export interface JwtPayload {
  role?: string;
  userDepartmentId?: string;
  [key: string]: unknown;
}

export interface MeetingRoomResponse {
  id: string | number;
  name: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  agenda?: string;
  start: Date;
  end: Date;
  status?: string;
  departmentId?: string;
  departmentName?: string;
  meetingRoomId: string;
  meetingRoomName?: string;
  userName?: string;
  gtimName?: string;
  visitorName?: string;
  companyName?: string;
  request?: string;
  equipment: { id: string; name: string; quantity: number }[];
  createdAt?: string;
  isGenbaVisit: boolean;
}

export interface HydrateObject {
  departmentId?: string;
  departmentName?: string;
  meetingRoomId?: string;
  meetingRoomName?: string;
  equipment?: { id?: string; name: string; quantity: number }[];
  [key: string]: unknown;
}

export type SortableValue = string | Date | number | undefined | null;
