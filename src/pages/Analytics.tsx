import { motion } from 'framer-motion';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { generateMonthlyTrend, generateRedemptionChannels, generateRegionalStats, NAMIBIAN_REGIONS } from '@/lib/mockData';
import { TrendingUp, Users, Ticket, DollarSign, Calendar, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';

const monthlyData = generateMonthlyTrend();
const channelData = generateRedemptionChannels();
const regionalData = generateRegionalStats().sort((a, b) => b.beneficiaries - a.beneficiaries).slice(0, 8);

const Analytics = () => {
  const [activeNav, setActiveNav] = useState('/analytics');
  const [period, setPeriod] = useState('6m');

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeItem={activeNav} onNavigate={setActiveNav} />
      <main className="pl-[260px]">
        <Header title="Analytics" subtitle="Insights and reporting for government disbursements" />

        <div className="p-6 space-y-6">
          {/* Period Selector */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1m">Last Month</SelectItem>
                  <SelectItem value="3m">Last 3 Months</SelectItem>
                  <SelectItem value="6m">Last 6 Months</SelectItem>
                  <SelectItem value="1y">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Total Disbursed', value: 'N$602.8M', change: '+4.5%', icon: DollarSign, color: 'text-secondary' },
              { label: 'Vouchers Issued', value: '104,582', change: '+8.2%', icon: Ticket, color: 'text-primary' },
              { label: 'Redemption Rate', value: '87.3%', change: '+2.1%', icon: TrendingUp, color: 'text-success' },
              { label: 'Active Beneficiaries', value: '98,234', change: '+1.2%', icon: Users, color: 'text-accent' },
            ].map((kpi, i) => (
              <motion.div
                key={kpi.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl border bg-card p-5"
              >
                <div className="flex items-center justify-between mb-2">
                  <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                  <span className="text-xs font-medium text-success">{kpi.change}</span>
                </div>
                <p className="text-2xl font-bold font-display">{kpi.value}</p>
                <p className="text-sm text-muted-foreground">{kpi.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Charts Row 1 */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Trend Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-xl border bg-card p-6"
            >
              <h3 className="font-display font-semibold text-lg mb-1">Voucher Distribution Trend</h3>
              <p className="text-sm text-muted-foreground mb-4">Monthly issuance vs redemption</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient id="issGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(222, 47%, 18%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(222, 47%, 18%)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(32, 95%, 44%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(32, 95%, 44%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    <Area type="monotone" dataKey="issued" stroke="hsl(222, 47%, 18%)" fill="url(#issGrad)" strokeWidth={2} />
                    <Area type="monotone" dataKey="redeemed" stroke="hsl(32, 95%, 44%)" fill="url(#redGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Redemption Channels */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-xl border bg-card p-6"
            >
              <h3 className="font-display font-semibold text-lg mb-1">Redemption Channels</h3>
              <p className="text-sm text-muted-foreground mb-4">How beneficiaries access funds</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={channelData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={4} dataKey="value">
                      {channelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => `${v}%`} />
                    <Legend formatter={(v) => <span className="text-xs text-muted-foreground">{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>

          {/* Charts Row 2 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-xl border bg-card p-6"
          >
            <h3 className="font-display font-semibold text-lg mb-1">Regional Comparison</h3>
            <p className="text-sm text-muted-foreground mb-4">Top 8 regions by beneficiary count</p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={regionalData} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <YAxis dataKey="region" type="category" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} width={80} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Bar dataKey="beneficiaries" fill="hsl(32, 95%, 44%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Analytics;
