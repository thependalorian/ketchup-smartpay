/**
 * Help Page - Ketchup Portal
 * Purpose: Help center, documentation links, and support
 * Location: apps/ketchup-portal/src/pages/Help.tsx
 */

import { Link } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Card, Button } from '@smartpay/ui';

const quickLinks = [
  { title: 'Reconciliation', path: '/reconciliation', description: 'Run and view voucher reconciliation.' },
  { title: 'Analytics', path: '/analytics', description: 'Monthly trend and redemption channel data.' },
  { title: 'Reports', path: '/reports', description: 'Reports hub and export options.' },
  { title: 'Status monitor', path: '/status-monitor', description: 'Voucher status events and history.' },
  { title: 'Webhooks', path: '/webhooks', description: 'Webhook delivery and retry monitoring.' },
];

const Help = () => {
  return (
    <Layout title="Help" subtitle="Help and documentation">
      <div className="space-y-6">
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-2">Quick links</h3>
          <p className="text-sm text-muted-foreground mb-4">Jump to key portal sections.</p>
          <ul className="space-y-2">
            {quickLinks.map((item) => (
              <li key={item.path}>
                <Link to={item.path} className="text-primary hover:underline font-medium">
                  {item.title}
                </Link>
                <span className="text-muted-foreground text-sm ml-2">— {item.description}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-2">Frequently asked questions</h3>
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="font-medium text-foreground">How do I run reconciliation?</dt>
              <dd className="text-muted-foreground mt-1">
                Go to <Link to="/reconciliation" className="text-primary hover:underline">Reconciliation</Link>, pick a date, and click Run reconciliation. View records and filter by match status.
              </dd>
            </div>
            <div>
              <dt className="font-medium text-foreground">Where can I see voucher analytics?</dt>
              <dd className="text-muted-foreground mt-1">
                <Link to="/analytics" className="text-primary hover:underline">Analytics</Link> shows monthly trend and redemption channels.
              </dd>
            </div>
            <div>
              <dt className="font-medium text-foreground">How do I distribute vouchers in batch?</dt>
              <dd className="text-muted-foreground mt-1">
                Use <Link to="/batch-distribution" className="text-primary hover:underline">Batch distribution</Link> to paste voucher IDs or issue a single voucher.
              </dd>
            </div>
            <div>
              <dt className="font-medium text-foreground">Who do I contact for support?</dt>
              <dd className="text-muted-foreground mt-1">
                Contact your SmartPay / Ketchup administrator for API keys, webhook configuration, and platform support.
              </dd>
            </div>
          </dl>
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-2">Settings</h3>
          <p className="text-sm text-muted-foreground mb-4">Configure API base URL and other options.</p>
          <Button asChild variant="outline" size="sm">
            <Link to="/settings">Open settings</Link>
          </Button>
        </Card>
      </div>
    </Layout>
  );
};

export default Help;
