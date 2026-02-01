/**
 * Government Header Component
 * 
 * Purpose: Top navigation bar for Government oversight portal
 * Location: apps/government-portal/src/components/layout/Header.tsx
 */

import { motion } from 'framer-motion';
import { Bell, Search, User, Shield } from 'lucide-react';
import { Button } from '@smartpay/ui';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
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
        {/* Government Badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary">
          <Shield className="h-3.5 w-3.5" />
          <span className="text-xs font-semibold">Government Portal</span>
        </div>

        {/* Search */}
        <div className="relative hidden lg:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search reports, compliance data..."
            className="h-10 w-64 rounded-lg border bg-muted/50 pl-10 pr-4 text-sm transition-all placeholder:text-muted-foreground focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
            2
          </span>
        </Button>

        {/* User Menu */}
        <div className="flex items-center gap-3 border-l pl-4">
          <div className="hidden text-right md:block">
            <p className="text-sm font-medium">Ministry of Finance</p>
            <p className="text-xs text-muted-foreground">Oversight Officer</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-primary">
            <User className="h-5 w-5 text-white" />
          </div>
        </div>
      </div>
    </header>
  );
}
