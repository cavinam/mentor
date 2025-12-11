'use client';

import { useState } from 'react';
import { Calendar, Clock, Users, MapPin, Wrench, Edit, X, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { bookingService, type Booking } from '@/services/bookingService';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';

// Helper function to format date as DD-MMM-YYYY
function formatDisplayDate(dateString: string): string {
  try {
    // Handle ISO format (2025-12-10T00:00:00.000Z)
    const date = parseISO(dateString);
    return format(date, 'dd-MMM-yyyy'); // e.g., "10-Dec-2025"
  } catch {
    return dateString; // Fallback to original if parsing fails
  }
}

interface BookingViewModeProps {
  booking: Booking;
  onEdit: () => void;
  onClose: () => void;
  onSuccess?: () => void;
}

export function BookingViewMode({ booking, onEdit, onClose, onSuccess }: BookingViewModeProps) {
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelRemark, setCancelRemark] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCancelClick = () => {
    setIsCancelling(true);
    setCancelRemark('');
  };

  const handleConfirmCancel = async () => {
    if (!cancelRemark.trim()) {
      toast.error('Please provide a reason for cancellation');
      return;
    }

    try {
      setIsSubmitting(true);
      await bookingService.cancel(booking.id, cancelRemark);
      toast.success('Booking cancelled successfully');
      if (onSuccess) onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error cancelling booking:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      APPROVED: 'bg-green-100 text-green-800 border-green-300',
      REJECTED: 'bg-red-100 text-red-800 border-red-300',
      CANCELED: 'bg-gray-100 text-gray-800 border-gray-300',
      PARTIALLY_APPROVED: 'bg-blue-100 text-blue-800 border-blue-300',
    };
    return badges[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  return (
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
                {formatDisplayDate(booking.startDate)}
                {booking.startDate !== booking.endDate && ` - ${formatDisplayDate(booking.endDate)}`}
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

      {/* Request */}
      {booking.request && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Request</h2>
          <p className="text-gray-700">{booking.request}</p>
        </div>
      )}

      {/* Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>

        <div className="space-y-3">
          <div className="space-y-3">
            {isCancelling ? (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                  <div className="flex items-center gap-2 text-red-800 mb-2">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Cancellation Reason</span>
                  </div>
                  <textarea
                    value={cancelRemark}
                    onChange={(e) => setCancelRemark(e.target.value)}
                    placeholder="Why are you cancelling this booking?"
                    className="w-full px-3 py-2 text-sm border border-red-200 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
                    rows={3}
                    autoFocus
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsCancelling(false)}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleConfirmCancel}
                    disabled={isSubmitting || !cancelRemark.trim()}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                    Confirm Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                {booking.overallStatus === 'PENDING' && (
                  <>
                    <button
                      onClick={onEdit}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Edit Booking
                    </button>
                    <button
                      onClick={handleCancelClick}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Cancel Booking
                    </button>
                  </>
                )}

                {booking.overallStatus === 'APPROVED' && (
                  <button
                    onClick={handleCancelClick}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Cancel Booking
                  </button>
                )}
              </>
            )}
          </div>
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
  );
}
