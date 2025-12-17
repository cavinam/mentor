'use client';

import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import React, { useState, useMemo, useCallback } from 'react';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// Custom CSS for resource view columns - simplified to only handle text styling
const resourceViewStyles = `
  .rbc-time-header-content .rbc-header {
    font-size: 11px !important;
    padding: 4px 2px !important;
    white-space: normal !important;
    word-wrap: break-word !important;
    line-height: 1.2 !important;
  }
`;

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resourceId?: string; // Room ID for resource-based view
  resource?: {
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
    room: string;
    roomId?: string;
    bookedBy: string;
    department?: string;
    gtimName?: string;
    visitorName?: string;
    visitorCompany?: string;
    originalBookingId?: string; // For multi-day events, keeps track of the original booking ID
  };
}

// Room color palette - distinct colors for meeting rooms (high contrast)
export const ROOM_COLORS = [
  { bg: '#16a34a', border: '#15803d', name: 'Green' },     // Vivid Green
  { bg: '#2563eb', border: '#1d4ed8', name: 'Blue' },      // Bright Blue
  { bg: '#dc2626', border: '#b91c1c', name: 'Red' },       // Red
  { bg: '#7c3aed', border: '#6d28d9', name: 'Purple' },    // Purple
  { bg: '#ea580c', border: '#c2410c', name: 'Orange' },    // Orange
  { bg: '#0891b2', border: '#0e7490', name: 'Cyan' },      // Cyan
  { bg: '#ca8a04', border: '#a16207', name: 'Yellow' },    // Dark Yellow/Gold
  { bg: '#db2777', border: '#be185d', name: 'Pink' },      // Hot Pink
  { bg: '#4f46e5', border: '#4338ca', name: 'Indigo' },    // Indigo
  { bg: '#0d9488', border: '#0f766e', name: 'Teal' },      // Teal
  { bg: '#9333ea', border: '#7e22ce', name: 'Violet' },    // Violet
  { bg: '#65a30d', border: '#4d7c0f', name: 'Lime' },      // Lime
];

// Resource interface for room columns
interface CalendarResource {
  id: string;
  title: string;
}

interface BookingCalendarProps {
  events?: CalendarEvent[];
  rooms?: { id: string; name: string }[];
  onSelectEvent?: (event: CalendarEvent) => void;
  onSelectSlot?: (slotInfo: { start: Date; end: Date }) => void;
  view?: View;
  onView?: (view: View) => void;
  date?: Date;
  onNavigate?: (date: Date) => void;
}

export function BookingCalendar({
  events = [],
  rooms = [],
  onSelectEvent,
  onSelectSlot,
  view,
  onView,
  date,
  onNavigate,
}: BookingCalendarProps) {
  // Use internal state if props are not provided (uncontrolled mode fallback)
  const [internalView, setInternalView] = useState<View>('month');
  const [internalDate, setInternalDate] = useState(new Date());

  const currentView = view || internalView;
  const currentDate = date || internalDate;

  const handleViewChange = (newView: View) => {
    if (onView) onView(newView);
    else setInternalView(newView);
  };

  const handleNavigate = (newDate: Date) => {
    if (onNavigate) onNavigate(newDate);
    else setInternalDate(newDate);
  };

  // Create resources from rooms for week/day view columns
  const resources: CalendarResource[] = useMemo(() => {
    return rooms.map(room => ({
      id: room.id,
      title: room.name,
    }));
  }, [rooms]);

  // Create a map of room names to colors
  const roomColorMap = useMemo(() => {
    const map: Record<string, typeof ROOM_COLORS[0]> = {};
    rooms.forEach((room, index) => {
      map[room.name] = ROOM_COLORS[index % ROOM_COLORS.length];
      map[room.id] = ROOM_COLORS[index % ROOM_COLORS.length];
    });
    return map;
  }, [rooms]);

  // Custom event styling based on room
  const eventStyleGetter = useCallback(
    (event: CalendarEvent) => {
      const roomName = event.resource?.room || '';
      const colorScheme = roomColorMap[roomName] || roomColorMap[event.resourceId || ''] || { bg: '#6b7280', border: '#4b5563' };

      return {
        style: {
          backgroundColor: colorScheme.bg,
          borderColor: colorScheme.border,
          color: '#ffffff',
        },
      };
    },
    [roomColorMap]
  );

  // Check if we should show resources (only in day view when rooms exist)
  const showResources = currentView === 'day' && resources.length > 0;

  // Custom components
  const components = useMemo(
    () => ({
      event: ({ event }: { event: CalendarEvent }) => (
        <div
          className="text-xs px-1 overflow-hidden"
          title={`${event.title}\nRoom: ${event.resource?.room || 'N/A'}\nBy: ${event.resource?.bookedBy || 'Unknown'}\nStatus: ${event.resource?.status}`}
        >
          <div className="font-semibold truncate">
            <span>{event.title}</span>
          </div>
          {/* Show room name only in month view where resources aren't shown as columns */}
          {!showResources && event.resource?.room && (
            <div className="text-[10px] opacity-80 truncate">{event.resource.room}</div>
          )}
        </div>
      ),
      agenda: {
        event: ({ event }: { event: CalendarEvent }) => (
          <div className="flex items-center gap-4 py-1 flex-wrap">
            <span className="font-semibold text-white">
              {event.title} - {event.resource?.room || 'No Room'}
            </span>
            {event.resource?.department && (
              <span className="text-sm text-white/90">
                <span className="font-medium">Dept:</span> {event.resource.department}
              </span>
            )}
            {event.resource?.gtimName && (
              <span className="text-sm text-white/90">
                <span className="font-medium">GTIM:</span> {event.resource.gtimName}
              </span>
            )}
            {event.resource?.visitorName && (
              <span className="text-sm text-white/90">
                <span className="font-medium">Visitor:</span> {event.resource.visitorName}
              </span>
            )}
            {event.resource?.visitorCompany && (
              <span className="text-sm text-white/90">
                <span className="font-medium">Company:</span> {event.resource.visitorCompany}
              </span>
            )}
          </div>
        ),
      },
      // Custom resource header for room column names
      resourceHeader: ({ label, resource }: { label: React.ReactNode; resource: CalendarResource }) => (
        <div
          className="text-center font-semibold text-gray-700 py-1 px-1 bg-gray-50 border-b border-gray-200 text-xs leading-tight min-h-[40px] flex items-center justify-center"
          title={resource?.title || String(label)}
        >
          <span className="break-words hyphens-auto">{label}</span>
        </div>
      ),
    }),
    [showResources]
  );

  return (
    <div className="h-[700px] bg-white p-4 rounded-lg border border-gray-200">
      {showResources && <style>{resourceViewStyles}</style>}
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        view={currentView}
        onView={handleViewChange}
        date={currentDate}
        onNavigate={handleNavigate}
        eventPropGetter={eventStyleGetter}
        onSelectEvent={onSelectEvent}
        onSelectSlot={onSelectSlot}
        selectable
        components={components}
        popup
        showMultiDayTimes
        step={30}
        timeslots={2}
        defaultView="month"
        views={['month', 'week', 'day', 'agenda']}
        // Resource props for room columns in week/day views
        resources={showResources ? resources : undefined}
        resourceIdAccessor="id"
        resourceTitleAccessor="title"
        messages={{
          next: 'Next',
          previous: 'Previous',
          today: 'Today',
          month: 'Month',
          week: 'Week',
          day: 'Day',
          agenda: 'Agenda',
          date: 'Date',
          time: 'Time',
          event: 'Event',
          noEventsInRange: 'No bookings in this range',
          showMore: (total) => `+${total} more`,
        }}
        formats={{
          timeGutterFormat: 'HH:mm',
          eventTimeRangeFormat: ({ start, end }, culture, localizer) =>
            localizer
              ? `${localizer.format(start, 'HH:mm', culture)} - ${localizer.format(
                end,
                'HH:mm',
                culture
              )}`
              : '',
          agendaTimeRangeFormat: ({ start, end }, culture, localizer) =>
            localizer
              ? `${localizer.format(start, 'HH:mm', culture)} - ${localizer.format(
                end,
                'HH:mm',
                culture
              )}`
              : '',
        }}
        min={new Date(0, 0, 0, 7, 0, 0)}
        max={new Date(0, 0, 0, 23, 59, 59)}
        scrollToTime={new Date(0, 0, 0, 7, 0, 0)}
      />
    </div>
  );
}
