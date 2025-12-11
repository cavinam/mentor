export type SpecialRequestType =
  | 'COFFEE' | 'TEA' | 'LUNCH' | 'SPECIAL_LUNCH' | 'MINERAL_WATER' | 'WELCOME_BOARD'
  | 'OSHIBORY' | 'HAT' | 'APRON' | 'GLOVES' | 'GLASSES' | 'EAR_PLUG' | 'SAFETY_HELMET';

export interface SpecialRequestInput {
  type: SpecialRequestType;
  quantity?: number;
  notes?: string;
  description?: string;
}

export interface SpecialRequestResponse {
  id: string;
  type: SpecialRequestType;
  quantity?: number | null;
  notes?: string | null;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Helper to validate special request based on type
export function validateSpecialRequest(request: SpecialRequestInput): string | null {
  switch (request.type) {
    case 'COFFEE':
    case 'TEA':
      if (!request.quantity || request.quantity < 1) {
        return `${request.type} requires quantity`;
      }
      // Notes are optional but allowed
      return null;

    case 'LUNCH':
    case 'MINERAL_WATER':
      if (!request.quantity || request.quantity < 1) {
        return `${request.type} requires quantity`;
      }
      return null;

    case 'SPECIAL_LUNCH':
      if (!request.quantity || request.quantity < 1) {
        return 'SPECIAL_LUNCH requires quantity';
      }
      // Notes are optional but allowed
      return null;

    case 'WELCOME_BOARD':
      if (!request.description || request.description.trim() === '') {
        return 'WELCOME_BOARD requires description';
      }
      return null;

    // APD (Alat Pelindung Diri) items - require quantity
    case 'OSHIBORY':
    case 'HAT':
    case 'APRON':
    case 'GLOVES':
    case 'GLASSES':
    case 'EAR_PLUG':
    case 'SAFETY_HELMET':
      if (!request.quantity || request.quantity < 1) {
        return `${request.type} requires quantity`;
      }
      return null;

    default:
      return 'Invalid request type';
  }
}

