/**
 * Help & Documentation - Government Portal
 * Purpose: Quick links and FAQ for oversight users
 * Location: apps/government-portal/src/pages/Help.tsx
 */

import { Layout } from '../components/layout/Layout';
import { Card } from '@smartpay/ui';
import { Link } from 'react-router-dom';
import {
  Shield,
  Eye,
  Users,
  ClipboardCheck,
  TrendingUp,
  Building2,
  MapPin,
  FileText,
  HelpCircle,
} from 'lucide-react';

const quickLinks = [
  { to: '/compliance', label: 'Compliance Overview', icon: Shield },
  { to: '/vouchers', label: 'Voucher Monitoring', icon: Eye },
  { to: '/beneficiaries', label: 'Beneficiary Registry', icon: Users },
  { to: '/audit', label: 'Audit Reports', icon: ClipboardCheck },
  { to: '/analytics', label: 'Financial Analytics', icon: TrendingUp },
  { to: '/agents', label: 'Agent Network Status', icon: Building2 },
  { to: '/regions', label: 'Regional Performance', icon: MapPin },
  { to: '/reports', label: 'Reports', icon: FileText },
];

const faqs = [
  {
    q: 'How do I view voucher distribution by region?',
    a: 'Go to Regional Performance to see totals by region, redemption rates, and export CSV.',
  },
  {
    q: 'Where do I check compliance and trust account status?',
    a: 'Use the Compliance Overview page for compliance score, trust account status, and open incidents.',
  },
  {
    q: 'How can I export data for reporting?',
    a: 'Regional Performance and Financial Analytics pages have Export CSV buttons. Audit and Reports list historical reports.',
  },
];

export default function Help() {
  return (
    <Layout title="Help & Documentation" subtitle="Government portal help center">
      <div className="space-y-6">
        <Card className="p-6">
          <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4">
            <HelpCircle className="h-5 w-5" />
            Quick links
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {quickLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-2 rounded-lg border p-3 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
              >
                <Icon className="h-4 w-4 text-muted-foreground" />
                {label}
              </Link>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-foreground mb-4">Frequently asked questions</h3>
          <ul className="space-y-4">
            {faqs.map(({ q, a }, i) => (
              <li key={i}>
                <p className="font-medium text-foreground">{q}</p>
                <p className="text-sm text-muted-foreground mt-1">{a}</p>
              </li>
            ))}
          </ul>
        </Card>

        <p className="text-sm text-muted-foreground">
          For API and configuration, see <Link to="/settings" className="text-primary hover:underline">Settings</Link>.
        </p>
      </div>
    </Layout>
  );
}
