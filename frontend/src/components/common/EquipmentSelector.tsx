import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";

interface Equipment {
  id: string;
  name: string;
}

interface EquipmentSelectorProps {
  equipmentList: Equipment[];
  equipmentUnavailableIds?: string[];
  selectedEquipments: string[];
  onChange: (selected: string[]) => void;
  isEditing?: boolean;
}

export default function EquipmentSelector({
  equipmentList,
  equipmentUnavailableIds = [],
  selectedEquipments,
  onChange,
  isEditing = true,
}: EquipmentSelectorProps) {
  // Handler untuk menambah dropdown baru
  const handleAdd = () => {
    if (selectedEquipments.length < equipmentList.length) {
      onChange([...selectedEquipments, ""]);
    }
  };

  // Handler untuk menghapus dropdown tertentu
  const handleRemove = (idx: number) => {
    let newSelected = [...selectedEquipments];
    newSelected.splice(idx, 1);
    if (newSelected.length === 0) {
      newSelected = [""];
    }
    onChange(newSelected);
  };

  // Helper: cek status tersedia
  const isAvailable = (id: string) =>
    id && !equipmentUnavailableIds.includes(id);

  return (
    <div>
      <label className="block font-semibold mb-1"></label>
      {selectedEquipments.map((selectedId, idx) => (
        <div key={idx} className="flex items-center gap-2 mb-2">
          <select
            value={selectedId}
            onChange={(e) => {
              const newSelected = [...selectedEquipments];
              newSelected[idx] = e.target.value;
              onChange(newSelected);
            }}
            disabled={!isEditing}
            className="rounded-md w-full border border-gray-300 px-3 py-2"
          >
            <option value="">Pilih Equipment</option>
            {equipmentList.map((item) => {
              const alreadySelected =
                selectedEquipments.includes(item.id) && selectedId !== item.id;
              const unavailable =
                equipmentUnavailableIds.includes(item.id) || alreadySelected;
              return (
                <option key={item.id} value={item.id} disabled={unavailable}>
                  {item.name}
                  {equipmentUnavailableIds.includes(item.id)
                    ? " (Tidak Tersedia)"
                    : alreadySelected
                    ? " (Sudah Dipilih)"
                    : ""}
                </option>
              );
            })}
          </select>
          {selectedId &&
            (isAvailable(selectedId) ? (
              <FaCheckCircle className="text-green-500" title="Tersedia" />
            ) : (
              <FaTimesCircle className="text-red-500" title="Tidak Tersedia" />
            ))}
          {isEditing && (
            <button
              type="button"
              onClick={() => handleRemove(idx)}
              className="text-red-500 text-xs px-2"
              title="Hapus"
            >
              Hapus
            </button>
          )}
        </div>
      ))}
      {isEditing && selectedEquipments.length < equipmentList.length && (
        <button
          type="button"
          onClick={handleAdd}
          className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm"
        >
          Add Equipment
        </button>
      )}
    </div>
  );
}
