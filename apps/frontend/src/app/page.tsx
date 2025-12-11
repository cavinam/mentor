'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, loadUser } = useAuthStore();

  useEffect(() => {
    // Load user and redirect if authenticated
    const checkAuth = async () => {
      await loadUser();
      if (isAuthenticated) {
        router.push('/dashboard');
      }
    };
    checkAuth();
  }, [isAuthenticated, loadUser, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-red-50 to-red-100 relative overflow-hidden">
      {/* Background Logo Watermark */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'url(/G-TIM3.png)',
          backgroundSize: '60%',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* Content Card */}
      <div className="relative z-10 text-center space-y-6 p-12 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl max-w-md mx-4">
        {/* Logo at top */}
        <img
          src="/G-TIM3.png"
          alt="G-TIM Logo"
          className="h-16 mx-auto mb-4"
        />

        <h1 className="text-3xl font-bold text-gray-900">
          Visitor and Meeting Room Information System
        </h1>
        <p className="text-lg text-gray-600">
          Manage your meeting room bookings efficiently
        </p>

        <div className="flex gap-4 justify-center mt-8">
          <Link
            href="/login"
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-md"
          >
            Login
          </Link>
          <Link
            href="/view"
            className="px-6 py-3 bg-white text-red-600 border-2 border-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium shadow-md"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
