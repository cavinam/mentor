'use client';

import { X } from 'lucide-react';
import { type Booking } from '@/services/bookingService';

interface BookingHeaderProps {
  mode: 'create' | 'view' | 'edit';
  booking?: Booking | null;
  onClose: () => void;
}

export function BookingHeader({ mode, booking, onClose }: BookingHeaderProps) {
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
  );
}
