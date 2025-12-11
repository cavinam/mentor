'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Plus, Wrench, Edit, Trash2, Search } from 'lucide-react';
import { api } from '@/lib/api';
import { EquipmentFormModal } from '@/components/master/equipment-master/EquipmentFormModal';
import { DeleteConfirmModal } from '@/components/master/equipment-master/DeleteConfirmModal';

interface Equipment {
  id: string;
  name: string;
  description?: string;
}

interface EquipmentStats {
  total: number;
}

export default function EquipmentPage() {
  const { user } = useAuthStore();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [stats, setStats] = useState<EquipmentStats>({
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchEquipment();
    fetchStats();
  }, [searchTerm]);

  const fetchEquipment = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (searchTerm) params.search = searchTerm;

      const response = await api.get('/equipment', { params });
      setEquipment(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch equipment:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/equipment/stats');
      setStats(response.data.data || {
        total: 0,
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleEdit = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setIsFormModalOpen(true);
  };

  const handleDelete = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedEquipment) return;
    
    setDeleteLoading(true);
    try {
      await api.delete(`/equipment/${selectedEquipment.id}`);
      setIsDeleteModalOpen(false);
      setSelectedEquipment(null);
      fetchEquipment();
      fetchStats();
    } catch (error) {
      console.error('Failed to delete equipment:', error);
      alert('Failed to delete equipment. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleFormSuccess = () => {
    fetchEquipment();
    fetchStats();
    setSelectedEquipment(null);
  };

  const formatTypeName = (type: string) => {
    return type.replace(/_/g, ' ');
  };

  if (user?.role !== 'ADMIN') {
    return (
      <div className="text-center py-20">
        <Wrench className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-500">Only administrators can manage equipment</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Equipment</h1>
          <p className="text-gray-600 mt-1">Manage equipment master data</p>
        </div>
        <button
          onClick={() => {
            setSelectedEquipment(null);
            setIsFormModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Equipment
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500">Total Equipment Types</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search equipment..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm w-full md:w-64"
          />
        </div>
      </div>

      {/* Equipment Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 mt-2">Loading equipment...</p>
        </div>
      ) : equipment.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">No equipment found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {equipment.map((item) => (
            <div key={item.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <Wrench className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(item)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Edit equipment"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Delete equipment"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{item.name}</h3>
              
              {item.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{item.description}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <EquipmentFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setSelectedEquipment(null);
        }}
        onSuccess={handleFormSuccess}
        equipment={selectedEquipment}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedEquipment(null);
        }}
        onConfirm={confirmDelete}
        equipmentName={selectedEquipment?.name || ''}
        loading={deleteLoading}
      />
    </div>
  );
}
