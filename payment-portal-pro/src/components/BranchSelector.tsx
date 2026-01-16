import React from 'react';
import { Branch } from '@/types/models';
import { useBranch } from '@/context/BranchContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building, MapPin, Phone, Mail, Check } from 'lucide-react';

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
    <div className="space-y-6 p-4 sm:p-0">
      {showBackButton && onBack && (
        <Button variant="outline" onClick={onBack} className="mb-4">
          ← Volver a Vista Global
        </Button>
      )}
      
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Building className="w-8 h-8 text-primary" />
          </div>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Seleccionar Sede</h2>
        <p className="text-gray-600 text-sm sm:text-base max-w-md mx-auto">
          Elige una sede para comenzar a gestionar
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
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
      className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${
        isSelected ? 'ring-2 ring-primary shadow-lg bg-primary/5' : 'hover:bg-gray-50'
      }`}
      onClick={onSelect}
    >
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Building className="w-4 h-4 text-primary" />
              <CardTitle className="text-lg font-semibold">{branch.name}</CardTitle>
            </div>
            <Badge 
              variant={isSelected ? "default" : "secondary"} 
              className="w-fit text-xs font-medium"
            >
              {branch.code}
            </Badge>
          </div>
          {isSelected && (
            <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
              <Check className="w-4 h-4 text-primary-foreground" />
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="space-y-2 text-sm">
          {branch.address && (
            <div className="flex items-start gap-2 text-gray-600">
              <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-gray-400" />
              <span className="leading-tight">{branch.address}</span>
            </div>
          )}
          {branch.phone && (
            <div className="flex items-center gap-2 text-gray-600">
              <Phone className="w-4 h-4 flex-shrink-0 text-gray-400" />
              <span>{branch.phone}</span>
            </div>
          )}
          {branch.email && (
            <div className="flex items-center gap-2 text-gray-600">
              <Mail className="w-4 h-4 flex-shrink-0 text-gray-400" />
              <span className="truncate">{branch.email}</span>
            </div>
          )}
        </div>
        
        {branch.isMain && (
          <div className="pt-2 border-t">
            <Badge variant="default" className="w-full justify-center text-xs font-medium">
              ⭐ Sede Principal
            </Badge>
          </div>
        )}
        
        {isSelected && (
          <div className="pt-2">
            <Button 
              className="w-full" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
              }}
            >
              Gestionar esta sede
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BranchSelector;
