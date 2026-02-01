/**
 * Monthly Trend Chart Component
 * 
 * Purpose: Display monthly voucher trends from database
 * Location: src/components/dashboard/MonthlyTrendChart.tsx
 */

import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { dashboardAPI } from '@smartpay/api-client';

export function MonthlyTrendChart() {
  const { data, isLoading } = useQuery({
    queryKey: ['monthly-trend'],
    queryFn: () => dashboardAPI.getMonthlyTrend(12),
    refetchInterval: 60000, // Refetch every minute
  });

  const chartData = data || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="col-span-2 rounded-xl border bg-card p-6"
    >
      <div className="mb-6">
        <h3 className="font-display text-lg font-semibold">Voucher Distribution Trends</h3>
        <p className="text-sm text-muted-foreground">Monthly issuance and redemption overview</p>
      </div>

      {isLoading ? (
        <div className="h-72 flex items-center justify-center">
          <div className="text-muted-foreground">Loading chart data...</div>
        </div>
      ) : chartData.length === 0 ? (
        <div className="h-72 flex items-center justify-center">
          <div className="text-muted-foreground">No data available</div>
        </div>
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorIssued" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(222, 47%, 18%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(222, 47%, 18%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorRedeemed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(32, 95%, 44%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(32, 95%, 44%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorExpired" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={'hsl(var(--border))'} />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(value: number) => [value.toLocaleString(), '']}
            />
            <Legend
              verticalAlign="top"
              height={36}
              formatter={(value) => (
                <span className="text-xs capitalize text-muted-foreground">{value}</span>
              )}
            />
            <Area
              type="monotone"
              dataKey="issued"
              stroke="hsl(222, 47%, 18%)"
              strokeWidth={2}
              fill="url(#colorIssued)"
            />
            <Area
              type="monotone"
              dataKey="redeemed"
              stroke="hsl(32, 95%, 44%)"
              strokeWidth={2}
              fill="url(#colorRedeemed)"
            />
            <Area
              type="monotone"
              dataKey="expired"
              stroke="hsl(0, 84%, 60%)"
              strokeWidth={2}
              fill="url(#colorExpired)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      )}
    </motion.div>
  );
}
