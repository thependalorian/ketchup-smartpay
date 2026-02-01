import { cn } from '../lib/utils';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
  };
  icon: LucideIcon;
  variant?: 'default' | 'primary' | 'accent' | 'success' | 'warning';
  className?: string;
  delay?: number;
}

export function MetricCard({
  title,
  value,
  subtitle,
  change,
  icon: Icon,
  variant = 'default',
  className,
  delay = 0,
}: MetricCardProps) {
  const variants = {
    default: {
      bg: 'bg-card',
      iconBg: 'bg-muted',
      iconColor: 'text-muted-foreground',
    },
    primary: {
      bg: 'gradient-primary text-primary-foreground',
      iconBg: 'bg-primary-foreground/10',
      iconColor: 'text-primary-foreground',
    },
    accent: {
      bg: 'gradient-accent text-accent-foreground',
      iconBg: 'bg-accent-foreground/10',
      iconColor: 'text-accent-foreground',
    },
    success: {
      bg: 'bg-success/5 border-success/20',
      iconBg: 'bg-success/10',
      iconColor: 'text-success',
    },
    warning: {
      bg: 'bg-warning/5 border-warning/20',
      iconBg: 'bg-warning/10',
      iconColor: 'text-warning',
    },
  };

  const style = variants[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={cn(
        'relative overflow-hidden rounded-xl border p-6 transition-all hover:shadow-lg',
        style.bg,
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className={cn(
            'text-sm font-medium',
            variant === 'primary' || variant === 'accent' ? 'text-inherit opacity-80' : 'text-muted-foreground'
          )}>
            {title}
          </p>
          <p className="text-3xl font-bold font-display tracking-tight">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {subtitle && (
            <p className={cn(
              'text-sm',
              variant === 'primary' || variant === 'accent' ? 'text-inherit opacity-70' : 'text-muted-foreground'
            )}>
              {subtitle}
            </p>
          )}
          {change && (
            <div className={cn(
              'inline-flex items-center gap-1 text-sm font-medium',
              change.type === 'increase' ? 'text-success' : 'text-destructive'
            )}>
              <span>{change.type === 'increase' ? '↑' : '↓'}</span>
              <span>{change.value}%</span>
              <span className="opacity-70">vs last month</span>
            </div>
          )}
        </div>
        <div className={cn('rounded-xl p-3', style.iconBg)}>
          <Icon className={cn('h-6 w-6', style.iconColor)} />
        </div>
      </div>
      
      {/* Decorative element */}
      {(variant === 'primary' || variant === 'accent') && (
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/5" />
      )}
    </motion.div>
  );
}
