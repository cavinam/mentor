'use client';

import { useState, useMemo, useEffect } from 'react';
import { View } from 'react-big-calendar';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, endOfDay, addDays, format } from 'date-fns';
import { BookingCalendar, CalendarEvent, ROOM_COLORS } from '@/components/mentor/calendar/BookingCalendar';
import { BookingPanel } from '@/components/mentor/bookings/BookingPanel';
import { bookingService, type Booking } from '@/services/bookingService';
import { roomService, type Room } from '@/services/roomService';
import { Search, X, Calendar as CalendarIcon } from 'lucide-react';

export default function CalendarPage() {
  const [selectedRoom, setSelectedRoom] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Calendar state
  const [currentView, setCurrentView] = useState<View>('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Panel state
  const [panelMode, setPanelMode] = useState<'create' | 'view' | null>(null);

  // Fetch bookings and rooms from API
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [bookingsRes, roomsRes] = await Promise.all([
        bookingService.getAll({ limit: 10000 }), // Get all bookings for calendar
        roomService.getAll(),
      ]);
      setBookings(bookingsRes.data);
      setRooms(roomsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Failed to load calendar data. Please try refreshing the page.');
    } finally {
      setIsLoading(false);
    }
  };

  // Convert bookings to calendar events
  // For multi-day bookings, create separate events for each day with the same time slot
  const events = useMemo<CalendarEvent[]>(() => {
    const allEvents: CalendarEvent[] = [];

    bookings.forEach((booking) => {
      // Parse date - handle both Date objects and string formats
      const parseDate = (dateStr: string | Date) => {
        if (dateStr instanceof Date) return dateStr;
        return new Date(dateStr);
      };

      const startDateObj = parseDate(booking.startDate);
      const endDateObj = parseDate(booking.endDate);

      // Parse time
      const startHour = parseInt(booking.startTime.split(':')[0]);
      const startMinute = parseInt(booking.startTime.split(':')[1]);
      const endHour = parseInt(booking.endTime.split(':')[0]);
      const endMinute = parseInt(booking.endTime.split(':')[1]);

      // Calculate how many days this booking spans
      const startDateOnly = new Date(startDateObj.getFullYear(), startDateObj.getMonth(), startDateObj.getDate());
      const endDateOnly = new Date(endDateObj.getFullYear(), endDateObj.getMonth(), endDateObj.getDate());
      const daysDiff = Math.floor((endDateOnly.getTime() - startDateOnly.getTime()) / (1000 * 60 * 60 * 24));

      // Create an event for each day
      for (let i = 0; i <= daysDiff; i++) {
        const currentDate = new Date(startDateOnly);
        currentDate.setDate(currentDate.getDate() + i);

        const eventStart = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          currentDate.getDate(),
          startHour,
          startMinute
        );

        const eventEnd = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          currentDate.getDate(),
          endHour,
          endMinute
        );

        allEvents.push({
          id: daysDiff > 0 ? `${booking.id}-day-${i}` : booking.id, // Unique ID for each day's event
          title: booking.agenda,
          start: eventStart,
          end: eventEnd,
          resourceId: booking.meetingRoomId || undefined, // Link to room column in week/day views
          resource: {
            status: booking.overallStatus === 'CANCELED' ? 'CANCELLED' : booking.overallStatus as 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED',
            room: booking.meetingRoom?.name || 'No Room',
            roomId: booking.meetingRoomId,
            bookedBy: booking.user?.fullName || 'Unknown',
            department: booking.department?.name,
            gtimName: booking.gtimName,
            visitorName: booking.visitorName,
            visitorCompany: booking.companyName,
            originalBookingId: booking.id, // Keep track of original booking ID
          },
        });
      }
    });

    return allEvents;
  }, [bookings]);

  // Filter events by room and date range
  const filteredEvents = useMemo(() => {
    let result = events;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(event =>
        event.title.toLowerCase().includes(query) ||
        event.resource?.room?.toLowerCase().includes(query) ||
        event.resource?.bookedBy?.toLowerCase().includes(query)
      );
    }

    // Filter by room
    if (selectedRoom !== 'all') {
      result = result.filter(event => event.resource?.room === selectedRoom);
    }

    // Filter out CANCELED and REJECTED
    result = result.filter(event =>
      event.resource?.status !== 'CANCELLED' &&
      event.resource?.status !== 'REJECTED'
    );

    // Filter by visible date range
    let start: Date, end: Date;

    switch (currentView) {
      case 'month':
        start = startOfMonth(currentDate);
        end = endOfMonth(currentDate);
        break;
      case 'week':
        start = startOfWeek(currentDate);
        end = endOfWeek(currentDate);
        break;
      case 'day':
        start = startOfDay(currentDate);
        end = endOfDay(currentDate);
        break;
      case 'agenda':
        start = currentDate;
        end = addDays(currentDate, 30);
        break;
      default:
        start = startOfMonth(currentDate);
        end = endOfMonth(currentDate);
    }

    // Include events that overlap with the range
    return result.filter(event => {
      return (
        (event.start >= start && event.start <= end) ||
        (event.end >= start && event.end <= end) ||
        (event.start <= start && event.end >= end)
      );
    });
  }, [events, searchQuery, selectedRoom, currentView, currentDate]);

  const handleSelectEvent = (event: CalendarEvent) => {
    // Show booking detail panel
    // For multi-day events, use the original booking ID
    const bookingId = event.resource?.originalBookingId || event.id;
    setPanelMode('view');
    setSelectedBookingId(bookingId);
  };

  const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
    // Open create booking panel
    // TODO: Can enhance to pass pre-filled date/time to BookingPanel
    console.log('Selected slot:', slotInfo);
    setPanelMode('create');
    setSelectedBookingId(null);
  };

  const handleClosePanel = () => {
    setPanelMode(null);
    setSelectedBookingId(null);
  };

  const handlePanelSuccess = async () => {
    await fetchData(); // Refresh calendar and wait for completion
    handleClosePanel();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading calendar...</p>
        </div>
      </div>
    );
  }

  const isPanelOpen = panelMode !== null;

  return (
    <div className={`transition-all duration-300 ${isPanelOpen ? 'mr-[40rem]' : 'mr-0'}`}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Calendar View</h1>
        <p className="text-gray-600 mt-1">View all meeting room bookings in calendar format</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            {/* Search Field */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search agenda, room, organizer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-8 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Room Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Room:</label>
              <select
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={rooms.length === 0}
              >
                <option value="all">All Rooms</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.name}>
                    {room.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Picker for Day View */}
            {currentView === 'day' && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Date:</label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={format(currentDate, 'yyyy-MM-dd')}
                    onChange={(e) => {
                      const newDate = new Date(e.target.value);
                      if (!isNaN(newDate.getTime())) {
                        setCurrentDate(newDate);
                      }
                    }}
                    className="pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="text-sm text-gray-500">
            {filteredEvents.length} {filteredEvents.length === 1 ? 'booking' : 'bookings'} displayed
          </div>
        </div>
      </div>

      {/* Calendar */}
      <BookingCalendar
        events={filteredEvents} // This now only contains events in visible range + selected room
        rooms={rooms}
        onSelectEvent={handleSelectEvent}
        onSelectSlot={handleSelectSlot}
        view={currentView}
        onView={setCurrentView}
        date={currentDate}
        onNavigate={setCurrentDate}
      />

      {/* Legend */}
      <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Meeting Room Legend</h3>
        <div className="flex flex-wrap gap-6">
          {rooms.map((room, index) => {
            const color = ROOM_COLORS[index % ROOM_COLORS.length];
            return (
              <div key={room.id} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: color.bg }}
                ></div>
                <span className="text-sm text-gray-700">{room.name}</span>
              </div>
            );
          })}
          {/* No Room / Genba Visit legend */}
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: '#9ca3af' }}
            ></div>
            <span className="text-sm text-gray-700">No Room / Genba Visit</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            💡 <strong>Tip:</strong> Click on an event to view details, or click on an empty slot to create a new booking.
          </p>
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">Calendar Features</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Switch between Month, Week, Day, and Agenda views</li>
          <li>• Click on events to view booking details</li>
          <li>• Click on empty slots to create new bookings</li>
          <li>• Filter bookings by meeting room</li>
          <li>• Color-coded by meeting room</li>
        </ul>
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
