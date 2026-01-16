import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
}

const variantStyles = {
  default: {
    bg: 'bg-card',
    iconBg: 'bg-muted',
    iconColor: 'text-muted-foreground',
  },
  primary: {
    bg: 'bg-card',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
  },
  success: {
    bg: 'bg-card',
    iconBg: 'bg-success/10',
    iconColor: 'text-success',
  },
  warning: {
    bg: 'bg-card',
    iconBg: 'bg-warning/10',
    iconColor: 'text-warning',
  },
  error: {
    bg: 'bg-card',
    iconBg: 'bg-destructive/10',
    iconColor: 'text-destructive',
  },
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
}) => {
  const styles = variantStyles[variant];

  return (
    <div className={cn('stat-card', styles.bg)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0 overflow-hidden">
          <p className="text-xs font-medium text-muted-foreground mb-1 leading-tight">{title}</p>
          <p className="text-lg sm:text-2xl font-bold text-foreground leading-tight break-words" title={typeof value === 'string' ? value : String(value)}>
            {typeof value === 'string' && value.length > 12 
              ? `${value.slice(0, 10)}...` 
              : value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1 leading-tight truncate">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={cn(
                  'text-xs font-medium',
                  trend.isPositive ? 'text-success' : 'text-destructive'
                )}
              >
                {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-muted-foreground hidden sm:inline">vs mes anterior</span>
            </div>
          )}
        </div>
        <div className={cn('p-2 sm:p-3 rounded-xl flex-shrink-0', styles.iconBg)}>
          <Icon className={cn('w-4 h-4 sm:w-6 sm:h-6', styles.iconColor)} />
        </div>
      </div>
    </div>
  );
};
