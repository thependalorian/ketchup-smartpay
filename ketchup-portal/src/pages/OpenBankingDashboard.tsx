/**
 * Open Banking Dashboard - Ketchup Portal
 * Purpose: Hub for Open Banking (Accounts, Payments, Consents)
 * Location: apps/ketchup-portal/src/pages/OpenBankingDashboard.tsx
 */

import { Link } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Card, Button } from '@smartpay/ui';

const OpenBankingDashboard = () => {
  const sections = [
    {
      title: 'Accounts',
      description: 'View and manage connected bank accounts (AIS). Link new accounts and see balances.',
      path: '/open-banking/accounts',
      label: 'View accounts',
    },
    {
      title: 'Payments',
      description: 'Initiate payments (PIS) and view recent payment activity.',
      path: '/open-banking/payments',
      label: 'Go to payments',
    },
    {
      title: 'Consents',
      description: 'Manage Open Banking consents and authorization status.',
      path: '/open-banking/consents',
      label: 'Manage consents',
    },
  ];

  return (
    <Layout title="Open Banking" subtitle="Banking dashboard">
      <div className="space-y-6">
        <p className="text-muted-foreground">
          Use Open Banking to link bank accounts (AIS), initiate payments (PIS), and manage consents.
        </p>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sections.map((s) => (
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

export default OpenBankingDashboard;
