'use client';

import { useAuthStore } from '@/store/authStore';
import { useState, useEffect } from 'react';
import { Calendar, CheckSquare, Building2, Clock, Users, Briefcase, FileText, Loader2, Eye, X } from 'lucide-react';
import { bookingService, Booking } from '@/services/bookingService';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [todayBookings, setTodayBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Fetch today's bookings
  useEffect(() => {
    const fetchTodayBookings = async () => {
      try {
        setIsLoading(true);
        const today = getTodayDate();
        const response = await bookingService.getAll({
          startDate: today,
          endDate: today,
        });
        setTodayBookings(response.data);
      } catch (err) {
        console.error('Error fetching today bookings:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTodayBookings();
  }, []);

  // Extract unique departments from today's bookings
  const uniqueDepartments = Array.from(
    new Map(
      todayBookings
        .filter((b) => b.department)
        .map((b) => [b.department!.id, b.department!])
    ).values()
  );

  // Extract unique companies visiting today
  const uniqueCompanies = Array.from(
    new Set(
      todayBookings
        .filter((b) => b.companyName)
        .map((b) => b.companyName!)
    )
  );

  // Separate genba visits and room bookings
  const genbaVisits = todayBookings.filter((b) => b.isGenbaVisit);
  const roomBookings = todayBookings.filter((b) => !b.isGenbaVisit && b.meetingRoom);

  // Extract unique rooms being used today
  const uniqueRooms = Array.from(
    new Map(
      roomBookings
        .filter((b) => b.meetingRoom)
        .map((b) => [b.meetingRoom!.id, b.meetingRoom!])
    ).values()
  );

  // Extract all requests
  const bookingsWithRequests = todayBookings.filter(
    (b) => b.request || (b.specialRequests && b.specialRequests.length > 0)
  );

  // Stats
  const stats = {
    total: todayBookings.length,
    pending: todayBookings.filter((b) => b.overallStatus === 'PENDING').length,
    approved: todayBookings.filter((b) => b.overallStatus === 'APPROVED').length,
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back, {user?.fullName}!</p>
        <p className="text-sm text-gray-500 mt-1">
          Hari ini: {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Memuat data hari ini...</span>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Booking Hari Ini</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Pending</p>
                  <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.pending}</p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Approved</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">{stats.approved}</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <CheckSquare className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Today's Information Table - Per Event View */}
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
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-red-600" />
                        Requests
                      </div>
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
                  {todayBookings.length > 0 ? (
                    todayBookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                        {/* Waktu */}
                        <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                          {booking.startTime} - {booking.endTime}
                        </td>
                        {/* Agenda */}
                        <td className="px-4 py-3 text-sm">
                          <div className="font-medium text-gray-900">{booking.agenda}</div>
                          {booking.companyName && (
                            <div className="text-xs text-gray-500">{booking.companyName}</div>
                          )}
                        </td>
                        {/* Department */}
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {booking.department?.name || '-'}
                        </td>
                        {/* Room/Location */}
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {booking.meetingRoom ? (
                            <span>{booking.meetingRoom.name}</span>
                          ) : booking.isGenbaVisit ? (
                            <span className="text-orange-600 font-medium">Genba</span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        {/* Type */}
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
                        {/* Requests */}
                        <td className="px-4 py-3 text-sm">
                          {booking.specialRequests && booking.specialRequests.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {booking.specialRequests.map((sr, idx) => (
                                <span
                                  key={idx}
                                  className="inline-block text-xs bg-red-50 text-red-700 px-1.5 py-0.5 rounded"
                                >
                                  {sr.type}: ({sr.quantity || 1})
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>
                        {/* Status */}
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
                        {/* Action */}
                        <td className="px-4 py-3 text-sm">
                          <button
                            onClick={() => {
                              setSelectedBooking(booking);
                              setIsDetailOpen(true);
                            }}
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
                      <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                        Tidak ada booking hari ini
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Booking Detail Modal */}
          <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-white border border-gray-300 shadow-2xl">
              <DialogHeader className="border-b border-gray-200 pb-4">
                <DialogTitle className="flex items-center gap-2 text-xl">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Detail Booking
                </DialogTitle>
              </DialogHeader>
              {selectedBooking && (
                <div className="space-y-4 pt-4">
                  {/* Header */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-bold text-gray-900 text-lg">{selectedBooking.agenda}</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${selectedBooking.overallStatus === 'APPROVED' ? 'bg-green-100 text-green-700' :
                        selectedBooking.overallStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                          selectedBooking.overallStatus === 'REJECTED' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                        }`}>
                        {selectedBooking.overallStatus}
                      </span>
                      {selectedBooking.isGenbaVisit && (
                        <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-medium">Genba Visit</span>
                      )}
                      {selectedBooking.meetingRoom && (
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">{selectedBooking.meetingRoom.name}</span>
                      )}
                    </div>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-gray-500 text-xs uppercase font-medium">Waktu</p>
                      <p className="font-semibold text-gray-900 flex items-center gap-1 mt-1">
                        <Clock className="w-4 h-4" />
                        {selectedBooking.startTime} - {selectedBooking.endTime}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-gray-500 text-xs uppercase font-medium">Department</p>
                      <p className="font-semibold text-gray-900 mt-1">{selectedBooking.department?.name || '-'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-gray-500 text-xs uppercase font-medium">PIC</p>
                      <p className="font-semibold text-gray-900 mt-1">{selectedBooking.user?.fullName || '-'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-gray-500 text-xs uppercase font-medium">Room</p>
                      <p className="font-semibold text-gray-900 mt-1">{selectedBooking.meetingRoom?.name || 'Genba Visit'}</p>
                    </div>
                  </div>

                  {/* Visitor Info */}
                  {(selectedBooking.gtimName || selectedBooking.visitorName || selectedBooking.companyName) && (
                    <div className="border-t border-gray-200 pt-4">
                      <p className="text-gray-500 text-xs uppercase font-medium mb-2">Visitor Info</p>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {selectedBooking.gtimName && (
                          <div>
                            <p className="text-gray-500">GTIM Name</p>
                            <p className="font-medium text-gray-900">{selectedBooking.gtimName}</p>
                          </div>
                        )}
                        {selectedBooking.visitorName && (
                          <div>
                            <p className="text-gray-500">Visitor Name</p>
                            <p className="font-medium text-gray-900">{selectedBooking.visitorName}</p>
                          </div>
                        )}
                        {selectedBooking.companyName && (
                          <div>
                            <p className="text-gray-500">Company</p>
                            <p className="font-medium text-gray-900">{selectedBooking.companyName}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Request */}
                  {selectedBooking.request && (
                    <div className="border-t border-gray-200 pt-4">
                      <p className="text-gray-500 text-xs uppercase font-medium mb-2">Request</p>
                      <p className="text-gray-700 bg-yellow-50 p-3 rounded-lg">{selectedBooking.request}</p>
                    </div>
                  )}

                  {/* Special Requests */}
                  {selectedBooking.specialRequests && selectedBooking.specialRequests.length > 0 && (
                    <div className="border-t border-gray-200 pt-4">
                      <p className="text-gray-500 text-xs uppercase font-medium mb-2">Special Requests</p>
                      <div className="space-y-2">
                        {selectedBooking.specialRequests.map((sr, idx) => (
                          <div key={idx} className="bg-red-50 p-3 rounded-lg">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-red-700">{sr.type}</span>
                              {sr.quantity && <span className="text-red-600 text-sm">Qty: {sr.quantity}</span>}
                            </div>
                            {(sr.description || sr.notes) && (
                              <p className="text-red-600 text-sm mt-1">{sr.description || sr.notes}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Equipment */}
                  {selectedBooking.meetingEquipments && selectedBooking.meetingEquipments.length > 0 && (
                    <div className="border-t border-gray-200 pt-4">
                      <p className="text-gray-500 text-xs uppercase font-medium mb-2">Equipment</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedBooking.meetingEquipments.map((me, idx) => (
                          <span key={idx} className="inline-block text-sm bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg">
                            {me.equipment.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/bookings" className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left">
                <Calendar className="w-8 h-8 text-blue-600 mb-2" />
                <h3 className="font-medium text-gray-900">New Booking</h3>
                <p className="text-sm text-gray-500 mt-1">Create a new meeting room booking</p>
              </Link>

              <Link href="/calendar" className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left">
                <Calendar className="w-8 h-8 text-blue-600 mb-2" />
                <h3 className="font-medium text-gray-900">View Calendar</h3>
                <p className="text-sm text-gray-500 mt-1">Check room availability</p>
              </Link>

              <Link href="/bookings" className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left">
                <CheckSquare className="w-8 h-8 text-blue-600 mb-2" />
                <h3 className="font-medium text-gray-900">My Bookings</h3>
                <p className="text-sm text-gray-500 mt-1">View your booking history</p>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
