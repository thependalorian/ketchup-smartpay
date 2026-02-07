/**
 * Trust Account Page - Ketchup Portal
 * Purpose: View trust account status and run daily reconciliation (PSD-3; moved from Buffr per PRD).
 * Location: apps/ketchup-portal/src/pages/TrustAccount.tsx
 */

import { Layout } from '../components/layout/Layout';
import { Button, Card } from '@smartpay/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '@smartpay/api-client/ketchup';
import { RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';

export default function TrustAccount() {
  const queryClient = useQueryClient();

  const { data: status, isLoading, isError, error } = useQuery({
    queryKey: ['admin-trust-account-status'],
    queryFn: () => adminAPI.getTrustAccountStatus(),
  });

  const reconcileMutation = useMutation({
    mutationFn: () => adminAPI.reconcileTrustAccount('Ketchup Portal'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-trust-account-status'] }),
  });

  const isCompliant = status?.isCompliant ?? status?.status === 'compliant';

  return (
    <Layout title="Trust Account" subtitle="PSD-3 trust account status and daily reconciliation">
      <div className="space-y-6">
        {isError && (
          <Card className="p-4 border-destructive/50 bg-destructive/5">
            <p className="text-sm text-destructive">
              {error instanceof Error ? error.message : 'Failed to load trust account status.'}
            </p>
          </Card>
        )}

        <Card className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h3 className="font-semibold">Current status</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-trust-account-status'] })}
              disabled={isLoading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
          {isLoading ? (
            <p className="text-muted-foreground text-sm mt-4">Loading...</p>
          ) : status ? (
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2">
                {isCompliant ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                )}
                <span className="font-medium capitalize">{status.status ?? (isCompliant ? 'compliant' : 'deficient')}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Coverage: <strong>{(status.coveragePercentage ?? status.coverage_ratio * 100)?.toFixed(2)}%</strong>
                {status.deficiencyAmount != null && status.deficiencyAmount > 0 && (
                  <> · Deficiency: <strong>N${status.deficiencyAmount.toLocaleString()}</strong> (resolve within 1 business day)</>
                )}
              </p>
              {status.lastReconciliationDate && (
                <p className="text-xs text-muted-foreground">
                  Last reconciliation: {new Date(status.lastReconciliationDate).toLocaleDateString()}
                </p>
              )}
            </div>
          ) : null}
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-2">Run daily reconciliation</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Reconcile trust account balance with outstanding e-money liabilities (PSD-3 Section 11.2.4).
          </p>
          <Button
            onClick={() => reconcileMutation.mutate()}
            disabled={reconcileMutation.isPending || isLoading}
          >
            {reconcileMutation.isPending ? 'Running...' : 'Run reconciliation'}
          </Button>
          {reconcileMutation.isSuccess && (
            <p className="text-sm text-green-600 mt-2">Reconciliation completed successfully.</p>
          )}
          {reconcileMutation.isError && (
            <p className="text-sm text-destructive mt-2">
              {reconcileMutation.error instanceof Error ? reconcileMutation.error.message : 'Reconciliation failed.'}
            </p>
          )}
        </Card>
      </div>
    </Layout>
  );
}
