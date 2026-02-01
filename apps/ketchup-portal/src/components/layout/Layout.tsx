/**
 * Layout Component
 * 
 * Purpose: Main layout wrapper with sidebar and header
 * Location: apps/ketchup-portal/src/components/layout/Layout.tsx
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
          {children}
        </main>
      </div>
    </div>
  );
}
