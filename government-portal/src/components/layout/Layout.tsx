/**
 * Layout Component - Government Portal
 * 
 * Purpose: Main layout wrapper with sidebar and header
 * Mobile responsive with collapsible sidebar and hamburger menu
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
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      {/* Main content area - responsive margins */}
      <div className="flex flex-1 flex-col lg:ml-[260px] min-h-screen transition-all duration-300">
        <Header title={title} subtitle={subtitle} />
        <main className="flex-1 p-4 md:p-6 lg:p-6">
          {/* Read-only indicator - Ketchup brand styling */}
          <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-primary"></div>
            <span>Government Oversight Portal - Read-Only Access</span>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
