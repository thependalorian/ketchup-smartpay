/**
 * Settings Page - Ketchup Portal
 * Purpose: Application and API configuration, theme toggle
 * Location: apps/ketchup-portal/src/pages/Settings.tsx
 */

import { useState, useEffect } from 'react';
import { Layout } from '../components/layout/Layout';
import { Card, Input, Label, Switch } from '@smartpay/ui';

const API_BASE = import.meta.env.VITE_API_URL ?? '';
const THEME_KEY = 'ketchup-portal-theme';

const Settings = () => {
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
    <Layout title="Settings" subtitle="Application settings">
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
          <p className="text-sm text-muted-foreground mb-4">
            Base URL used by the portal to call the Ketchup SmartPay API. Set via VITE_API_URL at build time.
          </p>
          <Input
            readOnly
            value={API_BASE || '(not set)'}
            className="font-mono text-sm bg-muted/50"
          />
          {!API_BASE && (
            <p className="text-xs text-muted-foreground mt-2">
              Configure VITE_API_URL in .env for local development (e.g. http://localhost:3001).
            </p>
          )}
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-2">Portal info</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>Ketchup Portal – operator dashboard for voucher distribution and monitoring.</li>
            <li>Use Beneficiaries, Vouchers, Agents, and Batch distribution for day-to-day operations.</li>
            <li>Reconciliation, Webhooks, and Reports are available from the sidebar.</li>
          </ul>
        </Card>
      </div>
    </Layout>
  );
};

export default Settings;
