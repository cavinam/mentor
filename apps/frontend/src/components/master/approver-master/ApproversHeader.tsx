import { Plus } from 'lucide-react';

interface ApproversHeaderProps {
  onAddClick: () => void;
}

export function ApproversHeader({ onAddClick }: ApproversHeaderProps) {
  return (
    <div className="mb-8 flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Master Approvers</h1>
        <p className="text-gray-600 mt-1">
          Manage approvers for each department
        </p>
      </div>
      <button
        onClick={onAddClick}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        <Plus className="w-5 h-5" />
        Add Approver
      </button>
    </div>
  );
}
