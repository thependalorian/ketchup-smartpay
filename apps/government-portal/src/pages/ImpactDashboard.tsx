/**
 * Impact Dashboard – Analytics for government and partners (PRD Section 9, G2P 4.0).
 * Location: apps/government-portal/src/pages/ImpactDashboard.tsx
 */

import { Layout } from '../components/layout/Layout';
import { Card } from '@smartpay/ui';
import { useQuery } from '@tanstack/react-query';

export default function ImpactDashboard() {
  const { data: impact } = useQuery({
    queryKey: ['gov-impact-kpis'],
    queryFn: async () => {
      const res = await fetch('/api/government/impact');
      if (!res.ok) return null;
      return res.json();
    },
  });

  const kpis = impact && typeof impact === 'object' ? (impact as Record<string, unknown>) : {};
  const inclusion = (kpis.financialInclusion as Record<string, unknown>) || {};
  const social = (kpis.socialImpact as Record<string, unknown>) || {};
  const adoption = (kpis.adoption as Record<string, unknown>) || {};

  return (
    <Layout title="Impact Dashboard" subtitle="Social impact, financial inclusion, and sustainability KPIs">
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Unbanked served</p>
            <p className="text-2xl font-semibold">{String(inclusion.unbankedServed ?? '—')}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">First-time wallet users</p>
            <p className="text-2xl font-semibold">{String(inclusion.firstTimeWalletUsers ?? '—')}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Beneficiaries reached</p>
            <p className="text-2xl font-semibold">{String(social.beneficiariesReached ?? '—')}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Rural %</p>
            <p className="text-2xl font-semibold">{social.ruralPercent != null ? `${Number(social.ruralPercent).toFixed(1)}%` : '—'}</p>
          </Card>
        </div>
        <Card className="p-6">
          <h3 className="font-semibold mb-2">Adoption & inclusion</h3>
          <p className="text-sm text-muted-foreground">
            Digital adoption: {adoption.digitalAdoptionRate != null ? `${Number(adoption.digitalAdoptionRate).toFixed(1)}%` : '—'} |
            USSD adoption: {adoption.ussdAdoptionRate != null ? `${Number(adoption.ussdAdoptionRate).toFixed(1)}%` : '—'} |
            NPS: {adoption.nps != null ? String(adoption.nps) : '—'}
          </p>
        </Card>
      </div>
    </Layout>
  );
}
