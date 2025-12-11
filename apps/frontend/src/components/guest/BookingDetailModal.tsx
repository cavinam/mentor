'use client';

import { Calendar, Clock } from 'lucide-react';
import type { Booking } from '@/services/bookingService';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface BookingDetailModalProps {
    booking: Booking | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function BookingDetailModal({ booking, open, onOpenChange }: BookingDetailModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-white border border-gray-300 shadow-2xl">
                <DialogHeader className="border-b border-gray-200 pb-4">
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        Detail Booking
                    </DialogTitle>
                </DialogHeader>
                {booking && (
                    <div className="space-y-4 pt-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="font-bold text-gray-900 text-lg">{booking.agenda}</h3>
                            <div className="flex flex-wrap gap-2 mt-2">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${booking.overallStatus === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                    booking.overallStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                                        booking.overallStatus === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                            'bg-gray-100 text-gray-700'
                                    }`}>
                                    {booking.overallStatus}
                                </span>
                                {booking.isGenbaVisit && (
                                    <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-medium">Genba Visit</span>
                                )}
                                {booking.meetingRoom && (
                                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">{booking.meetingRoom.name}</span>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-gray-500 text-xs uppercase font-medium">Waktu</p>
                                <p className="font-semibold text-gray-900 flex items-center gap-1 mt-1">
                                    <Clock className="w-4 h-4" />
                                    {booking.startTime} - {booking.endTime}
                                </p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-gray-500 text-xs uppercase font-medium">Department</p>
                                <p className="font-semibold text-gray-900 mt-1">{booking.department?.name || '-'}</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-gray-500 text-xs uppercase font-medium">PIC</p>
                                <p className="font-semibold text-gray-900 mt-1">{booking.user?.fullName || '-'}</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-gray-500 text-xs uppercase font-medium">Room</p>
                                <p className="font-semibold text-gray-900 mt-1">{booking.meetingRoom?.name || 'Genba Visit'}</p>
                            </div>
                        </div>

                        {(booking.gtimName || booking.visitorName || booking.companyName) && (
                            <div className="border-t border-gray-200 pt-4">
                                <p className="text-gray-500 text-xs uppercase font-medium mb-2">Visitor Info</p>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    {booking.gtimName && (
                                        <div>
                                            <p className="text-gray-500">GTIM Name</p>
                                            <p className="font-medium text-gray-900">{booking.gtimName}</p>
                                        </div>
                                    )}
                                    {booking.visitorName && (
                                        <div>
                                            <p className="text-gray-500">Visitor Name</p>
                                            <p className="font-medium text-gray-900">{booking.visitorName}</p>
                                        </div>
                                    )}
                                    {booking.companyName && (
                                        <div>
                                            <p className="text-gray-500">Company</p>
                                            <p className="font-medium text-gray-900">{booking.companyName}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
