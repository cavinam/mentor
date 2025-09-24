"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import { useAuth } from "../components/AuthContext";
import { getToken } from "../lib/auth";
import { getApiBase } from "../lib/apiBase";
import moment from "moment";

type EquipmentItem = { name: string; type?: string; quantity?: number };
type DepartmentInfo = { id?: string; name?: string };
type MeetingRoomInfo = { id?: string; name?: string };
type UserInfo = { fullName?: string; email?: string };

type MeetingRow = {
  id: string;
  agenda?: string;
  request?: string;
  department?: DepartmentInfo | null;
  meetingRoom?: MeetingRoomInfo | null;
  user?: UserInfo | null;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  meetingEquipments?: { equipment: EquipmentItem; quantity: number }[];
  overallStatus?: string;
  createdAt?: string;
};

const API_BASE_URL = getApiBase();

const buildAuth = (token: string) =>
  token && token.startsWith("Bearer ") ? token : `Bearer ${token}`;

type JwtPayload = {
  role?: string;
  exp?: number;
  iat?: number;
  [key: string]: unknown;
};

function parseJwt(token: string): JwtPayload | null {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload) as JwtPayload;
  } catch {
    return null;
  }
}

function isAdminish(role?: string): boolean {
  return role === "ADMIN" || role === "HRGA_MANAGER" || role === "SECTION_HEAD";
}

const getDateOnly = (s: string) => {
  const d = s?.includes("T") ? s.split("T")[0] : s;
  return d || "";
};

export default function Home() {
  const { isLoggedIn, isAuthReady } = useAuth();

  const [meetings, setMeetings] = useState<MeetingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<string | undefined>(undefined);
  const [showPending, setShowPending] = useState(false);
  const [showToday, setShowToday] = useState(false);

  const fetchMeetings = useCallback(async (adminView: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      if (!token) {
        setError("Token otentikasi tidak ditemukan.");
        setLoading(false);
        return;
      }
      const endpoint = adminView ? `/api/meetings` : `/api/meetings/mine`;
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: { Authorization: buildAuth(token) },
        cache: "no-store",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.message || "Gagal memuat data");
        setMeetings([]);
        return;
      }
      const data = (await res.json()) as MeetingRow[];
      const normalized: MeetingRow[] = (data || []).map((m: MeetingRow) => ({
        ...m,
        id: String(m.id),
      }));
      setMeetings(normalized);
    } catch (e: unknown) {
      const error = e as Error;
      setError(error?.message || "Terjadi kesalahan saat memuat data.");
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthReady || !isLoggedIn) return;
    const token = getToken();
    const payload = token ? parseJwt(token) : null;
    const r = payload?.role as string | undefined;
    setRole(r);
    const adminView = isAdminish(r);
    fetchMeetings(adminView);
  }, [isAuthReady, isLoggedIn, fetchMeetings]);

  // Lists for tables
  const pendingList = useMemo(
    () => meetings.filter((m) => m.overallStatus === "PENDING"),
    [meetings]
  );

  const todayList = useMemo(() => {
    const today = moment().format("YYYY-MM-DD");
    return meetings.filter((m) => {
      const mStart = getDateOnly(m.startDate);
      const mEnd = getDateOnly(m.endDate) || mStart;
      return (
        mStart <= today &&
        mEnd >= today &&
        m.overallStatus !== "REJECTED" &&
        m.overallStatus !== "CANCELED"
      );
    });
  }, [meetings]);

  const formatDateTime = (date?: string, time?: string) => {
    if (!date) return "-";
    const d = getDateOnly(date);
    const t = time ? (time.length === 5 ? `${time}:00` : time) : "00:00:00";
    const mm = moment(
      `${d} ${t}`,
      ["YYYY-MM-DD HH:mm:ss", "YYYY-MM-DD HH:mm"],
      true
    );
    return mm.isValid() ? mm.format("DD MMM YYYY HH:mm") : `${d} ${t}`;
  };

  // Metrics
  const { pendingCount, todayCount } = useMemo(() => {
    const today = moment().format("YYYY-MM-DD");
    let pending = 0;
    let todayMeetings = 0;

    meetings.forEach((m) => {
      if (m.overallStatus === "PENDING") pending += 1;
      const mStart = getDateOnly(m.startDate);
      const mEnd = getDateOnly(m.endDate) || mStart;
      if (
        mStart <= today &&
        mEnd >= today &&
        m.overallStatus !== "REJECTED" &&
        m.overallStatus !== "CANCELED"
      ) {
        todayMeetings += 1;
      }
    });

    return { pendingCount: pending, todayCount: todayMeetings };
  }, [meetings]);

  return (
    <Layout>
      <div className="bg-white p-8 rounded-lg shadow-lg min-h-[60vh]">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-800">
            Dashboard {isAdminish(role) ? "(Admin/Approver)" : "(User)"}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Ringkasan status booking dan kegiatan hari ini.
          </p>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded border bg-red-100 text-red-800 border-red-300">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          <div
            className="bg-blue-50 border border-blue-200 rounded-lg p-6 shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-300"
            role="button"
            tabIndex={0}
            onClick={() => setShowPending((v) => !v)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setShowPending((v) => !v);
            }}
          >
            <div className="text-sm font-medium text-blue-700">
              Total Pending
            </div>
            <div className="mt-2 text-4xl font-bold text-blue-900">
              {loading ? "…" : pendingCount}
            </div>
            <div className="mt-1 text-xs text-blue-700">
              {isAdminish(role)
                ? "Semua meeting yang statusnya Pending"
                : "Meeting Anda yang statusnya Pending"}
            </div>
          </div>

          <div
            className="bg-green-50 border border-green-200 rounded-lg p-6 shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-300"
            role="button"
            tabIndex={0}
            onClick={() => setShowToday((v) => !v)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setShowToday((v) => !v);
            }}
          >
            <div className="text-sm font-medium text-green-700">
              Today Activity
            </div>
            <div className="mt-2 text-4xl font-bold text-green-900">
              {loading ? "…" : todayCount}
            </div>
            <div className="mt-1 text-xs text-green-700">
              Jumlah meeting yang berlangsung pada tanggal hari ini
            </div>
          </div>
        </div>

        {/* Tabel detail berdasarkan kartu yang diklik */}
        {showPending && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xl font-semibold text-blue-800">
                Daftar Pending ({pendingList.length})
              </h3>
              <button
                type="button"
                onClick={() => setShowPending(false)}
                className="text-sm px-3 py-1 rounded border border-blue-300 text-blue-700 hover:bg-blue-50"
                aria-label="Tutup daftar pending"
              >
                Tutup
              </button>
            </div>
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">
                      No
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">
                      Agenda
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">
                      Request
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">
                      Departemen
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">
                      Ruang
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">
                      User
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">
                      Start
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">
                      End
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {pendingList.map((m, idx) => (
                    <tr key={m.id}>
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {m.agenda || "-"}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {m.request || "-"}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {m.department?.name || "-"}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {m.meetingRoom?.name || "-"}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {m.user?.fullName || "-"}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {formatDateTime(m.startDate, m.startTime)}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {formatDateTime(m.endDate, m.endTime)}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        <span className="inline-block px-2 py-0.5 rounded text-xs bg-yellow-100 text-yellow-800 border border-yellow-200">
                          {m.overallStatus || "-"}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {pendingList.length === 0 && (
                    <tr>
                      <td
                        className="px-4 py-3 text-center text-sm text-gray-500"
                        colSpan={9}
                      >
                        Tidak ada data.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {showToday && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xl font-semibold text-green-800">
                Today Activity ({todayList.length})
              </h3>
              <button
                type="button"
                onClick={() => setShowToday(false)}
                className="text-sm px-3 py-1 rounded border border-green-300 text-green-700 hover:bg-green-50"
                aria-label="Tutup daftar kegiatan hari ini"
              >
                Tutup
              </button>
            </div>
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">
                      No
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">
                      Agenda
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">
                      Request
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">
                      Departemen
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">
                      Ruang
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">
                      User
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">
                      Start
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">
                      End
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {todayList.map((m, idx) => (
                    <tr key={m.id}>
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {m.agenda || "-"}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {m.request || "-"}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {m.department?.name || "-"}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {m.meetingRoom?.name || "-"}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {m.user?.fullName || "-"}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {formatDateTime(m.startDate, m.startTime)}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {formatDateTime(m.endDate, m.endTime)}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        <span className="inline-block px-2 py-0.5 rounded text-xs bg-green-100 text-green-800 border border-green-200">
                          {m.overallStatus || "-"}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {todayList.length === 0 && (
                    <tr>
                      <td
                        className="px-4 py-3 text-center text-sm text-gray-500"
                        colSpan={9}
                      >
                        Tidak ada data.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="text-sm text-gray-500">
          Gunakan menu di sidebar untuk melihat kalender, approvals, atau
          mengelola meeting.
        </div>
      </div>
    </Layout>
  );
}
