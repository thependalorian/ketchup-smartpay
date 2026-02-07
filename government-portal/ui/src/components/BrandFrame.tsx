/**
 * Ketchup Brand Frame Components
 * brand.md section 06 - Open Frame / Brackets / Arrows
 */

import { cn } from '../lib/utils';
import { ReactNode } from 'react';

interface OpenFrameProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'thick' | 'thin';
  corners?: 'all' | 'top' | 'bottom' | 'none';
}

/**
 * Open Frame - Isolated branded frame element
 * brand.md: "The frame from the logo can be isolated as a branded graphic element"
 */
export function OpenFrame({ 
  children, 
  className, 
  variant = 'default',
  corners = 'all'
}: OpenFrameProps) {
  const borderWidths = {
    thin: '2px',
    default: '4px',
    thick: '6px',
  };

  const cornerStyles = {
    all: 'rounded-none',
    top: 'rounded-t-xl',
    bottom: 'rounded-b-xl',
    none: 'rounded-none',
  };

  return (
    <div className={cn(
      'border border-primary/30',
      borderWidths[variant],
      cornerStyles[corners],
      className
    )}>
      <div className="absolute inset-0 bg-gradient-sphere-subtle opacity-50" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

interface BracketsProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'thick' | 'thin';
  position?: 'all' | 'left' | 'right' | 'corners';
}

/**
 * Open Brackets - Brackets that frame content
 * brand.md: "The negative of the frame creates brackets that highlight content"
 */
export function Brackets({ 
  children, 
  className, 
  variant = 'default',
  position = 'all'
}: BracketsProps) {
  const borderWidths = {
    thin: 'border-l-2 border-r-2',
    default: 'border-l-4 border-r-4',
    thick: 'border-l-6 border-r-6',
  };

  const horizontalLine = {
    thin: 'h-4 border-t-2',
    default: 'h-6 border-t-4',
    thick: 'h-8 border-t-6',
  };

  return (
    <div className={cn('relative inline-block', className)}>
      {/* Left brackets */}
      {(position === 'all' || position === 'left' || position === 'corners') && (
        <>
          <div className={cn('absolute -left-2 top-0 border-l-4 border-primary/40', horizontalLine[variant])} />
          <div className={cn('absolute -left-2 bottom-0 border-l-4 border-primary/40', horizontalLine[variant])} />
        </>
      )}
      
      {/* Right brackets */}
      {(position === 'all' || position === 'right' || position === 'corners') && (
        <>
          <div className={cn('absolute -right-2 top-0 border-r-4 border-primary/40', horizontalLine[variant])} />
          <div className={cn('absolute -right-2 bottom-0 border-r-4 border-primary/40', horizontalLine[variant])} />
        </>
      )}
      
      <div className="relative z-10 px-4">{children}</div>
    </div>
  );
}

interface BrandArrowProps {
  direction: 'up' | 'down' | 'left' | 'right';
  className?: string;
  variant?: 'default' | 'thick' | 'thin';
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Open Arrows - Corners from brackets used as arrows
 * brand.md: "Corners from the open brackets can be used as arrows to suggest movement"
 */
export function BrandArrow({
  direction,
  className,
  variant = 'default',
  size = 'md'
}: BrandArrowProps) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  const borders = {
    thin: 'border-2',
    default: 'border-3',
    thick: 'border-4',
  };

  const rotations = {
    up: 'rotate-45',
    down: 'rotate-[135deg]',
    left: 'rotate-[-45deg]',
    right: 'rotate-[45deg]',
  };

  return (
    <div 
      className={cn(
        'inline-block border-primary',
        sizes[size],
        borders[variant],
        'border-l-0 border-b-0',
        rotations[direction],
        className
      )}
    />
  );
}

interface BlurOverlayProps {
  children: ReactNode;
  className?: string;
  intensity?: 'light' | 'medium' | 'heavy';
}

/**
 * Blur Effect - Blurred background for content overlay
 * brand.md: "Blurring can frame content and create space for copy overlay"
 */
export function BlurOverlay({ 
  children, 
  className, 
  intensity = 'medium' 
}: BlurOverlayProps) {
  const intensities = {
    light: 'backdrop-blur-sm',
    medium: 'backdrop-blur-md',
    heavy: 'backdrop-blur-xl',
  };

  return (
    <div className={cn('relative', className)}>
      <div className={cn('absolute inset-0 bg-background/80', intensities[intensity])} />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

interface HeroBlurProps {
  imageUrl?: string;
  children: ReactNode;
  className?: string;
}

/**
 * Hero with Blur Effect
 * brand.md example: "Lorem ipsum dolor sit amet over a softly blurred background"
 */
export function HeroBlur({ 
  imageUrl, 
  children, 
  className 
}: HeroBlurProps) {
  return (
    <div className={cn('relative overflow-hidden rounded-xl', className)}>
      {imageUrl && (
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${imageUrl})` }}
        >
          <div className="absolute inset-0 backdrop-blur-md bg-background/60" />
        </div>
      )}
      {!imageUrl && (
        <div className="absolute inset-0 gradient-sphere-subtle" />
      )}
      <div className="relative z-10 p-8">{children}</div>
    </div>
  );
}
