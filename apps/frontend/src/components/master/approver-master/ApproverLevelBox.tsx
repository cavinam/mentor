import { Shield, Trash2 } from 'lucide-react';
import { DepartmentApprover } from '@/types';

interface ApproverLevelBoxProps {
  level: 1 | 2;
  approver: DepartmentApprover | null;
  onRemove: (approverId: string) => void;
}

export function ApproverLevelBox({ level, approver, onRemove }: ApproverLevelBoxProps) {
  const isLevel1 = level === 1;
  const colorClasses = isLevel1
    ? {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        badge: 'bg-blue-100 text-blue-700',
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        textColor: 'text-blue-600',
      }
    : {
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        badge: 'bg-purple-100 text-purple-700',
        iconBg: 'bg-purple-100',
        iconColor: 'text-purple-600',
        textColor: 'text-purple-600',
      };

  const roleName = isLevel1 ? 'Section Head' : 'HRGA Manager';

  return (
    <div className={`flex-1 p-4 ${colorClasses.bg} rounded-lg border ${colorClasses.border}`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs font-semibold ${colorClasses.badge} px-2 py-1 rounded`}>
          Level {level}
        </span>
        {approver && (
          <button
            onClick={() => onRemove(approver.id)}
            className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
            title="Remove approver"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="flex items-center gap-3">
        <div className={`p-2 ${colorClasses.iconBg} rounded-lg`}>
          <Shield className={`w-5 h-5 ${colorClasses.iconColor}`} />
        </div>
        <div>
          <p className={`text-xs ${colorClasses.textColor} font-medium`}>{roleName}</p>
          {approver ? (
            <>
              <p className="font-semibold text-gray-900">{approver.user.fullName}</p>
              <p className="text-xs text-gray-500">{approver.user.email}</p>
            </>
          ) : (
            <p className="text-sm text-gray-400 italic">Not assigned</p>
          )}
        </div>
      </div>
    </div>
  );
}
