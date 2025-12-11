'use client';

import Link from 'next/link';
import { LogIn } from 'lucide-react';

export function LoginBanner() {
    return (
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-6 mb-8 text-white">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h2 className="text-xl font-semibold">Mode Read-Only</h2>
                    <p className="text-red-100 mt-1">Login untuk membuat booking atau mengakses fitur lainnya.</p>
                </div>
                <Link
                    href="/login"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white text-red-600 font-medium rounded-lg hover:bg-red-50 transition-colors shadow-md"
                >
                    <LogIn className="w-5 h-5" />
                    Login Sekarang
                </Link>
            </div>
        </div>
    );
}
