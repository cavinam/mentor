'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, LayoutDashboard, LogIn, Home } from 'lucide-react';

interface GuestSidebarProps {
    isCollapsed: boolean;
}

const guestItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/view', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/login', label: 'Login', icon: LogIn },
];

export function GuestSidebar({ isCollapsed }: GuestSidebarProps) {
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    return (
        <aside
            className={`h-screen bg-white border-r border-gray-200 flex flex-col sticky top-0 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}
        >
            {/* Logo/Brand */}
            <div className="p-3 border-b border-gray-200">
                <div className="flex items-center gap-3 p-2">
                    <img
                        src="/logo.png"
                        alt="Mentor Logo"
                        className="w-8 h-8 rounded-md object-contain flex-shrink-0"
                    />
                    {!isCollapsed && (
                        <div className="flex-1 text-left min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">Mentor</p>
                            <p className="text-xs text-gray-500 truncate">Guest Mode</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 p-2 overflow-y-auto">
                <nav className="space-y-1">
                    {!isCollapsed && (
                        <p className="px-3 text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                            Menu
                        </p>
                    )}
                    {guestItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.href);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                title={isCollapsed ? item.label : undefined}
                                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${isCollapsed ? 'justify-center' : ''
                                    } ${active
                                        ? 'bg-red-50 text-red-700 font-medium'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                <Icon className="w-4 h-4 flex-shrink-0" />
                                {!isCollapsed && <span>{item.label}</span>}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Guest Footer */}
            <div className="border-t border-gray-200 p-3">
                {!isCollapsed ? (
                    <div className="text-center">
                        <p className="text-xs text-gray-500">Anda belum login</p>
                        <Link
                            href="/login"
                            className="mt-2 w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                        >
                            <LogIn className="w-4 h-4" />
                            Login
                        </Link>
                    </div>
                ) : (
                    <div className="flex justify-center">
                        <Link
                            href="/login"
                            className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="Login"
                        >
                            <LogIn className="w-5 h-5" />
                        </Link>
                    </div>
                )}
            </div>
        </aside>
    );
}
