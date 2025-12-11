import { Building2, ChevronRight } from 'lucide-react';
import { DepartmentApprovers } from '@/types';
import { ApproverLevelBox } from './ApproverLevelBox';

interface DepartmentApproverCardProps {
  data: DepartmentApprovers;
  onRemoveApprover: (approverId: string) => void;
}

export function DepartmentApproverCard({ data, onRemoveApprover }: DepartmentApproverCardProps) {
  const { department, level1, level2 } = data;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">{department.name}</h2>
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex items-center gap-4">
          <ApproverLevelBox level={1} approver={level1} onRemove={onRemoveApprover} />
          <ChevronRight className="w-6 h-6 text-gray-400 flex-shrink-0" />
          <ApproverLevelBox level={2} approver={level2} onRemove={onRemoveApprover} />
        </div>
      </div>
    </div>
  );
}
