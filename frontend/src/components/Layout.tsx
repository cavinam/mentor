"use client";

import React, { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthContext";
import Sidebar from "./sidebar/Sidebar";
import { Toaster } from "react-hot-toast";
export default function Layout({ children }: { children: ReactNode }) {
  const { isLoggedIn, isAuthReady } = useAuth(); // Mengambil state isAuthReady
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    // Hanya melakukan redirect jika otentikasi sudah siap DAN pengguna tidak login
    if (isAuthReady && !isLoggedIn) {
      router.push("/login");
    }
  }, [isLoggedIn, isAuthReady, router]); // Tambahkan isAuthReady ke dependency array

  if (!isAuthReady) {
    return (
      <div className="flex justify-center items-center h-screen w-screen bg-gray-100">
        <p>Memuat...</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return null;
  }

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />
      {/* Menggunakan 'flex-grow' untuk mengisi ruang yang tersisa dan memusatkan konten */}
      <main className="flex-grow p-8 overflow-y-auto transition-all duration-300 max-h-screen">
        {/* Konten anak sekarang mengisi lebar penuh, tidak dibatasi oleh max-w-7xl */}
        {children}
      </main>
      <Toaster />
    </div>
  );
}
