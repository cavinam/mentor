import React, { useEffect, useState } from "react";
import moment from "moment";
import toast from "react-hot-toast";
import { CalendarEvent, Department, MeetingRoom } from "@/types/calendar";
import EquipmentSelector from "../common/EquipmentSelector";

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
  onClose: () => void;
  onChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => void;
  onEquipmentChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
}

export default function AddScheduleModal({
  isOpen,
  formData,
  departments,
  meetingRooms,
  equipmentList,
  equipmentUnavailableIds,
  onClose,
  onChange,
  onEquipmentChange,
  onSubmit,
}: AddScheduleModalProps) {
  const [selectedEquipments, setSelectedEquipments] = useState<string[]>(
    formData.equipment?.map((eq) => eq.id) || [""]
  );

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
        value: checked,
      },
    } as any);
  };

  const handleSubmit = () => {
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
    if (!formData.start || !formData.end) {
      toast.error("Waktu mulai dan akhir wajib diisi");
      return;
    }
    if (moment(formData.end).isSameOrBefore(moment(formData.start))) {
      toast.error("End time harus setelah Start time");
      return;
    }
    onSubmit();
    toast.success("Booking created successfully");
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
                disabled={true}
                className="block w-full rounded-md border border-gray-300 shadow-sm sm:text-sm px-3 py-2 bg-gray-100 text-gray-500 cursor-not-allowed"
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
                // Update ke parent (formData)
                const selected = equipmentList.filter((eq) =>
                  arr.includes(eq.id)
                );
                onChange({
                  target: {
                    name: "equipment",
                    value: selected,
                  },
                } as any);
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
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Create
          </button>
          <button
            onClick={onClose}
            className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
