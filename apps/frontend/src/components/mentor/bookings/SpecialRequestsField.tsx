'use client';

import { Coffee, Sandwich, Droplet, FileText, HardHat, Hand, Glasses, Ear, Shirt } from 'lucide-react';

// Custom Towel icon component
const Towel = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="3" width="16" height="18" rx="2" />
    <line x1="4" y1="8" x2="20" y2="8" />
    <line x1="4" y1="16" x2="20" y2="16" />
  </svg>
);

export type SpecialRequestType =
  | 'COFFEE' | 'TEA' | 'LUNCH' | 'SPECIAL_LUNCH' | 'MINERAL_WATER' | 'WELCOME_BOARD'
  | 'OSHIBORY' | 'HAT' | 'APRON' | 'GLOVES' | 'GLASSES' | 'EAR_PLUG' | 'SAFETY_HELMET' | 'SERAGAM';

export interface SpecialRequest {
  type: SpecialRequestType;
  quantity?: number;
  notes?: string;
  description?: string;
}

interface SpecialRequestsFieldProps {
  value: SpecialRequest[];
  onChange: (requests: SpecialRequest[]) => void;
}

const requestOptions: Array<{
  type: SpecialRequestType;
  label: string;
  icon: React.ReactNode;
  hasQuantity: boolean;
  hasNotes: boolean;
  hasDescription: boolean;
  category: 'food' | 'apd' | 'other';
}> = [
    // Food & Drink
    { type: 'COFFEE', label: 'Coffee', icon: <Coffee className="w-4 h-4" />, hasQuantity: true, hasNotes: true, hasDescription: false, category: 'food' },
    { type: 'TEA', label: 'Tea', icon: <Coffee className="w-4 h-4" />, hasQuantity: true, hasNotes: true, hasDescription: false, category: 'food' },
    { type: 'LUNCH', label: 'Lunch', icon: <Sandwich className="w-4 h-4" />, hasQuantity: true, hasNotes: false, hasDescription: false, category: 'food' },
    { type: 'SPECIAL_LUNCH', label: 'Special Lunch', icon: <Sandwich className="w-4 h-4" />, hasQuantity: true, hasNotes: true, hasDescription: false, category: 'food' },
    { type: 'MINERAL_WATER', label: 'Mineral Water', icon: <Droplet className="w-4 h-4" />, hasQuantity: true, hasNotes: false, hasDescription: false, category: 'food' },
    // APD (Alat Pelindung Diri)
    { type: 'HAT', label: 'Hat', icon: <HardHat className="w-4 h-4" />, hasQuantity: true, hasNotes: false, hasDescription: false, category: 'apd' },
    { type: 'SAFETY_HELMET', label: 'Safety Helmet', icon: <HardHat className="w-4 h-4" />, hasQuantity: true, hasNotes: false, hasDescription: false, category: 'apd' },
    { type: 'APRON', label: 'Apron Lengan', icon: <Shirt className="w-4 h-4" />, hasQuantity: true, hasNotes: false, hasDescription: false, category: 'apd' },
    { type: 'GLOVES', label: 'Sarung Tangan', icon: <Hand className="w-4 h-4" />, hasQuantity: true, hasNotes: false, hasDescription: false, category: 'apd' },
    { type: 'GLASSES', label: 'Kacamata', icon: <Glasses className="w-4 h-4" />, hasQuantity: true, hasNotes: false, hasDescription: false, category: 'apd' },
    { type: 'EAR_PLUG', label: 'Ear Plug', icon: <Ear className="w-4 h-4" />, hasQuantity: true, hasNotes: false, hasDescription: false, category: 'apd' },
    // Other
    { type: 'OSHIBORY', label: 'Oshibory', icon: <Towel className="w-4 h-4" />, hasQuantity: true, hasNotes: false, hasDescription: false, category: 'other' },
    { type: 'SERAGAM', label: 'Seragam', icon: <Shirt className="w-4 h-4" />, hasQuantity: true, hasNotes: true, hasDescription: false, category: 'other' },
    { type: 'WELCOME_BOARD', label: 'Welcome Board', icon: <FileText className="w-4 h-4" />, hasQuantity: false, hasNotes: false, hasDescription: true, category: 'other' },
  ];

export function SpecialRequestsField({ value, onChange }: SpecialRequestsFieldProps) {
  const isChecked = (type: SpecialRequestType) => {
    return value.some(r => r.type === type);
  };

  const getRequest = (type: SpecialRequestType) => {
    return value.find(r => r.type === type);
  };

  const handleToggle = (type: SpecialRequestType) => {
    if (isChecked(type)) {
      // Remove request
      onChange(value.filter(r => r.type !== type));
    } else {
      // Add request with default values
      const option = requestOptions.find(o => o.type === type);
      const newRequest: SpecialRequest = {
        type,
        ...(option?.hasQuantity && { quantity: 1 }),
        ...(option?.hasNotes && { notes: '' }),
        ...(option?.hasDescription && { description: '' }),
      };
      onChange([...value, newRequest]);
    }
  };

  const handleUpdate = (type: SpecialRequestType, field: keyof SpecialRequest, fieldValue: any) => {
    onChange(value.map(r =>
      r.type === type ? { ...r, [field]: fieldValue } : r
    ));
  };

  const foodOptions = requestOptions.filter(o => o.category === 'food');
  const apdOptions = requestOptions.filter(o => o.category === 'apd');
  const otherOptions = requestOptions.filter(o => o.category === 'other');

  const renderOption = (option: typeof requestOptions[0]) => {
    const checked = isChecked(option.type);
    const request = getRequest(option.type);

    return (
      <div key={option.type} className="border border-gray-200 rounded-md p-2">
        <div className="flex items-center justify-between gap-2">
          <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
            <input
              type="checkbox"
              checked={checked}
              onChange={() => handleToggle(option.type)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"
            />
            <span className="flex items-center gap-1.5 text-sm text-gray-700 truncate">
              {option.icon}
              <span className="truncate">{option.label}</span>
            </span>
          </label>
          {option.hasQuantity && checked && (
            <input
              type="number"
              min="1"
              value={request?.quantity || 1}
              onChange={(e) => handleUpdate(option.type, 'quantity', parseInt(e.target.value) || 1)}
              className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          )}
        </div>

        {/* Notes field - shown below when checked */}
        {checked && option.hasNotes && (
          <div className="mt-2 pl-6">
            <input
              type="text"
              value={request?.notes || ''}
              onChange={(e) => handleUpdate(option.type, 'notes', e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Notes..."
            />
          </div>
        )}

        {/* Description field - shown below when checked */}
        {checked && option.hasDescription && (
          <div className="mt-2 pl-6">
            <textarea
              value={request?.description || ''}
              onChange={(e) => handleUpdate(option.type, 'description', e.target.value)}
              rows={2}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter description..."
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Food & Drink */}
      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Food & Drink</h4>
        <div className="grid grid-cols-2 gap-2">
          {foodOptions.map(renderOption)}
        </div>
      </div>

      {/* APD (Alat Pelindung Diri) */}
      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">APD</h4>
        <div className="grid grid-cols-2 gap-2">
          {apdOptions.map(renderOption)}
        </div>
      </div>

      {/* Other */}
      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Other</h4>
        <div className="grid grid-cols-2 gap-2">
          {otherOptions.map(renderOption)}
        </div>
      </div>
    </div>
  );
}


