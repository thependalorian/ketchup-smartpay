/**
 * Voucher Status Chart Component
 *
 * Purpose: Display redemption channels from database (post_office, pos, mobile, atm only).
 * Banks are not redemption channels.
 * Location: src/components/dashboard/VoucherStatusChart.tsx
 */

import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { dashboardAPI } from '@smartpay/api-client';
import { getRedemptionChannelColor } from '../../constants/channelColors';

export { REDEMPTION_CHANNEL_COLORS } from '../../constants/channelColors';

export function VoucherStatusChart() {
  const { data: channels, isLoading } = useQuery({
    queryKey: ['redemption-channels'],
    queryFn: () => dashboardAPI.getRedemptionChannels(),
    refetchInterval: 60000,
  });

  const chartData = (channels || []).map((channel) => ({
    channel: channel.channel,
    value: channel.percentage,
    color: getRedemptionChannelColor(channel.channel),
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="rounded-xl border bg-card p-6"
    >
      <div className="mb-6">
        <h3 className="font-display text-lg font-semibold">Redemption Channels</h3>
        <p className="text-sm text-muted-foreground">Post office, POS, mobile, ATM only (banks are not redemption channels)</p>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="text-muted-foreground">Loading chart data...</div>
        </div>
      ) : chartData.length === 0 ? (
        <div className="h-64 flex items-center justify-center">
          <div className="text-muted-foreground">No data available</div>
        </div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={4}
                dataKey="value"
                nameKey="channel"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: number) => [`${value}%`, 'Percentage']}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => (
                  <span className="text-xs text-muted-foreground">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}
