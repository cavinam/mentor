'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useState } from 'react';
import {
  LayoutDashboard,
  Calendar,
  CalendarCheck,
  Building2,
  Users,
  Wrench,
  FolderTree,
  ClipboardCheck,
  History,
  LogOut,
  UserCheck,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown
} from 'lucide-react';

interface NavigationProps {
  isCollapsed?: boolean;
}

export function Navigation({ isCollapsed = false }: NavigationProps) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    mentor: true,
    master: true,
  });

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Mentor Section - Menu untuk aktivitas booking
  const mentorItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'SECTION_HEAD', 'HRGA_MANAGER', 'USER'] },
    { href: '/calendar', label: 'Calendar', icon: Calendar, roles: ['ADMIN', 'SECTION_HEAD', 'HRGA_MANAGER', 'USER'] },
    { href: '/bookings', label: 'My Booking', icon: CalendarCheck, roles: ['ADMIN', 'SECTION_HEAD', 'HRGA_MANAGER', 'USER'] },
    { href: '/summary-visitor', label: 'Summary Visitor', icon: History, roles: ['ADMIN', 'HRGA_MANAGER'] },
    { href: '/approvals', label: 'Approvals', icon: ClipboardCheck, roles: ['ADMIN', 'SECTION_HEAD', 'HRGA_MANAGER'] },
  ];

  // Master Section - Menu untuk data master
  const masterItems = [
    { href: '/master/users', label: 'Users', icon: Users, roles: ['ADMIN'] },
    { href: '/master/equipment', label: 'Equipments', icon: Wrench, roles: ['ADMIN'] },
    { href: '/master/rooms', label: 'Meeting Rooms', icon: Building2, roles: ['ADMIN'] },
    { href: '/master/departments', label: 'Departments', icon: FolderTree, roles: ['ADMIN'] },
    { href: '/master/approvers', label: 'Approvers', icon: UserCheck, roles: ['ADMIN'] },
  ];

  const filteredMentorItems = mentorItems.filter(item =>
    user && item.roles.includes(user.role)
  );

  const filteredMasterItems = masterItems.filter(item =>
    user && item.roles.includes(user.role)
  );

  const renderNavItems = (items: typeof mentorItems, sectionKey: string) => {
    const isExpanded = expandedSections[sectionKey];

    if (!isExpanded && !isCollapsed) return null;

    return items.map((item) => {
      const Icon = item.icon;
      const active = isActive(item.href);

      return (
        <Link
          key={item.href}
          href={item.href}
          title={isCollapsed ? item.label : undefined}
          className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${isCollapsed ? 'justify-center' : 'ml-2'
            } ${active
              ? 'bg-gray-100 text-gray-900 font-medium'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
        >
          <Icon className="w-4 h-4 flex-shrink-0" />
          {!isCollapsed && <span>{item.label}</span>}
        </Link>
      );
    });
  };

  const renderSectionHeader = (label: string, icon: React.ReactNode, sectionKey: string) => {
    const isExpanded = expandedSections[sectionKey];

    if (isCollapsed) {
      return (
        <div className="flex justify-center py-2 text-gray-400">
          {icon}
        </div>
      );
    }

    return (
      <button
        onClick={() => toggleSection(sectionKey)}
        className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
      >
        <div className="flex items-center gap-3">
          {icon}
          <span>{label}</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>
    );
  };

  return (
    <nav className="space-y-2">
      {/* Mentor Section */}
      {filteredMentorItems.length > 0 && (
        <div>
          {!isCollapsed && (
            <p className="px-3 text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
              Menu
            </p>
          )}
          {renderSectionHeader('Mentor', <LayoutDashboard className="w-4 h-4" />, 'mentor')}
          <div className={`space-y-0.5 overflow-hidden transition-all duration-200 ${expandedSections.mentor && !isCollapsed ? 'max-h-96 opacity-100' : isCollapsed ? '' : 'max-h-0 opacity-0'
            }`}>
            {renderNavItems(filteredMentorItems, 'mentor')}
          </div>
        </div>
      )}

      {/* Master Section */}
      {filteredMasterItems.length > 0 && (
        <div>
          {renderSectionHeader('Master', <FolderTree className="w-4 h-4" />, 'master')}
          <div className={`space-y-0.5 overflow-hidden transition-all duration-200 ${expandedSections.master && !isCollapsed ? 'max-h-96 opacity-100' : isCollapsed ? '' : 'max-h-0 opacity-0'
            }`}>
            {renderNavItems(filteredMasterItems, 'master')}
          </div>
        </div>
      )}
    </nav>
  );
}

interface UserMenuProps {
  isCollapsed?: boolean;
}

export function UserMenu({ isCollapsed = false }: UserMenuProps) {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  if (!user) return null;

  if (isCollapsed) {
    return (
      <div className="border-t border-gray-200 p-2">
        <div className="flex flex-col items-center gap-2">
          <div
            className="w-8 h-8 rounded-md bg-gray-200 flex items-center justify-center text-gray-600 font-medium text-sm cursor-pointer"
            title={`${user.fullName}\n${user.email}\n${user.role}`}
          >
            {user.fullName.substring(0, 2).toUpperCase()}
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 text-gray-500 hover:text-red-600 transition-colors rounded-md hover:bg-gray-100"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-gray-200 p-2">
      <button className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 transition-colors">
        <div className="w-8 h-8 rounded-md bg-gray-200 flex items-center justify-center text-gray-600 font-medium text-sm">
          {user.fullName.substring(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{user.fullName}</p>
          <p className="text-xs text-gray-500 truncate">{user.email}</p>
        </div>
        <ChevronsUpDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
      </button>

      <button
        onClick={handleLogout}
        className="w-full mt-1 flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
      >
        <LogOut className="w-4 h-4" />
        Logout
      </button>
    </div>
  );
}
