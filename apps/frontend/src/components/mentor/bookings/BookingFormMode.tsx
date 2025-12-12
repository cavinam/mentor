'use client';

import { Save } from 'lucide-react';
import { z } from 'zod';
import { type Room } from '@/services/roomService';
import { type Equipment } from '@/services/equipmentService';
import { DateTimePicker24h } from '@/components/shared/Datetime';
import { SpecialRequestsField, type SpecialRequest } from './SpecialRequestsField';
import { RoomSelect } from './RoomSelect';
import { EquipmentMultiSelect } from './EquipmentMultiSelect';

// Zod Validation Schema
export const bookingFormSchema = z.object({
  category: z.enum(['EXTERNAL', 'INTERNAL'], {
    required_error: 'Category wajib diisi',
  }),
  agenda: z.string().min(1, 'Meeting Agenda wajib diisi'),
  gtimName: z.string().min(1, 'GTIM Name wajib diisi'),
  visitorName: z.string(),
  companyName: z.string(),
  allDay: z.boolean(),
  request: z.string(),
  isGenbaVisit: z.boolean(),
  meetingRoomId: z.string(),
  equipments: z.array(z.object({ equipmentId: z.string() })),
  specialRequests: z.array(z.any()),
}).superRefine((data, ctx) => {
  if (data.category === 'EXTERNAL') {
    if (!data.companyName || data.companyName.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Company Name wajib diisi untuk kategori External',
        path: ['companyName'],
      });
    }
    if (!data.visitorName || data.visitorName.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Visitor Name wajib diisi untuk kategori External',
        path: ['visitorName'],
      });
    }
  }
});

export type BookingFormData = z.infer<typeof bookingFormSchema>;

interface FormData {
  category: 'EXTERNAL' | 'INTERNAL';
  agenda: string;
  gtimName: string;
  visitorName: string;
  companyName: string;
  allDay: boolean;
  request: string;
  isGenbaVisit: boolean;
  meetingRoomId: string;
  equipments: Array<{ equipmentId: string }>;
  specialRequests: SpecialRequest[];
}

export type FormErrors = Partial<Record<keyof FormData, string>>;

interface BookingFormModeProps {
  mode: 'create' | 'edit';
  formData: FormData;
  rooms: Room[];
  equipment: Equipment[];
  startDateTime: Date | undefined;
  endDateTime: Date | undefined;
  isSaving: boolean;
  currentBookingId?: string;
  errors?: FormErrors;
  onInputChange: (field: string, value: any) => void;
  onStartDateTimeChange: (date: Date | undefined) => void;
  onEndDateTimeChange: (date: Date | undefined) => void;
  onEquipmentToggle: (equipmentId: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel?: () => void;
}

export function BookingFormMode({
  mode,
  formData,
  rooms,
  equipment,
  startDateTime,
  endDateTime,
  isSaving,
  currentBookingId,
  errors = {},
  onInputChange,
  onStartDateTimeChange,
  onEndDateTimeChange,
  onEquipmentToggle,
  onSubmit,
  onCancel,
}: BookingFormModeProps) {
  const isInternal = formData.category === 'INTERNAL';

  const handleCategoryChange = (value: 'EXTERNAL' | 'INTERNAL') => {
    onInputChange('category', value);
    // Clear visitor fields when switching to INTERNAL
    if (value === 'INTERNAL') {
      onInputChange('visitorName', '');
      onInputChange('companyName', '');
    }
  };

  return (
    <form onSubmit={onSubmit}>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="space-y-4">
          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleCategoryChange(e.target.value as 'EXTERNAL' | 'INTERNAL')}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.category ? 'border-red-500' : 'border-gray-300'}`}
            >
              <option value="EXTERNAL">External</option>
              <option value="INTERNAL">Internal</option>
            </select>
            {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
          </div>

          {/* Meeting Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meeting Agenda <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.agenda}
                onChange={(e) => onInputChange('agenda', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.agenda ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.agenda && <p className="text-red-500 text-sm mt-1">{errors.agenda}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Name {!isInternal && <span className="text-red-500">*</span>}{isInternal && <span className="text-gray-400">(N/A for Internal)</span>}
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => onInputChange('companyName', e.target.value)}
                disabled={isInternal}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isInternal ? 'bg-gray-100 cursor-not-allowed text-gray-400 border-gray-300' : errors.companyName ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.companyName && !isInternal && <p className="text-red-500 text-sm mt-1">{errors.companyName}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GTIM Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.gtimName}
                onChange={(e) => onInputChange('gtimName', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.gtimName ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.gtimName && <p className="text-red-500 text-sm mt-1">{errors.gtimName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Visitor Name {!isInternal && <span className="text-red-500">*</span>}{isInternal && <span className="text-gray-400">(N/A for Internal)</span>}
              </label>
              <input
                type="text"
                value={formData.visitorName}
                onChange={(e) => onInputChange('visitorName', e.target.value)}
                disabled={isInternal}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isInternal ? 'bg-gray-100 cursor-not-allowed text-gray-400 border-gray-300' : errors.visitorName ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.visitorName && !isInternal && <p className="text-red-500 text-sm mt-1">{errors.visitorName}</p>}
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date & Time
              </label>
              <DateTimePicker24h
                value={startDateTime}
                onChange={onStartDateTimeChange}
                disabled={formData.allDay}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date & Time
              </label>
              <DateTimePicker24h
                value={endDateTime}
                onChange={onEndDateTimeChange}
                disabled={formData.allDay}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="allDay"
              checked={formData.allDay}
              onChange={(e) => onInputChange('allDay', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="allDay" className="text-sm text-gray-700">
              All Day Event
            </label>
          </div>

          {/* Meeting Room & Equipment - Side by Side */}
          <div className="grid grid-cols-2 gap-4">
            <RoomSelect
              rooms={rooms}
              value={formData.meetingRoomId}
              onChange={(roomId) => onInputChange('meetingRoomId', roomId)}
              startDateTime={startDateTime}
              endDateTime={endDateTime}
              disabled={isSaving}
              excludeMeetingId={currentBookingId}
            />

            <EquipmentMultiSelect
              equipment={equipment}
              value={formData.equipments.map(e => e.equipmentId)}
              onChange={(equipmentIds) => {
                const newEquipments = equipmentIds.map(eqId => ({
                  equipmentId: eqId
                }));
                onInputChange('equipments', newEquipments);
              }}
              startDateTime={startDateTime}
              endDateTime={endDateTime}
              disabled={isSaving}
            />
          </div>

          {/* Genba Visit Checkbox */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isGenbaVisit"
              checked={formData.isGenbaVisit}
              onChange={(e) => onInputChange('isGenbaVisit', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="isGenbaVisit" className="text-sm text-gray-700">
              Genba Visit
            </label>
          </div>

          {/* Request */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Request
            </label>
            <SpecialRequestsField
              value={formData.specialRequests}
              onChange={(requests) => onInputChange('specialRequests', requests)}
            />
          </div>

          <div className="border-t border-gray-200 pt-4 mt-6"></div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : mode === 'create' ? 'Create Booking' : 'Save Changes'}
            </button>
            {mode === 'edit' && onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={isSaving}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
