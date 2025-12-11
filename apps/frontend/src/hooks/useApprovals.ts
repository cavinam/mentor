// Approval hook for pending approvals
export function useApprovals() {
  return {
    approvals: [],
    isLoading: false,
    error: null,
    approve: async (meetingId: string, remark?: string) => {},
    reject: async (meetingId: string, remark?: string) => {},
  };
}
