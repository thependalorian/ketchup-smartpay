/**
 * Additional UI Enhancement Components
 * Timeline, EmptyState, QuickAction for better UX
 */

import { cn } from '../lib/utils';
import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { LucideIcon, ArrowRight, Plus, Search, Filter } from 'lucide-react';
import { Button } from './button';

// ==================== Timeline ====================

interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  time: string;
  icon?: LucideIcon;
  iconVariant?: 'default' | 'primary' | 'warning' | 'success' | 'error';
  status?: 'completed' | 'current' | 'pending';
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

export function Timeline({ items, className }: TimelineProps) {
  const iconVariants = {
    default: 'bg-muted text-muted-foreground',
    primary: 'bg-primary text-primary-foreground',
    success: 'bg-success text-success-foreground',
    warning: 'bg-warning text-warning-foreground',
    error: 'bg-destructive text-destructive-foreground',
  };

  const lineVariants = {
    completed: 'bg-primary',
    current: 'bg-primary',
    pending: 'bg-muted',
  };

  return (
    <div className={cn('relative', className)}>
      {items.map((item, index) => (
        <div key={item.id} className="relative flex gap-4 pb-8 last:pb-0">
          {/* Timeline Line */}
          {index < items.length - 1 && (
            <div className={cn(
              'absolute left-[19px] top-10 w-0.5 h-[calc(100%-40px)]',
              lineVariants[item.status || 'pending']
            )} />
          )}

          {/* Icon */}
          <div className={cn(
            'relative z-10 flex h-10 w-10 items-center justify-center rounded-full shrink-0',
            iconVariants[item.iconVariant || 'default'],
            item.status === 'current' && 'ring-4 ring-primary/20'
          )}>
            {item.icon ? (
              <item.icon className="h-5 w-5" />
            ) : (
              <div className="h-2.5 w-2.5 rounded-full bg-current" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 pt-1">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-foreground">{item.title}</h4>
              <span className="text-xs text-muted-foreground">{item.time}</span>
            </div>
            {item.description && (
              <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ==================== Empty State ====================

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  variant?: 'default' | 'search' | 'filter';
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  variant = 'default',
  className,
}: EmptyStateProps) {
  const variants = {
    default: '',
    search: 'bg-muted/50',
    filter: 'bg-muted/30',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex flex-col items-center justify-center rounded-xl p-12 text-center',
        variants[variant],
        className
      )}
    >
      {Icon && (
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>
      )}
      {action}
    </motion.div>
  );
}

// ==================== Quick Action ====================

interface QuickActionProps {
  icon: LucideIcon;
  label: string;
  description?: string;
  onClick?: () => void;
  variant?: 'default' | 'primary' | 'accent';
  className?: string;
}

export function QuickAction({
  icon: Icon,
  label,
  description,
  onClick,
  variant = 'default',
  className,
}: QuickActionProps) {
  const variants = {
    default: 'bg-card border hover:bg-muted hover:shadow-md',
    primary: 'gradient-primary text-primary-foreground hover:opacity-95 shadow-ketchup',
    accent: 'gradient-accent text-accent-foreground hover:opacity-95',
  };

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        'flex items-center gap-4 p-4 rounded-xl border transition-all text-left',
        variants[variant],
        className
      )}
    >
      <div className={cn(
        'p-3 rounded-lg',
        variant === 'primary' ? 'bg-white/10' : 'bg-muted'
      )}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn(
          'font-medium',
          variant === 'primary' ? 'text-primary-foreground' : 'text-foreground'
        )}>
          {label}
        </p>
        {description && (
          <p className={cn(
            'text-sm',
            variant === 'primary' ? 'text-primary-foreground/80' : 'text-muted-foreground'
          )}>
            {description}
          </p>
        )}
      </div>
      {variant === 'default' && (
        <ArrowRight className="h-5 w-5 text-muted-foreground" />
      )}
    </motion.button>
  );
}

// ==================== Quick Actions Grid ====================

interface QuickActionsGridProps {
  actions: {
    icon: LucideIcon;
    label: string;
    description?: string;
    onClick?: () => void;
    variant?: 'default' | 'primary' | 'accent';
  }[];
  className?: string;
}

export function QuickActionsGrid({ actions, className }: QuickActionsGridProps) {
  return (
    <div className={cn('grid gap-4', className)}>
      {actions.map((action, index) => (
        <QuickAction key={index} {...action} />
      ))}
    </div>
  );
}

// ==================== Search Header ====================

interface SearchHeaderProps {
  title: string;
  description?: string;
  searchPlaceholder?: string;
  onSearch?: (value: string) => void;
  actions?: ReactNode;
  className?: string;
}

export function SearchHeader({
  title,
  description,
  searchPlaceholder = 'Search...',
  onSearch,
  actions,
  className,
}: SearchHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-4 mb-6', className)}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-semibold text-foreground">{title}</h2>
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
        {actions}
      </div>
      
      {onSearch && (
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              onChange={(e) => onSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

// ==================== Section Header ====================

interface SectionHeaderProps {
  title: string;
  action?: ReactNode;
  className?: string;
}

export function SectionHeader({ title, action, className }: SectionHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)}>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {action}
    </div>
  );
}

// ==================== Status Pill ====================

interface StatusPillProps {
  status: 'active' | 'inactive' | 'pending' | 'warning' | 'error' | 'success';
  label?: string;
  className?: string;
}

export function StatusPill({ status, label, className }: StatusPillProps) {
  const variants = {
    active: 'bg-success/10 text-success border-success/20',
    inactive: 'bg-muted text-muted-foreground border-border',
    pending: 'bg-warning/10 text-warning border-warning/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    error: 'bg-destructive/10 text-destructive border-destructive/20',
    success: 'bg-success/10 text-success border-success/20',
  };

  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
      variants[status],
      className
    )}>
      {label || status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
