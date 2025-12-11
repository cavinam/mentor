'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Navigation, UserMenu } from '@/components/layouts/Navigation';
import { Building2, PanelLeft, ChevronRight } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

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

  // Generate breadcrumb items from pathname
  const generateBreadcrumbs = () => {
    const paths = pathname.split('/').filter(Boolean);
    const breadcrumbs: { label: string; href: string }[] = [];

    let currentPath = '';
    paths.forEach((segment) => {
      currentPath += `/${segment}`;
      // Convert segment to readable label (capitalize and replace hyphens)
      const label = segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      breadcrumbs.push({ label, href: currentPath });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="flex">
          {/* Sidebar */}
          <aside
            className={`h-screen bg-white border-r border-gray-200 flex flex-col sticky top-0 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'
              }`}
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
                    <p className="text-sm font-semibold text-gray-900 truncate">MENTOR</p>
                    <p className="text-xs text-gray-500 truncate">Booking System</p>
                  </div>
                )}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 p-2 overflow-y-auto">
              <Navigation isCollapsed={isCollapsed} />
            </div>

            {/* User Menu */}
            <UserMenu isCollapsed={isCollapsed} />
          </aside>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            {/* Header with Toggle Button and Breadcrumb */}
            <div className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200">
              <div className="h-[60px] flex items-center px-4 gap-4">
                {/* Toggle Button */}
                <button
                  onClick={toggleSidebar}
                  className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-200 transition-colors text-gray-500 hover:text-gray-700 flex-shrink-0"
                  title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                  <PanelLeft className={`w-5 h-5 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
                </button>

                {/* Breadcrumb */}
                <nav className="flex items-center text-sm">
                  {breadcrumbs.map((crumb, index) => (
                    <div key={crumb.href} className="flex items-center">
                      {index > 0 && (
                        <ChevronRight className="w-4 h-4 text-gray-400 mx-2" />
                      )}
                      {index === breadcrumbs.length - 1 ? (
                        <span className="text-gray-900 font-medium">{crumb.label}</span>
                      ) : (
                        <Link
                          href={crumb.href}
                          className="text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          {crumb.label}
                        </Link>
                      )}
                    </div>
                  ))}
                </nav>
              </div>
            </div>
            <div className="p-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}



