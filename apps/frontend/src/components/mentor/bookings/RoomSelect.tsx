'use client';

import { useEffect, useState } from 'react';
import { roomService, type Room } from '@/services/roomService';
import { format } from 'date-fns';

interface RoomSelectProps {
  rooms: Room[];
  value: string;
  onChange: (roomId: string) => void;
  startDateTime?: Date;
  endDateTime?: Date;
  disabled?: boolean;
  excludeMeetingId?: string;
}

interface RoomAvailability {
  [roomId: string]: {
    isAvailable: boolean;
    checking: boolean;
  };
}

export function RoomSelect({ rooms, value, onChange, startDateTime, endDateTime, disabled, excludeMeetingId }: RoomSelectProps) {
  const [availability, setAvailability] = useState<RoomAvailability>({});

  useEffect(() => {
    if (!startDateTime || !endDateTime) {
      setAvailability({});
      return;
    }

    checkAllRooms();
  }, [startDateTime, endDateTime, rooms, excludeMeetingId]);

  const checkAllRooms = async () => {
    if (!startDateTime || !endDateTime) return;

    // Mark all as checking
    const checkingState: RoomAvailability = {};
    rooms.forEach(room => {
      checkingState[room.id] = { isAvailable: true, checking: true };
    });
    setAvailability(checkingState);

    // Check each room
    const results: RoomAvailability = {};
    await Promise.all(
      rooms.map(async (room) => {
        try {
          const response = await roomService.checkAvailability({
            roomId: room.id,
            startDate: format(startDateTime, 'yyyy-MM-dd'),
            endDate: format(endDateTime, 'yyyy-MM-dd'),
            startTime: format(startDateTime, 'HH:mm'),
            endTime: format(endDateTime, 'HH:mm'),
            excludeMeetingId,
          });
          results[room.id] = {
            isAvailable: response.data.isAvailable,
            checking: false,
          };
        } catch (error) {
          results[room.id] = {
            isAvailable: true, // Assume available if check fails
            checking: false,
          };
        }
      })
    );

    setAvailability(results);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Meeting Room
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        <option value="">Select a room</option>
        {rooms.map((room) => {
          const roomAvail = availability[room.id];
          const isChecking = roomAvail?.checking;
          const isAvailable = roomAvail?.isAvailable !== false;
          const label = `${room.name}${!isAvailable ? ' - Already Reserved' : ''
            }${isChecking ? ' - Checking...' : ''}`;

          return (
            <option
              key={room.id}
              value={room.id}
              disabled={!isAvailable}
              className={!isAvailable ? 'text-gray-400' : ''}
            >
              {label}
            </option>
          );
        })}
      </select>
      {startDateTime && endDateTime && (
        <p className="text-xs text-gray-500 mt-1">
          {Object.keys(availability).length === 0 ? 'Select dates to check availability' :
            Object.values(availability).some(a => a.checking) ? 'Checking availability...' :
              'Green options are available'}
        </p>
      )}
    </div>
  );
}
