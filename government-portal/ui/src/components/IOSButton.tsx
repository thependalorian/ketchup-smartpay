/**
 * iOS-Style Button Components
 * Modern, pill-shaped buttons with iOS design language
 */

import { cn } from '../lib/utils';
import { LucideIcon } from 'lucide-react';
import { motion, HTMLMotionProps } from 'framer-motion';

// ==================== iOS Button ====================

interface IOSButtonProps extends Omit<HTMLMotionProps<"button">, "color"> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  fullWidth?: boolean;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  children?: React.ReactNode;
  className?: string;
  loading?: boolean;
}

/**
 * iOS-style button with pill shape, shadow, and smooth animations
 * Features: rounded-full, shadow-lg, hover lift effect, active press effect
 */
export const IOSButton = motion.button<IOSButtonProps>;

export function IOSButtonComponent({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon: Icon,
  iconPosition = 'left',
  children,
  className,
  loading = false,
  disabled,
  ...props
}: IOSButtonProps) {
  const variants = {
    primary: 'bg-primary text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30',
    secondary: 'bg-secondary text-white shadow-lg shadow-secondary/25 hover:shadow-xl hover:shadow-secondary/30',
    success: 'bg-success text-white shadow-lg shadow-success/25 hover:shadow-xl hover:shadow-success/30',
    warning: 'bg-warning text-white shadow-lg shadow-warning/25 hover:shadow-xl hover:shadow-warning/30',
    danger: 'bg-destructive text-white shadow-lg shadow-destructive/25 hover:shadow-xl hover:shadow-destructive/30',
    ghost: 'bg-transparent text-primary shadow-none hover:bg-primary/10',
  };

  const sizes = {
    sm: 'h-8 px-4 text-xs',
    md: 'h-10 px-6 text-sm',
    lg: 'h-12 px-8 text-base',
    icon: 'h-10 w-10',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        // Base styles
        'inline-flex items-center justify-center gap-2 font-medium rounded-full',
        'transition-all duration-200 ease-out',
        'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2',
        'disabled:opacity-50 disabled:pointer-events-none',
        // Variant styles
        variants[variant],
        // Size styles
        sizes[size],
        // Full width
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {!loading && Icon && iconPosition === 'left' && <Icon className="h-4 w-4" />}
      {!loading && children}
      {!loading && Icon && iconPosition === 'right' && <Icon className="h-4 w-4" />}
    </motion.button>
  );
}

// ==================== Pill Button ====================

interface PillButtonProps extends Omit<HTMLMotionProps<"button">, "color"> {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  active?: boolean;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
}

/**
 * Pill-shaped toggle/tab button
 * Great for: Tabs, tags, filters, toggle buttons
 */
export const PillButton = motion.button<PillButtonProps>;

export function PillButtonComponent({
  variant = 'default',
  size = 'md',
  active = false,
  icon: Icon,
  children,
  className,
  ...props
}: PillButtonProps) {
  const variants = {
    default: active 
      ? 'bg-primary text-white shadow-md' 
      : 'bg-muted text-foreground hover:bg-muted/80',
    outline: active
      ? 'bg-primary/10 text-primary border-2 border-primary'
      : 'bg-transparent text-foreground border-2 border-border hover:border-primary/50',
    ghost: active
      ? 'bg-primary/10 text-primary'
      : 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted',
  };

  const sizes = {
    sm: 'h-7 px-3 text-xs',
    md: 'h-9 px-4 text-sm',
    lg: 'h-11 px-5 text-base',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium rounded-full',
        'transition-all duration-200',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </motion.button>
  );
}

// ==================== Pill Group ====================

interface PillGroupProps {
  options: { value: string; label: string; icon?: LucideIcon }[];
  value: string;
  onChange: (value: string) => void;
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
}

/**
 * Group of pill buttons for tabs/filters
 */
export function PillGroup({ 
  options, 
  value, 
  onChange, 
  variant = 'default',
  className 
}: PillGroupProps) {
  return (
    <div className={cn('inline-flex gap-2 p-1 bg-muted/50 rounded-full', className)}>
      {options.map((option) => (
        <PillButton
          key={option.value}
          variant={variant}
          active={value === option.value}
          icon={option.icon}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </PillButton>
      ))}
    </div>
  );
}

// ==================== Circle Button ====================

interface CircleButtonProps extends Omit<HTMLMotionProps<"button">, "color"> {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'primary' | 'ghost' | 'outline';
  icon: LucideIcon;
  className?: string;
}

/**
 * Circular icon button with iOS styling
 */
export const CircleButton = motion.button<CircleButtonProps>;

export function CircleButtonComponent({
  size = 'md',
  variant = 'default',
  icon: Icon,
  className,
  ...props
}: CircleButtonProps) {
  const variants = {
    default: 'bg-muted text-foreground hover:bg-muted/80',
    primary: 'bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/25',
    ghost: 'bg-transparent text-foreground hover:bg-muted',
    outline: 'bg-transparent border-2 border-border text-foreground hover:border-primary/50',
  };

  const sizes = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className={cn(
        'inline-flex items-center justify-center rounded-full font-medium',
        'transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-primary/50',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      <Icon className={cn(size === 'sm' && 'h-4 w-4', size === 'md' && 'h-5 w-5', size === 'lg' && 'h-6 w-6')} />
    </motion.button>
  );
}

// ==================== Floating Action Button (FAB) ====================

interface FABProps extends Omit<HTMLMotionProps<"button">, "color"> {
  icon: LucideIcon;
  label?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  className?: string;
}

/**
 * Floating Action Button - iOS style with blur backdrop
 */
export const FAB = motion.button<FABProps>;

export function FABComponent({
  icon: Icon,
  label,
  variant = 'primary',
  position = 'bottom-right',
  className,
  ...props
}: FABProps) {
  const variants = {
    primary: 'bg-primary text-white shadow-lg shadow-primary/25 hover:shadow-xl',
    secondary: 'bg-secondary text-white shadow-lg shadow-secondary/25 hover:shadow-xl',
    ghost: 'bg-white/80 dark:bg-black/80 text-foreground shadow-md hover:bg-white dark:hover:bg-black',
  };

  const positions = {
    'bottom-right': 'fixed bottom-6 right-6',
    'bottom-left': 'fixed bottom-6 left-6',
    'top-right': 'fixed top-6 right-6',
    'top-left': 'fixed top-6 left-6',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium rounded-full',
        'transition-all duration-200',
        'backdrop-blur-lg',
        variants[variant],
        'h-14 w-14 md:h-16 md:w-16',
        positions[position],
        className
      )}
      {...props}
    >
      <Icon className="h-6 w-6" />
      {label && <span className="sr-only">{label}</span>}
    </motion.button>
  );
}
