"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Layout from "../../components/Layout";
import {
  Calendar,
  momentLocalizer,
  DateLocalizer,
  View,
} from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { getToken } from "../../lib/auth";
import { getApiBase } from "../../lib/apiBase";
import { CalendarEvent, MeetingRoom, Department } from "@/types/calendar";
import MeetingDetailModal from "../../components/detail/MeetingDetailModal";
import { useAuth } from "../../components/AuthContext";
import AddScheduleModal from "../../components/add-schedule/AddScheduleModal";
import toast from "react-hot-toast";

const localizer = momentLocalizer(moment);
const API_BASE_URL = getApiBase();

// Rentang waktu kalender tetap 24 jam, tetapi scroll default ke jam 07:00
const dayStart = new Date(1970, 0, 1, 0, 0, 0); // min: 00:00
const dayEnd = new Date(1970, 0, 1, 23, 59, 59); // max: 23:59
const scrollToTimeDefault = new Date(1970, 0, 1, 7, 0, 0); // scroll awal: 07:00

// Force 24-hour time display in calendar
const formats = {
  timeGutterFormat: (
    date: Date,
    culture: string | undefined,
    localizer?: DateLocalizer
  ) =>
    localizer?.format(date, "HH:mm", culture) || moment(date).format("HH:mm"),
  eventTimeRangeFormat: (
    { start, end }: { start: Date; end: Date },
    culture: string | undefined,
    localizer?: DateLocalizer
  ) =>
    `${
      localizer?.format(start, "HH:mm", culture) ||
      moment(start).format("HH:mm")
    } – ${
      localizer?.format(end, "HH:mm", culture) || moment(end).format("HH:mm")
    }`,
  agendaTimeRangeFormat: (
    { start, end }: { start: Date; end: Date },
    culture: string | undefined,
    localizer?: DateLocalizer
  ) =>
    `${
      localizer?.format(start, "HH:mm", culture) ||
      moment(start).format("HH:mm")
    } – ${
      localizer?.format(end, "HH:mm", culture) || moment(end).format("HH:mm")
    }`,
};

// Pastikan header Authorization selalu benar: tidak dobel "Bearer "
const buildAuth = (token: string) =>
  token && token.startsWith("Bearer ") ? token : `Bearer ${token}`;

export default function CalendarPage() {
  const { isLoggedIn, isAuthReady } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null
  );
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<
    Partial<
      CalendarEvent & {
        equipment: { id: string; name: string; quantity: number }[];
        isGenbaVisit?: boolean;
      }
    >
  >({});
  const [meetingRooms, setMeetingRooms] = useState<MeetingRoom[]>([]);
  const [selectedMeetingRoomId, setSelectedMeetingRoomId] = useState<
    string | null
  >(null);
  const [view, setView] = useState<View>("month");
  const [date, setDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");

  // --- form state
  // Pastikan tipe data equipment di formData juga memiliki id
  const [formData, setFormData] = useState<
    Partial<
      CalendarEvent & {
        equipment: { id: string; name: string; quantity: number }[];
      }
    >
  >({});
  const [isEditing, setIsEditing] = useState(false);

  // --- master data
  const [departments, setDepartments] = useState<Department[]>([]);
  const [equipmentList, setEquipmentList] = useState<
    { id: string; name: string }[]
  >([]);
  // Equipment availability (ids that are unavailable) for create/edit
  const [createEquipUnavailableIds, setCreateEquipUnavailableIds] = useState<
    string[]
  >([]);
  const [editEquipUnavailableIds, setEditEquipUnavailableIds] = useState<
    string[]
  >([]);

  // --- logged in user's department (for auto-fill)
  const [currentUserDeptId, setCurrentUserDeptId] = useState<string>("");
  const [currentUserRole, setCurrentUserRole] = useState<string>("");

  // ====== Fetch master data ======
  useEffect(() => {
    if (!isAuthReady || !isLoggedIn) return;
    fetchProfile();
    fetchDepartments();
    fetchMeetingRooms();
    fetchEquipment();
  }, [isAuthReady, isLoggedIn]);

  const fetchProfile = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/profile`, {
        headers: { Authorization: buildAuth(token) },
        cache: "no-store",
      });
      if (!res.ok) {
        return;
      }
      const data = await res.json();
      const depId = data?.departmentId ?? data?.department?.id ?? "";
      const role = data?.role ?? "";
      setCurrentUserDeptId(depId ? String(depId) : "");
      setCurrentUserRole(role);
    } catch {
      // ignore
    }
  };

  const fetchDepartments = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/departments`, {
        headers: { Authorization: buildAuth(token) },
        cache: "no-store",
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          console.warn("departments unauthorized, skipping");
          setDepartments([]);
          return;
        }
        throw new Error("Gagal mengambil daftar department");
      }
      const data = await res.json();
      setDepartments(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMeetingRooms = async () => {
    setLoading(true);
    const token = getToken();
    if (!token) {
      setError("Token otentikasi tidak ditemukan.");
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/meeting-rooms`, {
        headers: { Authorization: buildAuth(token) },
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Gagal mengambil daftar Meeting Room.");
      const data = await response.json();
      const normalized = (data || []).map(
        (r: { id: string | number; name: string }) => ({
          id: String(r.id),
          name: r.name,
        })
      );
      setMeetingRooms(normalized);
      // Default: tampilkan semua ruang (tidak memilih room tertentu)
      // Jangan set selectedMeetingRoomId ke room pertama
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat mengambil data."
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchEquipment = async () => {
    setLoading(true);
    const token = getToken();
    if (!token) {
      setError("Token otentikasi tidak ditemukan.");
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/equipment`, {
        headers: { Authorization: buildAuth(token) },
        cache: "no-store",
      });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          console.warn("equipment unauthorized, skipping");
          setEquipmentList([]);
          return;
        }
        throw new Error("Gagal mengambil daftar equipment.");
      }
      const data = await response.json();
      setEquipmentList(
        data.map((d: { id: string; name: string }) => ({
          id: d.id,
          name: d.name,
        }))
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat mengambil data equipment."
      );
    } finally {
      setLoading(false);
    }
  };

  // ====== Equipment availability helpers ======
  const toHHmmss = (t: string) => (t.length === 5 ? `${t}:00` : t);
  const getPieces = (d: Date) => ({
    date: moment(d).format("YYYY-MM-DD"),
    time: moment(d).format("HH:mm:ss"),
  });

  const fetchAvailability = useCallback(
    async (
      start: Date,
      end: Date,
      excludeMeetingId?: string
    ): Promise<string[]> => {
      const token = getToken();
      if (!token) return [];
      try {
        const s = getPieces(start);
        const e = getPieces(end);
        const url = new URL(`${API_BASE_URL}/api/equipment/availability`);
        url.searchParams.set("startDate", s.date);
        url.searchParams.set("endDate", e.date);
        url.searchParams.set("startTime", toHHmmss(s.time));
        url.searchParams.set("endTime", toHHmmss(e.time));
        if (excludeMeetingId)
          url.searchParams.set("excludeMeetingId", excludeMeetingId);

        const res = await fetch(url.toString(), {
          headers: { Authorization: buildAuth(token) },
          cache: "no-store",
        });
        if (!res.ok) return [];
        const data = await res.json();
        const unavailableIds = (
          data as {
            id: string | number;
            unavailable?: boolean;
            remaining?: number;
          }[]
        )
          .filter(
            (x) =>
              x.unavailable || (x.remaining !== undefined && x.remaining <= 0)
          )
          .map((x) => String(x.id));
        return unavailableIds;
      } catch {
        return [];
      }
    },
    []
  );

  // Auto-load availability for Create modal when time changes
  useEffect(() => {
    if (!isCreateOpen) return;
    if (!createForm.start || !createForm.end) return;
    (async () => {
      const unavail = await fetchAvailability(
        createForm.start as Date,
        createForm.end as Date
      );
      setCreateEquipUnavailableIds(unavail);
    })();
  }, [isCreateOpen, createForm.start, createForm.end, fetchAvailability]);

  // Auto-load availability for Edit modal when time changes
  useEffect(() => {
    if (!isModalOpen) return;
    if (!formData.start || !formData.end) return;
    const excludeId = (formData.id as unknown as string) || undefined;
    (async () => {
      const unavail = await fetchAvailability(
        formData.start as Date,
        formData.end as Date,
        excludeId
      );
      setEditEquipUnavailableIds(unavail);
    })();
  }, [
    isModalOpen,
    formData.start,
    formData.end,
    formData.id,
    fetchAvailability,
  ]);

  function parseEventTime(
    dateStr?: string,
    timeStr?: string,
    isoStr?: string
  ): Date | null {
    if (dateStr && timeStr) {
      const d = dateStr.split("T")[0];
      const t = timeStr.trim();
      const combinedString = `${d} ${t}`;
      const m = moment(
        combinedString,
        ["YYYY-MM-DD HH:mm:ss", "YYYY-MM-DD HH:mm"],
        true
      );
      return m.isValid() ? m.toDate() : null;
    }

    if (isoStr) {
      // Periksa apakah string ISO diakhiri dengan 'Z' atau tidak
      const localIsoStr = isoStr.endsWith("Z")
        ? isoStr.replace("Z", "")
        : isoStr;

      const m = moment(localIsoStr);
      return m.isValid() ? m.toDate() : null;
    }

    return null;
  }

  const fetchEvents = useCallback(async (_meetingRoomId: string) => {
    setLoading(true);
    setError(null);

    const token = getToken();
    if (!token) {
      setError("Token otentikasi tidak ditemukan.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/meetings/calendar`, {
        headers: { Authorization: buildAuth(token) },
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Gagal mengambil data kalender.");
      const data = await response.json();

      const formattedEvents: CalendarEvent[] = (
        data as {
          id: string | number;
          title?: string;
          agenda?: string;
          startDate?: string;
          startTime?: string;
          start?: string;
          endDate?: string;
          endTime?: string;
          end?: string;
          status?: string;
          overallStatus?: string;
          userName?: string;
          user?: { fullName?: string };
          departmentId?: string | number;
          department?: { id?: string | number; name?: string };
          departmentName?: string;
          meetingRoomId?: string | number;
          meetingRoom?: { id?: string | number; name?: string };
          meetingRoomName?: string;
          gtimName?: string;
          visitorName?: string;
          companyName?: string;
          request?: string;
          equipment?: { id: string; name: string; quantity: number }[];
          meetingEquipments?: {
            equipment?: { id?: string; name?: string };
            quantity: number;
          }[];
          isGenbaVisit?: boolean;
          createdAt?: string;
          updatedAt?: string;
        }[]
      )
        .map((event) => {
          // 🔹 Gunakan parseEventTime untuk handle dua kemungkinan
          const start = parseEventTime(
            event.startDate,
            event.startTime,
            event.start
          );
          const end = parseEventTime(event.endDate, event.endTime, event.end);

          if (!start || !end) return null;

          const isAllDay = moment(end).diff(moment(start), "hours") >= 24;

          return {
            id: String(event.id),
            title: event.title ?? event.agenda ?? "-",
            start: start,
            end: end,
            // simpan juga nilai mentah dari backend untuk menghindari drift saat ditampilkan di modal
            rawStartDate: event.startDate,
            rawStartTime: event.startTime,
            rawEndDate: event.endDate,
            rawEndTime: event.endTime,
            allDay: isAllDay,
            status: event.status ?? event.overallStatus,
            userName: event.userName ?? event.user?.fullName,
            departmentId: event.departmentId
              ? String(event.departmentId)
              : event.department?.id
              ? String(event.department?.id)
              : undefined,
            departmentName: event.departmentName ?? event.department?.name,
            meetingRoomId: event.meetingRoomId
              ? String(event.meetingRoomId)
              : event.meetingRoom?.id
              ? String(event.meetingRoom?.id)
              : undefined,
            meetingRoomName: event.meetingRoomName ?? event.meetingRoom?.name,
            gtimName: event.gtimName,
            visitorName: event.visitorName,
            companyName: event.companyName,
            agenda: event.agenda,
            request: event.request,
            equipment:
              event.equipment ??
              (event.meetingEquipments
                ? event.meetingEquipments.map(
                    (me: {
                      equipment?: { id?: string; name?: string };
                      quantity: number;
                    }) => ({
                      id: me.equipment?.id
                        ? String(me.equipment?.id)
                        : me.equipment?.id,
                      name: me.equipment?.name,
                      quantity: me.quantity,
                    })
                  )
                : []),
            isGenbaVisit: event.isGenbaVisit,
            createdAt: event.createdAt,
            updatedAt: event.updatedAt,
          };
        })
        .filter(Boolean) as CalendarEvent[];

      const filtered = _meetingRoomId
        ? formattedEvents.filter((ev) => ev.meetingRoomId === _meetingRoomId)
        : formattedEvents;

      console.log("Calendar: total fetched events=", formattedEvents.length);
      console.log(
        "Calendar: filtered by room=",
        _meetingRoomId || "(ALL)",
        "count=",
        filtered.length
      );

      setEvents(filtered);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat mengambil data."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // ====== Fetch events ======
  useEffect(() => {
    if (!isAuthReady || !isLoggedIn) return;
    fetchEvents(selectedMeetingRoomId || "");
  }, [
    selectedMeetingRoomId,
    isAuthReady,
    isLoggedIn,
    currentUserRole,
    currentUserDeptId,
    fetchEvents,
  ]);

  // ====== Helpers ======
  const hydrateIdsFromNames = useCallback(
    (prev: Partial<CalendarEvent>) => {
      const next = { ...prev };

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

      // LOGIKA BARU UNTUK MENGHIDRASI ID PERALATAN
      if (next.equipment && next.equipment.length > 0) {
        next.equipment = next.equipment.map((item) => {
          if (item.id) return item; // Jika ID sudah ada, lewati
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

  // ====== Handlers ======
  const handleMeetingRoomChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMeetingRoomId(e.target.value || null);
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    const withIds = hydrateIdsFromNames(event);

    // Jika backend mengirim field mentah, gunakan untuk membentuk waktu persis di form
    const rawStartDate = (
      event as CalendarEvent & {
        rawStartDate?: string;
        rawStartTime?: string;
        rawEndDate?: string;
        rawEndTime?: string;
      }
    ).rawStartDate;
    const rawStartTime = (
      event as CalendarEvent & {
        rawStartDate?: string;
        rawStartTime?: string;
        rawEndDate?: string;
        rawEndTime?: string;
      }
    ).rawStartTime;
    const rawEndDate = (
      event as CalendarEvent & {
        rawStartDate?: string;
        rawStartTime?: string;
        rawEndDate?: string;
        rawEndTime?: string;
      }
    ).rawEndDate;
    const rawEndTime = (
      event as CalendarEvent & {
        rawStartDate?: string;
        rawStartTime?: string;
        rawEndDate?: string;
        rawEndTime?: string;
      }
    ).rawEndTime;

    const preciseStart =
      rawStartDate && rawStartTime
        ? moment(
            `${rawStartDate} ${rawStartTime}`,
            "YYYY-MM-DD HH:mm:ss"
          ).toDate()
        : withIds.start;
    const preciseEnd =
      rawEndDate && rawEndTime
        ? moment(`${rawEndDate} ${rawEndTime}`, "YYYY-MM-DD HH:mm:ss").toDate()
        : withIds.end;

    setFormData({
      ...withIds,
      // Auto-fill department if missing using logged-in user's department
      departmentId:
        withIds.departmentId || currentUserDeptId || withIds.departmentId,
      start: preciseStart,
      end: preciseEnd,
    });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
    setFormData({});
    setIsEditing(false);
  };

  const handleNavigate = (newDate: Date) => setDate(newDate);
  const handleView = (newView: View) => setView(newView);

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    // Prefill create form dengan slot terpilih + auto-fill department dari user
    setCreateForm(
      (prev) =>
        ({
          ...prev,
          start,
          end,
          startDate: moment(start).format("YYYY-MM-DD"),
          endDate: moment(end).format("YYYY-MM-DD"),
          startTime: moment(start).format("HH:mm"),
          endTime: moment(end).format("HH:mm"),
          meetingRoomId: selectedMeetingRoomId || prev.meetingRoomId,
          departmentId:
            prev.departmentId || currentUserDeptId || prev.departmentId,
        } as Partial<
          CalendarEvent & {
            equipment: { id: string; name: string; quantity: number }[];
            isGenbaVisit?: boolean;
          }
        >)
    );
    setIsCreateOpen(true);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, type, value } = e.target;
    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
      return;
    }

    // Jika field waktu/tanggal, update field start/end juga
    if (name === "startDate" || name === "startTime") {
      const current = formData.start ? moment(formData.start) : moment();
      const dateStr =
        name === "startDate" ? value : current.format("YYYY-MM-DD");
      const timeStr =
        name === "startTime"
          ? value.length === 5
            ? `${value}:00`
            : value
          : current.format("HH:mm:ss");
      const combined = moment(`${dateStr} ${timeStr}`, "YYYY-MM-DD HH:mm:ss");
      setFormData((prev) => ({
        ...prev,
        start: combined.toDate(),
        [name]: value,
      }));
      return;
    }
    if (name === "endDate" || name === "endTime") {
      const current = formData.end ? moment(formData.end) : moment();
      const dateStr = name === "endDate" ? value : current.format("YYYY-MM-DD");
      const timeStr =
        name === "endTime"
          ? value.length === 5
            ? `${value}:00`
            : value
          : current.format("HH:mm:ss");
      const combined = moment(`${dateStr} ${timeStr}`, "YYYY-MM-DD HH:mm:ss");
      setFormData((prev) => ({
        ...prev,
        end: combined.toDate(),
        [name]: value,
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, type, value } = e.target;
    if (type === "checkbox") {
      setCreateForm((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
      return;
    }
    if (name === "startDate" || name === "startTime") {
      const current = createForm.start ? moment(createForm.start) : moment();
      const dateStr =
        name === "startDate" ? value : current.format("YYYY-MM-DD");
      const timeStr =
        name === "startTime"
          ? value.length === 5
            ? `${value}:00`
            : value
          : current.format("HH:mm:ss");
      const combined = moment(`${dateStr} ${timeStr}`, "YYYY-MM-DD HH:mm:ss");
      setCreateForm((prev) => ({
        ...prev,
        start: combined.toDate(),
        [name]: value,
      }));
      return;
    }
    if (name === "endDate" || name === "endTime") {
      const current = createForm.end ? moment(createForm.end) : moment();
      const dateStr = name === "endDate" ? value : current.format("YYYY-MM-DD");
      const timeStr =
        name === "endTime"
          ? value.length === 5
            ? `${value}:00`
            : value
          : current.format("HH:mm:ss");
      const combined = moment(`${dateStr} ${timeStr}`, "YYYY-MM-DD HH:mm:ss");
      setCreateForm((prev) => ({
        ...prev,
        end: combined.toDate(),
        [name]: value,
      }));
      return;
    }
    setCreateForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // const handleCreateSubmit = async () => {
  //   // This function is now handled by the modal itself
  //   // The modal will handle validation, API call, and toast notifications
  //   // This function is kept for backward compatibility but is now empty
  //   // The actual logic has been moved to AddScheduleModal component
  //   return Promise.resolve();
  // };

  const handleCreateSuccess = async () => {
    // Refresh events after successful creation
    await fetchEvents(selectedMeetingRoomId || "");
    setIsCreateOpen(false);
    setCreateForm({});
    return Promise.resolve();
  };

  // FUNGSI handleSave YANG LENGKAP DAN BENAR
  const handleSave = async () => {
    if (!formData.id) {
      console.error("ID meeting tidak ditemukan. Gagal menyimpan perubahan.");
      return;
    }

    // Validasi semua field kecuali genba visit, equipment, dan request
    const requiredFields = [
      "agenda",
      "gtimName",
      "companyName",
      "visitorName",
      "start",
      "end",
      "departmentId",
      "meetingRoomId",
    ];

    for (const field of requiredFields) {
      const value = (formData as Record<string, unknown>)[field];
      if (
        value === undefined ||
        value === null ||
        (typeof value === "string" && value.trim() === "")
      ) {
        toast.error(`Field ${field} wajib diisi.`);
        return;
      }
    }

    // Validasi waktu
    const startMoment = formData.start ? moment(formData.start) : null;
    const endMoment = formData.end ? moment(formData.end) : null;
    if (
      !startMoment ||
      !startMoment.isValid() ||
      !endMoment ||
      !endMoment.isValid()
    ) {
      toast.error("Waktu mulai/akhir tidak valid.");
      return;
    }
    if (endMoment.isSameOrBefore(startMoment)) {
      toast.error("End time harus setelah Start time.");
      return;
    }

    // Siapkan data untuk dikirim ke backend
    // Map array equipment menjadi dua array terpisah: id dan quantity
    const equipmentIds = formData.equipment?.map((eq) => eq.id) || [];
    const equipmentQuantities =
      formData.equipment?.map((eq) => eq.quantity) || [];

    const dataToSave = {
      // Properti meeting
      agenda: formData.agenda,
      isGenbaVisit: formData.isGenbaVisit,
      request: formData.request,

      gtimName: formData.gtimName,
      companyName: formData.companyName,
      visitorName: formData.visitorName,

      // Konversi objek Date ke format string
      startDate: moment(formData.start).format("YYYY-MM-DD"),
      endDate: moment(formData.end).format("YYYY-MM-DD"),
      startTime: moment(formData.start).format("HH:mm:ss"),
      endTime: moment(formData.end).format("HH:mm:ss"),

      // Foreign keys
      departmentId: formData.departmentId,
      meetingRoomId: formData.meetingRoomId,

      // Peralatan
      equipmentIds,
      equipmentQuantities,
    };

    setLoading(true);
    setError(null);

    const token = getToken(); // Asumsikan Anda memiliki fungsi untuk mendapatkan token
    if (!token) {
      toast.error("Token otentikasi tidak ditemukan.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/meetings/${formData.id}`,
        {
          method: "PATCH", // Menggunakan PATCH sesuai routes Anda
          headers: {
            "Content-Type": "application/json",
            Authorization: buildAuth(token),
          },
          body: JSON.stringify(dataToSave),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 409) {
          const msg =
            typeof errorData.message === "string" ? errorData.message : "";
          if (msg.toLowerCase().includes("Meeting Room")) {
            toast.error(`Meeting Bentrok: ${msg}`);
          } else if (
            Array.isArray(errorData.conflicts) &&
            errorData.conflicts.length
          ) {
            toast.error(` ${errorData.conflicts.join("; ")}`);
          } else {
            toast.error(errorData.message || "Meeting Tidak berhasil diupdate");
          }
        } else {
          toast.error(errorData.message || "Meeting Tidak berhasil diupdate");
        }
        return;
      }

      const updatedEvent = await response.json();

      // Refresh daftar event berdasarkan ruang yang dipilih agar format dan filter konsisten
      await fetchEvents(selectedMeetingRoomId || "");

      // Beri notifikasi sukses update (status akan kembali menjadi pending jika sebelumnya approved)
      toast.success(
        "Meeting Berhasil di update. Status dikembalikan ke Pending untuk approval ulang."
      );

      // Tutup modal setelah sukses
      closeModal();
      console.log("Data berhasil diperbarui:", updatedEvent);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat menyimpan data.";
      toast.error(errorMessage);
      console.error("Error dalam handleSave:", err);
    } finally {
      setLoading(false);
    }
  };

  // Legacy checkbox handler (kept for compatibility, unused by new UI)
  const handleEquipmentChange = () => {
    if (!isEditing) return;
  };

  // Multi-select handler for edit modal equipment
  const handleEditEquipmentSelectChange = (ids: string[]) => {
    if (!isEditing) return;
    setFormData((prev) => {
      const mapped = ids.map((id) => {
        const found = equipmentList.find((eq) => eq.id === id);
        return { id, name: found?.name || "", quantity: 1 };
      });
      return { ...prev, equipment: mapped };
    });
  };

  // Filtered events based on search query and exclude past meetings
  const filteredEvents = useMemo(() => {
    const now = moment();
    const notPastEvents = events.filter((ev) => moment(ev.end).isAfter(now));
    const q = searchQuery.trim().toLowerCase();
    if (!q) return notPastEvents;
    const includes = (v?: string | number | Date) =>
      !!v && String(v).toLowerCase().includes(q);
    return notPastEvents.filter((ev) => {
      return (
        includes(ev.title) ||
        includes(ev.agenda) ||
        includes(ev.request) ||
        includes(ev.userName) ||
        includes(ev.departmentName) ||
        includes(ev.meetingRoomName) ||
        includes(ev.companyName) ||
        includes(ev.visitorName) ||
        includes(ev.gtimName) ||
        includes(moment(ev.start).format("YYYY-MM-DD HH:mm")) ||
        includes(moment(ev.end).format("YYYY-MM-DD HH:mm"))
      );
    });
  }, [events, searchQuery]);

  // ====== Render ======
  if (loading && events.length === 0) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-full">
          <p className="text-gray-600">Memuat data kalender...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-full">
          <p className="text-red-500">{error}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-white p-8 rounded-lg shadow-lg min-h-[80vh]">
        {/* Pilih Meeting Room */}
        <div className="grid grid-cols-1 sm:grid-cols-3 items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold text-gray-800 text-center sm:text-left">
            {selectedMeetingRoomId && (
              <span className="text-gray-700">
                (
                {
                  meetingRooms.find((room) => room.id === selectedMeetingRoomId)
                    ?.name
                }
                )
              </span>
            )}
          </h1>
          <div className="text-center">
            <span className="text-3xl font-bold text-gray-700">Schedule</span>
          </div>
          <div className="flex flex-col sm:flex-row items-center sm:justify-end gap-2">
            <div className="w-full sm:w-72">
              <label
                htmlFor="calendar-search"
                className="block text-2xl font-bold text-gray-700 mb-1"
              >
                Cari
              </label>
              <div className="relative">
                <input
                  id="calendar-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="judul, agenda, departemen, dll..."
                  className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-lg font-semibold px-4 py-2 pr-10"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute inset-y-0 right-2 my-auto text-gray-500 hover:text-gray-700"
                    aria-label="Bersihkan pencarian"
                    title="Bersihkan"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
            <div>
              <label
                htmlFor="meeting-room-select"
                className="block text-2xl font-bold text-gray-700 mb-1"
              >
                Pilih Meeting Room
              </label>
              <select
                id="meeting-room-select"
                value={selectedMeetingRoomId || ""}
                onChange={handleMeetingRoomChange}
                className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-300
                  focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-lg font-semibold px-4 py-2"
              >
                <option value="">Meeting Room</option>
                {meetingRooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Kalender */}
        <Calendar
          selectable
          localizer={localizer}
          formats={formats}
          step={30}
          timeslots={2}
          min={dayStart}
          max={dayEnd}
          scrollToTime={scrollToTimeDefault}
          events={filteredEvents}
          startAccessor="start"
          endAccessor="end"
          allDayAccessor={(event) => event.allDay || false}
          style={{ height: 600 }}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          className="rounded-lg shadow-inner"
          date={date}
          view={view}
          onNavigate={handleNavigate}
          onView={handleView}
        />
      </div>

      {/* Modal Create Booking */}
      <AddScheduleModal
        isOpen={isCreateOpen}
        formData={createForm}
        departments={departments}
        meetingRooms={meetingRooms}
        equipmentList={equipmentList}
        equipmentUnavailableIds={createEquipUnavailableIds}
        onClose={() => setIsCreateOpen(false)}
        onChange={handleCreateChange}
        onSuccess={handleCreateSuccess}
      />

      {/* Gunakan komponen modal yang sudah dipisah */}
      <MeetingDetailModal
        isModalOpen={isModalOpen}
        selectedEvent={selectedEvent}
        formData={formData}
        isEditing={isEditing}
        departments={departments}
        meetingRooms={meetingRooms}
        equipmentList={equipmentList}
        equipmentUnavailableIds={editEquipUnavailableIds}
        closeModal={closeModal}
        handleChange={handleChange}
        handleSave={handleSave}
        setIsEditing={setIsEditing}
        hydrateIdsFromNames={hydrateIdsFromNames}
        handleEquipmentChange={handleEquipmentChange}
        handleEquipmentSelectChange={handleEditEquipmentSelectChange}
      />
    </Layout>
  );
}
