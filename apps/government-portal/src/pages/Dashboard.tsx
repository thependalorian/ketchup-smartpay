/**
 * Dashboard - Government Portal
 *
 * Purpose: Ministry of Finance oversight dashboard with real-time compliance, uptime, and incidents from API.
 * Location: apps/government-portal/src/pages/Dashboard.tsx
 */
import { Link } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { MetricCard, Card, Button } from '@smartpay/ui';
import { Shield, CheckCircle2, AlertTriangle, TrendingUp, Eye, Users, FileText, MapPin } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { complianceAPI } from '@smartpay/api-client/government';

const Dashboard = () => {
  const { data: dashboard, isLoading: loadingDashboard } = useQuery({
    queryKey: ['gov-dashboard-compliance'],
    queryFn: () => complianceAPI.getDashboard(),
  });
  const { data: uptime, isLoading: loadingUptime } = useQuery({
    queryKey: ['gov-dashboard-uptime'],
    queryFn: () => complianceAPI.getSystemUptime(),
  });
  const { data: incidents = [], isLoading: loadingIncidents } = useQuery({
    queryKey: ['gov-dashboard-incidents'],
    queryFn: () => complianceAPI.getIncidents(),
  });

  const dash = dashboard && typeof dashboard === 'object' ? (dashboard as Record<string, unknown>) : {};
  const overallScore = dash.overallComplianceScore != null ? Number(dash.overallComplianceScore).toFixed(1) : null;
  const overallStatus = (dash.overallStatus as string) ?? '—';
  const uptimeObj = uptime && typeof uptime === 'object' ? (uptime as Record<string, unknown>) : {};
  const uptimePct =
    uptimeObj.uptimePercentage != null
      ? Number(uptimeObj.uptimePercentage).toFixed(2)
      : uptimeObj.overallUptimePercent != null
        ? Number(uptimeObj.overallUptimePercent).toFixed(2)
        : Array.isArray(uptimeObj.services) && (uptimeObj.services as unknown[]).length > 0
          ? (
              (uptimeObj.services as Array<{ availabilityPercentage?: number }>).reduce(
                (sum, s) => sum + (Number(s?.availabilityPercentage) || 0),
                0
              ) / (uptimeObj.services as unknown[]).length
            ).toFixed(2)
          : null;
  const openIncidents = Array.isArray(incidents) ? incidents.length : 0;
  const isLoading = loadingDashboard || loadingUptime || loadingIncidents;

  return (
    <Layout title="Government Dashboard" subtitle="Ministry of Finance oversight portal">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <MetricCard
          title="Compliance Score"
          value={isLoading ? '—' : overallScore != null ? `${overallScore}%` : '—'}
          icon={Shield}
          trend={overallScore != null ? (overallStatus === 'FULLY COMPLIANT' ? 0 : -1) : 0}
          loading={loadingDashboard}
        />
        <MetricCard
          title="PSD Status"
          value={isLoading ? '—' : overallStatus === 'FULLY COMPLIANT' ? '100%' : overallStatus}
          icon={CheckCircle2}
          trend={overallStatus === 'FULLY COMPLIANT' ? 0 : -1}
          loading={loadingDashboard}
        />
        <MetricCard
          title="Open Incidents"
          value={isLoading ? '—' : String(openIncidents)}
          icon={AlertTriangle}
          trend={0}
          loading={loadingIncidents}
        />
        <MetricCard
          title="System Uptime"
          value={isLoading ? '—' : uptimePct != null ? `${uptimePct}%` : '—'}
          icon={TrendingUp}
          trend={0}
          loading={loadingUptime}
        />
      </div>
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Quick access</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Button asChild variant="outline" size="sm" className="justify-start"><Link to="/compliance"><Shield className="h-4 w-4 mr-2" /> Compliance</Link></Button>
          <Button asChild variant="outline" size="sm" className="justify-start"><Link to="/vouchers"><Eye className="h-4 w-4 mr-2" /> Voucher monitoring</Link></Button>
          <Button asChild variant="outline" size="sm" className="justify-start"><Link to="/beneficiaries"><Users className="h-4 w-4 mr-2" /> Beneficiary registry</Link></Button>
          <Button asChild variant="outline" size="sm" className="justify-start"><Link to="/audit"><FileText className="h-4 w-4 mr-2" /> Audit reports</Link></Button>
          <Button asChild variant="outline" size="sm" className="justify-start"><Link to="/analytics"><TrendingUp className="h-4 w-4 mr-2" /> Financial analytics</Link></Button>
          <Button asChild variant="outline" size="sm" className="justify-start"><Link to="/regions"><MapPin className="h-4 w-4 mr-2" /> Regional performance</Link></Button>
        </div>
      </Card>
    </Layout>
  );
};
export default Dashboard;
