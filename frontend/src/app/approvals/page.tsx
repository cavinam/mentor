"use client";

import React, { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import moment from "moment";
import { useAuth } from "../../components/AuthContext";
import { getToken } from "../../lib/auth";
import { getApiBase } from "../../lib/apiBase";
import RejectRemarkModal from "@/components/RejectRemarkModal";

type EquipmentItem = { name: string; type?: string; quantity?: number };
type DepartmentInfo = { id?: string; name?: string };
type MeetingRoomInfo = { name?: string };
type UserInfo = { fullName?: string; email?: string };

type PendingApprovalMeeting = {
  id: string;
  agenda?: string;
  request?: string;
  department?: DepartmentInfo | null;
  meetingRoom?: MeetingRoomInfo | null;
  user?: UserInfo | null;
  startDate: string; // ISO or date-only string
  endDate: string;
  startTime: string; // "HH:mm:ss" or "HH:mm"
  endTime: string;
  meetingEquipments?: { equipment: EquipmentItem; quantity: number }[];
  overallStatus?: string;
  gtimName?: string;
  companyName?: string;
  visitorName?: string;
  createdAt?: string;
};

const API_BASE_URL = getApiBase();

// Pastikan header Authorization selalu benar: tidak dobel "Bearer "
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
  return role === "ADMIN" || role === "HRGA_MANAGER" || role === "SECTION_HEAD";
}

export default function ApprovalsPage() {
  const { isLoggedIn, isAuthReady } = useAuth();

  const [items, setItems] = useState<PendingApprovalMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<{
    type: "success" | "error" | "warning";
    message: string;
  } | null>(null);

  // Reject modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectMeetingId, setRejectMeetingId] = useState<string | null>(null);
  const [rejectRemark, setRejectRemark] = useState("");

  // Filters
  const [searchText, setSearchText] = useState("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  const [role, setRole] = useState<string | undefined>(undefined);
  const [userDepartmentId, setUserDepartmentId] = useState<string | undefined>(
    undefined
  );
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(
    undefined
  );

  const showNotice = (
    message: string,
    type: "success" | "error" | "warning" = "success"
  ) => {
    setNotice({ message, type });
    setTimeout(() => setNotice(null), 5000);
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
      const endpoint = `/api/meetings/pending-approvals`;
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
      let normalized: PendingApprovalMeeting[] = (data || []).map((m: any) => ({
        ...m,
        id: String(m.id),
      }));

      // Filter for SECTION_HEAD to only show meetings from their department
      if (role === "SECTION_HEAD" && userDepartmentId) {
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

  const approveOrReject = async (
    meetingId: string,
    status: "APPROVED" | "REJECTED",
    remark?: string
  ) => {
    try {
      const token = getToken();
      if (!token) {
        showNotice("Token otentikasi tidak ditemukan.", "error");
        return;
      }
      const body: any = { status, remark: remark || "" };
      const res = await fetch(
        `${API_BASE_URL}/api/meetings/${meetingId}/approve`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: buildAuth(token),
          },
          body: JSON.stringify(body),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showNotice(
          err.message ||
            `Gagal ${
              status === "APPROVED" ? "menyetujui" : "menolak"
            } meeting.`,
          "error"
        );
        return;
      }

      // Setelah sukses, segarkan data baris ini agar status terbarui, tapi tetap tampil
      await refreshOne(meetingId);

      if (status === "APPROVED") {
        showNotice("Meeting berhasil di-approve.", "success");
      } else {
        showNotice("Meeting berhasil di-reject.", "warning");
      }
    } catch (e) {
      console.error(e);
      showNotice("Terjadi kesalahan pada proses approval.", "error");
    }
  };

  const handleRejectClick = (meetingId: string) => {
    setRejectMeetingId(meetingId);
    setRejectRemark("");
    setRejectModalOpen(true);
  };

  const refreshOne = async (meetingId: string) => {
    try {
      const token = getToken();
      if (!token) return;
      const res = await fetch(`${API_BASE_URL}/api/meetings/${meetingId}`, {
        headers: { Authorization: buildAuth(token) },
        cache: "no-store",
      });
      if (!res.ok) return;
      const updated = await res.json();
      const normalized = { ...updated, id: String(updated.id) };
      setItems((prev) =>
        prev.some((m) => m.id === String(meetingId))
          ? prev.map((m) => (m.id === String(meetingId) ? normalized : m))
          : [...prev, normalized]
      );
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!isAuthReady || !isLoggedIn) return;
    const token = getToken();
    if (token) {
      const payload = parseJwt(token);
      if (payload) {
        setRole(payload.role);
        setUserDepartmentId(payload.departmentId); // Changed from userDepartmentId to departmentId
        setCurrentUserId(payload.userId);
        const adminView = isAdminish(payload.role);
        fetchMeetings(adminView, payload.role, payload.departmentId); // Changed from userDepartmentId to departmentId
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthReady, isLoggedIn]);

  const formatDateTimeRange = (m: PendingApprovalMeeting) => {
    // Gabungkan tanggal dan waktu untuk ditampilkan
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

  // Helpers for filtering and searching
  const getDateOnly = (s: string) => {
    const d = s?.includes("T") ? s.split("T")[0] : s;
    return d || "";
  };

  const filteredItems = items.filter((m) => {
    // Only show meetings that are still pending approval
    // Exclude APPROVED and REJECTED meetings automatically
    const allowedStatuses = ["PENDING", "PARTIALLY_APPROVED"];
    const isAllowed = allowedStatuses.includes(m.overallStatus || "");
    return isAllowed;
  });

  const finalFilteredItems = filteredItems.filter((m) => {
    const needle = searchText.trim().toLowerCase();

    // Date range overlap: meeting [start,end] overlaps filter [from,to]
    const mStart = getDateOnly(m.startDate as any);
    const mEnd = getDateOnly(m.endDate as any) || mStart;
    const from = fromDate;
    const to = toDate;

    let dateOk = true;
    if (from && to) {
      dateOk = mStart <= to && mEnd >= from;
    } else if (from) {
      dateOk = mEnd >= from;
    } else if (to) {
      dateOk = mStart <= to;
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
          <h1 className="text-2xl font-bold text-gray-800">Approvals</h1>
          <button
            onClick={() =>
              fetchMeetings(isAdminish(role), role, userDepartmentId)
            }
            className="px-4 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
          >
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-col sm:flex-row gap-3 sm:items-end">
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
          <div className="flex gap-2">
            <button
              onClick={() => {
                setSearchText("");
                setFromDate("");
                setToDate("");
              }}
              className="h-10 mt-6 px-4 bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
            >
              Reset
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <p className="text-gray-600">Memuat daftar approvals...</p>
          </div>
        ) : finalFilteredItems.length === 0 ? (
          <div className="text-center text-gray-600">
            Tidak ada meeting yang menunggu approval.
          </div>
        ) : (
          <>
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
                      Remark
                    </th>
                    <th className="px-3 py-2 text-left text-sm font-semibold text-gray-700 border-b">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {finalFilteredItems.map((m) => {
                    const equipments = (m.meetingEquipments || []).map((me) => {
                      const n = me.equipment?.name || "-";
                      const q = me.quantity ?? 1;
                      return `${n} (${q})`;
                    });
                    const disableActions =
                      m.overallStatus === "APPROVED" ||
                      m.overallStatus === "REJECTED";
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
                        <td className="px-3 py-2 text-sm text-gray-700">
                          {(() => {
                            // First try to find current user's approval remark
                            const userApproval = (m as any).approvals?.find(
                              (a: any) => a.approver.id === currentUserId
                            );
                            if (userApproval?.remark) {
                              return userApproval.remark;
                            }

                            // If no user-specific remark, find any approval with a remark
                            const anyApprovalWithRemark = (
                              m as any
                            ).approvals?.find((a: any) => a.remark);
                            if (anyApprovalWithRemark?.remark) {
                              return `${anyApprovalWithRemark.remark} (${
                                anyApprovalWithRemark.approver.fullName ||
                                "Unknown"
                              })`;
                            }

                            return "-";
                          })()}
                        </td>
                        <td className="px-3 py-2 text-sm">
                          <div className="flex gap-2">
                            <button
                              onClick={() => approveOrReject(m.id, "APPROVED")}
                              className={`px-3 py-1 rounded text-white ${
                                disableActions
                                  ? "bg-green-300 cursor-not-allowed"
                                  : "bg-green-600 hover:bg-green-700"
                              }`}
                              disabled={disableActions}
                              title="Setujui"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectClick(m.id)}
                              className={`px-3 py-1 rounded text-white ${
                                disableActions
                                  ? "bg-red-300 cursor-not-allowed"
                                  : "bg-red-600 hover:bg-red-700"
                              }`}
                              disabled={disableActions}
                              title="Tolak"
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        <RejectRemarkModal
          isOpen={rejectModalOpen}
          onClose={() => setRejectModalOpen(false)}
          onConfirm={async () => {
            if (!rejectMeetingId) return;
            await approveOrReject(rejectMeetingId, "REJECTED", rejectRemark);
            setRejectModalOpen(false);
            setRejectMeetingId(null);
            setRejectRemark("");
          }}
          remark={rejectRemark}
          setRemark={setRejectRemark}
        />
      </div>
    </Layout>
  );
}
