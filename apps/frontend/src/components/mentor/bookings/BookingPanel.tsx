'use client';

import { useState, useEffect } from 'react';
import { bookingService, type Booking } from '@/services/bookingService';
import { roomService, type Room } from '@/services/roomService';
import { equipmentService, type Equipment } from '@/services/equipmentService';
import { useAuthStore } from '@/store/authStore';
import { format, parse } from 'date-fns';
import { toast } from 'sonner';
import { type SpecialRequest } from './SpecialRequestsField';
import { BookingHeader } from './BookingHeader';
import { BookingViewMode } from './BookingViewMode';
import { BookingFormMode } from './BookingFormMode';

interface BookingPanelProps {
  mode: 'create' | 'view' | 'edit';
  bookingId?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function BookingPanel({ mode: initialMode, bookingId, onClose, onSuccess }: BookingPanelProps) {
  const { user } = useAuthStore();
  const [mode, setMode] = useState(initialMode);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [startDateTime, setStartDateTime] = useState<Date | undefined>(undefined);
  const [endDateTime, setEndDateTime] = useState<Date | undefined>(undefined);

  const [formData, setFormData] = useState({
    agenda: '',
    gtimName: '',
    visitorName: '',
    companyName: '',
    allDay: false,
    request: '',
    isGenbaVisit: false,
    meetingRoomId: '',
    equipments: [] as Array<{ equipmentId: string }>,
    specialRequests: [] as SpecialRequest[],
  });

  useEffect(() => {
    fetchRoomsAndEquipment();
    if (bookingId && (mode === 'view' || mode === 'edit')) {
      fetchBookingData();
    } else {
      setIsLoading(false);
    }
  }, [bookingId, mode]);

  const fetchBookingData = async () => {
    if (!bookingId) return;

    try {
      setIsLoading(true);
      const response = await bookingService.getById(bookingId);
      setBooking(response.data);

      setFormData({
        agenda: response.data.agenda,
        gtimName: response.data.gtimName || '',
        visitorName: response.data.visitorName || '',
        companyName: response.data.companyName || '',
        allDay: response.data.allDay,
        request: response.data.request || '',
        isGenbaVisit: response.data.isGenbaVisit,
        meetingRoomId: response.data.meetingRoomId || '',
        equipments: response.data.meetingEquipments?.map(me => ({
          equipmentId: me.equipment.id,
        })) || [],
        specialRequests: response.data.specialRequests || [],
      });

      // Parse dates with validation
      try {
        const startDateStr = response.data.startDate.split('T')[0]; // Handle ISO format
        const endDateStr = response.data.endDate.split('T')[0];

        const startDate = parse(`${startDateStr} ${response.data.startTime}`, 'yyyy-MM-dd HH:mm', new Date());
        const endDate = parse(`${endDateStr} ${response.data.endTime}`, 'yyyy-MM-dd HH:mm', new Date());

        // Validate parsed dates
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          console.error('Invalid date parsed:', { startDate, endDate, raw: response.data });
          throw new Error('Invalid date format');
        }

        setStartDateTime(startDate);
        setEndDateTime(endDate);
      } catch (dateError) {
        console.error('Error parsing dates:', dateError, response.data);
        toast.error('Error loading booking dates');
      }
    } catch (error: any) {
      console.error('Error fetching booking:', error);
      toast.error(error.response?.data?.error || 'Failed to load booking');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRoomsAndEquipment = async () => {
    try {
      const [roomsResponse, equipmentResponse] = await Promise.all([
        roomService.getAll(),
        equipmentService.getAll(),
      ]);
      setRooms(roomsResponse.data);
      setEquipment(equipmentResponse.data);
      console.log('📦 Fetched equipment list:', equipmentResponse.data);
    } catch (error) {
      console.error('Error fetching rooms and equipment:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!startDateTime || !endDateTime) {
      toast.error('Please select start and end date/time');
      return;
    }

    setIsSaving(true);
    try {
      const bookingData = {
        ...formData,
        startDate: format(startDateTime, 'yyyy-MM-dd'),
        endDate: format(endDateTime, 'yyyy-MM-dd'),
        startTime: formData.allDay ? '00:00' : format(startDateTime, 'HH:mm'),
        endTime: formData.allDay ? '23:59' : format(endDateTime, 'HH:mm'),
        meetingRoomId: formData.meetingRoomId || undefined,
      };

      if (mode === 'create') {
        await bookingService.create(bookingData);
        toast.success('Booking created successfully!');
      } else if (mode === 'edit' && bookingId) {
        await bookingService.update(bookingId, bookingData);
        toast.success('Booking updated successfully!');
      }

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error: any) {
      console.error('Error saving booking:', error);
      toast.error(error.response?.data?.error || 'Failed to save booking');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEquipmentToggle = (equipmentId: string) => {
    setFormData(prev => {
      const existingIndex = prev.equipments.findIndex(e => e.equipmentId === equipmentId);
      if (existingIndex >= 0) {
        return {
          ...prev,
          equipments: prev.equipments.filter(e => e.equipmentId !== equipmentId),
        };
      } else {
        return {
          ...prev,
          equipments: [...prev.equipments, { equipmentId }],
        };
      }
    });
  };

  const handleEditClick = () => {
    setMode('edit');
  };

  const handleCancelEdit = () => {
    if (booking) {
      setFormData({
        agenda: booking.agenda,
        gtimName: booking.gtimName || '',
        visitorName: booking.visitorName || '',
        companyName: booking.companyName || '',
        allDay: booking.allDay,
        request: booking.request || '',
        isGenbaVisit: booking.isGenbaVisit,
        meetingRoomId: booking.meetingRoomId || '',
        equipments: booking.meetingEquipments?.map(me => ({
          equipmentId: me.equipment.id,
        })) || [],
        specialRequests: booking.specialRequests || [],
      });

      const startDate = parse(`${booking.startDate} ${booking.startTime}`, 'yyyy-MM-dd HH:mm', new Date());
      const endDate = parse(`${booking.endDate} ${booking.endTime}`, 'yyyy-MM-dd HH:mm', new Date());
      setStartDateTime(startDate);
      setEndDateTime(endDate);
    }
    setMode('view');
  };

  if (isLoading) {
    return (
      <div className="fixed top-0 right-0 h-full w-[40rem] bg-white shadow-2xl z-50 overflow-y-auto animate-slide-in border-l border-gray-200">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500 mt-2">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-0 right-0 h-full w-[40rem] bg-white shadow-2xl z-50 overflow-y-auto animate-slide-in border-l border-gray-200">
      <div className="p-6">
        <BookingHeader
          mode={mode}
          booking={booking}
          onClose={onClose}
        />

        {mode === 'view' && booking ? (
          <BookingViewMode
            booking={booking}
            onEdit={handleEditClick}
            onClose={onClose}
            onSuccess={onSuccess}
          />
        ) : (
          <BookingFormMode
            mode={mode === 'view' ? 'edit' : mode}
            formData={formData}
            rooms={rooms}
            equipment={equipment}
            startDateTime={startDateTime}
            endDateTime={endDateTime}
            isSaving={isSaving}
            currentBookingId={bookingId}
            onInputChange={handleInputChange}
            onStartDateTimeChange={setStartDateTime}
            onEndDateTimeChange={setEndDateTime}
            onEquipmentToggle={handleEquipmentToggle}
            onSubmit={handleSubmit}
            onCancel={mode === 'edit' ? handleCancelEdit : undefined}
          />
        )}
      </div>
    </div>
  );
}
