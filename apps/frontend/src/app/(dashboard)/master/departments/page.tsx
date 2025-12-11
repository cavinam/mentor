'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Plus, FolderTree, Edit, Trash2, Users, Calendar } from 'lucide-react';
import { api } from '@/lib/api';
import { DepartmentFormModal } from '@/components/master/dept-master/DepartmentFormModal';
import { DeleteConfirmModal } from '@/components/master/dept-master/DeleteConfirmModal';

interface Department {
  id: string;
  name: string;
  _count: {
    users: number;
    meetings: number;
  };
  createdAt: string;
  updatedAt: string;
}

const DEPARTMENT_COLORS = [
  { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
  { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
  { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
  { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
  { bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-200' },
  { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200' },
];

export default function DepartmentsPage() {
  const { user } = useAuthStore();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const response = await api.get('/departments');
      setDepartments(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (department: Department) => {
    setSelectedDepartment(department);
    setIsFormModalOpen(true);
  };

  const handleDelete = (department: Department) => {
    setSelectedDepartment(department);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedDepartment) return;

    setDeleteLoading(true);
    try {
      await api.delete(`/departments/${selectedDepartment.id}`);
      setIsDeleteModalOpen(false);
      setSelectedDepartment(null);
      fetchDepartments();
    } catch (error: any) {
      console.error('Failed to delete department:', error);
      alert(error.response?.data?.error || 'Failed to delete department. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleFormSuccess = () => {
    fetchDepartments();
    setSelectedDepartment(null);
  };

  const getDepartmentColor = (index: number) => {
    return DEPARTMENT_COLORS[index % DEPARTMENT_COLORS.length];
  };

  const totalUsers = departments.reduce((sum, dept) => sum + dept._count.users, 0);
  const totalMeetings = departments.reduce((sum, dept) => sum + dept._count.meetings, 0);

  if (user?.role !== 'ADMIN') {
    return (
      <div className="text-center py-20">
        <FolderTree className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-500">Only administrators can manage departments</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Departments</h1>
          <p className="text-gray-600 mt-1">Manage department master data</p>
        </div>
        <button
          onClick={() => {
            setSelectedDepartment(null);
            setIsFormModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Department
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500">Total Departments</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{departments.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-blue-200 bg-blue-50">
          <p className="text-sm text-blue-700">Total Users</p>
          <p className="text-2xl font-bold text-blue-800 mt-1">{totalUsers}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-green-200 bg-green-50">
          <p className="text-sm text-green-700">Total Meetings</p>
          <p className="text-2xl font-bold text-green-800 mt-1">{totalMeetings}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-purple-200 bg-purple-50">
          <p className="text-sm text-purple-700">Active</p>
          <p className="text-2xl font-bold text-purple-800 mt-1">{departments.length}</p>
        </div>
      </div>

      {/* Departments Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 mt-2">Loading departments...</p>
        </div>
      ) : departments.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <FolderTree className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">No departments found</p>
          <button
            onClick={() => setIsFormModalOpen(true)}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add First Department
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((dept, index) => {
            const colors = getDepartmentColor(index);
            return (
              <div
                key={dept.id}
                className={`bg-white rounded-lg border ${colors.border} p-6 hover:shadow-md transition-shadow`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 ${colors.bg} rounded-lg`}>
                    <FolderTree className={`w-6 h-6 ${colors.text}`} />
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(dept)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Edit department"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(dept)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Delete department"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-3">{dept.name}</h3>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>
                      {dept._count.users} {dept._count.users === 1 ? 'user' : 'users'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {dept._count.meetings} {dept._count.meetings === 1 ? 'meeting' : 'meetings'}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Created: {new Date(dept.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <DepartmentFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setSelectedDepartment(null);
        }}
        onSuccess={handleFormSuccess}
        department={selectedDepartment}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedDepartment(null);
        }}
        onConfirm={confirmDelete}
        departmentName={selectedDepartment?.name || ''}
        userCount={selectedDepartment?._count.users || 0}
        loading={deleteLoading}
      />
    </div>
  );
}
