'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import type { Booking } from '@/services/bookingService';
import {
    GuestSidebar,
    GuestHeader,
    StatsCards,
    TodayActivityTable,
    BookingDetailModal,
    QuickActions,
    LoginBanner,
    RoomAvailabilityChecker,
} from '@/components/guest';

export default function GuestDashboardPage() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [todayBookings, setTodayBookings] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    // Load collapsed state from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('sidebar-collapsed');
        if (saved !== null) {
            setIsCollapsed(saved === 'true');
        }
    }, []);

    const toggleSidebar = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem('sidebar-collapsed', String(newState));
    };

    // Fetch today's bookings from public endpoint (no auth required)
    useEffect(() => {
        const fetchTodayBookings = async () => {
            try {
                setIsLoading(true);
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
                const response = await fetch(`${API_URL}/api/public/today-bookings`);
                const data = await response.json();
                if (data.success) {
                    setTodayBookings(data.data);
                } else {
                    setTodayBookings([]);
                }
            } catch (err: unknown) {
                console.log('Unable to fetch public bookings:', err);
                setTodayBookings([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTodayBookings();
    }, []);

    // Stats
    const stats = {
        total: todayBookings.length,
        pending: todayBookings.filter((b) => b.overallStatus === 'PENDING').length,
        approved: todayBookings.filter((b) => b.overallStatus === 'APPROVED').length,
    };

    const handleViewDetail = (booking: Booking) => {
        setSelectedBooking(booking);
        setIsDetailOpen(true);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="flex">
                {/* Sidebar */}
                <GuestSidebar isCollapsed={isCollapsed} />

                {/* Main Content */}
                <main className="flex-1 overflow-auto">
                    {/* Header */}
                    <GuestHeader isCollapsed={isCollapsed} onToggleSidebar={toggleSidebar} />

                    <div className="p-8">
                        {/* Page Header */}
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                            <p className="text-gray-600 mt-1">Selamat datang! Silakan login untuk mengakses fitur lengkap.</p>
                            <p className="text-sm text-gray-500 mt-1">
                                Hari ini: {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                        </div>

                        {/* Login Banner */}
                        <LoginBanner />

                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-red-600" />
                                <span className="ml-2 text-gray-600">Memuat data hari ini...</span>
                            </div>
                        ) : (
                            <>
                                {/* Stats Cards */}
                                <StatsCards
                                    total={stats.total}
                                    pending={stats.pending}
                                    approved={stats.approved}
                                />

                                {/* Today's Activity Table */}
                                <TodayActivityTable
                                    bookings={todayBookings}
                                    onViewDetail={handleViewDetail}
                                />

                                {/* Booking Detail Modal */}
                                <BookingDetailModal
                                    booking={selectedBooking}
                                    open={isDetailOpen}
                                    onOpenChange={setIsDetailOpen}
                                />

                                {/* Room Availability Checker */}
                                <RoomAvailabilityChecker />

                                {/* Quick Actions */}
                                <QuickActions />
                            </>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
