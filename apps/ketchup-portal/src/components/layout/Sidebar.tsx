/**
 * Ketchup Sidebar Component
 * 
 * Purpose: Navigation sidebar for Ketchup portal with mobile responsive hamburger menu
 * Location: apps/ketchup-portal/src/components/layout/Sidebar.tsx
 */

import { cn } from '@smartpay/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Ticket,
  Building2,
  MapPin,
  BarChart3,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Webhook,
  RefreshCw,
  Send,
  Activity,
  FileText,
  Shield,
  Wallet,
  Link2,
  Lock,
  Map,
  Truck,
  CreditCard,
  Monitor,
  Gauge,
  ScrollText,
  Landmark,
  ClipboardCheck,
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
  isSection?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/' },
  { label: 'Beneficiaries', icon: Users, href: '/beneficiaries' },
  { label: 'Vouchers', icon: Ticket, href: '/vouchers' },
  { label: 'Batch Distribution', icon: Send, href: '/batch-distribution' },
  { label: 'Status Monitor', icon: Activity, href: '/status-monitor' },
  { label: 'Webhook Monitoring', icon: Webhook, href: '/webhooks' },
  { label: 'Reconciliation', icon: RefreshCw, href: '/reconciliation' },
  { label: 'Agent Network', icon: Building2, href: '/agents' },
  { label: 'SmartPay Mobile', icon: Truck, href: '/mobile-units' },
  { label: 'ATM Management', icon: CreditCard, href: '/atms' },
  { label: 'POS Terminals', icon: Monitor, href: '/pos-terminals' },
  { label: 'Network Map', icon: Map, href: '/map' },
  { label: 'Regions', icon: MapPin, href: '/regions' },
  { label: 'Analytics', icon: BarChart3, href: '/analytics' },
  { label: 'Reports', icon: FileText, href: '/reports' },
  // Admin section (moved from Buffr per PRD)
  { label: 'ADMIN', icon: Shield, href: '#', isSection: true },
  { label: 'SmartPay Monitoring', icon: Gauge, href: '/admin/smartpay-monitoring' },
  { label: 'Audit Logs', icon: ScrollText, href: '/admin/audit-logs' },
  { label: 'Trust Account', icon: Landmark, href: '/admin/trust-account' },
  { label: 'Compliance Admin', icon: ClipboardCheck, href: '/admin/compliance' },
  // Open Banking section
  { label: 'OPEN BANKING', icon: Shield, href: '#', isSection: true },
  { label: 'Banking Dashboard', icon: Wallet, href: '/open-banking' },
  { label: 'My Accounts', icon: Link2, href: '/open-banking/accounts' },
  { label: 'Send Payment', icon: Send, href: '/open-banking/payments' },
  { label: 'Manage Consents', icon: Lock, href: '/open-banking/consents' },
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

    if (item.isSection) {
      if (isCollapsed && !isMobileOpen) return null;
      return (
        <div className={cn(
          "px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-4 mb-1",
          isMobileOpen && "lg:px-3"
        )}>
          {item.label}
        </div>
      );
    }

    return (
      <motion.button
        onClick={() => navigate(item.href)}
        whileHover={{ x: 4 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          'group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
          isActive
            ? 'bg-primary/10 text-primary shadow-sm'
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
                isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
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
      {/* Logo - Ketchup branding (brand.md) */}
      <div className="flex h-16 items-center justify-between border-b border-border bg-card px-4">
        {!isCollapsed ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3"
          >
            <div className="ketchup-logo-wrap shrink-0">
              <img
                src="/ketchup-logo.png"
                alt="Ketchup SmartPay"
                className="h-9 w-9 rounded-lg object-contain"
              />
            </div>
            <div>
              <p className="font-display text-sm font-semibold tracking-tight text-foreground">SmartPay</p>
              <p className="text-[10px] text-muted-foreground">Ketchup Solutions</p>
            </div>
          </motion.div>
        ) : (
          <div className="ketchup-logo-wrap mx-auto shrink-0">
            <img
              src="/ketchup-logo.png"
              alt="Ketchup SmartPay"
              className="h-9 w-9 rounded-lg object-contain"
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
        {navItems.map((item, index) => (
          <NavLink key={`${item.href}-${index}`} item={item} />
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
            <div className="flex h-16 items-center justify-between border-b border-border bg-card px-4">
              <div className="flex items-center gap-3">
                <div className="ketchup-logo-wrap shrink-0">
                  <img
                    src="/ketchup-logo.png"
                    alt="Ketchup SmartPay"
                    className="h-9 w-9 rounded-lg object-contain"
                  />
                </div>
                <div>
                  <p className="font-display text-sm font-semibold tracking-tight text-foreground">SmartPay</p>
                  <p className="text-[10px] text-muted-foreground">Ketchup Solutions</p>
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
              {navItems.map((item, index) => (
                <NavLink key={`${item.href}-${index}`} item={item} />
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
