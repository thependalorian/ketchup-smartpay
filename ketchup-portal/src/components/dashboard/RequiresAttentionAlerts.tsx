/**
 * Requires Attention Alerts Component
 *
 * Purpose: Show Ketchup alerts for failed, expired, and expiring-soon vouchers
 * Location: apps/ketchup-portal/src/components/dashboard/RequiresAttentionAlerts.tsx
 */

import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { AlertTriangle, XCircle, Clock, Ticket } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { dashboardAPI, type RequiresAttention } from '@smartpay/api-client/ketchup';

export function RequiresAttentionAlerts() {
  const { data, isLoading } = useQuery({
    queryKey: ['requires-attention'],
    queryFn: () => dashboardAPI.getRequiresAttention(7),
    refetchInterval: 60000,
  });

  const att = data as RequiresAttention | undefined;
  const total = att
    ? (att.summary.failed ?? 0) + (att.summary.expired ?? 0) + (att.summary.expiring_soon ?? 0)
    : 0;

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border bg-card"
      >
        <div className="flex items-center justify-between border-b p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold">Requires Attention</h3>
              <p className="text-sm text-muted-foreground">Failed, expired, expiring soon</p>
            </div>
          </div>
        </div>
        <div className="p-6 text-center text-muted-foreground">Loading...</div>
      </motion.div>
    );
  }

  if (!att || total === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border bg-card"
      >
        <div className="flex items-center justify-between border-b p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
              <Ticket className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold">Requires Attention</h3>
              <p className="text-sm text-muted-foreground">No alerts</p>
            </div>
          </div>
        </div>
        <div className="p-6 text-center text-sm text-muted-foreground">
          No failed, expired, or expiring-soon vouchers in the next 7 days.
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="rounded-xl border bg-card"
    >
      <div className="flex items-center justify-between border-b p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold">Requires Attention</h3>
            <p className="text-sm text-muted-foreground">
              {att.summary.failed} failed, {att.summary.expired} expired, {att.summary.expiring_soon} expiring soon
            </p>
          </div>
        </div>
        <Link
          to="/vouchers"
          className="text-sm font-medium text-primary hover:underline"
        >
          View vouchers
        </Link>
      </div>

      <div className="grid gap-4 p-6 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50/50 p-4 dark:border-red-900 dark:bg-red-950/20">
          <XCircle className="h-8 w-8 text-red-600" />
          <div>
            <p className="font-semibold text-red-800 dark:text-red-200">Failed</p>
            <p className="text-2xl font-bold text-red-700 dark:text-red-300">{att.summary.failed}</p>
            <p className="text-xs text-muted-foreground">Delivery or redemption failed</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-orange-200 bg-orange-50/50 p-4 dark:border-orange-900 dark:bg-orange-950/20">
          <Clock className="h-8 w-8 text-orange-600" />
          <div>
            <p className="font-semibold text-orange-800 dark:text-orange-200">Expired</p>
            <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{att.summary.expired}</p>
            <p className="text-xs text-muted-foreground">Past expiry date</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900 dark:bg-amber-950/20">
          <Clock className="h-8 w-8 text-amber-600" />
          <div>
            <p className="font-semibold text-amber-800 dark:text-amber-200">Expiring soon</p>
            <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{att.summary.expiring_soon}</p>
            <p className="text-xs text-muted-foreground">Within 7 days</p>
          </div>
        </div>
      </div>

      {(att.sample_failed?.length > 0 || att.sample_expiring_soon?.length > 0) && (
        <div className="border-t px-6 py-4">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Sample voucher IDs (view in Vouchers)</p>
          <div className="flex flex-wrap gap-2">
            {att.sample_failed?.slice(0, 5).map((s) => (
              <Link
                key={s.id}
                to={`/vouchers?view=${s.id}`}
                className="rounded bg-red-100 px-2 py-1 font-mono text-xs text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-200"
              >
                {s.voucher_code ?? s.id.slice(0, 8)}
              </Link>
            ))}
            {att.sample_expiring_soon?.slice(0, 5).map((s) => (
              <Link
                key={s.id}
                to={`/vouchers?view=${s.id}`}
                className="rounded bg-amber-100 px-2 py-1 font-mono text-xs text-amber-800 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-200"
              >
                {s.voucher_code ?? s.id.slice(0, 8)}
              </Link>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
