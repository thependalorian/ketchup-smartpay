/**
 * Ketchup Brand Badge Components
 * brand.md section 06 - Member / Partner Badges
 */

import { cn } from '../lib/utils';

interface BrandBadgeProps {
  variant?: 'silver' | 'gold' | 'platinum' | 'default';
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function BrandBadge({ 
  variant = 'default', 
  children, 
  className,
  size = 'md'
}: BrandBadgeProps) {
  const variants = {
    silver: 'bg-gradient-to-r from-slate-300 via-slate-100 to-slate-300 text-slate-700 border-slate-400',
    gold: 'bg-gradient-to-r from-amber-400 via-amber-200 to-amber-400 text-amber-800 border-amber-500',
    platinum: 'bg-gradient-to-r from-slate-400 via-slate-200 to-slate-400 text-slate-800 border-slate-500',
    default: 'bg-primary text-primary-foreground border-primary',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  return (
    <span className={cn(
      'inline-flex items-center font-semibold rounded-full border',
      variants[variant],
      sizes[size],
      className
    )}>
      {children}
    </span>
  );
}

interface PartnerBadgeProps {
  level: 'silver' | 'gold' | 'platinum';
  orientation?: 'vertical' | 'horizontal';
}

export function PartnerBadge({ level, orientation = 'vertical' }: PartnerBadgeProps) {
  const labels = {
    silver: 'Partner',
    gold: 'Gold Partner',
    platinum: 'Platinum Partner',
  };

  if (orientation === 'horizontal') {
    return (
      <div className={cn(
        'flex items-center gap-2 px-3 py-1 rounded-full border font-medium',
        level === 'silver' && 'bg-slate-100 text-slate-700 border-slate-400',
        level === 'gold' && 'bg-amber-100 text-amber-800 border-amber-400',
        level === 'platinum' && 'bg-slate-200 text-slate-800 border-slate-500'
      )}>
        <span>{labels[level]}</span>
      </div>
    );
  }

  return (
    <div className={cn(
      'flex flex-col items-center px-4 py-2 rounded-lg border',
      level === 'silver' && 'bg-slate-50 text-slate-700 border-slate-300',
      level === 'gold' && 'bg-amber-50 text-amber-800 border-amber-300',
      level === 'platinum' && 'bg-slate-100 text-slate-800 border-slate-400'
    )}>
      <span className="text-xs uppercase tracking-wider opacity-75">{level}</span>
      <span className="font-semibold">Partner</span>
    </div>
  );
}
