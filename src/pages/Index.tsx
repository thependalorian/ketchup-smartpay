import { motion } from 'framer-motion';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { MetricCard } from '@/components/ui/MetricCard';
import { MonthlyTrendChart } from '@/components/dashboard/MonthlyTrendChart';
import { VoucherStatusChart } from '@/components/dashboard/VoucherStatusChart';
import { RegionalMap } from '@/components/dashboard/RegionalMap';
import { RecentVouchers } from '@/components/dashboard/RecentVouchers';
import { AgentNetworkHealth } from '@/components/dashboard/AgentNetworkHealth';
import { LiveActivityFeed } from '@/components/dashboard/LiveActivityFeed';
import { generateDashboardMetrics } from '@/lib/mockData';
import {
  Users,
  Ticket,
  BadgeDollarSign,
  Building2,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react';
import { useState } from 'react';

const metrics = generateDashboardMetrics();

const formatCurrency = (amount: number) => {
  if (amount >= 1_000_000_000) {
    return `N$${(amount / 1_000_000_000).toFixed(2)}B`;
  }
  if (amount >= 1_000_000) {
    return `N$${(amount / 1_000_000).toFixed(2)}M`;
  }
  return new Intl.NumberFormat('en-NA', {
    style: 'currency',
    currency: 'NAD',
    minimumFractionDigits: 0,
  }).format(amount);
};

const Index = () => {
  const [activeNav, setActiveNav] = useState('/');

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeItem={activeNav} onNavigate={setActiveNav} />
      
      <main className="pl-[260px]">
        <Header 
          title="Dashboard" 
          subtitle="SmartPay Voucher Distribution Platform • Namibia G2P" 
        />

        <div className="p-6 space-y-6">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-2xl gradient-hero p-8 text-primary-foreground"
          >
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <span className="flex h-2 w-2 rounded-full bg-success animate-pulse" />
                <span className="text-sm font-medium text-primary-foreground/80">System Online</span>
              </div>
              <h2 className="font-display text-3xl font-bold mb-2">
                Welcome to SmartPay
              </h2>
              <p className="text-primary-foreground/80 max-w-xl">
                Managing {metrics.totalBeneficiaries.toLocaleString()} beneficiaries across Namibia's 14 regions 
                with {formatCurrency(metrics.totalDisbursement)} in total disbursements.
              </p>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-secondary/10 blur-3xl" />
            <div className="absolute -right-10 bottom-0 h-40 w-40 rounded-full bg-accent/10 blur-2xl" />
          </motion.div>

          {/* Key Metrics Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <MetricCard
              title="Total Beneficiaries"
              value={metrics.totalBeneficiaries.toLocaleString()}
              subtitle={`${metrics.activeBeneficiaries.toLocaleString()} active`}
              icon={Users}
              variant="primary"
              delay={0.1}
            />
            <MetricCard
              title="Vouchers Issued"
              value={metrics.totalVouchersIssued.toLocaleString()}
              change={{ value: 8.2, type: 'increase' }}
              icon={Ticket}
              delay={0.15}
            />
            <MetricCard
              title="Redemption Rate"
              value={`${((metrics.vouchersRedeemed / metrics.totalVouchersIssued) * 100).toFixed(1)}%`}
              subtitle={`${metrics.vouchersRedeemed.toLocaleString()} redeemed`}
              icon={CheckCircle2}
              variant="success"
              delay={0.2}
            />
            <MetricCard
              title="Monthly Disbursement"
              value={formatCurrency(metrics.monthlyDisbursement)}
              change={{ value: 4.5, type: 'increase' }}
              icon={BadgeDollarSign}
              variant="accent"
              delay={0.25}
            />
            <MetricCard
              title="Active Agents"
              value={metrics.activeAgents.toLocaleString()}
              subtitle={`of ${metrics.totalAgents} total`}
              icon={Building2}
              delay={0.3}
            />
            <MetricCard
              title="Network Health"
              value={`${metrics.networkHealthScore}%`}
              change={{ value: 2.1, type: 'increase' }}
              icon={TrendingUp}
              variant="success"
              delay={0.35}
            />
          </div>

          {/* Charts Row */}
          <div className="grid gap-6 lg:grid-cols-3">
            <MonthlyTrendChart />
            <VoucherStatusChart />
          </div>

          {/* Data Tables & Maps Row */}
          <div className="grid gap-6 lg:grid-cols-3">
            <RecentVouchers />
            <RegionalMap />
          </div>

          {/* Bottom Row */}
          <div className="grid gap-6 lg:grid-cols-2">
            <AgentNetworkHealth />
            <LiveActivityFeed />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
