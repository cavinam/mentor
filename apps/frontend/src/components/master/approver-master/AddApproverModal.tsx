import { Shield } from 'lucide-react';
import { Department, User } from '@/types';

interface AddApproverModalProps {
  isOpen: boolean;
  departments: Department[];
  sectionHeads: User[];
  hrgaManagers: User[];
  selectedDepartment: string;
  selectedLevel1User: string;
  saving: boolean;
  onDepartmentChange: (departmentId: string) => void;
  onLevel1UserChange: (userId: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export function AddApproverModal({
  isOpen,
  departments,
  sectionHeads,
  hrgaManagers,
  selectedDepartment,
  selectedLevel1User,
  saving,
  onDepartmentChange,
  onLevel1UserChange,
  onSubmit,
  onClose,
}: AddApproverModalProps) {
  if (!isOpen) return null;

  // Check if selected department is HRGA or Expatriate (these go directly to HRGA Manager)
  const selectedDept = departments.find(d => d.id === selectedDepartment);
  const deptName = selectedDept?.name.toUpperCase() || '';
  const isDirectToHRGA = deptName === 'HRGA' || deptName === 'EXPATRIATE';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Add Department Approvers</h2>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Department Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Department <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => onDepartmentChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select department</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          {/* Level 1 - Section Head Selection (Hidden for HRGA and Expatriate Department) */}
          {!isDirectToHRGA && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <label className="block text-sm font-medium text-blue-700 mb-2">
                <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded mr-2">Level 1</span>
                Approver (Section Head) <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedLevel1User}
                onChange={(e) => onLevel1UserChange(e.target.value)}
                className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                required={!isDirectToHRGA}
              >
                <option value="">Select Section Head</option>
                {sectionHeads.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.fullName} ({user.email})
                  </option>
                ))}
              </select>
              {sectionHeads.length === 0 && (
                <p className="text-xs text-red-500 mt-1">
                  No Section Head users found. Create a user with SECTION_HEAD role first.
                </p>
              )}
            </div>
          )}

          {/* Info for HRGA/Expatriate Department */}
          {isDirectToHRGA && (
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-800">
                <strong>{selectedDept?.name} Department:</strong> Approval will go directly to Level 2 (HRGA Manager) without Section Head approval.
              </p>
            </div>
          )}

          {/* Level 2 - HRGA Manager Auto-fill */}
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <label className="block text-sm font-medium text-purple-700 mb-2">
              <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-2 py-1 rounded mr-2">Level 2</span>
              Approver (HRGA Manager)
            </label>
            <div className="px-3 py-2 bg-white border border-purple-300 rounded-md">
              {hrgaManagers.length > 0 ? (
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-purple-600" />
                  <span className="text-gray-900 font-medium">{hrgaManagers[0].fullName}</span>
                  <span className="text-gray-500 text-sm">({hrgaManagers[0].email})</span>
                </div>
              ) : (
                <span className="text-red-500 text-sm">No HRGA Manager found</span>
              )}
            </div>
            <p className="text-xs text-purple-600 mt-1">
              Auto-assigned to HRGA Manager
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={
                saving ||
                hrgaManagers.length === 0 ||
                (!isDirectToHRGA && sectionHeads.length === 0)
              }
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Add Approvers'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
