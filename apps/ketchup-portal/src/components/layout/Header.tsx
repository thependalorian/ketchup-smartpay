/**
 * Ketchup Header Component
 *
 * Purpose: Top navigation bar for Ketchup portal; notifications icon links to /notifications.
 * Location: apps/ketchup-portal/src/components/layout/Header.tsx
 */

import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Bell, Search, User } from 'lucide-react';
import { Button } from '@smartpay/ui';
import { useQuery } from '@tanstack/react-query';
import { notificationsAPI } from '@smartpay/api-client/ketchup';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { data: unreadCount } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: () => notificationsAPI.getUnreadCount(),
    staleTime: 60 * 1000,
  });
  const badgeCount = typeof unreadCount === 'number' ? unreadCount : 0;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/80 px-6 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="font-display text-xl font-semibold text-foreground">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </motion.div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search beneficiaries, vouchers..."
            className="h-10 w-64 rounded-lg border bg-muted/50 pl-10 pr-4 text-sm transition-all placeholder:text-muted-foreground focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Notifications – navigates to /notifications */}
        <Button variant="ghost" size="icon" className="relative" asChild>
          <Link to="/notifications" aria-label="View notifications">
            <Bell className="h-5 w-5" />
            {badgeCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {badgeCount > 99 ? '99+' : badgeCount}
              </span>
            )}
          </Link>
        </Button>

        {/* User Menu */}
        <div className="flex items-center gap-3 border-l pl-4">
          <div className="hidden text-right md:block">
            <p className="text-sm font-medium">Ketchup Solutions</p>
            <p className="text-xs text-muted-foreground">Voucher Operations</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
            <User className="h-5 w-5 text-primary-foreground" />
          </div>
        </div>
      </div>
    </header>
  );
}
