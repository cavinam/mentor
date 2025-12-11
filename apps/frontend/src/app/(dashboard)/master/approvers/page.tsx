'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Department, User, DepartmentApprover, DepartmentApprovers } from '@/types';
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
        alert('No HRGA Manager found. Please create a user with HRGA_MANAGER role first.');
        return;
      }
    } else {
      // For other departments, need Level 1 (Section Head)
      if (!selectedLevel1User) {
        alert('Please select Level 1 approver (Section Head)');
        return;
      }
    }

    if (hrgaManagers.length === 0) {
      alert('No HRGA Manager found. Please create a user with HRGA_MANAGER role first.');
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
          alert(level1Response.data.message || 'Failed to add Level 1 approver');
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

      alert(`Approvers added successfully${isHRGADepartment ? ' (HRGA dept: Direct to Level 2)' : ''}`);
      setShowAddModal(false);
      setSelectedDepartment('');
      setSelectedLevel1User('');
      fetchApprovers();
    } catch (error: any) {
      console.error('Error adding approver:', error);
      alert(error.response?.data?.message || 'Failed to add approver');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveApprover = async (approverId: string) => {
    if (!confirm('Are you sure you want to remove this approver?')) {
      return;
    }

    try {
      const response = await api.delete(`/approvers/${approverId}`);
      
      if (response.data.success) {
        alert('Approver removed successfully');
        fetchApprovers();
      } else {
        alert(response.data.message || 'Failed to remove approver');
      }
    } catch (error: any) {
      console.error('Error removing approver:', error);
      alert(error.response?.data?.message || 'Failed to remove approver');
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
    </div>
  );
}
