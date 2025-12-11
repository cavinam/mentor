'use client';

import { useAuthStore } from '@/store/authStore';
import { useState, useEffect, useMemo } from 'react';
import { Plus, Calendar, Clock, CheckCircle, XCircle, AlertCircle, Loader2, Search, X } from 'lucide-react';
import { bookingService, Booking } from '@/services/bookingService';
import { BookingPanel } from '@/components/mentor/bookings/BookingPanel';
import { format, parseISO } from 'date-fns';

export default function BookingsPage() {
  const { user } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  // Panel state
  const [panelMode, setPanelMode] = useState<'create' | 'view' | null>(null);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  // Fetch user's bookings
  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      const response = await bookingService.getMyBookings();
      setBookings(response.data);
    } catch (err: any) {
      console.error('Error fetching bookings:', err);
      setError('Failed to load bookings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // Panel handlers
  const handleOpenCreate = () => {
    setPanelMode('create');
    setSelectedBookingId(null);
  };

  const handleOpenView = (bookingId: string) => {
    setPanelMode('view');
    setSelectedBookingId(bookingId);
  };

  const handleClosePanel = () => {
    setPanelMode(null);
    setSelectedBookingId(null);
  };

  const handlePanelSuccess = () => {
    fetchBookings(); // Refresh list
    handleClosePanel();
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setStartDateFilter('');
    setEndDateFilter('');
  };

  // Filter bookings based on search and date range
  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      // Search filter - check agenda, room name, visitor name, company name
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery ||
        booking.agenda.toLowerCase().includes(searchLower) ||
        (booking.meetingRoom?.name?.toLowerCase().includes(searchLower)) ||
        (booking.visitorName?.toLowerCase().includes(searchLower)) ||
        (booking.companyName?.toLowerCase().includes(searchLower)) ||
        (booking.gtimName?.toLowerCase().includes(searchLower));

      // Date range filter
      const bookingDate = new Date(booking.startDate);
      bookingDate.setHours(0, 0, 0, 0);

      let matchesDateRange = true;
      if (startDateFilter) {
        const start = new Date(startDateFilter);
        start.setHours(0, 0, 0, 0);
        matchesDateRange = matchesDateRange && bookingDate >= start;
      }
      if (endDateFilter) {
        const end = new Date(endDateFilter);
        end.setHours(23, 59, 59, 999);
        matchesDateRange = matchesDateRange && bookingDate <= end;
      }

      return matchesSearch && matchesDateRange;
    });
  }, [bookings, searchQuery, startDateFilter, endDateFilter]);

  // Calculate stats from filtered bookings
  const stats = {
    total: filteredBookings.length,
    pending: filteredBookings.filter((b) => b.overallStatus === 'PENDING').length,
    approved: filteredBookings.filter((b) => b.overallStatus === 'APPROVED').length,
    upcoming: filteredBookings.filter((b) => {
      const bookingDate = new Date(b.startDate);
      const today = new Date();
      return bookingDate >= today && (b.overallStatus === 'APPROVED' || b.overallStatus === 'PENDING');
    }).length,
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      APPROVED: 'bg-green-100 text-green-800 border-green-200',
      REJECTED: 'bg-red-100 text-red-800 border-red-200',
      CANCELED: 'bg-gray-100 text-gray-800 border-gray-200',
      PARTIALLY_APPROVED: 'bg-blue-100 text-blue-800 border-blue-200',
    };

    const icons = {
      PENDING: AlertCircle,
      APPROVED: CheckCircle,
      REJECTED: XCircle,
      CANCELED: XCircle,
      PARTIALLY_APPROVED: AlertCircle,
    };

    const Icon = icons[status as keyof typeof icons] || AlertCircle;
    const style = styles[status as keyof typeof styles] || styles.PENDING;

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${style}`}>
        <Icon className="w-3 h-3" />
        {status}
      </span>
    );
  };

  const isPanelOpen = panelMode !== null;

  return (
    <div className={`transition-all duration-300 ${isPanelOpen ? 'mr-[40rem]' : 'mr-0'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-gray-600 mt-1">Manage your meeting room bookings</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Booking
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500">Total Bookings</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{isLoading ? '-' : stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-yellow-200 bg-yellow-50">
          <p className="text-sm text-yellow-700">Pending</p>
          <p className="text-2xl font-bold text-yellow-800 mt-1">{isLoading ? '-' : stats.pending}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-green-200 bg-green-50">
          <p className="text-sm text-green-700">Approved</p>
          <p className="text-2xl font-bold text-green-800 mt-1">{isLoading ? '-' : stats.approved}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-blue-200 bg-blue-50">
          <p className="text-sm text-blue-700">Upcoming</p>
          <p className="text-2xl font-bold text-blue-800 mt-1">{isLoading ? '-' : stats.upcoming}</p>
        </div>
      </div>

      {/* Bookings List/Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <h2 className="text-lg font-semibold text-gray-900">Booking List</h2>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search Field */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search agenda, room, visitor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
                />
              </div>

              {/* Date Range */}
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={startDateFilter}
                  onChange={(e) => setStartDateFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  title="Start Date"
                />
                <span className="text-gray-400">-</span>
                <input
                  type="date"
                  value={endDateFilter}
                  onChange={(e) => setEndDateFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  title="End Date"
                />
              </div>

              {/* Clear Filters Button */}
              {(searchQuery || startDateFilter || endDateFilter) && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Filter Results Info */}
          {(searchQuery || startDateFilter || endDateFilter) && (
            <div className="mt-3 text-sm text-gray-500">
              Showing {filteredBookings.length} of {bookings.length} bookings
              {searchQuery && <span className="ml-1">matching "{searchQuery}"</span>}
              {startDateFilter && <span className="ml-1">from {startDateFilter}</span>}
              {endDateFilter && <span className="ml-1">to {endDateFilter}</span>}
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Meeting Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Room
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
                    <p className="text-gray-500">Loading bookings...</p>
                  </td>
                </tr>
              ) : filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">
                      {bookings.length === 0 ? 'No bookings yet' : 'No bookings match your filters'}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      {bookings.length === 0
                        ? 'Create your first booking to get started'
                        : 'Try adjusting your search or date range'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{booking.agenda}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {booking.meetingRoom?.name || 'No room'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>
                          {new Date(booking.startDate).toLocaleDateString()}
                          {booking.endDate && booking.startDate !== booking.endDate && (
                            <span> - {new Date(booking.endDate).toLocaleDateString()}</span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>{booking.startTime} - {booking.endTime}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(booking.overallStatus)}
                      {booking.overallStatus === 'CANCELED' && booking.cancellationRemark && (
                        <p className="text-xs text-gray-500 mt-1 max-w-[150px] truncate" title={booking.cancellationRemark}>
                          {booking.cancellationRemark}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleOpenView(booking.id)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Booking Panel */}
      {panelMode === 'create' && (
        <BookingPanel
          mode="create"
          onClose={handleClosePanel}
          onSuccess={handlePanelSuccess}
        />
      )}

      {panelMode === 'view' && selectedBookingId && (
        <BookingPanel
          mode="view"
          bookingId={selectedBookingId}
          onClose={handleClosePanel}
          onSuccess={handlePanelSuccess}
        />
      )}
    </div>
  );
}
