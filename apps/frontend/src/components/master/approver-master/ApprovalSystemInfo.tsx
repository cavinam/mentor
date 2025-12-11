export function ApprovalSystemInfo() {
  return (
    <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-blue-900 mb-2">Two-Level Approval System</h3>
      <ul className="text-sm text-blue-800 space-y-1">
        <li>• <strong>Section Head:</strong> First level approval for department bookings</li>
        <li>• <strong>HRGA Manager:</strong> Final approval for all bookings</li>
        <li>• Each department can have multiple approvers for each level</li>
      </ul>
    </div>
  );
}
