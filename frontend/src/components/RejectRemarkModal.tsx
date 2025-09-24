"use client";

import React from "react";
import toast from "react-hot-toast";

interface RejectRemarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  remark: string;
  setRemark: (value: string) => void;
  isLoading?: boolean;
}

export default function RejectRemarkModal({
  isOpen,
  onClose,
  onConfirm,
  remark,
  setRemark,
  isLoading = false,
}: RejectRemarkModalProps) {
  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      await onConfirm();
      toast.success("Meeting berhasil ditolak");
    } catch (error) {
      console.error("Error rejecting meeting:", error);
      toast.error("Gagal menolak meeting");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-full">
        <h2 className="text-lg font-semibold mb-4">Alasan Penolakan</h2>
        <textarea
          className="w-full border border-gray-300 rounded-md p-2 mb-4"
          rows={4}
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          placeholder="Masukkan alasan penolakan..."
          disabled={isLoading}
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            disabled={isLoading}
          >
            Batal
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-red-400"
            disabled={remark.trim() === "" || isLoading}
          >
            {isLoading ? "Memproses..." : "Konfirmasi Tolak"}
          </button>
        </div>
      </div>
    </div>
  );
}
