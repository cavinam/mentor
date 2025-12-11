'use client';

import { useEffect, useState } from 'react';
import { equipmentService, type Equipment } from '@/services/equipmentService';
import { MultiSelect } from '@/components/ui/multi-select';
import { format } from 'date-fns';

interface EquipmentMultiSelectProps {
  equipment: Equipment[];
  value: string[]; // Array of equipment IDs
  onChange: (equipmentIds: string[]) => void;
  startDateTime?: Date;
  endDateTime?: Date;
  disabled?: boolean;
}

interface EquipmentAvailability {
  [equipmentId: string]: {
    isAvailable: boolean;
    checking: boolean;
  };
}

export function EquipmentMultiSelect({ 
  equipment, 
  value, 
  onChange, 
  startDateTime, 
  endDateTime, 
  disabled 
}: EquipmentMultiSelectProps) {
  const [availability, setAvailability] = useState<EquipmentAvailability>({});

  useEffect(() => {
    if (!startDateTime || !endDateTime) {
      setAvailability({});
      return;
    }

    checkAllEquipment();
  }, [startDateTime, endDateTime, equipment]);

  const checkAllEquipment = async () => {
    if (!startDateTime || !endDateTime) return;

    console.log('🔍 Checking equipment availability for:', {
      startDate: format(startDateTime, 'yyyy-MM-dd'),
      endDate: format(endDateTime, 'yyyy-MM-dd'),
      totalEquipment: equipment.length,
    });

    // Mark all as checking
    const checkingState: EquipmentAvailability = {};
    equipment.forEach(eq => {
      checkingState[eq.id] = { isAvailable: true, checking: true };
    });
    setAvailability(checkingState);

    // Check each equipment
    const results: EquipmentAvailability = {};
    await Promise.all(
      equipment.map(async (eq) => {
        try {
          const response = await equipmentService.checkAvailability({
            equipmentId: eq.id,
            startDate: format(startDateTime, 'yyyy-MM-dd'),
            endDate: format(endDateTime, 'yyyy-MM-dd'),
          });
          results[eq.id] = {
            isAvailable: response.data.isAvailable,
            checking: false,
          };
          console.log(`✅ ${eq.name}: ${response.data.isAvailable ? 'Available' : 'Not Available'}`, response.data);
        } catch (error) {
          console.error(`❌ Error checking ${eq.name}:`, error);
          results[eq.id] = {
            isAvailable: true, // Assume available if check fails
            checking: false,
          };
        }
      })
    );

    console.log('📊 Final availability results:', results);
    setAvailability(results);
  };

  // Filter out unavailable equipment from options
  const availableOptions = equipment
    .filter(eq => {
      const avail = availability[eq.id];
      return avail?.isAvailable !== false;
    })
    .map(eq => {
      const avail = availability[eq.id];
      return {
        label: `${eq.name}${avail?.checking ? ' - Checking...' : ''}`,
        value: eq.id,
        disabled: avail?.checking || false,
      };
    });

  // Add unavailable equipment that are already selected (so they show as disabled)
  const unavailableSelected = equipment
    .filter(eq => {
      const avail = availability[eq.id];
      return avail?.isAvailable === false && value.includes(eq.id);
    })
    .map(eq => ({
      label: `${eq.name} - Already Reserved`,
      value: eq.id,
      disabled: true,
    }));

  const allOptions = [...availableOptions, ...unavailableSelected];

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Equipment
      </label>
      <MultiSelect
        options={allOptions}
        onValueChange={onChange}
        defaultValue={value}
        variant="secondary"
        maxCount={3}
        disabled={disabled}
      />
      {startDateTime && endDateTime && (
        <p className="text-xs text-gray-500 mt-1">
          {Object.keys(availability).length === 0 ? 'Select dates to check availability' : 
           Object.values(availability).some(a => a.checking) ? 'Checking availability...' : 
           'Only available equipment are shown'}
        </p>
      )}
    </div>
  );
}
