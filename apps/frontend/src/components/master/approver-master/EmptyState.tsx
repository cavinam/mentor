import { Users } from 'lucide-react';

export function EmptyState() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
      <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
      <p className="text-gray-500">No approvers configured yet</p>
      <p className="text-sm text-gray-400 mt-1">
        Add approvers to departments to enable the approval workflow
      </p>
    </div>
  );
}
