import { api } from '@/lib/api';

export interface Equipment {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EquipmentListResponse {
  success: boolean;
  data: Equipment[];
}

export const equipmentService = {
  // Get all equipment
  getAll: async (): Promise<EquipmentListResponse> => {
    const response = await api.get('/equipment');
    return response.data;
  },

  // Get equipment by ID
  getById: async (id: string): Promise<{ success: boolean; data: Equipment }> => {
    const response = await api.get(`/equipment/${id}`);
    return response.data;
  },

  // Check equipment availability
  checkAvailability: async (params: {
    equipmentId: string;
    startDate: string;
    endDate: string;
  }): Promise<{ success: boolean; data: { isAvailable: boolean; conflictingMeetings: any[] } }> => {
    const response = await api.get('/equipment/availability', { params });
    return response.data;
  },
};
