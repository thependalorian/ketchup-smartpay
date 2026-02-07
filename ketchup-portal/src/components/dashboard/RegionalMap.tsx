/**
 * Regional Map Component
 * 
 * Purpose: Display regional statistics from database
 * Location: src/components/dashboard/RegionalMap.tsx
 */

import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { dashboardAPI } from '@smartpay/api-client';

export function RegionalMap() {
  const { data: regionalStats, isLoading } = useQuery({
    queryKey: ['regional-stats'],
    queryFn: () => dashboardAPI.getRegionalStats(),
    refetchInterval: 60000,
  });

  const stats = regionalStats || [];
  const maxBeneficiaries = stats.length > 0 ? Math.max(...stats.map((r) => r.beneficiaries)) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="rounded-xl border bg-card p-6"
    >
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg font-semibold">Regional Distribution</h3>
          <p className="text-sm text-muted-foreground">Beneficiaries across Namibia's 14 regions</p>
        </div>
        <MapPin className="h-5 w-5 text-secondary" />
      </div>

      {isLoading ? (
        <div className="max-h-80 flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading regional data...</div>
        </div>
      ) : stats.length === 0 ? (
        <div className="max-h-80 flex items-center justify-center py-12">
          <div className="text-muted-foreground">No regional data available</div>
        </div>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
          {stats
            .sort((a, b) => b.beneficiaries - a.beneficiaries)
            .map((region, index) => {
              const percentage = maxBeneficiaries > 0 ? (region.beneficiaries / maxBeneficiaries) * 100 : 0;
              const redemptionRate = region.vouchers > 0 
                ? ((region.redeemed / region.vouchers) * 100).toFixed(1)
                : '0.0';

            return (
              <motion.div
                key={region.region}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="group"
              >
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="font-medium text-foreground group-hover:text-secondary transition-colors">
                    {region.region}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">
                      {region.beneficiaries.toLocaleString()}
                    </span>
                    <span className="text-xs text-success font-medium">
                      {redemptionRate}%
                    </span>
                  </div>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.8, delay: index * 0.05, ease: 'easeOut' }}
                    className="h-full rounded-full gradient-accent"
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
