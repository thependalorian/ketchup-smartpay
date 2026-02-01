/**
 * Dashboard Page - Ketchup Portal
 *
 * Purpose: Main dashboard showing real-time metrics, adoption and training metrics (PRD GTM)
 * Location: apps/ketchup-portal/src/pages/Dashboard.tsx
 */

import { Layout } from '../components/layout/Layout';
import { MetricCard } from '@smartpay/ui';
import { Users, Ticket, BadgeDollarSign, Building2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { dashboardAPI } from '@smartpay/api-client/ketchup';

// Import dashboard components
import { MonthlyTrendChart } from '../components/dashboard/MonthlyTrendChart';
import { VoucherStatusChart } from '../components/dashboard/VoucherStatusChart';
import { RegionalMap } from '../components/dashboard/RegionalMap';
import { RecentVouchers } from '../components/dashboard/RecentVouchers';
import { AgentNetworkHealth } from '../components/dashboard/AgentNetworkHealth';
import { LiveActivityFeed } from '../components/dashboard/LiveActivityFeed';
import { RequiresAttentionAlerts } from '../components/dashboard/RequiresAttentionAlerts';

const Dashboard = () => {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: () => dashboardAPI.getMetrics(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  return (
    <Layout title="Dashboard" subtitle="Real-time operations overview">
      {/* Metrics Cards - API returns unwrapped DashboardMetrics (no .data) */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <MetricCard
          title="Total Beneficiaries"
          value={metrics?.totalBeneficiaries ?? 0}
          icon={Users}
          trend={+5.2}
          loading={isLoading}
        />
        <MetricCard
          title="Vouchers Distributed"
          value={metrics?.totalVouchersIssued ?? 0}
          icon={Ticket}
          trend={+12.8}
          loading={isLoading}
        />
        <MetricCard
          title="Total Amount"
          value={`N$${(metrics?.totalDisbursement ?? 0).toLocaleString()}`}
          icon={BadgeDollarSign}
          trend={+8.3}
          loading={isLoading}
        />
        <MetricCard
          title="Active Agents"
          value={metrics?.activeAgents ?? 0}
          icon={Building2}
          trend={+2.1}
          loading={isLoading}
        />
      </div>

      {/* Adoption & training metrics (PRD GTM) – backend can expose digitalAdoptionRate, trainingCompletionRate */}
      {(metrics as Record<string, unknown>)?.digitalAdoptionRate != null && (
        <div className="grid gap-4 md:grid-cols-2 mb-4">
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Digital adoption rate</p>
            <p className="text-2xl font-semibold">{Number((metrics as Record<string, unknown>).digitalAdoptionRate).toFixed(1)}%</p>
          </div>
        </div>
      )}

      {/* Requires Attention (failed, expired, expiring soon) */}
      <RequiresAttentionAlerts />

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <MonthlyTrendChart />
        <VoucherStatusChart />
      </div>

      {/* Map and Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <RegionalMap />
        <RecentVouchers />
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 md:grid-cols-2">
        <AgentNetworkHealth />
        <LiveActivityFeed />
      </div>
    </Layout>
  );
};

export default Dashboard;
