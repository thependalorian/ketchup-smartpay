/**
 * Government Sidebar Component
 * 
 * Purpose: Navigation sidebar for Government oversight portal with mobile responsive design
 * Location: apps/government-portal/src/components/layout/Sidebar.tsx
 */

import { cn } from '@smartpay/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Shield,
  Eye,
  Users,
  ClipboardCheck,
  TrendingUp,
  Building2,
  MapPin,
  FileText,
  Settings,
  HelpCircle,
  ChevronLeft,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
  badge?: number;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/' },
  { label: 'Compliance Overview', icon: Shield, href: '/compliance' },
  { label: 'Voucher Monitoring', icon: Eye, href: '/vouchers' },
  { label: 'Beneficiary Registry', icon: Users, href: '/beneficiaries' },
  { label: 'Audit Reports', icon: ClipboardCheck, href: '/audit' },
  { label: 'Financial Analytics', icon: TrendingUp, href: '/analytics' },
  { label: 'Agent Network Status', icon: Building2, href: '/agents' },
  { label: 'Regional Performance', icon: MapPin, href: '/regions' },
  { label: 'Reports', icon: FileText, href: '/reports' },
];

const bottomNavItems: NavItem[] = [
  { label: 'Settings', icon: Settings, href: '/settings' },
  { label: 'Help', icon: HelpCircle, href: '/help' },
];

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const activeItem = location.pathname;

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  // Handle escape key to close mobile sidebar
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileOpen(false);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = activeItem === item.href;
    const Icon = item.icon;

    return (
      <motion.button
        onClick={() => navigate(item.href)}
        whileHover={{ x: 4 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          'group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
          isActive
            ? 'bg-primary/10 text-primary shadow-sm border border-primary/20'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        )}
      >
        {isActive && (
          <motion.div
            layoutId="activeIndicator"
            className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary"
          />
        )}
        <Icon className={cn('h-5 w-5 shrink-0', isActive && 'text-primary')} />
        {!isCollapsed || isMobileOpen ? (
          <>
            <span className="flex-1 text-left">{item.label}</span>
            {item.badge && (
              <span className={cn(
                'rounded-full px-2 py-0.5 text-xs font-medium',
                isActive ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
              )}>
                {item.badge.toLocaleString()}
              </span>
            )}
          </>
        ) : null}
      </motion.button>
    );
  };

  // Desktop sidebar (always visible on lg screens)
  const desktopSidebar = (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 72 : 260 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={cn(
        "hidden lg:flex fixed left-0 top-0 z-40 h-screen flex-col border-r bg-card",
        isCollapsed && "items-center"
      )}
    >
      {/* Logo - Ketchup / Government SmartPay branding */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!isCollapsed ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2"
          >
            <div className="relative">
              <img
                src="/ketchup-logo.png"
                alt="Ketchup SmartPay"
                className="h-9 w-9 shrink-0 rounded-lg object-contain bg-background"
              />
            </div>
            <div>
              <p className="font-display font-semibold text-foreground">SmartPay</p>
              <p className="text-[10px] text-muted-foreground">Government Portal</p>
            </div>
          </motion.div>
        ) : (
          <div className="relative mx-auto">
            <img
              src="/ketchup-logo.png"
              alt="Ketchup SmartPay"
              className="h-9 w-9 shrink-0 rounded-lg object-contain bg-background"
            />
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft className={cn('h-4 w-4 transition-transform', isCollapsed && 'rotate-180')} />
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </nav>

      {/* Bottom Navigation */}
      <div className="border-t p-3">
        <div className="space-y-1">
          {bottomNavItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </div>
        <div className="mt-3 border-t pt-3">
          <button className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
            <LogOut className="h-5 w-5 shrink-0" />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </div>
    </motion.aside>
  );

  // Mobile sidebar (slide-in drawer)
  const mobileSidebar = (
    <AnimatePresence>
      {isMobileOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
          
          {/* Mobile drawer */}
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 z-50 h-screen w-[280px] flex-col border-r bg-card lg:hidden"
          >
            {/* Mobile header with close button */}
            <div className="flex h-16 items-center justify-between border-b px-4">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <img
                    src="/ketchup-logo.png"
                    alt="Ketchup SmartPay"
                    className="h-9 w-9 shrink-0 rounded-lg object-contain bg-background"
                  />
                </div>
                <div>
                  <p className="font-display font-semibold text-foreground">SmartPay</p>
                  <p className="text-[10px] text-muted-foreground">Government Portal</p>
                </div>
              </div>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Main Navigation */}
            <nav className="flex-1 space-y-1 overflow-y-auto p-3">
              {navItems.map((item) => (
                <NavLink key={item.href} item={item} />
              ))}
            </nav>

            {/* Bottom Navigation */}
            <div className="border-t p-3">
              <div className="space-y-1">
                {bottomNavItems.map((item) => (
                  <NavLink key={item.href} item={item} />
                ))}
              </div>
              <div className="mt-3 border-t pt-3">
                <button className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
                  <LogOut className="h-5 w-5 shrink-0" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );

  // Mobile hamburger button (visible only on small screens)
  const mobileToggleButton = (
    <button
      onClick={() => setIsMobileOpen(true)}
      className="fixed bottom-4 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg lg:hidden"
      aria-label="Open menu"
    >
      <Menu className="h-6 w-6" />
    </button>
  );

  return (
    <>
      {desktopSidebar}
      {mobileSidebar}
      {mobileToggleButton}
    </>
  );
}
