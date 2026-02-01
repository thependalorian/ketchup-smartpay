/**
 * Settings - Government Portal
 */
import { useState, useEffect } from 'react';
import { Layout } from '../components/layout/Layout';
import { Card, Input, Label, Switch } from '@smartpay/ui';

const API_BASE = import.meta.env.VITE_API_URL ?? '';
const THEME_KEY = 'government-portal-theme';

export default function Settings() {
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(THEME_KEY) === 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
      localStorage.setItem(THEME_KEY, 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem(THEME_KEY, 'light');
    }
  }, [dark]);

  return (
    <Layout title="Settings" subtitle="Portal settings and preferences">
      <div className="space-y-6 max-w-xl">
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-2">Appearance</h3>
          <div className="flex items-center justify-between">
            <Label htmlFor="theme" className="text-sm text-muted-foreground">Dark mode</Label>
            <Switch id="theme" checked={dark} onCheckedChange={setDark} />
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-2">API configuration</h3>
          <p className="text-sm text-muted-foreground mb-4">Base URL for Government API. Set via VITE_API_URL at build time.</p>
          <Input readOnly value={API_BASE || '(not set)'} className="font-mono text-sm bg-muted/50" />
          {!API_BASE && <p className="text-xs text-muted-foreground mt-2">Configure VITE_API_URL in .env for local development.</p>}
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-2">Portal info</h3>
          <p className="text-sm text-muted-foreground">Government oversight portal for compliance, monitoring, audit, and analytics. Read-only access to beneficiary registry, voucher stats, agent network, and regional performance.</p>
        </Card>
      </div>
    </Layout>
  );
}
