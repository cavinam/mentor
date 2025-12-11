'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, Save, Edit, Trash2, Calendar, Clock, Users, MapPin, Wrench, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { bookingService, type Booking } from '@/services/bookingService';
import { roomService, type Room } from '@/services/roomService';
import { equipmentService, type Equipment } from '@/services/equipmentService';
import { useAuthStore } from '@/store/authStore';
import { DateTimePicker24h } from '@/components/shared/Datetime';
import { format, parse } from 'date-fns';
import { MultiSelect } from '@/components/ui/multi-select';
import { SpecialRequestsField, type SpecialRequest } from './SpecialRequestsField';

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
      
      const startDate = parse(`${response.data.startDate} ${response.data.startTime}`, 'yyyy-MM-dd HH:mm', new Date());
      const endDate = parse(`${response.data.endDate} ${response.data.endTime}`, 'yyyy-MM-dd HH:mm', new Date());
      setStartDateTime(startDate);
      setEndDateTime(endDate);
    } catch (error: any) {
      console.error('Error fetching booking:', error);
      alert(error.response?.data?.message || 'Failed to load booking details');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRoomsAndEquipment = async () => {
    try {
      const [roomsRes, equipmentRes] = await Promise.all([
        roomService.getAll(),
        equipmentService.getAll(),
      ]);
      setRooms(roomsRes.data);
      setEquipment(equipmentRes.data);
    } catch (error: any) {
      console.error('Error fetching rooms/equipment:', error);
      alert('Failed to load rooms and equipment');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.agenda.trim()) {
      alert('Meeting agenda is required');
      return;
    }

    if (!startDateTime || !endDateTime) {
      alert('Start and end date/time are required');
      return;
    }

    try {
      setIsSaving(true);
      
      const bookingData = {
        ...formData,
        startDate: format(startDateTime, 'yyyy-MM-dd'),
        endDate: format(endDateTime, 'yyyy-MM-dd'),
        startTime: format(startDateTime, 'HH:mm'),
        endTime: format(endDateTime, 'HH:mm'),
      };
      
      if (mode === 'create') {
        await bookingService.create(bookingData);
        alert('Booking created successfully!');
        onSuccess?.(); // Let parent handle close after refresh
      } else if (mode === 'edit' && bookingId) {
        await bookingService.update(bookingId, bookingData);
        alert('Booking updated successfully!');
        setMode('view');
        await fetchBookingData();
        onSuccess?.();
      }
    } catch (error: any) {
      console.error('Error saving booking:', error);
      alert(error.response?.data?.message || 'Failed to save booking');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      APPROVED: 'bg-green-100 text-green-800 border-green-200',
      REJECTED: 'bg-red-100 text-red-800 border-red-200',
      CANCELED: 'bg-gray-100 text-gray-800 border-gray-200',
      CANCELLED: 'bg-gray-100 text-gray-800 border-gray-200',
      PARTIALLY_APPROVED: 'bg-blue-100 text-blue-800 border-blue-200',
    };
    return styles[status as keyof typeof styles] || styles.PENDING;
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      PENDING: AlertCircle,
      APPROVED: CheckCircle,
      REJECTED: XCircle,
      CANCELED: XCircle,
      CANCELLED: XCircle,
      PARTIALLY_APPROVED: AlertCircle,
    };
    return icons[status as keyof typeof icons] || AlertCircle;
  };

  if (isLoading) {
    return (
      <div className="fixed top-0 right-0 h-full w-[40rem] bg-white shadow-2xl z-50 overflow-y-auto border-l border-gray-200">
        <div className="p-6 flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-0 right-0 h-full w-[40rem] bg-white shadow-2xl z-50 overflow-y-auto animate-slide-in border-l border-gray-200">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">
              {mode === 'create' ? 'Create New Booking' : mode === 'edit' ? 'Edit Booking' : booking?.agenda}
            </h1>
            <p className="text-gray-600 mt-1">
              {mode === 'create' 
                ? 'Fill in the details to book a meeting room'
                : mode === 'edit'
                ? 'Update booking details'
                : `Booking #${booking?.id.slice(0, 8)}`
              }
            </p>
          </div>
          <div className="flex items-center gap-3">
            {mode === 'view' && booking && (
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusBadge(booking.overallStatus)}`}>
                {booking.overallStatus}
              </span>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              aria-label="Close panel"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        {mode === 'view' && booking ? (
          /* VIEW MODE */
          <div className="space-y-6">
            {/* Meeting Details */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Meeting Details</h2>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Date</p>
                    <p className="text-gray-900">
                      {booking.startDate}
                      {booking.startDate !== booking.endDate && ` - ${booking.endDate}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Time</p>
                    <p className="text-gray-900">
                      {booking.allDay ? 'All Day' : `${booking.startTime} - ${booking.endTime}`}
                    </p>
                  </div>
                </div>

                {booking.meetingRoom && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Room</p>
                      <p className="text-gray-900">{booking.meetingRoom.name}</p>
                      {booking.meetingRoom.location && (
                        <p className="text-sm text-gray-500">{booking.meetingRoom.location}</p>
                      )}
                    </div>
                  </div>
                )}

                {booking.user && (
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Organizer</p>
                      <p className="text-gray-900">{booking.user.fullName}</p>
                      <p className="text-sm text-gray-500">{booking.user.email}</p>
                    </div>
                  </div>
                )}

                {booking.gtimName && (
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">GTIM Name</p>
                      <p className="text-gray-900">{booking.gtimName}</p>
                    </div>
                  </div>
                )}

                {booking.visitorName && (
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Visitor</p>
                      <p className="text-gray-900">{booking.visitorName}</p>
                      {booking.companyName && (
                        <p className="text-sm text-gray-500">{booking.companyName}</p>
                      )}
                    </div>
                  </div>
                )}

                {booking.meetingEquipments && booking.meetingEquipments.length > 0 && (
                  <div className="flex items-start gap-3">
                    <Wrench className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Equipment</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {booking.meetingEquipments.map((item) => (
                          <span
                            key={item.equipment.id}
                            className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm"
                          >
                            {item.equipment.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Special Request */}
            {booking.request && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Special Request</h2>
                <p className="text-gray-700">{booking.request}</p>
              </div>
            )}

            {/* Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
              
              <div className="space-y-3">
                {booking.overallStatus === 'PENDING' && (
                  <>
                    <button 
                      onClick={handleEditClick}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Edit Booking
                    </button>
                    <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">
                      <X className="w-4 h-4" />
                      Cancel Booking
                    </button>
                  </>
                )}
                
                {booking.overallStatus === 'APPROVED' && (
                  <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">
                    <X className="w-4 h-4" />
                    Cancel Booking
                  </button>
                )}

                <button className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-red-600 text-red-600 rounded-md hover:bg-red-50 transition-colors">
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>

            {/* Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Information</h2>
              
              <div className="space-y-3 text-sm">
                {booking.user && (
                  <div>
                    <p className="text-gray-500">Created by</p>
                    <p className="text-gray-900 font-medium">{booking.user.fullName}</p>
                  </div>
                )}
                <div>
                  <p className="text-gray-500">Created at</p>
                  <p className="text-gray-900">{new Date(booking.createdAt).toLocaleString()}</p>
                </div>
                {booking.isGenbaVisit && (
                  <div className="pt-2 border-t">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      Genba Visit
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* FORM MODE (Create or Edit) */
          <form onSubmit={handleSubmit}>
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
                      onChange={(e) => handleInputChange('agenda', e.target.value)}
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
                      onChange={(e) => handleInputChange('companyName', e.target.value)}
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
                      onChange={(e) => handleInputChange('gtimName', e.target.value)}
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
                      onChange={(e) => handleInputChange('visitorName', e.target.value)}
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
                      onChange={setStartDateTime}
                      disabled={formData.allDay}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date & Time *
                    </label>
                    <DateTimePicker24h
                      value={endDateTime}
                      onChange={setEndDateTime}
                      disabled={formData.allDay}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="allDay"
                    checked={formData.allDay}
                    onChange={(e) => handleInputChange('allDay', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="allDay" className="text-sm text-gray-700">
                    All Day Event
                  </label>
                </div>

                {/* Meeting Room */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meeting Room
                  </label>
                  <select
                    value={formData.meetingRoomId}
                    onChange={(e) => handleInputChange('meetingRoomId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a room</option>
                    {rooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.name} {room.location ? `(${room.location})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Genba Visit Checkbox */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isGenbaVisit"
                    checked={formData.isGenbaVisit}
                    onChange={(e) => handleInputChange('isGenbaVisit', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="isGenbaVisit" className="text-sm text-gray-700">
                    Genba Visit
                  </label>
                </div>

                {/* Equipment - Multi Select */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Equipment
                  </label>
                  <MultiSelect
                    options={equipment.map(eq => ({
                      label: `${eq.name} (${eq.type})`,
                      value: eq.id,
                    }))}
                    onValueChange={(values) => {
                      const newEquipments = values.map(eqId => ({
                        equipmentId: eqId
                      }));
                      handleInputChange('equipments', newEquipments);
                    }}
                    defaultValue={formData.equipments.map(e => e.equipmentId)}
                    variant="secondary"
                    maxCount={3}
                  />
                </div>

                {/* Special Requests */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Special Requests
                  </label>
                  <SpecialRequestsField
                    value={formData.specialRequests}
                    onChange={(requests) => handleInputChange('specialRequests', requests)}
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
                  {mode === 'edit' && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
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
        )}
      </div>
    </div>
  );
}
