import React from 'react';
import { Menu } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface NavbarProps {
  title: string;
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  title, 
  onMenuClick, 
  showMenuButton = false 
}) => {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-3">
        {/* Mobile Menu Button */}
        {showMenuButton && (
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg hover:bg-muted transition-colors lg:hidden"
          >
            <Menu className="w-5 h-5 text-muted-foreground" />
          </button>
        )}
        
        {/* Title */}
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-foreground">{title}</h1>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* User Avatar */}
        <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-border">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <span className="text-sm font-medium text-primary-foreground">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <span className="text-sm font-medium text-foreground hidden sm:block">
            {user?.username || 'Usuario'}
          </span>
        </div>
      </div>
    </header>
  );
};
