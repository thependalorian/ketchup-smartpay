/**
 * Live Activity Feed Component
 *
 * Purpose: Display recent voucher status events from API (no mock data)
 * Location: apps/ketchup-portal/src/components/dashboard/LiveActivityFeed.tsx
 */

import { motion } from 'framer-motion';
import { Activity, Clock, Store, Wallet, Building2, ArrowUpRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { statusEventsAPI, type StatusEvent } from '@smartpay/api-client/ketchup';
import { getRedemptionChannelColor } from '../../constants/channelColors';

function formatTime(isoString: string | undefined) {
  if (!isoString) return '—';
  const date = new Date(isoString);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  return date.toLocaleTimeString('en-NA', { hour: '2-digit', minute: '2-digit' });
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-NA', {
    style: 'currency',
    currency: 'NAD',
    minimumFractionDigits: 0,
  }).format(amount);
}

function eventToLabel(event: StatusEvent): {
  message: string;
  icon: typeof Store;
  iconBg: string;
  iconColorHex?: string;
  amount?: number;
} {
  const status = (event.toStatus || event.status || '').toLowerCase();
  const triggeredBy = (event.triggeredBy || '').toLowerCase();
  const meta = (event.metadata || {}) as Record<string, unknown>;
  const amount = typeof meta.amount === 'number' ? meta.amount : undefined;
  const region = typeof meta.region === 'string' ? meta.region : '';
  const method = typeof meta.redemptionMethod === 'string' ? meta.redemptionMethod : '';

  if (status === 'redeemed') {
    const methodLabel = method || (triggeredBy === 'webhook' ? 'redemption' : 'redemption');
    const channelColor = getRedemptionChannelColor(method);
    return {
      message: region ? `Voucher redeemed via ${methodLabel} in ${region}` : `Voucher redeemed (${methodLabel})`,
      icon: method?.includes('merchant') ? Store : method?.includes('cash') ? Building2 : Wallet,
      iconBg: 'bg-success/10 text-success',
      iconColorHex: channelColor,
      amount,
    };
  }
  if (status === 'issued' || status === 'delivered') {
    return {
      message: region ? `Voucher issued to ${region}` : 'Voucher issued',
      icon: ArrowUpRight,
      iconBg: 'bg-info/10 text-info',
      amount,
    };
  }
  return {
    message: `Status: ${event.toStatus || event.status || 'updated'}`,
    icon: Activity,
    iconBg: 'bg-muted text-muted-foreground',
    amount,
  };
}

export function LiveActivityFeed() {
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['status-events-recent'],
    queryFn: () => statusEventsAPI.getRecent(10),
    refetchInterval: 30000,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.7 }}
      className="rounded-xl border bg-card"
    >
      <div className="flex items-center justify-between border-b p-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
              <Activity className="h-5 w-5 text-accent" />
            </div>
            <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
              <span className="relative inline-flex h-3 w-3 rounded-full bg-accent" />
            </span>
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold">Live Activity</h3>
            <p className="text-sm text-muted-foreground">Recent voucher & status events</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="p-6 text-center text-muted-foreground">Loading activity...</div>
      ) : events.length === 0 ? (
        <div className="p-6 text-center text-muted-foreground">No recent activity</div>
      ) : (
        <div className="divide-y">
          {events.map((event) => {
            const { message, icon: Icon, iconBg, iconColorHex, amount } = eventToLabel(event);
            return (
              <motion.div
                key={event.id ?? event.voucherId ?? event.timestamp ?? Math.random()}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="flex items-start gap-4 px-6 py-4"
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconColorHex ? '' : iconBg}`}
                  style={iconColorHex ? { backgroundColor: `${iconColorHex}20`, color: iconColorHex } : undefined}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground">{message}</p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatTime(event.timestamp)}
                    {amount != null && amount > 0 && (
                      <>
                        <span>•</span>
                        <span className="font-medium text-foreground">{formatCurrency(amount)}</span>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
