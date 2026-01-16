import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Branch } from '@/types/models';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';

interface BranchContextType {
  branches: Branch[];
  selectedBranch: Branch | null;
  isLoading: boolean;
  setSelectedBranch: (branch: Branch | null) => void;
  fetchBranches: () => Promise<void>;
  getCurrentBranchId: () => number | null;
  canManageBranches: () => boolean;
  createBranch: (branch: Omit<Branch, 'id'>) => Promise<Branch>;
  updateBranch: (id: number, branch: Partial<Branch>) => Promise<Branch>;
  deleteBranch: (id: number) => Promise<void>;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

const API_BASE = import.meta.env.VITE_API_URL ?? '/api';

export const BranchProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user, fetchWithAuth } = useAuth();
  const { toast } = useToast();

  const fetchBranches = useCallback(async () => {
    // Allow fetching branches for registration page (no user logged in)
    // or for logged in users with appropriate roles
    if (user && (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
      return;
    }

    try {
      setIsLoading(true);
      // Use public endpoint for registration, authenticated endpoint for logged users
      const endpoint = user ? '/branches' : '/branches/public';
      const response = user 
        ? await fetchWithAuth(endpoint)
        : await fetch(`${API_BASE}${endpoint}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar las sedes');
      }

      const data: Branch[] = await response.json();
      setBranches(data);

      // Si es ADMIN, seleccionar automáticamente su sede
      if (user && user.role === 'ADMIN' && user.branch) {
        const userBranch = data.find(b => b.id === user.branch?.id);
        if (userBranch) {
          setSelectedBranch(userBranch);
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'No se pudieron cargar las sedes',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, fetchWithAuth, toast]);

  const getCurrentBranchId = useCallback((): number | null => {
    if (user?.role === 'SUPER_ADMIN') {
      return selectedBranch?.id || null;
    } else if (user?.role === 'ADMIN' && user.branch) {
      return user.branch.id;
    } else if (user?.role === 'STUDENT' && user.branch) {
      return user.branch.id;
    }
    return null;
  }, [user, selectedBranch]);

  const canManageBranches = useCallback((): boolean => {
    return user?.role === 'SUPER_ADMIN';
  }, [user]);

  const createBranch = useCallback(async (branch: Omit<Branch, 'id'>): Promise<Branch> => {
    if (!canManageBranches()) {
      throw new Error('No tienes permisos para crear sedes');
    }

    // Validar que solo haya una sede principal
    if (branch.isMain && branches.some(b => b.isMain && b.active)) {
      throw new Error('Ya existe una sede principal. Solo puede haber una sede principal.');
    }

    try {
      const response = await fetchWithAuth('/branches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(branch),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al crear la sede');
      }

      const newBranch = await response.json();
      setBranches(prev => [...prev, newBranch]);
      
      toast({
        title: "Sede Creada",
        description: `La sede "${newBranch.name}" ha sido creada exitosamente.`,
      });

      return newBranch;
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'No se pudo crear la sede',
        variant: "destructive",
      });
      throw error;
    }
  }, [canManageBranches, branches, fetchWithAuth, toast]);

  const updateBranch = useCallback(async (id: number, branch: Partial<Branch>): Promise<Branch> => {
    if (!canManageBranches()) {
      throw new Error('No tienes permisos para editar sedes');
    }

    // Validar que solo haya una sede principal si se está marcando como principal
    const currentBranch = branches.find(b => b.id === id);
    if (branch.isMain && !currentBranch?.isMain && branches.some(b => b.isMain && b.active && b.id !== id)) {
      throw new Error('Ya existe una sede principal. Solo puede haber una sede principal.');
    }

    try {
      const response = await fetchWithAuth(`/branches/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(branch),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al actualizar la sede');
      }

      const updatedBranch = await response.json();
      setBranches(prev => prev.map(b => b.id === id ? updatedBranch : b));
      
      toast({
        title: "Sede Actualizada",
        description: `La sede "${updatedBranch.name}" ha sido actualizada exitosamente.`,
      });

      return updatedBranch;
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'No se pudo actualizar la sede',
        variant: "destructive",
      });
      throw error;
    }
  }, [canManageBranches, branches, fetchWithAuth, toast]);

  const deleteBranch = useCallback(async (id: number): Promise<void> => {
    if (!canManageBranches()) {
      throw new Error('No tienes permisos para eliminar sedes');
    }

    const branchToDelete = branches.find(b => b.id === id);
    if (!branchToDelete) {
      throw new Error('Sede no encontrada');
    }

    try {
      const response = await fetchWithAuth(`/branches/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al eliminar la sede');
      }

      setBranches(prev => prev.map(b => b.id === id ? { ...b, active: false } : b));
      
      toast({
        title: "Sede Eliminada",
        description: `La sede "${branchToDelete.name}" ha sido dada de baja exitosamente.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'No se pudo eliminar la sede',
        variant: "destructive",
      });
      throw error;
    }
  }, [canManageBranches, branches, fetchWithAuth, toast]);

  useEffect(() => {
    if (user) {
      fetchBranches();
    } else {
      // Limpiar estado cuando no hay usuario (logout)
      setBranches([]);
      setSelectedBranch(null);
      setIsLoading(false);
    }
  }, [user, fetchBranches]);

  const value = {
    branches,
    selectedBranch,
    isLoading,
    setSelectedBranch,
    fetchBranches,
    getCurrentBranchId,
    canManageBranches,
    createBranch,
    updateBranch,
    deleteBranch,
  };

  return (
    <BranchContext.Provider value={value}>
      {children}
    </BranchContext.Provider>
  );
};

export const useBranch = () => {
  const context = useContext(BranchContext);
  if (context === undefined) {
    throw new Error('useBranch must be used within a BranchProvider');
  }
  return context;
};
