import { api } from '@/lib/api';

export interface Room {
  id: string;
  name: string;
  location?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RoomListResponse {
  success: boolean;
  data: Room[];
}

export const roomService = {
  // Get all rooms
  getAll: async (): Promise<RoomListResponse> => {
    const response = await api.get('/rooms');
    return response.data;
  },

  // Get room by ID
  getById: async (id: string): Promise<{ success: boolean; data: Room }> => {
    const response = await api.get(`/rooms/${id}`);
    return response.data;
  },

  // Check room availability
  checkAvailability: async (params: {
    roomId: string;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    excludeMeetingId?: string;
  }): Promise<{ success: boolean; data: { isAvailable: boolean } }> => {
    const response = await api.get('/rooms/availability', { params });
    return response.data;
  },
};

