"use client";

import React from "react";
import { useAuth } from "../AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SidebarProps } from "@/types/sidebar";

// Icon placeholder untuk menu
const HomeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
  </svg>
);

const CalendarIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
      clipRule="evenodd"
    />
  </svg>
);

const ApproveIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm-1 13l-3-3 1.414-1.414L11 11.172l3.586-3.586L16 9l-5 6z" />
  </svg>
);

const ManageIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" />
  </svg>
);

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div
      className={`flex flex-col h-screen sticky top-0 bg-gray-800 text-white shadow-lg transition-all duration-300 ${
        isOpen ? "w-64" : "w-20"
      }`}
    >
      <div className="flex items-center h-20 shadow-md p-4 justify-between">
        {isOpen && <h1 className="text-xl font-bold">Visitor App</h1>}
        <button
          onClick={onToggle}
          className="text-gray-200 hover:text-white transition-colors duration-200"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            {isOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 5l7 7-7 7M4 12h16"
              />
            )}
          </svg>
        </button>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-2 overflow-hidden">
        <Link href="/" passHref>
          <div className="flex items-center px-4 py-2 text-gray-200 hover:bg-gray-700 hover:text-white rounded-lg transition duration-200 cursor-pointer">
            <HomeIcon />
            {isOpen && <span className="ml-3">Dashboard</span>}
          </div>
        </Link>
        <Link href="/calendar" passHref>
          <div className="flex items-center px-4 py-2 text-gray-200 hover:bg-gray-700 hover:text-white rounded-lg transition duration-200 cursor-pointer">
            <CalendarIcon />
            {isOpen && <span className="ml-3">Kalender</span>}
          </div>
        </Link>
        <Link href="/approvals" passHref>
          <div className="flex items-center px-4 py-2 text-gray-200 hover:bg-gray-700 hover:text-white rounded-lg transition duration-200 cursor-pointer">
            <ApproveIcon />
            {isOpen && <span className="ml-3">Approvals</span>}
          </div>
        </Link>
        <Link href="/manage" passHref>
          <div className="flex items-center px-4 py-2 text-gray-200 hover:bg-gray-700 hover:text-white rounded-lg transition duration-200 cursor-pointer">
            <ManageIcon />
            {isOpen && <span className="ml-3">Manage Meetings</span>}
          </div>
        </Link>
      </nav>
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className={`flex items-center w-full px-4 py-2 text-red-400 hover:bg-gray-700 rounded-lg transition duration-200 ${
            !isOpen && "justify-center"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-5 w-5 ${isOpen ? "mr-3" : ""}`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 8.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z"
              clipRule="evenodd"
            />
          </svg>
          {isOpen && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
}
