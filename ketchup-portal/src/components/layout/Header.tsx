/**
 * Ketchup Header Component
 *
 * Purpose: Top navigation bar for Ketchup portal with mobile responsive design
 * Location: apps/ketchup-portal/src/components/layout/Header.tsx
 */

import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Bell, Search, User, Menu } from 'lucide-react';
import { Button } from '@smartpay/ui';
import { useQuery } from '@tanstack/react-query';
import { notificationsAPI } from '@smartpay/api-client/ketchup';
import { useState } from 'react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onMenuClick?: () => void;
}

export function Header({ title, subtitle, onMenuClick }: HeaderProps) {
  const { data: unreadCount } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: () => notificationsAPI.getUnreadCount(),
    staleTime: 60 * 1000,
  });
  const badgeCount = typeof unreadCount === 'number' ? unreadCount : 0;

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/95 px-4 md:px-6 backdrop-blur-sm shadow-sm">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center gap-3"
      >
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        
        <div>
          <h1 className="font-display text-lg md:text-xl font-semibold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">{subtitle}</p>}
        </div>
      </motion.div>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Search - hidden on mobile, visible on md and up */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            className="h-10 w-48 lg:w-64 rounded-lg border bg-muted/50 pl-10 pr-4 text-sm transition-all placeholder:text-muted-foreground focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Mobile search button */}
        <Button variant="ghost" size="icon" className="md:hidden h-9 w-9">
          <Search className="h-5 w-5" />
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative h-9 w-9 md:h-10 md:w-10" asChild>
          <Link to="/notifications" aria-label="View notifications">
            <Bell className="h-5 w-5" />
            {badgeCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {badgeCount > 99 ? '99+' : badgeCount}
              </span>
            )}
          </Link>
        </Button>

        {/* User Menu - hidden on mobile, visible on md and up */}
        <div className="hidden md:flex items-center gap-3 border-l pl-4">
          <div className="text-right">
            <p className="text-sm font-medium">Ketchup Solutions</p>
            <p className="text-xs text-muted-foreground">Voucher Operations</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
            <User className="h-5 w-5 text-primary-foreground" />
          </div>
        </div>

        {/* Mobile user avatar */}
        <div className="md:hidden flex h-9 w-9 items-center justify-center rounded-full bg-primary">
          <User className="h-5 w-5 text-primary-foreground" />
        </div>
      </div>
    </header>
  );
}
