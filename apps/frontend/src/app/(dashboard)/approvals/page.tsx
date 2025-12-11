'use client';

import { useAuthStore } from '@/store/authStore';
import { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Building2,
  User,
  Loader2,
  MessageSquare,
  RefreshCw,
  Search,
  X
} from 'lucide-react';
import { approvalService, PendingApproval, ApprovalHistory } from '@/services/approvalService';

type TabType = 'pending' | 'history';

export default function ApprovalsPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [historyApprovals, setHistoryApprovals] = useState<ApprovalHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [remarkModal, setRemarkModal] = useState<{
    open: boolean;
    type: 'approve' | 'reject';
    meetingId: string;
    agenda: string;
  } | null>(null);
  const [remark, setRemark] = useState('');

  // Check if user has approval rights
  const canApprove = user?.role === 'ADMIN' || user?.role === 'SECTION_HEAD' || user?.role === 'HRGA_MANAGER';

  // Fetch pending approvals
  const fetchPendingApprovals = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await approvalService.getPendingApprovals();
      setPendingApprovals(response.data);
    } catch (err: any) {
      console.error('Error fetching pending approvals:', err);
      setError('Failed to load pending approvals');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch approval history
  const fetchApprovalHistory = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await approvalService.getApprovalHistory({ limit: 50 });
      setHistoryApprovals(response.data);
    } catch (err: any) {
      console.error('Error fetching approval history:', err);
      setError('Failed to load approval history');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (canApprove) {
      if (activeTab === 'pending') {
        fetchPendingApprovals();
      } else {
        fetchApprovalHistory();
      }
    }
  }, [canApprove, activeTab]);

  // Handle approve
  const handleApprove = async (meetingId: string) => {
    try {
      setIsProcessing(meetingId);
      await approvalService.approve(meetingId);
      await fetchPendingApprovals();
      setRemarkModal(null);
      setRemark('');
    } catch (err: any) {
      console.error('Error approving:', err);
      setError(err.response?.data?.message || 'Failed to approve');
    } finally {
      setIsProcessing(null);
    }
  };

  // Handle reject
  const handleReject = async (meetingId: string, remarkText: string) => {
    try {
      setIsProcessing(meetingId);
      await approvalService.reject(meetingId, remarkText);
      await fetchPendingApprovals();
      setRemarkModal(null);
      setRemark('');
    } catch (err: any) {
      console.error('Error rejecting:', err);
      setError(err.response?.data?.message || 'Failed to reject');
    } finally {
      setIsProcessing(null);
    }
  };

  // Open remark modal
  const openRemarkModal = (type: 'approve' | 'reject', meetingId: string, agenda: string) => {
    setRemarkModal({ open: true, type, meetingId, agenda });
    setRemark('');
  };

  // Submit remark modal
  const submitRemarkModal = () => {
    if (!remarkModal) return;
    if (remarkModal.type === 'approve') {
      handleApprove(remarkModal.meetingId);
    } else {
      if (!remark.trim()) return; // Prevent empty remark for rejection
      handleReject(remarkModal.meetingId, remark);
    }
  };

  // Filter pending approvals based on search
  const filteredPendingApprovals = useMemo(() => {
    if (!searchQuery) return pendingApprovals;
    const query = searchQuery.toLowerCase();
    return pendingApprovals.filter(approval =>
      approval.meeting.agenda.toLowerCase().includes(query) ||
      approval.meeting.user?.fullName?.toLowerCase().includes(query) ||
      approval.meeting.department?.name?.toLowerCase().includes(query) ||
      approval.meeting.meetingRoom?.name?.toLowerCase().includes(query)
    );
  }, [pendingApprovals, searchQuery]);

  // Filter history approvals based on search
  const filteredHistoryApprovals = useMemo(() => {
    if (!searchQuery) return historyApprovals;
    const query = searchQuery.toLowerCase();
    return historyApprovals.filter(approval =>
      approval.meeting.agenda.toLowerCase().includes(query) ||
      approval.meeting.user?.fullName?.toLowerCase().includes(query)
    );
  }, [historyApprovals, searchQuery]);

  // Calculate stats from filtered data
  const stats = {
    pending: filteredPendingApprovals.length,
    approved: filteredHistoryApprovals.filter(a => a.status === 'APPROVED').length,
    rejected: filteredHistoryApprovals.filter(a => a.status === 'REJECTED').length,
  };

  if (!canApprove) {
    return (
      <div className="text-center py-20">
        <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-500">
          Only Admin, Section Heads and HRGA Managers can access this page
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Approvals</h1>
          <p className="text-gray-600 mt-1">
            {user?.role === 'ADMIN'
              ? 'Manage all booking approval requests'
              : user?.role === 'SECTION_HEAD'
                ? 'Review and approve booking requests from your department'
                : 'Final approval for all booking requests'}
          </p>
        </div>
        <button
          onClick={() => activeTab === 'pending' ? fetchPendingApprovals() : fetchApprovalHistory()}
          className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-yellow-200 bg-yellow-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-700">Pending Approval</p>
              <p className="text-2xl font-bold text-yellow-800 mt-1">{stats.pending}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-green-200 bg-green-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700">Approved</p>
              <p className="text-2xl font-bold text-green-800 mt-1">{stats.approved}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-red-200 bg-red-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-700">Rejected</p>
              <p className="text-2xl font-bold text-red-800 mt-1">{stats.rejected}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by agenda, requester, department, room..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {searchQuery && (
            <span className="text-sm text-gray-500">
              Found {activeTab === 'pending' ? filteredPendingApprovals.length : filteredHistoryApprovals.length} results
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex gap-6">
            <button
              onClick={() => setActiveTab('pending')}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'pending'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Pending ({stats.pending})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'history'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              History
            </button>
          </nav>
        </div>
      </div>

      {/* Pending Approvals List */}
      {activeTab === 'pending' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Pending Approvals</h2>
            <p className="text-sm text-gray-500 mt-1">
              {user?.role === 'ADMIN'
                ? 'All pending booking requests'
                : user?.role === 'SECTION_HEAD'
                  ? 'Requests from your department members awaiting your approval'
                  : 'Requests that have been approved by Section Heads, awaiting final approval'}
            </p>
          </div>

          <div className="divide-y divide-gray-200">
            {isLoading ? (
              <div className="p-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
                <p className="text-gray-500">Loading approvals...</p>
              </div>
            ) : filteredPendingApprovals.length === 0 ? (
              <div className="p-12 text-center">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">
                  {searchQuery ? 'No matching approvals found' : 'No pending approvals'}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  {searchQuery ? 'Try adjusting your search query' : 'New booking requests will appear here'}
                </p>
              </div>
            ) : (
              filteredPendingApprovals.map((approval) => (
                <div key={approval.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">{approval.meeting.agenda}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-500">
                          Requested by: {approval.meeting.user?.fullName || 'Unknown'}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>{new Date(approval.meeting.startDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span>{approval.meeting.startTime} - {approval.meeting.endTime}</span>
                        </div>
                        {approval.meeting.department && (
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-gray-400" />
                            <span>{approval.meeting.department.name}</span>
                          </div>
                        )}
                      </div>

                      {approval.meeting.meetingRoom && (
                        <div className="mt-3">
                          <span className="text-sm text-gray-700">Room: </span>
                          <span className="text-sm font-medium text-gray-900">
                            {approval.meeting.meetingRoom.name}
                          </span>
                        </div>
                      )}

                      {approval.meeting.request && (
                        <div className="mt-2">
                          <span className="text-sm text-gray-700">Notes: </span>
                          <span className="text-sm text-gray-600">{approval.meeting.request}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <button
                        onClick={() => openRemarkModal('approve', approval.meeting.id, approval.meeting.agenda)}
                        disabled={isProcessing === approval.meeting.id}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        {isProcessing === approval.meeting.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        Approve
                      </button>
                      <button
                        onClick={() => openRemarkModal('reject', approval.meeting.id, approval.meeting.agenda)}
                        disabled={isProcessing === approval.meeting.id}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        {isProcessing === approval.meeting.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* History List */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Approval History</h2>
            <p className="text-sm text-gray-500 mt-1">
              Your past approval decisions
            </p>
          </div>

          <div className="divide-y divide-gray-200">
            {isLoading ? (
              <div className="p-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
                <p className="text-gray-500">Loading history...</p>
              </div>
            ) : filteredHistoryApprovals.length === 0 ? (
              <div className="p-12 text-center">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">
                  {searchQuery ? 'No matching history found' : 'No approval history yet'}
                </p>
                {searchQuery && (
                  <p className="text-sm text-gray-400 mt-1">Try adjusting your search query</p>
                )}
              </div>
            ) : (
              filteredHistoryApprovals.map((approval) => (
                <div key={approval.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-medium text-gray-900">{approval.meeting.agenda}</h3>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${approval.status === 'APPROVED'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                          }`}>
                          {approval.status === 'APPROVED' ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                          {approval.status}
                        </span>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>{new Date(approval.meeting.startDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span>{approval.meeting.startTime} - {approval.meeting.endTime}</span>
                        </div>
                        {approval.approvedAt && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400">Processed:</span>
                            <span>{new Date(approval.approvedAt).toLocaleString()}</span>
                          </div>
                        )}
                      </div>

                      {approval.remark && (
                        <div className="mt-2 flex items-start gap-2">
                          <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5" />
                          <span className="text-sm text-gray-600">{approval.remark}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">Approval Process</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>- <strong>Level 1:</strong> Section Head approval (department-level)</li>
          <li>- <strong>Level 2:</strong> HRGA Manager approval (final approval)</li>
          <li>- Both levels must approve for a booking to be confirmed</li>
        </ul>
      </div>

      {/* Remark Modal */}
      {remarkModal?.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {remarkModal.type === 'approve' ? 'Approve' : 'Reject'} Meeting
              </h3>
              <p className="text-sm text-gray-500 mt-1">{remarkModal.agenda}</p>
            </div>

            <div className="p-6">
              {remarkModal.type === 'approve' ? (
                <p className="text-gray-600">Are you sure you want to approve this meeting request?</p>
              ) : (
                <>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Remark (Required)
                  </label>
                  <textarea
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    placeholder="Please provide a reason for rejection..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                  />
                  {remark === '' && (
                    <p className="text-xs text-red-500 mt-1">Remark cannot be empty</p>
                  )}
                </>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setRemarkModal(null)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitRemarkModal}
                disabled={isProcessing !== null || (remarkModal.type === 'reject' && !remark.trim())}
                className={`px-4 py-2 rounded-md text-white transition-colors flex items-center gap-2 ${remarkModal.type === 'approve'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isProcessing !== null && <Loader2 className="w-4 h-4 animate-spin" />}
                {remarkModal.type === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
