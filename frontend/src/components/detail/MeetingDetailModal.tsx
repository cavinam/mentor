import React, { useEffect, useState } from "react";
import moment from "moment";
import toast from "react-hot-toast";
import { MeetingDetailModalProps } from "@/types/modalprops";
import EquipmentSelector from "../common/EquipmentSelector";

export default function MeetingDetailModal({
  isModalOpen,
  formData,
  equipmentList,
  equipmentUnavailableIds,
  isEditing,
  handleEquipmentSelectChange,
  closeModal,
  handleSave,
  setIsEditing,
  departments = [],
  meetingRooms = [],
  handleChange,
}: MeetingDetailModalProps) {
  // Pastikan formData.equipment adalah array of {id, name}
  const [selectedEquipments, setSelectedEquipments] = useState<string[]>(
    Array.isArray(formData.equipment)
      ? formData.equipment.map((eq) => eq.id)
      : [""]
  );

  useEffect(() => {
    if (isModalOpen) {
      setSelectedEquipments(
        Array.isArray(formData.equipment)
          ? formData.equipment.map((eq) => eq.id)
          : [""]
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalOpen]);

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    handleChange({
      target: {
        name,
        value: checked,
      },
    } as any);
  };

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full">
        <h2 className="text-lg font-bold mb-4">Detail Meeting</h2>

        <div className="space-y-4">
          {/* Row 1 - Department & Meeting Room */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1">Department</label>
              <select
                name="departmentId"
                value={formData.departmentId || ""}
                onChange={handleChange}
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
                onChange={handleChange}
                disabled={!isEditing}
                className={`block w-full rounded-md border border-gray-300 shadow-sm sm:text-sm px-3 py-2 ${
                  !isEditing
                    ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                    : "bg-white"
                }`}
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
                  checked={formData.isGenbaVisit === true}
                  onChange={handleCheckboxChange}
                  disabled={!isEditing}
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
                required
                type="text"
                name="gtimName"
                value={formData.gtimName || ""}
                onChange={handleChange}
                readOnly={!isEditing}
                className={`w-full border border-gray-300 rounded-md px-3 py-2 ${
                  !isEditing ? "bg-gray-100 text-gray-500" : ""
                }`}
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Visitor Name</label>
              <input
                required
                type="text"
                name="visitorName"
                value={formData.visitorName || ""}
                onChange={handleChange}
                readOnly={!isEditing}
                className={`w-full border border-gray-300 rounded-md px-3 py-2 ${
                  !isEditing ? "bg-gray-100 text-gray-500" : ""
                }`}
              />
            </div>
          </div>

          {/* Row 3 - Company Name & Agenda */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1">Company Name</label>
              <input
                required
                type="text"
                name="companyName"
                value={formData.companyName || ""}
                onChange={handleChange}
                readOnly={!isEditing}
                className={`w-full border border-gray-300 rounded-md px-3 py-2 ${
                  !isEditing ? "bg-gray-100 text-gray-500" : ""
                }`}
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Agenda</label>
              <input
                required
                type="text"
                name="agenda"
                value={formData.agenda || ""}
                onChange={handleChange}
                readOnly={!isEditing}
                className={`w-full border border-gray-300 rounded-md px-3 py-2 ${
                  !isEditing ? "bg-gray-100 text-gray-500" : ""
                }`}
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
                value={
                  formData.start ? moment(formData.start).format("HH:mm") : ""
                }
                onChange={handleChange}
                lang="en-GB"
                step="1800"
                readOnly={!isEditing}
                className={`w-full border border-gray-300 rounded-md px-3 py-2 ${
                  !isEditing ? "bg-gray-100 text-gray-500" : ""
                }`}
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">End Time</label>
              <input
                type="time"
                name="endTime"
                value={formData.end ? moment(formData.end).format("HH:mm") : ""}
                onChange={handleChange}
                lang="en-GB"
                step="1800"
                readOnly={!isEditing}
                className={`w-full border border-gray-300 rounded-md px-3 py-2 ${
                  !isEditing ? "bg-gray-100 text-gray-500" : ""
                }`}
              />
            </div>
          </div>

          {/* Row 5 - Start/End Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1">Start Date</label>
              <input
                required
                type="date"
                name="startDate"
                value={
                  formData.start
                    ? moment(formData.start).format("YYYY-MM-DD")
                    : ""
                }
                onChange={handleChange}
                readOnly={!isEditing}
                className={`w-full border border-gray-300 rounded-md px-3 py-2 ${
                  !isEditing ? "bg-gray-100 text-gray-500" : ""
                }`}
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">End Date</label>
              <input
                required
                type="date"
                name="endDate"
                value={
                  formData.end ? moment(formData.end).format("YYYY-MM-DD") : ""
                }
                onChange={handleChange}
                readOnly={!isEditing}
                className={`w-full border border-gray-300 rounded-md px-3 py-2 ${
                  !isEditing ? "bg-gray-100 text-gray-500" : ""
                }`}
              />
            </div>
          </div>

          {/* Equipment */}
          <div>
            <label className="block font-semibold mb-1">Equipment</label>
            <EquipmentSelector
              equipmentList={equipmentList}
              equipmentUnavailableIds={equipmentUnavailableIds}
              selectedEquipments={selectedEquipments}
              onChange={(arr) => {
                setSelectedEquipments(arr);
                handleEquipmentSelectChange(arr.filter(Boolean));
              }}
              isEditing={isEditing}
            />
          </div>

          {/* Request */}
          <div>
            <label className="block font-semibold mb-1">Request</label>
            <textarea
              name="request"
              value={formData.request || ""}
              onChange={handleChange}
              readOnly={!isEditing}
              className={`w-full border border-gray-300 rounded-md px-3 py-2 h-24 ${
                !isEditing ? "bg-gray-100 text-gray-500" : ""
              }`}
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={closeModal}
            className="px-4 py-2 rounded bg-gray-200"
          >
            Tutup
          </button>
          {isEditing ? (
            <button
              type="button"
              onClick={async () => {
                const result = await handleSave();
                if (
                  result !== undefined &&
                  typeof result === "object" &&
                  "status" in result &&
                  (result as any).status === 200
                ) {
                  toast.success("Meeting updated successfully");
                }
              }}
              className="px-4 py-2 rounded bg-blue-600 text-white"
            >
              Simpan
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 rounded bg-yellow-500 text-white"
            >
              Edit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
