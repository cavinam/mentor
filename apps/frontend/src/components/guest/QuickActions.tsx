'use client';

import Link from 'next/link';
import { Calendar, CheckSquare, LogIn } from 'lucide-react';

const quickActions = [
    { label: 'New Booking', description: 'Create a new meeting room booking', icon: Calendar },
    { label: 'View Calendar', description: 'Check room availability', icon: Calendar },
    { label: 'My Bookings', description: 'View your booking history', icon: CheckSquare },
];

export function QuickActions() {
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {quickActions.map((action) => {
                    const Icon = action.icon;
                    return (
                        <Link
                            key={action.label}
                            href="/login"
                            className="p-4 border border-gray-200 rounded-lg hover:border-red-500 hover:bg-red-50 transition-colors text-left group"
                        >
                            <Icon className="w-8 h-8 text-gray-400 group-hover:text-red-600 mb-2 transition-colors" />
                            <h3 className="font-medium text-gray-900">{action.label}</h3>
                            <p className="text-sm text-gray-500 mt-1">{action.description}</p>
                            <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                                <LogIn className="w-3 h-3" />
                                Login diperlukan
                            </p>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
