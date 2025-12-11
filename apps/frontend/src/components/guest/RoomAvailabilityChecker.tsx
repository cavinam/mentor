'use client';

import { useState } from 'react';
import { Search, CheckCircle, XCircle, Clock, Users, Loader2, Building2 } from 'lucide-react';

interface RoomAvailability {
    id: string;
    name: string;
    location?: string;
    capacity?: number;
    isAvailable: boolean;
    conflictingMeetings: Array<{
        id: string;
        agenda: string;
        startTime: string;
        endTime: string;
        bookedBy: string;
        department: string;
    }>;
}

interface AvailabilityResult {
    date: string;
    startTime: string;
    endTime: string;
    rooms: RoomAvailability[];
    availableCount: number;
    totalCount: number;
}

export function RoomAvailabilityChecker() {
    const [date, setDate] = useState(() => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    });
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('10:00');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<AvailabilityResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showResult, setShowResult] = useState(false);

    const handleCheck = async () => {
        if (!date || !startTime || !endTime) {
            setError('Silakan lengkapi semua field');
            return;
        }

        if (startTime >= endTime) {
            setError('Waktu mulai harus lebih awal dari waktu selesai');
            return;
        }

        setIsLoading(true);
        setError(null);
        setShowResult(false);

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const response = await fetch(
                `${API_URL}/api/public/check-room-availability?date=${date}&startTime=${startTime}&endTime=${endTime}`
            );
            const data = await response.json();

            if (data.success) {
                setResult(data.data);
                // Small delay for smooth animation
                setTimeout(() => setShowResult(true), 50);
            } else {
                setError(data.message || 'Gagal mengecek ketersediaan');
            }
        } catch (err) {
            console.error('Error checking availability:', err);
            setError('Gagal terhubung ke server');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Check Room Availability</h2>
            </div>

            {/* Input Form */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Waktu Mulai</label>
                    <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Waktu Selesai</label>
                    <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                </div>
                <div className="flex items-end">
                    <button
                        onClick={handleCheck}
                        disabled={isLoading}
                        className="w-full px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:bg-red-400 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Checking...
                            </>
                        ) : (
                            <>
                                <Search className="w-4 h-4" />
                                Check Availability
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Loading State */}
            <div className={`overflow-hidden transition-all duration-300 ease-out ${isLoading ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="flex items-center justify-center py-4 gap-3">
                    <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    <span className="ml-2 text-gray-500 text-sm">Mengecek ketersediaan room...</span>
                </div>
            </div>

            {/* Error Message */}
            <div className={`transition-all duration-300 ease-out ${error ? 'max-h-40 opacity-100 mb-4' : 'max-h-0 opacity-0'}`}>
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                </div>
            </div>

            {/* Results */}
            <div className={`transition-all duration-500 ease-out ${result && showResult ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                {result && (
                    <div className="mt-4">
                        {/* Summary */}
                        <div className="flex items-center gap-4 mb-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg animate-fadeIn">
                            <div className="text-center transform transition-all duration-300 hover:scale-110">
                                <p className="text-2xl font-bold text-green-600">{result.availableCount}</p>
                                <p className="text-xs text-gray-500">Available</p>
                            </div>
                            <div className="text-center transform transition-all duration-300 hover:scale-110">
                                <p className="text-2xl font-bold text-red-600">{result.totalCount - result.availableCount}</p>
                                <p className="text-xs text-gray-500">Booked</p>
                            </div>
                            <div className="text-center transform transition-all duration-300 hover:scale-110">
                                <p className="text-2xl font-bold text-gray-900">{result.totalCount}</p>
                                <p className="text-xs text-gray-500">Total Rooms</p>
                            </div>
                            <div className="ml-auto text-right text-sm text-gray-500">
                                <p>{new Date(result.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                <p className="font-medium text-blue-600">{result.startTime} - {result.endTime}</p>
                            </div>
                        </div>

                        {/* Room List */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {result.rooms.map((room, index) => (
                                <div
                                    key={room.id}
                                    className={`p-4 rounded-lg border-2 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-md ${room.isAvailable
                                        ? 'border-green-200 bg-green-50 hover:border-green-400'
                                        : 'border-red-200 bg-red-50 hover:border-red-400'
                                        }`}
                                    style={{
                                        animationDelay: `${index * 50}ms`,
                                        animation: showResult ? 'fadeInUp 0.4s ease-out forwards' : 'none',
                                        opacity: 0,
                                    }}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{room.name}</h3>
                                            {room.location && (
                                                <p className="text-xs text-gray-500">{room.location}</p>
                                            )}
                                        </div>
                                        <div className={`transition-transform duration-300 ${room.isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                                            {room.isAvailable ? (
                                                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                                            ) : (
                                                <XCircle className="w-5 h-5 flex-shrink-0" />
                                            )}
                                        </div>
                                    </div>

                                    {room.capacity && (
                                        <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                                            <Users className="w-3 h-3" />
                                            <span>Kapasitas: {room.capacity}</span>
                                        </div>
                                    )}

                                    <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${room.isAvailable ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                                        {room.isAvailable ? '✓ Available' : '✗ Booked'}
                                    </div>

                                    {/* Show conflicting meetings */}
                                    {room.conflictingMeetings.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-red-200">
                                            <p className="text-xs font-medium text-red-700 mb-2">Current Booking:</p>
                                            {room.conflictingMeetings.map((meeting, idx) => (
                                                <div key={idx} className="text-xs text-red-600 bg-red-100 rounded-lg p-2 mb-1 transition-all duration-200 hover:bg-red-150">
                                                    <div className="font-medium">{meeting.agenda}</div>
                                                    <div className="flex items-center gap-1 mt-1 text-red-500">
                                                        <Clock className="w-3 h-3" />
                                                        {meeting.startTime} - {meeting.endTime}
                                                    </div>
                                                    <div className="text-red-400 mt-1">{meeting.bookedBy} • {meeting.department}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Custom animation styles */}
            <style jsx>{`
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
}
