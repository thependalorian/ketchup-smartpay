/**
 * Enhanced Entity Cards for Drivers, Vehicles, and Other Entities
 * Visual cards for better UI/UX
 */

import { cn } from '../lib/utils';
import { motion } from 'framer-motion';
import { 
  LucideIcon, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar, 
  Clock,
  Shield,
  Star,
  Fuel,
  Settings,
  User,
  Truck,
  CreditCard
} from 'lucide-react';
import { ReactNode } from 'react';

// ==================== Driver Card ====================

interface DriverCardProps {
  name: string;
  photo?: string;
  phone: string;
  email?: string;
  region: string;
  status: 'active' | 'inactive' | 'on-trip' | 'offline';
  rating?: number;
  tripsCompleted?: number;
  joinedDate?: string;
  licenseNumber?: string;
  vehicle?: string;
  onClick?: () => void;
  className?: string;
}

export function DriverCard({
  name,
  photo,
  phone,
  email,
  region,
  status,
  rating = 0,
  tripsCompleted = 0,
  joinedDate,
  licenseNumber,
  vehicle,
  onClick,
  className,
}: DriverCardProps) {
  const statusColors = {
    active: 'bg-success/10 text-success border-success/30',
    inactive: 'bg-muted text-muted-foreground border-border',
    'on-trip': 'bg-primary/10 text-primary border-primary/30',
    offline: 'bg-warning/10 text-warning border-warning/30',
  };

  const statusLabels = {
    active: 'Active',
    inactive: 'Inactive',
    'on-trip': 'On Trip',
    offline: 'Offline',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      onClick={onClick}
      className={cn(
        'rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-lg cursor-pointer',
        className
      )}
    >
      {/* Header with Avatar */}
      <div className="flex items-start gap-4 mb-4">
        <div className="relative">
          {photo ? (
            <img 
              src={photo} 
              alt={name}
              className="h-14 w-14 rounded-full object-cover ring-2 ring-primary/20" 
            />
          ) : (
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-7 w-7 text-primary" />
            </div>
          )}
          <span className={cn(
            'absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-card',
            status === 'active' && 'bg-success',
            status === 'inactive' && 'bg-muted-foreground',
            status === 'on-trip' && 'bg-primary',
            status === 'offline' && 'bg-warning',
          )} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">{name}</h3>
          <p className="text-sm text-muted-foreground truncate">{region}</p>
          <span className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border mt-1',
            statusColors[status]
          )}>
            {statusLabels[status]}
          </span>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <span className="truncate">{phone}</span>
        </div>
        {email && (
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="truncate">{email}</span>
          </div>
        )}
        {licenseNumber && (
          <div className="flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span className="truncate">{licenseNumber}</span>
          </div>
        )}
        {vehicle && (
          <div className="flex items-center gap-2 text-sm">
            <Truck className="h-4 w-4 text-muted-foreground" />
            <span className="truncate">{vehicle}</span>
          </div>
        )}
      </div>

      {/* Stats Footer */}
      <div className="flex items-center justify-between pt-4 border-t">
        {rating > 0 && (
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
            <span className="text-sm font-medium">{rating.toFixed(1)}</span>
          </div>
        )}
        {tripsCompleted > 0 && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{tripsCompleted} trips</span>
          </div>
        )}
        {joinedDate && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{joinedDate}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ==================== Vehicle Card ====================

interface VehicleCardProps {
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  color?: string;
  type?: 'sedan' | 'suv' | 'truck' | 'van' | 'motorcycle';
  status: 'active' | 'maintenance' | 'inactive';
  fuelLevel?: number;
  mileage?: number;
  lastService?: string;
  insuranceExpiry?: string;
  image?: string;
  onClick?: () => void;
  className?: string;
}

export function VehicleCard({
  make,
  model,
  year,
  licensePlate,
  color,
  type = 'sedan',
  status,
  fuelLevel,
  mileage,
  lastService,
  insuranceExpiry,
  image,
  onClick,
  className,
}: VehicleCardProps) {
  const statusColors = {
    active: 'bg-success/10 text-success border-success/30',
    maintenance: 'bg-warning/10 text-warning border-warning/30',
    inactive: 'bg-muted text-muted-foreground border-border',
  };

  const statusLabels = {
    active: 'Active',
    maintenance: 'Maintenance',
    inactive: 'Inactive',
  };

  const vehicleIcons = {
    sedan: '🚗',
    suv: '🚙',
    truck: '🛻',
    van: '🚐',
    motorcycle: '🏍️',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      onClick={onClick}
      className={cn(
        'rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-lg cursor-pointer',
        className
      )}
    >
      {/* Header with Image */}
      <div className="flex items-start gap-4 mb-4">
        {image ? (
          <img 
            src={image} 
            alt={`${make} ${model}`}
            className="h-16 w-16 rounded-lg object-cover ring-2 ring-primary/20" 
          />
        ) : (
          <div className="h-16 w-16 rounded-lg bg-gradient-sphere-subtle flex items-center justify-center text-3xl">
            {vehicleIcons[type]}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground">{make} {model}</h3>
          <p className="text-sm text-muted-foreground">{year}</p>
          <p className="text-lg font-mono font-medium text-primary">{licensePlate}</p>
          <span className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border mt-1',
            statusColors[status]
          )}>
            {statusLabels[status]}
          </span>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {color && (
          <div className="flex items-center gap-2 text-sm">
            <div className="h-4 w-4 rounded-full border" style={{ backgroundColor: color }} />
            <span className="capitalize">{color}</span>
          </div>
        )}
        {fuelLevel !== undefined && (
          <div className="flex items-center gap-2 text-sm">
            <Fuel className="h-4 w-4 text-muted-foreground" />
            <span>{fuelLevel}%</span>
          </div>
        )}
        {mileage !== undefined && (
          <div className="flex items-center gap-2 text-sm">
            <Settings className="h-4 w-4 text-muted-foreground" />
            <span>{mileage.toLocaleString()} km</span>
          </div>
        )}
        {lastService && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{lastService}</span>
          </div>
        )}
      </div>

      {/* Insurance Badge */}
      {insuranceExpiry && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-sm">
          <Shield className="h-4 w-4 text-primary" />
          <span className="text-muted-foreground">Insurance:</span>
          <span className="font-medium">{insuranceExpiry}</span>
        </div>
      )}
    </motion.div>
  );
}

// ==================== Generic Entity Card ====================

interface EntityCardProps {
  title: string;
  subtitle?: string;
  description?: string;
  icon: LucideIcon;
  iconVariant?: 'primary' | 'accent' | 'ketchup' | 'success' | 'warning';
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'success' | 'warning' | 'ketchup';
  stats?: { label: string; value: string | number }[];
  actions?: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function EntityCard({
  title,
  subtitle,
  description,
  icon: Icon,
  iconVariant = 'primary',
  badge,
  badgeVariant = 'default',
  stats,
  actions,
  onClick,
  className,
}: EntityCardProps) {
  const iconVariants = {
    primary: 'bg-primary/10 text-primary',
    accent: 'bg-accent/10 text-accent',
    ketchup: 'gradient-sphere-subtle text-foreground',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className={cn(
        'rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-md cursor-pointer',
        className
      )}
    >
      <div className="flex items-start gap-4">
        <div className={cn('p-3 rounded-lg', iconVariants[iconVariant])}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground truncate">{title}</h3>
            {badge && (
              <span className={cn(
                'px-2 py-0.5 rounded-full text-xs font-medium',
                badgeVariant === 'ketchup' && 'bg-primary/10 text-primary border-primary/20',
                badgeVariant === 'success' && 'bg-success/10 text-success',
                badgeVariant === 'warning' && 'bg-warning/10 text-warning',
                badgeVariant === 'default' && 'bg-muted text-muted-foreground',
              )}>
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
          {description && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{description}</p>
          )}
        </div>
      </div>

      {/* Stats */}
      {stats && stats.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <p className="text-lg font-semibold font-display">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      {actions && (
        <div className="flex items-center gap-2 mt-4 pt-4 border-t">
          {actions}
        </div>
      )}
    </motion.div>
  );
}

// ==================== Card Grid Container ====================

interface CardGridProps {
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function CardGrid({ 
  children, 
  columns = 3, 
  gap = 'md',
  className 
}: CardGridProps) {
  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  const gapClasses = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
  };

  return (
    <div className={cn('grid', columnClasses[columns], gapClasses[gap], className)}>
      {children}
    </div>
  );
}
