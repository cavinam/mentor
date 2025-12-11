'use client';

import { PanelLeft } from 'lucide-react';

interface GuestHeaderProps {
    isCollapsed: boolean;
    onToggleSidebar: () => void;
}

export function GuestHeader({ isCollapsed, onToggleSidebar }: GuestHeaderProps) {
    return (
        <div className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200">
            <div className="h-[60px] flex items-center px-4 gap-4">
                {/* Toggle Button */}
                <button
                    onClick={onToggleSidebar}
                    className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-200 transition-colors text-gray-500 hover:text-gray-700 flex-shrink-0"
                    title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    <PanelLeft className={`w-5 h-5 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
                </button>

                {/* Breadcrumb */}
                <nav className="flex items-center text-sm">
                    <span className="text-gray-900 font-medium">Dashboard</span>
                </nav>

                {/* Guest Badge */}
                <div className="ml-auto">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Read-Only Mode
                    </span>
                </div>
            </div>
        </div>
    );
}
