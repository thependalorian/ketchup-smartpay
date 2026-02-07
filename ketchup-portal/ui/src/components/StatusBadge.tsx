import { cn } from '../lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const statusBadgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        success: 'bg-success/10 text-success border border-success/20',
        warning: 'bg-warning/10 text-warning border border-warning/20',
        error: 'bg-destructive/10 text-destructive border border-destructive/20',
        info: 'bg-info/10 text-info border border-info/20',
        neutral: 'bg-muted text-muted-foreground border border-border',
        active: 'bg-success/10 text-success border border-success/20',
        inactive: 'bg-muted text-muted-foreground border border-border',
        pending: 'bg-warning/10 text-warning border border-warning/20',
        suspended: 'bg-destructive/10 text-destructive border border-destructive/20',
        issued: 'bg-info/10 text-info border border-info/20',
        delivered: 'bg-secondary/10 text-secondary border border-secondary/20',
        redeemed: 'bg-success/10 text-success border border-success/20',
        expired: 'bg-destructive/10 text-destructive border border-destructive/20',
        cancelled: 'bg-muted text-muted-foreground border border-border',
        low_liquidity: 'bg-warning/10 text-warning border border-warning/20',
      },
      size: {
        sm: 'px-2 py-0.5 text-[10px]',
        md: 'px-2.5 py-1 text-xs',
        lg: 'px-3 py-1.5 text-sm',
      },
    },
    defaultVariants: {
      variant: 'neutral',
      size: 'md',
    },
  }
);

interface StatusBadgeProps extends VariantProps<typeof statusBadgeVariants> {
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

export function StatusBadge({ children, variant, size, className, dot = true }: StatusBadgeProps) {
  return (
    <span className={cn(statusBadgeVariants({ variant, size }), className)}>
      {dot && (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            variant === 'success' || variant === 'active' || variant === 'redeemed' ? 'bg-success' : '',
            variant === 'warning' || variant === 'pending' || variant === 'low_liquidity' ? 'bg-warning' : '',
            variant === 'error' || variant === 'expired' || variant === 'suspended' ? 'bg-destructive' : '',
            variant === 'info' || variant === 'issued' ? 'bg-info' : '',
            variant === 'neutral' || variant === 'inactive' || variant === 'cancelled' ? 'bg-muted-foreground' : '',
            variant === 'delivered' ? 'bg-secondary' : ''
          )}
        />
      )}
      {children}
    </span>
  );
}
