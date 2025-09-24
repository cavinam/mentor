import { CalendarEvent, MeetingRoom, Department } from "@/types/calendar";

export interface MeetingDetailModalProps {
  isModalOpen: boolean;
  selectedEvent: CalendarEvent | null;
  formData: Partial<CalendarEvent>;
  isEditing: boolean;
  departments: Department[];
  meetingRooms: MeetingRoom[];
  equipmentList: { id: string; name: string }[];
  // IDs peralatan yang tidak tersedia (untuk disable checkbox)
  equipmentUnavailableIds?: string[];
  // Loading state for save operation
  isSaving?: boolean;
  closeModal: () => void;
  handleChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => void;
  handleSave: () => void;
  setIsEditing: (editing: boolean) => void;
  hydrateIdsFromNames: (prev: Partial<CalendarEvent>) => Partial<CalendarEvent>;
  // Checkbox handler (dipakai kembali)
  handleEquipmentChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  // Multi-select handler (dipakai untuk dropdown equipment)
  handleEquipmentSelectChange: (ids: string[]) => void;
}
