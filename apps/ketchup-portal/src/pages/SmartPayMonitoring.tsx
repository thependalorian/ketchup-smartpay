/**
 * SmartPay Monitoring Page - Ketchup Portal
 * Purpose: Admin view for SmartPay backend health and sync logs (moved from Buffr per PRD).
 * Location: apps/ketchup-portal/src/pages/SmartPayMonitoring.tsx
 */

import { Layout } from '../components/layout/Layout';
import { Button, Card } from '@smartpay/ui';
import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '@smartpay/api-client/ketchup';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

export default function SmartPayMonitoring() {
  const { data: health, isLoading, refetch } = useQuery({
    queryKey: ['admin-smartpay-health'],
    queryFn: () => adminAPI.getSmartPayHealth(),
  });

  const { data: syncLogs } = useQuery({
    queryKey: ['admin-smartpay-sync-logs'],
    queryFn: () => adminAPI.getSyncLogs(20),
  });

  const isHealthy = health?.status === 'healthy';
  const items = syncLogs?.items ?? [];
  const count = syncLogs?.count ?? 0;

  return (
    <Layout title="SmartPay Monitoring" subtitle="Backend health and sync logs">
      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h3 className="font-semibold">Backend health</h3>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
          {isLoading ? (
            <p className="text-muted-foreground text-sm mt-2">Checking...</p>
          ) : (
            <div className="mt-4 flex items-center gap-2">
              {isHealthy ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-amber-600" />
              )}
              <span className="font-medium">{health?.status ?? 'unknown'}</span>
              <span className="text-muted-foreground text-sm">
                {health?.service ?? '—'} · {health?.timestamp ? new Date(health.timestamp).toLocaleString() : '—'}
              </span>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-2">Sync logs</h3>
          <p className="text-sm text-muted-foreground mb-4">
            API sync activity (recent entries). Total: {count}
          </p>
          {items.length === 0 ? (
            <p className="text-muted-foreground text-sm">No sync logs yet.</p>
          ) : (
            <pre className="text-xs bg-muted p-4 rounded overflow-auto max-h-64">
              {JSON.stringify(items, null, 2)}
            </pre>
          )}
        </Card>
      </div>
    </Layout>
  );
}
