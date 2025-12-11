'use client';

import { Save } from 'lucide-react';
import { type Room } from '@/services/roomService';
import { type Equipment } from '@/services/equipmentService';
import { DateTimePicker24h } from '@/components/shared/Datetime';
import { SpecialRequestsField, type SpecialRequest } from './SpecialRequestsField';
import { RoomSelect } from './RoomSelect';
import { EquipmentMultiSelect } from './EquipmentMultiSelect';

interface FormData {
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

interface BookingFormModeProps {
  mode: 'create' | 'edit';
  formData: FormData;
  rooms: Room[];
  equipment: Equipment[];
  startDateTime: Date | undefined;
  endDateTime: Date | undefined;
  isSaving: boolean;
  currentBookingId?: string;
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
  onInputChange,
  onStartDateTimeChange,
  onEndDateTimeChange,
  onEquipmentToggle,
  onSubmit,
  onCancel,
}: BookingFormModeProps) {
  return (
    <form onSubmit={onSubmit}>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="space-y-4">
          {/* Meeting Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meeting Agenda *
              </label>
              <input
                type="text"
                value={formData.agenda}
                onChange={(e) => onInputChange('agenda', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Name
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => onInputChange('companyName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GTIM Name
              </label>
              <input
                type="text"
                value={formData.gtimName}
                onChange={(e) => onInputChange('gtimName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Visitor Name
              </label>
              <input
                type="text"
                value={formData.visitorName}
                onChange={(e) => onInputChange('visitorName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date & Time *
              </label>
              <DateTimePicker24h
                value={startDateTime}
                onChange={onStartDateTimeChange}
                disabled={formData.allDay}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date & Time *
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
