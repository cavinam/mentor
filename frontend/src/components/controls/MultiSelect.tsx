"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

export type MultiSelectOption = {
  id: string;
  label: string;
  disabled?: boolean;
};

export interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[]; // selected ids
  onChange: (ids: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Pilih...",
  disabled = false,
  className = "",
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectedOptions = useMemo(
    () => options.filter((o) => value.includes(o.id)),
    [options, value]
  );

  const toggleOption = (id: string) => {
    if (disabled) return;
    const target = options.find((o) => o.id === id);
    if (!target || target.disabled) return;

    const exists = value.includes(id);
    if (exists) {
      onChange(value.filter((v) => v !== id));
    } else {
      onChange([...value, id]);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* "Input" like button */}
      <button
        type="button"
        className={`w-full text-left rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm sm:text-sm ${
          disabled ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""
        }`}
        onClick={() => !disabled && setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {selectedOptions.length === 0 ? (
          <span className="text-gray-500">{placeholder}</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {selectedOptions.map((opt) => (
              <span
                key={opt.id}
                className="inline-flex items-center gap-1 rounded bg-blue-100 text-blue-800 px-2 py-0.5 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                {opt.label}
                {!disabled && (
                  <span
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleOption(opt.id);
                    }}
                    aria-label={`Remove ${opt.label}`}
                    title={`Remove ${opt.label}`}
                  >
                    ×
                  </span>
                )}
              </span>
            ))}
          </div>
        )}
        {/* caret */}
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
          ▾
        </span>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
          <ul role="listbox" className="py-1">
            {options.length === 0 && (
              <li className="px-3 py-2 text-sm text-gray-500">
                Tidak ada data
              </li>
            )}
            {options.map((opt) => {
              const selected = value.includes(opt.id);
              const rowDisabled = !!opt.disabled || disabled;
              return (
                <li
                  key={opt.id}
                  role="option"
                  aria-selected={selected}
                  className={`flex items-center justify-between px-3 py-2 text-sm ${
                    rowDisabled
                      ? "text-gray-400 cursor-not-allowed bg-gray-50"
                      : "cursor-pointer hover:bg-gray-100"
                  }`}
                  onClick={() => !rowDisabled && toggleOption(opt.id)}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selected}
                      readOnly
                      className="h-4 w-4"
                      aria-hidden="true"
                    />
                    <span>{opt.label}</span>
                  </div>
                  {opt.disabled && (
                    <span className="ml-2 text-xs text-red-500">
                      Unavailable
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
