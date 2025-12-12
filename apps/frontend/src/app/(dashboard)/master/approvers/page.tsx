'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Department, User, DepartmentApprover, DepartmentApprovers } from '@/types';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  ApproversHeader,
  ApprovalSystemInfo,
  EmptyState,
  DepartmentApproverCard,
  AddApproverModal,
} from '@/components/master/approver-master';

export default function ApproversPage() {
  const [approvers, setApprovers] = useState<DepartmentApprover[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [potentialApprovers, setPotentialApprovers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedLevel1User, setSelectedLevel1User] = useState('');

  // Delete confirmation dialog state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [approverToDelete, setApproverToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Get HRGA Managers for auto-fill
  const hrgaManagers = potentialApprovers.filter(u => u.role === 'HRGA_MANAGER');
  const sectionHeads = potentialApprovers.filter(u => u.role === 'SECTION_HEAD');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchApprovers(),
        fetchDepartments(),
        fetchPotentialApprovers(),
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchApprovers = async () => {
    try {
      const response = await api.get('/approvers');
      if (response.data.success) {
        setApprovers(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching approvers:', error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/departments');
      if (response.data.success) {
        setDepartments(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchPotentialApprovers = async () => {
    try {
      const response = await api.get('/approvers/potential');
      console.log('🔍 Potential Approvers Response:', response.data);
      if (response.data.success) {
        setPotentialApprovers(response.data.data);
        console.log('✅ Section Heads:', response.data.data.filter((u: User) => u.role === 'SECTION_HEAD'));
        console.log('✅ HRGA Managers:', response.data.data.filter((u: User) => u.role === 'HRGA_MANAGER'));
      }
    } catch (error) {
      console.error('Error fetching potential approvers:', error);
    }
  };

  const handleAddApprover = async (e: React.FormEvent) => {
    e.preventDefault();

    // Get selected department info
    const selectedDept = departments.find(d => d.id === selectedDepartment);
    const isHRGADepartment = selectedDept?.name.toUpperCase() === 'HRGA';

    // For HRGA department, only need Level 2 (HRGA Manager)
    if (isHRGADepartment) {
      if (hrgaManagers.length === 0) {
        toast.error('No HRGA Manager found. Please create a user with HRGA_MANAGER role first.');
        return;
      }
    } else {
      // For other departments, need Level 1 (Section Head)
      if (!selectedLevel1User) {
        toast.error('Please select Level 1 approver (Section Head)');
        return;
      }
    }

    if (hrgaManagers.length === 0) {
      toast.error('No HRGA Manager found. Please create a user with HRGA_MANAGER role first.');
      return;
    }

    setSaving(true);
    try {
      // Add Level 1 (Section Head) - Skip for HRGA department
      if (!isHRGADepartment && selectedLevel1User) {
        const level1Response = await api.post('/approvers', {
          departmentId: selectedDepartment,
          userId: selectedLevel1User,
          approverRole: 'SECTION_HEAD',
        });

        if (!level1Response.data.success) {
          toast.error(level1Response.data.message || 'Failed to add Level 1 approver');
          return;
        }
      }

      // Add Level 2 (HRGA Manager) - Always add
      const level2Response = await api.post('/approvers', {
        departmentId: selectedDepartment,
        userId: hrgaManagers[0].id,
        approverRole: 'HRGA_MANAGER',
      });

      // Level 2 might already exist, so we just log it
      if (!level2Response.data.success && !level2Response.data.message?.includes('already exists')) {
        console.warn('Level 2 approver note:', level2Response.data.message);
      }

      toast.success(`Approvers added successfully${isHRGADepartment ? ' (HRGA dept: Direct to Level 2)' : ''}`);
      setShowAddModal(false);
      setSelectedDepartment('');
      setSelectedLevel1User('');
      fetchApprovers();
    } catch (error: any) {
      console.error('Error adding approver:', error);
      toast.error(error.response?.data?.message || 'Failed to add approver');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveApprover = (approverId: string) => {
    setApproverToDelete(approverId);
    setDeleteConfirmOpen(true);
  };

  const confirmRemoveApprover = async () => {
    if (!approverToDelete) return;

    setIsDeleting(true);
    try {
      const response = await api.delete(`/approvers/${approverToDelete}`);

      if (response.data.success) {
        toast.success('Approver removed successfully');
        fetchApprovers();
      } else {
        toast.error(response.data.message || 'Failed to remove approver');
      }
    } catch (error: any) {
      console.error('Error removing approver:', error);
      toast.error(error.response?.data?.message || 'Failed to remove approver');
    } finally {
      setIsDeleting(false);
      setDeleteConfirmOpen(false);
      setApproverToDelete(null);
    }
  };

  // Group approvers by department with level info
  const approversByDepartment = approvers.reduce((acc, approver) => {
    const deptId = approver.departmentId;
    if (!acc[deptId]) {
      acc[deptId] = {
        department: approver.department,
        level1: null as DepartmentApprover | null,
        level2: null as DepartmentApprover | null,
      };
    }
    if (approver.approverRole === 'SECTION_HEAD') {
      acc[deptId].level1 = approver;
    } else if (approver.approverRole === 'HRGA_MANAGER') {
      acc[deptId].level2 = approver;
    }
    return acc;
  }, {} as Record<string, DepartmentApprovers>);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <ApproversHeader onAddClick={() => setShowAddModal(true)} />
      <ApprovalSystemInfo />

      <div className="space-y-4">
        {Object.keys(approversByDepartment).length === 0 ? (
          <EmptyState />
        ) : (
          Object.values(approversByDepartment).map((data) => (
            <DepartmentApproverCard
              key={data.department.id}
              data={data}
              onRemoveApprover={handleRemoveApprover}
            />
          ))
        )}
      </div>

      <AddApproverModal
        isOpen={showAddModal}
        departments={departments}
        sectionHeads={sectionHeads}
        hrgaManagers={hrgaManagers}
        selectedDepartment={selectedDepartment}
        selectedLevel1User={selectedLevel1User}
        saving={saving}
        onDepartmentChange={setSelectedDepartment}
        onLevel1UserChange={setSelectedLevel1User}
        onSubmit={handleAddApprover}
        onClose={() => {
          setShowAddModal(false);
          setSelectedDepartment('');
          setSelectedLevel1User('');
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Remove Approver</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this approver? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <button
              onClick={() => setDeleteConfirmOpen(false)}
              disabled={isDeleting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={confirmRemoveApprover}
              disabled={isDeleting}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isDeleting ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Removing...
                </>
              ) : (
                'Remove'
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
