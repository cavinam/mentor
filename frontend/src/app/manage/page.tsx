"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import Layout from "../../components/Layout";
import moment from "moment";
import { useAuth } from "../../components/AuthContext";
import { getToken } from "../../lib/auth";
import { getApiBase } from "../../lib/apiBase";
import MeetingDetailModal from "../../components/detail/MeetingDetailModal";
import CancelRemarkModal from "../../components/CancelRemarkModal";
import {
  ApiMeeting,
  ApiEquipment,
  MeetingFormData,
  JwtPayload,
  MeetingRoomResponse,
  CalendarEvent,
  SortableValue,
} from "../../types/api";

type MeetingRow = ApiMeeting;

type FormDataType = MeetingFormData;

type Department = { id: string; name: string };

const API_BASE_URL = getApiBase();

const buildAuth = (token: string) =>
  token && token.startsWith("Bearer ") ? token : `Bearer ${token}`;

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

  // Sorting state
  const [sortColumn, setSortColumn] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

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
      const data = (await res.json()) as MeetingRoomResponse[];
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
      const data = (await res.json()) as ApiEquipment[];
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
      const data = (await res.json()) as ApiMeeting[];
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
    const parsedPayload = token ? parseJwt(token) : null;
    const r = parsedPayload?.role as string | undefined;
    const depId = parsedPayload?.userDepartmentId as string | undefined;
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
    const filtered = items.filter((m) => {
      // Department filter
      if (departmentId && m.department?.id !== departmentId) return false;

      // Date range overlap
      const mStart = getDateOnly(m.startDate as string);
      const mEnd = getDateOnly(m.endDate as string) || mStart;
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

    // Apply sorting
    if (sortColumn) {
      filtered.sort((a, b) => {
        let aValue: SortableValue, bValue: SortableValue;

        switch (sortColumn) {
          case "agenda":
            aValue = a.agenda || "";
            bValue = b.agenda || "";
            break;
          case "gtimName":
            aValue = a.gtimName || "";
            bValue = b.gtimName || "";
            break;
          case "visitorName":
            aValue = a.visitorName || "";
            bValue = b.visitorName || "";
            break;
          case "companyName":
            aValue = a.companyName || "";
            bValue = b.companyName || "";
            break;
          case "user":
            aValue = a.user?.fullName || "";
            bValue = b.user?.fullName || "";
            break;
          case "department":
            aValue = a.department?.name || "";
            bValue = b.department?.name || "";
            break;
          case "meetingRoom":
            aValue =
              a.meetingRoom?.name || (a.meetingRoom ? "" : "Genba Visit");
            bValue =
              b.meetingRoom?.name || (b.meetingRoom ? "" : "Genba Visit");
            break;
          case "startDate":
            aValue = moment(
              `${a.startDate} ${a.startTime}`,
              "YYYY-MM-DD HH:mm:ss"
            ).toDate();
            bValue = moment(
              `${b.startDate} ${b.startTime}`,
              "YYYY-MM-DD HH:mm:ss"
            ).toDate();
            break;
          case "overallStatus":
            aValue = a.overallStatus || "";
            bValue = b.overallStatus || "";
            break;
          case "request":
            aValue = a.request || "";
            bValue = b.request || "";
            break;
          default:
            return 0;
        }

        // Handle string comparison
        if (typeof aValue === "string" && typeof bValue === "string") {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [
    items,
    searchText,
    fromDate,
    toDate,
    departmentId,
    sortColumn,
    sortDirection,
  ]);

  const formatDateTimeRange = (m: MeetingRow) => {
    const toDisplay = (dateStr: string, timeStr: string) => {
      const t = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
      const d = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
      const combined = moment(`${d} ${t}`, "YYYY-MM-DD HH:mm:ss");
      return combined.isValid() ? combined.format("DD MMM YYYY, HH:mm") : "-";
    };
    const start = toDisplay(m.startDate as string, m.startTime as string);
    const end = toDisplay(m.endDate as string, m.endTime as string);
    return `${start} - ${end}`;
  };

  const adminView = isAdminish(role);
  const showDepartmentFilter = adminView;

  const convertToCalendarEvent = useCallback(
    (
      m: MeetingRow,
      meetingRooms: { id: string; name: string }[] = []
    ): CalendarEvent => {
      const start = moment(
        `${m.startDate} ${
          m.startTime.length === 5 ? m.startTime + ":00" : m.startTime
        }`,
        "YYYY-MM-DD HH:mm:ss"
      ).toDate();
      const end = moment(
        `${m.endDate} ${
          m.endTime.length === 5 ? m.endTime + ":00" : m.endTime
        }`,
        "YYYY-MM-DD HH:mm:ss"
      ).toDate();

      // Use the meeting room data directly from the meeting object
      // This ensures we always have the correct meeting room name
      let meetingRoomId = m.meetingRoom?.id ? String(m.meetingRoom.id) : "";
      const meetingRoomName = m.meetingRoom?.name || "";

      // If meetingRoomId is not set, try to find it from meetingRooms
      if (!meetingRoomId && meetingRoomName && meetingRooms.length > 0) {
        const room = meetingRooms.find(
          (r) => r.name?.toLowerCase() === meetingRoomName?.toLowerCase()
        );
        if (room) {
          meetingRoomId = room.id;
        }
      }

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

      const result = {
        id: String(m.id),
        title: m.agenda || "Untitled Meeting",
        agenda: m.agenda,
        start,
        end,
        status: m.overallStatus,
        departmentId: m.department?.id,
        departmentName: m.department?.name,
        meetingRoomId: meetingRoomId,
        meetingRoomName: meetingRoomName,
        userName: m.user?.fullName,
        gtimName: m.gtimName,
        visitorName: m.visitorName,
        companyName: m.companyName,
        request: m.request,
        equipment: mappedEquipment,
        createdAt: m.createdAt,
        isGenbaVisit: !m.meetingRoom,
      };

      return result;
    },
    [equipmentList]
  );

  const openMeetingDetail = (meeting: MeetingRow) => {
    setSelectedMeeting(meeting);
    // Don't pass meetingRooms here - let the useEffect handle hydration after meetingRooms are loaded
    setFormData(convertToCalendarEvent(meeting));
    setIsEditing(false);
    setModalOpen(true);
  };

  // Hydrate formData when meetingRooms or selectedMeeting change to fix meetingRoomId
  const hydrateIdsFromNames = React.useCallback(
    (prev: CalendarEvent): CalendarEvent => {
      const next = { ...prev };

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
        if (room) {
          next.meetingRoomId = room.id;
        }
      }

      if (next.equipment && next.equipment.length > 0) {
        next.equipment = next.equipment.map((item) => {
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
      const converted = convertToCalendarEvent(selectedMeeting, meetingRooms);
      const hydrated = hydrateIdsFromNames(converted);
      setFormData(hydrated);
    }
  }, [
    selectedMeeting,
    meetingRooms.length,
    meetingRooms,
    hydrateIdsFromNames,
    convertToCalendarEvent,
  ]);

  // Additional useEffect to handle the case when formData exists but meetingRoomId is missing
  React.useEffect(() => {
    if (
      formData &&
      !formData.meetingRoomId &&
      (formData as CalendarEvent).meetingRoomName &&
      meetingRooms.length > 0
    ) {
      const hydrated = hydrateIdsFromNames(formData as CalendarEvent);
      if (hydrated.meetingRoomId !== formData.meetingRoomId) {
        setFormData(hydrated);
      }
    }
  }, [formData, meetingRooms, hydrateIdsFromNames]);

  const closeMeetingDetail = () => {
    setSelectedMeeting(null);
    setModalOpen(false);
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
      equipmentIds: formData.equipment?.map((e) => e.id) || [],
      equipmentQuantities: formData.equipment?.map((e) => e.quantity) || [],
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
    setFormData((prev: FormDataType | null) => {
      const mapped = ids.map((id) => {
        const found = equipmentList.find((eq) => eq.id === id);
        return { id, name: found?.name || "", quantity: 1 };
      });
      return { ...prev, equipment: mapped };
    });
  };

  const handleEquipmentChange = () => {
    // Not used in current modal
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // New column, default to ascending
      setSortColumn(column);
      setSortDirection("asc");
    }
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
                    <button
                      onClick={() => handleSort("agenda")}
                      className="flex items-center gap-1 hover:text-gray-900 focus:outline-none"
                    >
                      Agenda
                      {sortColumn === "agenda" && (
                        <span className="text-xs">
                          {sortDirection === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </button>
                  </th>
                  <th className="px-3 py-2 text-left text-sm font-semibold text-gray-700 border-b">
                    <button
                      onClick={() => handleSort("gtimName")}
                      className="flex items-center gap-1 hover:text-gray-900 focus:outline-none"
                    >
                      GTIM Name
                      {sortColumn === "gtimName" && (
                        <span className="text-xs">
                          {sortDirection === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </button>
                  </th>
                  <th className="px-3 py-2 text-left text-sm font-semibold text-gray-700 border-b">
                    <button
                      onClick={() => handleSort("visitorName")}
                      className="flex items-center gap-1 hover:text-gray-900 focus:outline-none"
                    >
                      Visitor Name
                      {sortColumn === "visitorName" && (
                        <span className="text-xs">
                          {sortDirection === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </button>
                  </th>
                  <th className="px-3 py-2 text-left text-sm font-semibold text-gray-700 border-b">
                    <button
                      onClick={() => handleSort("companyName")}
                      className="flex items-center gap-1 hover:text-gray-900 focus:outline-none"
                    >
                      Company Name
                      {sortColumn === "companyName" && (
                        <span className="text-xs">
                          {sortDirection === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </button>
                  </th>
                  <th className="px-3 py-2 text-left text-sm font-semibold text-gray-700 border-b">
                    <button
                      onClick={() => handleSort("user")}
                      className="flex items-center gap-1 hover:text-gray-900 focus:outline-none"
                    >
                      Pemohon
                      {sortColumn === "user" && (
                        <span className="text-xs">
                          {sortDirection === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </button>
                  </th>
                  <th className="px-3 py-2 text-left text-sm font-semibold text-gray-700 border-b">
                    <button
                      onClick={() => handleSort("department")}
                      className="flex items-center gap-1 hover:text-gray-900 focus:outline-none"
                    >
                      Departemen
                      {sortColumn === "department" && (
                        <span className="text-xs">
                          {sortDirection === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </button>
                  </th>
                  <th className="px-3 py-2 text-left text-sm font-semibold text-gray-700 border-b">
                    <button
                      onClick={() => handleSort("meetingRoom")}
                      className="flex items-center gap-1 hover:text-gray-900 focus:outline-none"
                    >
                      Ruang
                      {sortColumn === "meetingRoom" && (
                        <span className="text-xs">
                          {sortDirection === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </button>
                  </th>
                  <th className="px-3 py-2 text-left text-sm font-semibold text-gray-700 border-b">
                    <button
                      onClick={() => handleSort("startDate")}
                      className="flex items-center gap-1 hover:text-gray-900 focus:outline-none"
                    >
                      Waktu
                      {sortColumn === "startDate" && (
                        <span className="text-xs">
                          {sortDirection === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </button>
                  </th>
                  <th className="px-3 py-2 text-left text-sm font-semibold text-gray-700 border-b">
                    <button
                      onClick={() => handleSort("overallStatus")}
                      className="flex items-center gap-1 hover:text-gray-900 focus:outline-none"
                    >
                      Status
                      {sortColumn === "overallStatus" && (
                        <span className="text-xs">
                          {sortDirection === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </button>
                  </th>
                  <th className="px-3 py-2 text-left text-sm font-semibold text-gray-700 border-b">
                    Equipment
                  </th>
                  <th className="px-3 py-2 text-left text-sm font-semibold text-gray-700 border-b">
                    <button
                      onClick={() => handleSort("request")}
                      className="flex items-center gap-1 hover:text-gray-900 focus:outline-none"
                    >
                      Request
                      {sortColumn === "request" && (
                        <span className="text-xs">
                          {sortDirection === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </button>
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
                              setRejectMeetingId(String(m.id));
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
          formData={formData as CalendarEvent}
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
              // For all other fields (including meetingRoomId), keep the original string value

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
          const token = getToken();
          if (!token) {
            throw new Error("Token otentikasi tidak ditemukan.");
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
            throw new Error(err.message || "Gagal membatalkan meeting.");
          }
          setRejectModalOpen(false);
          setRejectMeetingId(null);
          setRejectRemark("");
          fetchMeetings(adminView, role, userDepartmentId);
        }}
        remark={rejectRemark}
        setRemark={setRejectRemark}
      />
    </Layout>
  );
}
