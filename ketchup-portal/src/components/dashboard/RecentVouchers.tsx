/**
 * Recent Vouchers Component
 *
 * Purpose: Display recent vouchers from database
 * Location: src/components/dashboard/RecentVouchers.tsx
 */

import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Ticket } from 'lucide-react';
import { StatusBadge } from '@smartpay/ui';
import { useQuery } from '@tanstack/react-query';
import { voucherAPI, type Voucher, type VoucherStatus } from '@smartpay/api-client';

/** API may return snake_case or extra display fields; extend for local use */
type VoucherRow = Voucher & Record<string, unknown>;

const STATUS_BADGE_VARIANT: Record<VoucherStatus, 'pending' | 'delivered' | 'redeemed' | 'expired' | 'cancelled' | 'error' | 'neutral'> = {
  pending: 'pending',
  distributed: 'delivered',
  redeemed: 'redeemed',
  expired: 'expired',
  cancelled: 'cancelled',
  failed: 'error',
};

export function RecentVouchers() {
  const { data: vouchers, isLoading } = useQuery({
    queryKey: ['recent-vouchers'],
    queryFn: () => voucherAPI.getAll({ limit: 8 }),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const recentVouchers = (vouchers || [])
    .slice(0, 8)
    .map((v) => v as VoucherRow)
    .sort((a, b) => {
      const dateA = (a.issuedAt ?? a.distributionDate ?? a.createdAt) as string | Date | undefined;
      const dateB = (b.issuedAt ?? b.distributionDate ?? b.createdAt) as string | Date | undefined;
      return new Date(dateB ?? 0).getTime() - new Date(dateA ?? 0).getTime();
    });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NA', {
      style: 'currency',
      currency: 'NAD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NA', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="col-span-2 rounded-xl border bg-card"
    >
      <div className="flex items-center justify-between border-b p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
            <Ticket className="h-5 w-5 text-secondary" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold">Recent Vouchers</h3>
            <p className="text-sm text-muted-foreground">Latest voucher activity across all regions</p>
          </div>
        </div>
        <Link
          to="/vouchers"
          className="group flex items-center gap-2 text-sm font-medium text-secondary transition-colors hover:text-secondary/80"
        >
          View All
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {isLoading ? (
        <div className="p-6 text-center text-muted-foreground">Loading vouchers...</div>
      ) : recentVouchers.length === 0 ? (
        <div className="p-6 text-center text-muted-foreground">No vouchers found</div>
      ) : (
        <div className="divide-y">
          {recentVouchers.map((voucher: VoucherRow, index: number) => {
            const dateVal = voucher.issuedAt ?? voucher.distributionDate ?? voucher.createdAt;
            const issuedDate = typeof dateVal === 'string' ? dateVal : (dateVal instanceof Date ? dateVal.toISOString() : new Date().toISOString());
            const beneficiaryName = String(voucher.beneficiaryName ?? voucher.beneficiary_name ?? voucher.beneficiaryId ?? '—');
            const region = String(voucher.region ?? 'Unknown');
            const grantType = String(voucher.grantType ?? voucher.grant_type ?? 'unknown');
            const badgeVariant = STATUS_BADGE_VARIANT[voucher.status] ?? 'neutral';

            return (
              <motion.div
                key={voucher.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-muted/30"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted font-mono text-xs font-medium text-muted-foreground">
                    {voucher.id.slice(-4)}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{beneficiaryName}</p>
                    <p className="text-sm text-muted-foreground">
                      {region} • {grantType.replace('_', ' ')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="font-semibold text-foreground">{formatCurrency((voucher as { amount?: number }).amount ?? 0)}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(issuedDate)}</p>
                  </div>
                  <StatusBadge variant={badgeVariant}>
                    {voucher.status.charAt(0).toUpperCase() + voucher.status.slice(1)}
                  </StatusBadge>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
