import React, { useState, useEffect } from 'react';
import { Building, Plus, Edit, Trash2, MapPin, Phone, Mail, CheckCircle, XCircle, Save, X } from 'lucide-react';
import { useBranch } from '@/context/BranchContext';
import { useAuth } from '@/context/AuthContext';
import { Branch } from '@/types/models';

interface BranchFormData {
  code: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  isMain: boolean;
  active: boolean;
}

export const Branches: React.FC = () => {
  const { branches, isLoading, fetchBranches, createBranch, updateBranch, deleteBranch } = useBranch();
  const { isSuperAdmin } = useAuth();
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState<BranchFormData>({
    code: '',
    name: '',
    address: '',
    phone: '',
    email: '',
    isMain: false,
    active: true,
  });

  // Check if there's already a main branch
  const hasMainBranch = branches.some(b => b.isMain && b.active);
  const currentBranchIsMain = editingBranch?.isMain || false;
  
  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const handleCreateBranch = async () => {
    try {
      // Create proper Branch object with all required fields
      const branchData = {
        ...formData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await createBranch(branchData);
      setIsCreateModalOpen(false);
      resetFormData();
    } catch (error) {
      // Error is handled in context
    }
  };

  const resetFormData = () => {
    setFormData({
      code: '',
      name: '',
      address: '',
      phone: '',
      email: '',
      isMain: false,
      active: true,
    });
  };

  const handleEditBranch = (branch: Branch) => {
    console.log('=== DEBUG handleEditBranch ===');
    console.log('Branch recibida:', branch);
    console.log('Branch.code:', branch.code);
    console.log('Branch.name:', branch.name);
    
    setEditingBranch(branch);
    const formDataToSet = {
      code: branch.code || '',
      name: branch.name || '',
      address: branch.address || '',
      phone: branch.phone || '',
      email: branch.email || '',
      isMain: branch.isMain || false,
      active: branch.active,
    };
    
    console.log('FormData a establecer:', formDataToSet);
    setFormData(formDataToSet);
    setIsEditModalOpen(true);
    console.log('=== FIN DEBUG handleEditBranch ===');
  };

  const handleUpdateBranch = async () => {
    if (!editingBranch) return;
    
    try {
      await updateBranch(editingBranch.id, formData);
      setIsEditModalOpen(false);
      setEditingBranch(null);
      resetFormData();
    } catch (error) {
      // Error is handled in context
    }
  };

  const handleDeleteBranch = async (branch: Branch) => {
    if (window.confirm(`¿Estás seguro de dar de baja la sede "${branch.name}"?`)) {
      try {
        await deleteBranch(branch.id);
      } catch (error) {
        // Error is handled in context
      }
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">Acceso Restringido</h2>
          <p className="text-gray-500">Solo los Super Administradores pueden gestionar sedes.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sedes</h1>
          <p className="text-gray-600">Gestiona las sedes de la academia</p>
        </div>
        <button
          onClick={() => {
            resetFormData();
            setIsCreateModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva Sede
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
          {branches.map((branch) => (
            <div key={branch.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
              <div className="flex flex-col gap-3 mb-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Building className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{branch.name}</h3>
                      {branch.isMain && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full mt-1">
                          <CheckCircle className="w-3 h-3" />
                          Principal
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full whitespace-nowrap ${
                      branch.active 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {branch.active ? (
                        <>
                          <CheckCircle className="w-3 h-3" />
                          Activa
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3" />
                          Inactiva
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                {branch.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{branch.address}</span>
                  </div>
                )}
                {branch.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{branch.phone}</span>
                  </div>
                )}
                {branch.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{branch.email}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleEditBranch(branch)}
                  className="flex items-center justify-center gap-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors w-full sm:w-auto"
                >
                  <Edit className="w-3 h-3" />
                  Editar
                </button>
                <button
                  onClick={() => handleDeleteBranch(branch)}
                  className="flex items-center justify-center gap-1 px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors w-full sm:w-auto"
                  disabled={!branch.active}
                >
                  <Trash2 className="w-3 h-3" />
                  {branch.active ? 'Dar de Baja' : 'Inactiva'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <BranchModal
          title="Nueva Sede"
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleCreateBranch}
          onCancel={() => {
            setIsCreateModalOpen(false);
            resetFormData();
          }}
          hasMainBranch={hasMainBranch}
          currentBranchIsMain={false}
        />
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <BranchModal
          title="Editar Sede"
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleUpdateBranch}
          onCancel={() => {
            setIsEditModalOpen(false);
            setEditingBranch(null);
            resetFormData();
          }}
          hasMainBranch={hasMainBranch}
          currentBranchIsMain={currentBranchIsMain}
        />
      )}
    </div>
  );
};

// Branch Modal Component
interface BranchModalProps {
  title: string;
  formData: BranchFormData;
  setFormData: (data: BranchFormData) => void;
  onSubmit: () => void;
  onCancel: () => void;
  hasMainBranch?: boolean;
  currentBranchIsMain?: boolean;
}

const BranchModal: React.FC<BranchModalProps> = ({
  title,
  formData,
  setFormData,
  onSubmit,
  onCancel,
  hasMainBranch = false,
  currentBranchIsMain = false,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-auto max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código de la Sede *
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="Ej: SUC01"
                maxLength={10}
                required
              />
              <p className="text-xs text-gray-500 mt-1">Código único de máximo 10 caracteres</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de la Sede *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="Ej: Sede Central"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dirección
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder="Ej: Calle Principal #123"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="Ej: +1234567890"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="Ej: sede@ejemplo.com"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isMain}
                  onChange={(e) => setFormData({ ...formData, isMain: e.target.checked })}
                  disabled={hasMainBranch && !currentBranchIsMain}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <span className="text-sm text-gray-700">Sede Principal</span>
              </label>

              {hasMainBranch && !currentBranchIsMain && (
                <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                  ⚠️ Ya existe una sede principal
                </span>
              )}
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Activa</span>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-4 sm:p-6 border-t border-gray-200 sticky bottom-0 bg-white">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm sm:text-base"
          >
            Cancelar
          </button>
          <button
            onClick={onSubmit}
            disabled={!formData.code.trim() || !formData.name.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            <Save className="w-4 h-4" />
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

export default Branches;
