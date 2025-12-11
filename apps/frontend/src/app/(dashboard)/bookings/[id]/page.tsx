'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { BookingPanel } from '@/components/mentor/bookings/BookingPanel';
import { Calendar } from 'lucide-react';

export default function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const handleClose = () => {
    router.push('/bookings');
  };

  const handleSuccess = () => {
    router.push('/bookings');
  };

  return (
    <>
      {/* Background content with responsive margin */}
      <div className="mr-[40rem] transition-all duration-300">
        <div className="flex items-center justify-center min-h-[500px]">
          <div className="text-center text-gray-400">
            <Calendar className="w-16 h-16 mx-auto mb-4" />
            <p className="text-lg font-medium">Booking Details</p>
            <p className="text-sm mt-2">View booking information on the right panel</p>
          </div>
        </div>
      </div>

      {/* Booking Panel */}
      <BookingPanel
        mode="view"
        bookingId={id}
        onClose={handleClose}
        onSuccess={handleSuccess}
      />
    </>
  );
}
