'use client';

import { Clock, Users, Building2, Eye } from 'lucide-react';
import type { Booking } from '@/services/bookingService';

interface TodayActivityTableProps {
    bookings: Booking[];
    onViewDetail: (booking: Booking) => void;
}

export function TodayActivityTable({ bookings, onViewDetail }: TodayActivityTableProps) {
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900">Today Activity</h2>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-blue-600" />
                                    Waktu
                                </div>
                            </th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                                Agenda
                            </th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-purple-600" />
                                    Department
                                </div>
                            </th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                                <div className="flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-green-600" />
                                    Room/Location
                                </div>
                            </th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                                Type
                            </th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                                Status
                            </th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                                Action
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {bookings.length > 0 ? (
                            bookings.map((booking) => (
                                <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                                        {booking.startTime} - {booking.endTime}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        <div className="font-medium text-gray-900">{booking.agenda}</div>
                                        {booking.companyName && (
                                            <div className="text-xs text-gray-500">{booking.companyName}</div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-900">
                                        {booking.department?.name || '-'}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-900">
                                        {booking.meetingRoom ? (
                                            <span>{booking.meetingRoom.name}</span>
                                        ) : booking.isGenbaVisit ? (
                                            <span className="text-orange-600 font-medium">Genba</span>
                                        ) : (
                                            <span className="text-gray-500">-</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                                        {booking.isGenbaVisit ? (
                                            <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-medium">
                                                Genba
                                            </span>
                                        ) : (
                                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">
                                                Room
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                                        <span
                                            className={`px-2 py-1 rounded text-xs font-medium ${booking.overallStatus === 'APPROVED'
                                                ? 'bg-green-100 text-green-700'
                                                : booking.overallStatus === 'PENDING'
                                                    ? 'bg-yellow-100 text-yellow-700'
                                                    : booking.overallStatus === 'REJECTED'
                                                        ? 'bg-red-100 text-red-700'
                                                        : 'bg-gray-100 text-gray-700'
                                                }`}
                                        >
                                            {booking.overallStatus}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        <button
                                            onClick={() => onViewDetail(booking)}
                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                            title="View Detail"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                                    Tidak ada booking hari ini
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
