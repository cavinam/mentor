"use client";

import React from "react";

interface CancelRemarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  remark: string;
  setRemark: (value: string) => void;
}

export default function CancelRemarkModal({
  isOpen,
  onClose,
  onConfirm,
  remark,
  setRemark,
}: CancelRemarkModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-full">
        <h2 className="text-lg font-semibold mb-4">Alasan Pembatalan</h2>
        <textarea
          className="w-full border border-gray-300 rounded-md p-2 mb-4"
          rows={4}
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          placeholder="Masukkan alasan pembatalan..."
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            disabled={remark.trim() === ""}
          >
            Konfirmasi Batal
          </button>
        </div>
      </div>
    </div>
  );
}
