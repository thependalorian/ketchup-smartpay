/**
 * Ketchup Brand Logo Components
 * brand.md section 02 - Logo Usage Guidelines
 */

import { cn } from '../lib/utils';

interface BrandLogoProps {
  variant?: 'full' | 'mark' | 'word';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showLabel?: boolean;
}

/**
 * Brand Logo - Consistent logo component
 * brand.md: "The primary Ketchup SmartPay logo is a circular emblem"
 */
export function BrandLogo({ 
  variant = 'full', 
  size = 'md', 
  className,
  showLabel = true 
}: BrandLogoProps) {
  const sizes = {
    sm: 'h-6 w-6',
    md: 'h-9 w-9',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  const labelSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
  };

  if (variant === 'mark') {
    return (
      <div className={cn('relative', className)}>
        <img 
          src="/ketchup-logo.png" 
          alt="Ketchup SmartPay" 
          className={cn('rounded-lg object-contain', sizes[size])} 
        />
      </div>
    );
  }

  if (variant === 'word') {
    return (
      <div className={cn('flex items-center', className)}>
        <span className={cn('font-display font-bold text-foreground', labelSizes[size])}>
          Ketchup SmartPay
        </span>
      </div>
    );
  }

  // Full logo (mark + label)
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <img 
        src="/ketchup-logo.png" 
        alt="Ketchup SmartPay" 
        className={cn('rounded-lg object-contain bg-background', sizes[size])} 
      />
      {showLabel && (
        <div className="flex flex-col">
          <span className={cn('font-display font-semibold text-foreground', labelSizes[size])}>
            SmartPay
          </span>
          <span className="text-[10px] text-muted-foreground">Ketchup Solutions</span>
        </div>
      )}
    </div>
  );
}

interface LogoMarkProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

/**
 * Logo Mark - Isolated circular logo mark
 * brand.md: "The logomark is the circular unit itself"
 */
export function LogoMark({ size = 'md', className }: LogoMarkProps) {
  const sizes = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
    xl: 'h-24 w-24',
  };

  return (
    <div className={cn('relative', className)}>
      <div className={cn('rounded-full gradient-sphere shadow-ketchup', sizes[size])} />
      {/* K letter overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-bold text-black" style={{ fontSize: '0.6em' }}>K</span>
      </div>
    </div>
  );
}

interface LogoBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Logo Badge - Small badge-sized logo
 * brand.md: "Use the isolated mark... favicon, app icon"
 */
export function LogoBadge({ size = 'md', className }: LogoBadgeProps) {
  const sizes = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
  };

  return (
    <div className={cn('relative inline-flex', className)}>
      <img 
        src="/ketchup-logo.png" 
        alt="Ketchup" 
        className={cn('rounded object-contain', sizes[size])} 
      />
    </div>
  );
}

interface PortalLogoProps {
  portal: 'ketchup' | 'government';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Portal Logo - Logo with portal-specific label
 * Consistent branding for both portals
 */
export function PortalLogo({ portal, size = 'md', className }: PortalLogoProps) {
  const sizes = {
    sm: 'h-6 w-6',
    md: 'h-9 w-9',
    lg: 'h-12 w-12',
  };

  const labelSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <img 
        src="/ketchup-logo.png" 
        alt="Ketchup SmartPay" 
        className={cn('rounded-lg object-contain bg-background', sizes[size])} 
      />
      <div className="flex flex-col">
        <span className={cn('font-display font-semibold text-foreground', labelSizes[size])}>
          SmartPay
        </span>
        <span className="text-[10px] text-muted-foreground">
          {portal === 'government' ? 'Government Portal' : 'Ketchup Solutions'}
        </span>
      </div>
    </div>
  );
}
