import { motion } from 'framer-motion';
import { ArrowRight, Ticket } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { generateBeneficiaries, generateVouchers } from '@/lib/mockData';
import { useMemo } from 'react';

export function RecentVouchers() {
  const vouchers = useMemo(() => {
    const beneficiaries = generateBeneficiaries(100);
    return generateVouchers(beneficiaries, 50)
      .sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime())
      .slice(0, 8);
  }, []);

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
        <button className="group flex items-center gap-2 text-sm font-medium text-secondary transition-colors hover:text-secondary/80">
          View All
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>

      <div className="divide-y">
        {vouchers.map((voucher, index) => (
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
                <p className="font-medium text-foreground">{voucher.beneficiaryName}</p>
                <p className="text-sm text-muted-foreground">
                  {voucher.region} • {voucher.grantType.replace('_', ' ')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="font-semibold text-foreground">{formatCurrency(voucher.amount)}</p>
                <p className="text-xs text-muted-foreground">{formatDate(voucher.issuedAt)}</p>
              </div>
              <StatusBadge variant={voucher.status}>
                {voucher.status.charAt(0).toUpperCase() + voucher.status.slice(1)}
              </StatusBadge>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
