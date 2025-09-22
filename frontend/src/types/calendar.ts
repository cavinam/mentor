export interface CalendarEvent {
  id: string;
  title: string;
  agenda?: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  status?: string;
  departmentId?: string;
  departmentName?: string;
  meetingRoomId?: string;
  meetingRoomName?: string;
  userName?: string;
  gtimName?: string;
  visitorName?: string;
  companyName?: string;
  request?: string;
  equipment?: { id: string; name: string; quantity: number }[];
  createdAt?: string;
  updatedAt?: string;
  isGenbaVisit?: boolean;
}

// Antarmuka untuk data Meeting Room
export interface MeetingRoom {
  id: string;
  name: string;
}

export interface Department {
  id: string;
  name: string;
}
