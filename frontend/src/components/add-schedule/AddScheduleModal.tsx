import React, { useEffect, useState } from "react";
import moment from "moment";
import toast from "react-hot-toast";
import { CalendarEvent, Department, MeetingRoom } from "@/types/calendar";
import EquipmentSelector from "../common/EquipmentSelector";
import { getToken } from "../../lib/auth";
import { getApiBase } from "../../lib/apiBase";

export interface AddScheduleModalProps {
  isOpen: boolean;
  formData: Partial<
    CalendarEvent & {
      equipment: { id: string; name: string; quantity: number }[];
      isGenbaVisit?: boolean;
    }
  >;
  departments: Department[];
  meetingRooms: MeetingRoom[];
  equipmentList: { id: string; name: string }[];
  equipmentUnavailableIds?: string[];
  userRole?: string;
  onClose: () => void;
  onChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => void;

  onSuccess?: () => void; // Callback for successful submission
}

export default function AddScheduleModal({
  isOpen,
  formData,
  departments,
  meetingRooms,
  equipmentList,
  equipmentUnavailableIds,
  userRole,
  onClose,
  onChange,
  onSuccess,
}: AddScheduleModalProps) {
  const [selectedEquipments, setSelectedEquipments] = useState<string[]>(
    formData.equipment?.map((eq) => eq.id) || [""]
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedEquipments(formData.equipment?.map((eq) => eq.id) || [""]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const startDateStr = formData.start
    ? moment(formData.start).format("YYYY-MM-DD")
    : "";
  const startTimeStr = formData.start
    ? moment(formData.start).format("HH:mm")
    : "";
  const endDateStr = formData.end
    ? moment(formData.end).format("YYYY-MM-DD")
    : "";
  const endTimeStr = formData.end ? moment(formData.end).format("HH:mm") : "";

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    onChange({
      target: {
        name,
        value: checked ? "true" : "false",
      },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  const handleSubmit = async () => {
    // Validasi minimal
    if (!formData.departmentId) {
      toast.error("Department wajib diisi");
      return;
    }
    if (!formData.gtimName?.trim()) {
      toast.error("Gtim Name wajib diisi");
      return;
    }
    if (!formData.visitorName?.trim()) {
      toast.error("Visitor Name wajib diisi");
      return;
    }
    if (!formData.companyName?.trim()) {
      toast.error("Visitor Company wajib diisi");
      return;
    }
    if (!formData.isGenbaVisit && !formData.meetingRoomId) {
      toast.error("Meeting room wajib diisi (kecuali Genba)");
      return;
    }
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

    const equipmentIds = formData.equipment?.map((eq) => eq.id) || [];
    const equipmentQuantities =
      formData.equipment?.map((eq) => eq.quantity) || [];

    const payload = {
      agenda: formData.agenda,
      isGenbaVisit: !!formData.isGenbaVisit,
      request: formData.request,
      gtimName: formData.gtimName,
      companyName: formData.companyName,
      visitorName: formData.visitorName,
      startDate: startMoment.format("YYYY-MM-DD"),
      endDate: endMoment.format("YYYY-MM-DD"),
      startTime: startMoment.format("HH:mm:ss"),
      endTime: endMoment.format("HH:mm:ss"),
      departmentId: formData.departmentId,
      meetingRoomId: formData.meetingRoomId,
      equipmentIds,
      equipmentQuantities,
    };

    setIsLoading(true);

    const token = getToken();
    if (!token) {
      toast.error("Token otentikasi tidak ditemukan.");
      setIsLoading(false);
      return;
    }

    const API_BASE_URL = getApiBase();

    try {
      const res = await fetch(`${API_BASE_URL}/api/meetings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        if (res.status === 409) {
          // Bentrok jadwal/ruangan atau peralatan
          const msg =
            typeof errData.message === "string" ? errData.message : "";
          if (msg.toLowerCase().includes("ruang rapat")) {
            toast.error(`Meeting Bentrok: ${msg}`);
          } else if (
            Array.isArray(errData.conflicts) &&
            errData.conflicts.length
          ) {
            toast.error(` ${errData.conflicts.join("; ")}`);
          } else {
            toast.error(errData.message || "Meeting Bentrok");
          }
        } else {
          toast.error(errData.message || "Meeting gagal dibuat");
        }
        return;
      }

      // Success - show toast in modal
      toast.success("Meeting berhasil dibuat");

      // Call success callback to refresh parent data
      if (onSuccess) {
        onSuccess();
      }

      // Close modal after success
      setTimeout(() => {
        onClose();
      }, 1000); // Small delay to show success toast
    } catch (err: unknown) {
      console.error(err);
      toast.error("Meeting gagal dibuat");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full">
        <h2 className="text-lg font-bold mb-4">Buat Booking</h2>

        <div className="space-y-4">
          {/* Row 1 - Department & Meeting Room */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1">Department</label>
              <select
                name="departmentId"
                value={formData.departmentId || ""}
                onChange={onChange}
                disabled={userRole !== "ADMIN" && userRole !== "HRGA_MANAGER"}
                className={`block w-full rounded-md border border-gray-300 shadow-sm sm:text-sm px-3 py-2 ${
                  userRole === "ADMIN" || userRole === "HRGA_MANAGER"
                    ? "bg-white text-gray-900 cursor-auto"
                    : "bg-gray-100 text-gray-500 cursor-not-allowed"
                }`}
              >
                <option value="">
                  {formData.departmentId ? "—" : "Pilih Department"}
                </option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Meeting Room</label>
              <select
                required
                name="meetingRoomId"
                value={formData.meetingRoomId || ""}
                onChange={onChange}
                className="block w-full rounded-md border border-gray-300 shadow-sm sm:text-sm px-3 py-2 bg-white"
              >
                <option value="">
                  {formData.meetingRoomId ? "—" : "Pilih Meeting Room"}
                </option>
                {meetingRooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                  </option>
                ))}
              </select>
              <label className="inline-flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  name="isGenbaVisit"
                  checked={!!formData.isGenbaVisit}
                  onChange={handleCheckboxChange}
                />
                <span>Genba Visit</span>
              </label>
              {formData.isGenbaVisit && (
                <div className="mt-2 text-blue-600 text-sm">
                  Meeting ini akan diadakan <b>Genba Visit</b>.
                </div>
              )}
            </div>
          </div>

          {/* Row 2 - Gtim Name & Visitor Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1">Gtim Name</label>
              <input
                type="text"
                name="gtimName"
                value={formData.gtimName || ""}
                onChange={onChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Visitor Name</label>
              <input
                type="text"
                name="visitorName"
                value={formData.visitorName || ""}
                onChange={onChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required
              />
            </div>
          </div>

          {/* Row 3 - Company Name & Agenda */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1">Agenda</label>
              <input
                type="text"
                name="agenda"
                value={formData.agenda || ""}
                onChange={onChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">
                Visitor Company
              </label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName || ""}
                onChange={onChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required
              />
            </div>
          </div>

          {/* Row 4 - Start/End Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1">Start Time</label>
              <input
                type="time"
                name="startTime"
                value={startTimeStr}
                onChange={onChange}
                lang="en-GB"
                step="1800"
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">End Time</label>
              <input
                type="time"
                name="endTime"
                value={endTimeStr}
                onChange={onChange}
                lang="en-GB"
                step="1800"
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required
              />
            </div>
          </div>

          {/* Row 5 - Start/End Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1">Start Date</label>
              <input
                type="date"
                name="startDate"
                value={startDateStr}
                onChange={onChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">End Date</label>
              <input
                type="date"
                name="endDate"
                value={endDateStr}
                onChange={onChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required
              />
            </div>
          </div>

          {/* Equipment (Checkboxes) */}
          <div className="mb-2">
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Equipment
            </label>
            <EquipmentSelector
              equipmentList={equipmentList}
              equipmentUnavailableIds={equipmentUnavailableIds}
              selectedEquipments={selectedEquipments}
              onChange={(arr) => {
                setSelectedEquipments(arr);
                // Update ke parent (formData) - equipment is already managed in formData
                const selected = equipmentList
                  .filter((eq) => arr.includes(eq.id))
                  .map((eq) => ({ ...eq, quantity: 1 }));
                // Update formData directly since equipment is part of the form state
                formData.equipment = selected;
              }}
              isEditing={true}
            />
          </div>

          {/* Request */}
          <div>
            <label className="block font-semibold mb-1">Request</label>
            <textarea
              name="request"
              value={formData.request || ""}
              onChange={onChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 h-24"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Creating..." : "Create"}
          </button>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
