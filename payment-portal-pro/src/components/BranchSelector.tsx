import React from 'react';
import { Branch } from '@/types/models';
import { useBranch } from '@/context/BranchContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface BranchSelectorProps {
  onBranchSelect?: (branch: Branch) => void;
  showBackButton?: boolean;
  onBack?: () => void;
}

export const BranchSelector: React.FC<BranchSelectorProps> = ({
  onBranchSelect,
  showBackButton = false,
  onBack
}) => {
  const { branches, selectedBranch, isLoading } = useBranch();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 sm:p-0">
      {showBackButton && onBack && (
        <Button variant="outline" onClick={onBack} className="mb-4">
          ← Volver a Vista Global
        </Button>
      )}
      
      <div className="text-center mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Seleccionar Sede</h2>
        <p className="text-gray-600 mt-2 text-sm sm:text-base">Elige una sede para gestionar</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {branches.map((branch) => (
          <BranchCard
            key={branch.id}
            branch={branch}
            isSelected={selectedBranch?.id === branch.id}
            onSelect={() => {
              onBranchSelect?.(branch);
            }}
          />
        ))}
      </div>
    </div>
  );
};

interface BranchCardProps {
  branch: Branch;
  isSelected: boolean;
  onSelect: () => void;
}

const BranchCard: React.FC<BranchCardProps> = ({ branch, isSelected, onSelect }) => {
  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`}
      onClick={onSelect}
    >
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
          <CardTitle className="text-base sm:text-lg truncate">{branch.name}</CardTitle>
          <Badge variant="secondary" className="w-fit">{branch.code}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm text-gray-600 space-y-2">
          {branch.address && (
            <div className="flex items-start gap-2">
              <span className="font-medium text-xs flex-shrink-0">Dirección:</span>
              <span className="line-clamp-2 leading-tight">{branch.address}</span>
            </div>
          )}
          {branch.phone && (
            <div className="flex items-center gap-2">
              <span className="font-medium text-xs flex-shrink-0">Teléfono:</span>
              <span className="truncate">{branch.phone}</span>
            </div>
          )}
          {branch.email && (
            <div className="flex items-center gap-2">
              <span className="font-medium text-xs flex-shrink-0">Email:</span>
              <span className="truncate">{branch.email}</span>
            </div>
          )}
        </div>
        
        {branch.isMain && (
          <div className="mt-2">
            <Badge variant="default" className="w-full justify-center text-xs">
              Sede Principal
            </Badge>
          </div>
        )}
        
        {isSelected && (
          <div className="mt-2">
            <div className="w-full bg-primary text-primary-foreground rounded px-3 py-1.5 text-center text-xs sm:text-sm">
              Seleccionada
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BranchSelector;
