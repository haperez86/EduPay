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

  useEffect(() => {
    if (user) {
      fetchBranches();
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
