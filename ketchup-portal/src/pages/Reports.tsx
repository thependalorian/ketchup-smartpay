/**
 * Reports Page - Ketchup Portal
 * Purpose: Hub for reconciliation and analytics reports
 * Location: apps/ketchup-portal/src/pages/Reports.tsx
 */

import { Link } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Card, Button } from '@smartpay/ui';

const Reports = () => {
  const reportSections = [
    {
      title: 'Reconciliation report',
      description: 'Run reconciliation for a date and view match/discrepancy records. Filter by status and export data.',
      path: '/reconciliation',
      label: 'Open reconciliation',
    },
    {
      title: 'Analytics report',
      description: 'Monthly voucher trend (issued, redeemed, expired) and redemption channel breakdown.',
      path: '/analytics',
      label: 'Open analytics',
    },
    {
      title: 'Regional stats',
      description: 'Voucher and agent statistics by region.',
      path: '/regions',
      label: 'View regions',
    },
  ];

  return (
    <Layout title="Reports" subtitle="Generate and view reports">
      <div className="space-y-6">
        <p className="text-muted-foreground">
          Use the sections below to access reconciliation, analytics, and regional reports.
        </p>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reportSections.map((s) => (
            <Card key={s.path} className="p-6 flex flex-col">
              <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground flex-1 mb-4">{s.description}</p>
              <Button asChild variant="outline" size="sm" className="w-fit">
                <Link to={s.path}>{s.label}</Link>
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Reports;
