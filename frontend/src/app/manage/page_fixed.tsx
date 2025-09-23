"use client";

import React, { useEffect, useMemo, useState } from "react";
import Layout from "../../components/Layout";
import moment from "moment";
import { useAuth } from "../../components/AuthContext";
import { getToken } from "../../lib/auth";
import { getApiBase } from "../../lib/apiBase";
import MeetingDetailModal from "../../components/detail/MeetingDetailModal";
import CancelRemarkModal from "../../components/CancelRemarkModal";

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
  gtimName?: string;
  companyName?: string;
  visitorName?: string;
  createdAt?: string;
};

type FormDataType = {
  id: string;
  agenda?: string;
  start?: Date | null;
  end?: Date | null;
  meetingRoomId?: string;
  departmentId?: string;
  equipment?: { id: string; name: string; quantity: number }[];
  gtimName?: string;
  visitorName?: string;
  companyName?: string;
  request?: string;
  isGenbaVisit?: boolean;
};

type Department = { id: string; name: string };

const API_BASE_URL = getApiBase();

const buildAuth = (token: string) =>
  token && token.startsWith("Bearer ") ? token : `Bearer ${token}`;

function parseJwt(token: string): any | null {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function isAdminish(role?: string): boolean {
  return role === "ADMIN" || role === "HRGA_MANAGER";
}

export default function ManageMeetingsPage() {
  const { isLoggedIn, isAuthReady } = useAuth();

  const [items, setItems] = useState<MeetingRow[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<{
    type: "success" | "error" | "warning";
    message: string;
  } | null>(null);

  // Reject modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectMeetingId, setRejectMeetingId] = useState<string | null>(null);
  const [rejectRemark, setRejectRemark] = useState("");

  const [searchText, setSearchText] = useState("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [departmentId, setDepartmentId] = useState<string>("");

  const [role, setRole] = useState<string | undefined>(undefined);
  const [userDepartmentId, setUserDepartmentId] = useState<string | undefined>(
    undefined
  );

  // State for modal
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingRow | null>(
    null
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<FormDataType | null>(null);

  // Master data for modal
  const [meetingRooms, setMeetingRooms] = useState<
    { id: string; name: string }[]
  >([]);
  const [equipmentList, setEquipmentList] = useState<
    { id: string; name: string }[]
  >([]);

  const showNotice = (
    message: string,
    type: "success" | "error" | "warning" = "success"
  ) => {
    setNotice({ message, type });
    setTimeout(() => setNotice(null), 5000);
  };

  const fetchDepartments = async () => {
    try {
      const token = getToken();
      if (!token) return;
      const res = await fetch(`${API_BASE_URL}/api/departments`, {
        headers: { Authorization: buildAuth(token) },
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as Department[];
      setDepartments(data || []);
    } catch {}
  };

  const fetchMeetingRooms = async () => {
    try {
      const token = getToken();
      if (!token) return;
      const res = await fetch(`${API_BASE_URL}/api/meeting-rooms`, {
        headers: { Authorization: buildAuth(token) },
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as any[];
      const normalized = (data || []).map((r) => ({
        id: String(r.id),
        name: r.name,
      }));
      setMeetingRooms(normalized);
    } catch {}
  };

  const fetchEquipment = async () => {
    try {
      const token = getToken();
      if (!token) return;
      const res = await fetch(`${API_BASE_URL}/api/equipment`, {
        headers: { Authorization: buildAuth(token) },
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as any[];
      setEquipmentList(data.map((d) => ({ id: d.id, name: d.name })));
    } catch {}
  };

  const fetchMeetings = async (
    adminView: boolean,
    role?: string,
    userDepartmentId?: string
  ) => {
    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        showNotice("Token otentikasi tidak ditemukan.", "error");
        return;
      }

      const payload = token ? parseJwt(token) : null;

      const endpoint = adminView ? `/api/meetings` : `/api/meetings/mine`;
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: { Authorization: buildAuth(token) },
        cache: "no-store",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showNotice(err.message || "Gagal mengambil daftar meeting.", "error");
        return;
      }
      const data = (await res.json()) as any[];
      let normalized: MeetingRow[] = (data || []).map((m) => ({
        ...m,
        id: String(m.id),
      }));

      // Filter for SECTION_HEAD to only show meetings from their department
      if (role === "SECTION_HEAD" && userDepartmentId) {
        // Remove client-side filtering because backend already filters by department
        // normalized = normalized.filter(
        //   (m) => m.department?.id === userDepartmentId
        // );
      }

      // Filter for USER to only show meetings from their department
      if (role === "USER" && userDepartmentId) {
        normalized = normalized.filter(
          (m) => m.department?.id === userDepartmentId
        );
      }

      setItems(normalized);
    } catch (e) {
      console.error(e);
      showNotice("Terjadi kesalahan saat memuat meeting.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthReady || !isLoggedIn) return;
    const token = getToken();
    const payload = token ? parseJwt(token) : null;
    const r = payload?.role as string | undefined;
    const depId = payload?.userDepartmentId as string | undefined;
    setRole(r);
    setUserDepartmentId(depId);
    const adminView = isAdminish(r);
    fetchMeetings(adminView, r, depId);
    fetchMeetingRooms();
    fetchEquipment();
    if (adminView || r === "SECTION_HEAD") {
      fetchDepartments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthReady, isLoggedIn]);

  const getDateOnly = (s: string) => {
    const d = s?.includes("T") ? s.split("T")[0] : s;
    return d || "";
  };

  const filteredItems = useMemo(() => {
    const needle = searchText.trim().toLowerCase();
    return items.filter((m) => {
      // Department filter
      if (departmentId && m.department?.id !== departmentId) return false;

      // Date range overlap
      const mStart = getDateOnly(m.startDate as any);
      const mEnd = getDateOnly(m.endDate as any) || mStart;
      let dateOk = true;
      if (fromDate && toDate) {
        dateOk = mStart <= toDate && mEnd >= fromDate;
      } else if (fromDate) {
        dateOk = mEnd >= fromDate;
      } else if (toDate) {
        dateOk = mStart <= toDate;
      }
      if (!dateOk) return false;

      if (!needle) return true;

      const equipments = (m.meetingEquipments || []).map((me) => {
        const n = me.equipment?.name || "-";
        const q = me.quantity ?? 1;
        return `${n} (${q})`;
      });

      const haystack = [
        m.agenda,
        m.user?.fullName,
        m.department?.name,
        m.meetingRoom?.name || "Genba Visit",
        m.overallStatus,
        equipments.join(" "),
        m.request,
        m.gtimName,
        m.visitorName,
        m.companyName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(needle);
    });
  }, [items, searchText, fromDate, toDate, departmentId]);

  const formatDateTimeRange = (m: MeetingRow) => {
    const toDisplay = (dateStr: string, timeStr: string) => {
      const t = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
      const d = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
      const combined = moment(`${d} ${t}`, "YYYY-MM-DD HH:mm:ss");
      return combined.isValid() ? combined.format("DD MMM YYYY, HH:mm") : "-";
    };
    const start = toDisplay(m.startDate as any, m.startTime as any);
    const end = toDisplay(m.endDate as any, m.endTime as any);
    return `${start} - ${end}`;
  };

  const adminView = isAdminish(role);
  const showDepartmentFilter = adminView;

  const convertToCalendarEvent = (m: MeetingRow) => {
    const start = moment(
      `${m.startDate} ${
        m.startTime.length === 5 ? m.startTime + ":00" : m.startTime
      }`,
      "YYYY-MM-DD HH:mm:ss"
    ).toDate();
    const end = moment(
      `${m.endDate} ${m.endTime.length === 5 ? m.endTime + ":00" : m.endTime}`,
      "YYYY-MM-DD HH:mm:ss"
    ).toDate();

    // Find matching meeting room from meetingRooms state by id
    const matchedMeetingRoom = meetingRooms.find(
      (room) => room.id === String(m.meetingRoom?.id)
    );

    // Map equipment ids to match equipmentList ids if possible
    const mappedEquipment = (m.meetingEquipments || []).map((me) => {
      // Try to find equipment in equipmentList by name or id
      const matchedEquip = equipmentList.find(
        (eq) => eq.id === me.equipment?.name || eq.name === me.equipment?.name
      );
      return {
        id: matchedEquip ? matchedEquip.id : me.equipment?.name || "",
        name: matchedEquip ? matchedEquip.name : me.equipment?.name || "",
        quantity: me.quantity || 1,
      };
    });

    return {
      id: m.id,
      title: m.agenda || "Meeting",
      agenda: m.agenda,
      start,
      end,
      status: m.overallStatus,
      departmentId: m.department?.id,
      departmentName: m.department?.name,
      meetingRoomId: matchedMeetingRoom
        ? matchedMeetingRoom.id
        : m.meetingRoom?.id
        ? String(m.meetingRoom.id)
        : "",
      meetingRoomName: matchedMeetingRoom
        ? matchedMeetingRoom.name
        : m.meetingRoom?.name,
      userName: m.user?.fullName,
      gtimName: m.gtimName,
      visitorName: m.visitorName,
      companyName: m.companyName,
      request: m.request,
      equipment: mappedEquipment,
      createdAt: m.createdAt,
      isGenbaVisit: !m.meetingRoom,
    };
  };

  const openMeetingDetail = (meeting: MeetingRow) => {
    setSelectedMeeting(meeting);
    setFormData(convertToCalendarEvent(meeting));
    setIsEditing(false);
    setModalOpen(true);
  };

  // Hydrate formData when meetingRooms or selectedMeeting change to fix meetingRoomId
  const hydrateIdsFromNames = React.useCallback(
    (prev: any) => {
      let next = { ...prev };

      // Fix: Set departmentId from meeting data if missing
      if (!next.departmentId && next.departmentName) {
        const dep = departments.find(
          (d) => d.name?.toLowerCase() === next.departmentName?.toLowerCase()
        );
        if (dep) next.departmentId = dep.id;
      }

      if (!next.meetingRoomId && next.meetingRoomName) {
        const room = meetingRooms.find(
          (r) => r.name?.toLowerCase() === next.meetingRoomName?.toLowerCase()
        );
        if (room) next.meetingRoomId = room.id;
      }

      if (next.equipment && next.equipment.length > 0) {
        next.equipment = next.equipment.map((item: any) => {
          if (item.id) return item; // If ID exists, skip
          const foundEquip = equipmentList.find((eq) => eq.name === item.name);
          return {
            id: foundEquip?.id || "",
            name: item.name,
            quantity: item.quantity,
          };
        });
      }

      return next;
    },
    [departments, meetingRooms, equipmentList]
  );

  React.useEffect(() => {
    if (selectedMeeting && meetingRooms.length > 0) {
      const converted = convertToCalendarEvent(selectedMeeting);
      const hydrated = hydrateIdsFromNames(converted);
      setFormData(hydrated);
    }
  }, [selectedMeeting, meetingRooms.length, hydrateIdsFromNames]);

  const closeMeetingDetail = () => {
    setSelectedMeeting(null);
    setModalOpen(false);
  };

  const cancelMeeting = async (meetingId: string) => {
    const token = getToken();
    if (!token) {
      showNotice("Token otentikasi tidak ditemukan.", "error");
      return;
    }
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/meetings/${meetingId}/cancel`,
        {
          method: "PATCH",
          headers: { Authorization: buildAuth(token) },
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showNotice(err.message || "Gagal membatalkan meeting.", "error");
        return;
      }
      showNotice("Meeting berhasil dibatalkan.", "success");
      // Refresh list after cancel
      fetchMeetings(adminView, role, userDepartmentId);
    } catch (e) {
      console.error(e);
      showNotice("Terjadi kesalahan saat membatalkan meeting.", "error");
    }
  };

  const handleSave = async () => {
    if (!formData) {
      showNotice("Form data tidak tersedia.", "error");
      return;
    }

    const token = getToken();
    if (!token) {
      showNotice("Token otentikasi tidak ditemukan.", "error");
      return;
    }

    const payload = {
      agenda: formData.agenda,
      startDate: moment(formData.start).format("YYYY-MM-DD"),
      endDate: moment(formData.end).format("YYYY-MM-DD"),
      startTime: moment(formData.start).format("HH:mm:ss"),
      endTime: moment(formData.end).format("HH:mm:ss"),
      meetingRoomId: formData.meetingRoomId,
      departmentId: formData.departmentId,
      equipmentIds: formData.equipment?.map((e: any) => e.id) || [],
      equipmentQuantities:
        formData.equipment?.map((e: any) => e.quantity) || [],
      gtimName: formData.gtimName,
      visitorName: formData.visitorName,
      companyName: formData.companyName,
      request: formData.request,
    };
    try {
      const res = await fetch(`${API_BASE_URL}/api/meetings/${formData.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: buildAuth(token),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showNotice(err.message || "Gagal menyimpan meeting.", "error");
        return;
      }
      // Remove duplicate toast, show only one success notice
      setIsEditing(false);
      // Refresh list after save
      fetchMeetings(adminView, role, userDepartmentId);
      showNotice("Meeting berhasil disimpan.", "success");
    } catch (e) {
      console.error(e);
      showNotice("Terjadi kesalahan saat menyimpan meeting.", "error");
    }
  };

  const handleEquipmentSelectChange = (ids: string[]) => {
    if (!isEditing) return;
    setFormData((prev: any) => {
      const mapped = ids.map((id) => {
        const found = equipmentList.find((eq) => eq.id === id);
        return { id, name: found?.name || "", quantity: 1 };
      });
      return { ...prev, equipment: mapped };
    });
  };

  const handleEquipmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Not used in current modal
  };

  return (
    <Layout>
      <div className="bg-white p-8 rounded-lg shadow-lg min-h-[80vh]">
        {notice && (
          <div
            className={`mb-4 px-4 py-3 rounded border ${
              notice.type === "success"
                ? "bg-green-100 text-green-800 border-green-300"
                : notice.type === "error"
                ? "bg-red-100 text-red-800 border-red-300"
                : "bg-yellow-100 text-yellow-800 border-yellow-300"
            }`}
          >
            <div className="flex justify-between items-center">
              <span>{notice.message}</span>
              <button
                onClick={() => setNotice(null)}
                className="ml-4 text-sm font-bold"
                aria-label="Tutup notifikasi"
                title="Tutup"
              >
                ×
              </button>
            </div>
          </div>
        )}

        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">
            {adminView ? "Manage Meetings (Admin)" : "My Meetings"}
          </h1>
          <button
            onClick={() => fetchMeetings(adminView, role, userDepartmentId)}
            className="px-4 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
          >
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-col lg:flex-row gap-3 lg:items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pencarian
            </label>
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Cari agenda, pemohon, departemen, ruang, status, equipment, request, GTIM, visitor, company..."
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tanggal dari
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tanggal sampai
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          {showDepartmentFilter && (
            <div className="min-w-[220px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white"
              >
                <option value="">Semua Department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => {
                setSearchText("");
                setFromDate("");
                setToDate("");
                setDepartmentId("");
              }}
              className="h-10 mt-6 px-4 bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
            >
              Reset
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <p className="text-gray-600">Memuat daftar meeting...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center text-gray-600">Tidak ada meeting.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-sm font-semibold text-gray-700 border-b">
                    Agenda
                  </th>
                  <th className="px-3 py-2 text-left text-sm font-semibold text-gray-700 border-b">
                    GTIM Name
                  </th>
                  <th className="px-3 py-2 text-left text-sm font-semibold text-gray-700 border-b">
                    Visitor Name
                  </th>
                  <th className="px-3 py-2 text-left text-sm font-semibold text-gray-700 border-b">
                    Company Name
                  </th>
                  <th className="px-3 py-2 text-left text-sm font-semibold text-gray-700 border-b">
                    Pemohon
                  </th>
                  <th className="px-3 py-2 text-left text-sm font-semibold text-gray-700 border-b">
                    Departemen
                  </th>
                  <th className="px-3 py-2 text-left text-sm font-semibold text-gray-700 border-b">
                    Ruang
                  </th>
                  <th className="px-3 py-2 text-left text-sm font-semibold text-gray-700 border-b">
                    Waktu
                  </th>
                  <th className="px-3 py-2 text-left text-sm font-semibold text-gray-700 border-b">
                    Status
                  </th>
                  <th className="px-3 py-2 text-left text-sm font-semibold text-gray-700 border-b">
                    Equipment
                  </th>
                  <th className="px-3 py-2 text-left text-sm font-semibold text-gray-700 border-b">
                    Request
                  </th>
                  <th className="px-3 py-2 text-left text-sm font-semibold text-gray-700 border-b">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((m) => {
                  const equipments = (m.meetingEquipments || []).map((me) => {
                    const n = me.equipment?.name || "-";
                    const q = me.quantity ?? 1;
                    return `${n} (${q})`;
                  });
                  const meetingEndDateTime = moment(
                    `${m.endDate} ${
                      m.endTime.length === 5 ? m.endTime + ":00" : m.endTime
                    }`,
                    "YYYY-MM-DD HH:mm:ss"
                  );
                  const now = moment();
                  const canCancel = now.isBefore(meetingEndDateTime);
                  return (
                    <tr key={m.id} className="border-b hover:bg-gray-50">
                      <td className="px-3 py-2 text-sm text-gray-800">
                        {m.agenda || "-"}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-700">
                        {m.gtimName || "-"}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-700">
                        {m.visitorName || "-"}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-700">
                        {m.companyName || "-"}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-700">
                        {m.user?.fullName || "-"}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-700">
                        {m.department?.name || "-"}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-700">
                        {m.meetingRoom?.name || "Genba Visit"}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-700">
                        {formatDateTimeRange(m)}
                      </td>
                      <td className="px-3 py-2 text-sm">
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            m.overallStatus === "PENDING"
                              ? "bg-yellow-100 text-yellow-800"
                              : m.overallStatus === "APPROVED"
                              ? "bg-green-100 text-green-800"
                              : m.overallStatus === "REJECTED"
                              ? "bg-red-100 text-red-800"
                              : m.overallStatus === "PARTIALLY_APPROVED"
                              ? "bg-blue-100 text-blue-800"
                              : m.overallStatus === "CANCELED"
                              ? "bg-gray-200 text-gray-700"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {m.overallStatus || "PENDING"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-700">
                        {equipments.length > 0 ? equipments.join(", ") : "-"}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-700">
                        {m.request || "-"}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-700 flex gap-2">
                        <button
                          onClick={() => openMeetingDetail(m)}
                          className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (canCancel) {
                              // Open reject remark modal before cancel
                              setRejectMeetingId(m.id);
                              setRejectRemark("");
                              setRejectModalOpen(true);
                            } else {
                              showNotice(
                                "Meeting sudah lewat, tidak bisa dibatalkan.",
                                "warning"
                              );
                            }
                          }}
                          className={`px-2 py-1 rounded text-white ${
                            canCancel
                              ? "bg-red-600 hover:bg-red-700"
                              : "bg-gray-400 cursor-not-allowed"
                          }`}
                          disabled={!canCancel}
                        >
                          Cancel
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {modalOpen && selectedMeeting && formData && (
        <MeetingDetailModal
          isModalOpen={modalOpen}
          selectedEvent={convertToCalendarEvent(selectedMeeting)}
          formData={formData as any}
          isEditing={isEditing}
          departments={departments}
          meetingRooms={meetingRooms}
          equipmentList={equipmentList}
          closeModal={closeMeetingDetail}
          handleChange={(e) => {
            const { name, value } = e.target;
            setFormData((prev: FormDataType | null) => {
              if (!prev) return null;

              let newValue: any = value;

              // Handle date and time fields properly
              if (name === "startDate" || name === "endDate") {
                // For date fields, combine with existing time
                const existingTime =
                  name === "startDate"
                    ? prev.start
                      ? moment(prev.start).format("HH:mm:ss")
                      : "09:00:00" // Default to 9 AM
                    : prev.end
                    ? moment(prev.end).format("HH:mm:ss")
                    : "17:00:00"; // Default to 5 PM

                if (value) {
                  newValue = moment(`${value} ${existingTime}`).toDate();
                } else {
                  newValue = null;
                }
              } else if (name === "startTime" || name === "endTime") {
                // For time fields, combine with existing date
                const existingDate =
                  name === "startTime"
                    ? prev.start
                      ? moment(prev.start).format("YYYY-MM-DD")
                      : moment().format("YYYY-MM-DD")
                    : prev.end
                    ? moment(prev.end).format("YYYY-MM-DD")
                    : moment().format("YYYY-MM-DD");

                if (value) {
                  newValue = moment(`${existingDate} ${value}`).toDate();
                } else {
                  newValue = null;
                }
              }

              // Update the correct field based on the input name
              if (name === "startDate" || name === "startTime") {
                return {
                  ...prev,
                  start: newValue,
                };
              } else if (name === "endDate" || name === "endTime") {
                return {
                  ...prev,
                  end: newValue,
                };
              }

              return {
                ...prev,
                [name]: newValue,
              };
            });
          }}
          handleSave={handleSave}
          setIsEditing={setIsEditing}
          hydrateIdsFromNames={() => convertToCalendarEvent(selectedMeeting)}
          handleEquipmentChange={handleEquipmentChange}
          handleEquipmentSelectChange={handleEquipmentSelectChange}
        />
      )}
      {/* Cancel Remark Modal for Cancel */}
      <CancelRemarkModal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        onConfirm={async () => {
          if (!rejectMeetingId) return;
          // Call cancelMeeting with remark
          try {
            const token = getToken();
            if (!token) {
              showNotice("Token otentikasi tidak ditemukan.", "error");
              return;
            }
            const res = await fetch(
              `${API_BASE_URL}/api/meetings/${rejectMeetingId}/cancel`,
              {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: buildAuth(token),
                },
                body: JSON.stringify({ remark: rejectRemark }),
              }
            );
            if (!res.ok) {
              const err = await res.json().catch(() => ({}));
              showNotice(err.message || "Gagal membatalkan meeting.", "error");
              return;
            }
            showNotice("Meeting berhasil dibatalkan.", "success");
            setRejectModalOpen(false);
            setRejectMeetingId(null);
            setRejectRemark("");
            fetchMeetings(adminView, role, userDepartmentId);
          } catch (e) {
            console.error(e);
            showNotice("Terjadi kesalahan saat membatalkan meeting.", "error");
          }
        }}
        remark={rejectRemark}
        setRemark={setRejectRemark}
      />
    </Layout>
  );
}
