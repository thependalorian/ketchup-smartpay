/**
 * Layout Component - Government Portal
 * 
 * Purpose: Main layout wrapper with sidebar and header
 * Location: apps/government-portal/src/components/layout/Layout.tsx
 */

import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface LayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function Layout({ children, title, subtitle }: LayoutProps) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 overflow-auto" style={{ marginLeft: '260px' }}>
        <Header title={title} subtitle={subtitle} />
        <main className="p-6">
          {/* Read-only indicator */}
          <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-blue-500"></div>
            <span>Government Oversight Portal - Read-Only Access</span>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
