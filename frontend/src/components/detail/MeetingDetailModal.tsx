import React, { useEffect, useState } from "react";
import moment from "moment";
import { MeetingDetailModalProps } from "@/types/modalprops";
import EquipmentSelector from "../common/EquipmentSelector";

// Helper function to check if meeting is approved
const isMeetingApproved = (status?: string) => {
  return status === "APPROVED";
};

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

  // State to track if time/date fields have been changed for approved meetings
  const [showReapprovalWarning, setShowReapprovalWarning] = useState(false);

  useEffect(() => {
    if (isModalOpen) {
      setSelectedEquipments(
        Array.isArray(formData.equipment)
          ? formData.equipment.map((eq) => eq.id)
          : [""]
      );
      // Reset warning when modal opens
      setShowReapprovalWarning(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalOpen]);

  // Enhanced handleChange to detect time/date changes for approved meetings
  const handleChangeWithWarning = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name } = e.target;

    // Check if this is a time/date field change for an approved meeting
    if (
      isMeetingApproved(formData.status) &&
      (name === "startTime" ||
        name === "endTime" ||
        name === "startDate" ||
        name === "endDate")
    ) {
      setShowReapprovalWarning(true);
    }

    // Call the original handleChange
    handleChange(e);
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;

    // Create a synthetic event object that matches the expected type
    const syntheticEvent = {
      target: {
        name,
        value: checked,
        type: "checkbox",
        checked,
        files: null,
        options: null,
      },
      currentTarget: e.currentTarget,
      bubbles: false,
      cancelable: false,
      defaultPrevented: false,
      eventPhase: 0,
      isDefaultPrevented: () => false,
      isPropagationStopped: () => false,
      isTrusted: false,
      nativeEvent: e.nativeEvent,
      persist: () => {},
      preventDefault: () => {},
      stopPropagation: () => {},
      timeStamp: Date.now(),
      type: "change",
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    handleChange(syntheticEvent);
  };

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full">
        <h2 className="text-lg font-bold mb-4">Detail Meeting</h2>

        <div className="space-y-4">
          {/* Warning message for approved meetings */}
          {showReapprovalWarning && isMeetingApproved(formData.status) && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded-md">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-yellow-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">
                    <strong>Perhatian:</strong> Mengubah waktu/tanggal meeting
                    yang sudah disetujui akan mengubah status menjadi
                    &ldquo;Pending&rdquo; dan memerlukan persetujuan ulang.
                  </p>
                </div>
              </div>
            </div>
          )}

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
              <label className="block font-semibold mb-1">
                Meeting Room {formData.isGenbaVisit ? "(Opsional)" : ""}
              </label>
              <div className="flex gap-2">
                <select
                  name="meetingRoomId"
                  value={formData.meetingRoomId || ""}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required={!formData.isGenbaVisit}
                  className={`block w-full rounded-md border border-gray-300 shadow-sm sm:text-sm px-3 py-2 ${
                    !isEditing
                      ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                      : "bg-white"
                  }`}
                >
                  <option value="">
                    {formData.meetingRoomId
                      ? (() => {
                          const foundRoom = meetingRooms.find(
                            (room) => room.id === formData.meetingRoomId
                          );

                          return foundRoom?.name || "—";
                        })()
                      : formData.isGenbaVisit
                      ? "Opsional untuk Genba Visit"
                      : "Pilih Meeting Room"}
                  </option>
                  {meetingRooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name}
                    </option>
                  ))}
                </select>
                {isEditing && formData.meetingRoomId && (
                  <button
                    type="button"
                    onClick={() => {
                      // Create a synthetic event to clear the meeting room
                      const syntheticEvent = {
                        target: {
                          name: "meetingRoomId",
                          value: "",
                        },
                      } as React.ChangeEvent<HTMLSelectElement>;
                      handleChange(syntheticEvent);
                    }}
                    className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm font-medium whitespace-nowrap"
                    title="Clear Meeting Room"
                  >
                    Clear
                  </button>
                )}
              </div>
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
                onChange={handleChangeWithWarning}
                lang="en-GB"
                step="1800"
                disabled={!isEditing}
                className={`w-full border border-gray-300 rounded-md px-3 py-2 ${
                  !isEditing
                    ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                    : ""
                }`}
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">End Time</label>
              <input
                type="time"
                name="endTime"
                value={formData.end ? moment(formData.end).format("HH:mm") : ""}
                onChange={handleChangeWithWarning}
                lang="en-GB"
                step="1800"
                disabled={!isEditing}
                className={`w-full border border-gray-300 rounded-md px-3 py-2 ${
                  !isEditing
                    ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                    : ""
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
                onChange={handleChangeWithWarning}
                disabled={!isEditing}
                className={`w-full border border-gray-300 rounded-md px-3 py-2 ${
                  !isEditing
                    ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                    : ""
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
                onChange={handleChangeWithWarning}
                disabled={!isEditing}
                className={`w-full border border-gray-300 rounded-md px-3 py-2 ${
                  !isEditing
                    ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                    : ""
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
              onClick={(e) => {
                e.preventDefault();
                handleSave();
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
