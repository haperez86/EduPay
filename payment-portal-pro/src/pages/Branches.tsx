import React, { useState, useEffect } from 'react';
import { Building, Plus, Edit, Trash2, MapPin, Phone, Mail, CheckCircle, XCircle } from 'lucide-react';
import { useBranch } from '@/context/BranchContext';
import { useAuth } from '@/context/AuthContext';
import { Branch } from '@/types/models';

interface BranchFormData {
  name: string;
  address: string;
  phone: string;
  email: string;
  isMain: boolean;
  active: boolean;
}

export const Branches: React.FC = () => {
  const { branches, isLoading, fetchBranches } = useBranch();
  const { isSuperAdmin } = useAuth();
  
  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

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
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {branches.map((branch) => (
            <div key={branch.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Building className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{branch.name}</h3>
                    {branch.isMain && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                        <CheckCircle className="w-3 h-3" />
                        Principal
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${
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

              <div className="space-y-2 text-sm text-gray-600">
                {branch.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{branch.address}</span>
                  </div>
                )}
                {branch.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span>{branch.phone}</span>
                  </div>
                )}
                {branch.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span>{branch.email}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Branches;
