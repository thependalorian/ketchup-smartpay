/**
 * Compliance Overview - Government Portal
 */
import { Layout } from '../components/layout/Layout';
import { Card } from '@smartpay/ui';
import { useQuery } from '@tanstack/react-query';
import { complianceAPI } from '@smartpay/api-client/government';

export default function Compliance() {
  const { data: dashboard } = useQuery({ queryKey: ['gov-compliance-dashboard'], queryFn: () => complianceAPI.getDashboard() });
  const { data: trustAccount } = useQuery({ queryKey: ['gov-compliance-trust'], queryFn: () => complianceAPI.getTrustAccountStatus() });
  const { data: incidents } = useQuery({ queryKey: ['gov-compliance-incidents'], queryFn: () => complianceAPI.getIncidents() });
  const dash = dashboard && typeof dashboard === 'object' ? (dashboard as Record<string, unknown>) : {};
  const trust = trustAccount && typeof trustAccount === 'object' ? (trustAccount as Record<string, unknown>) : {};
  const incList = Array.isArray(incidents) ? incidents : [];
  return (
    <Layout title="Compliance Overview" subtitle="PSD-1, PSD-3, PSD-12 compliance monitoring">
      <div className="space-y-6">
        {(Object.keys(dash).length > 0 || Object.keys(trust).length > 0) && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.keys(dash).length > 0 && (
              <>
                <Card className="p-4"><p className="text-sm text-muted-foreground">Compliance score</p><p className="text-2xl font-semibold">{String(dash.complianceScore ?? dash.score ?? '—')}</p></Card>
                <Card className="p-4"><p className="text-sm text-muted-foreground">Status</p><p className="text-2xl font-semibold">{String(dash.status ?? '—')}</p></Card>
              </>
            )}
            {Object.keys(trust).length > 0 && (
              <>
                <Card className="p-4"><p className="text-sm text-muted-foreground">Trust account</p><p className="text-2xl font-semibold">{String(trust.status ?? '—')}</p></Card>
                <Card className="p-4"><p className="text-sm text-muted-foreground">Coverage</p><p className="text-2xl font-semibold">{String(trust.coverage_ratio ?? '—')}</p></Card>
              </>
            )}
          </div>
        )}
        <Card className="p-6">
          <h3 className="font-semibold mb-2">Trust account status</h3>
          <p className="text-sm text-muted-foreground">
            {Object.keys(trust).length > 0 ? `Status: ${String(trust.status ?? '—')}. Coverage: ${String(trust.coverage_ratio ?? '—')}.` : 'No trust account data available. Backend may require additional routes.'}
          </p>
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold mb-2">Incidents</h3>
          {incList.length === 0 ? <p className="text-sm text-muted-foreground">No open incidents.</p> : (
            <ul className="text-sm space-y-2">
              {(incList as Record<string, unknown>[]).slice(0, 10).map((inc: Record<string, unknown>, i: number) => (
                <li key={i}>{String(inc.title ?? inc.type ?? inc.id ?? 'Incident')} — {String(inc.status ?? '—')}</li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </Layout>
  );
}
