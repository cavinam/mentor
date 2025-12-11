'use client';

import { Calendar, Clock, CheckSquare } from 'lucide-react';

interface StatsCardsProps {
    total: number;
    pending: number;
    approved: number;
}

export function StatsCards({ total, pending, approved }: StatsCardsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Booking Hari Ini</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">{total}</p>
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
                        <p className="text-3xl font-bold text-yellow-600 mt-2">{pending}</p>
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
                        <p className="text-3xl font-bold text-green-600 mt-2">{approved}</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                        <CheckSquare className="w-6 h-6 text-green-600" />
                    </div>
                </div>
            </div>
        </div>
    );
}
