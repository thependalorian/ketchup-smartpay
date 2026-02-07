/**
 * Audit Logs Page - Ketchup Portal
 * Purpose: Query and export audit/idempotency logs (moved from Buffr per PRD).
 * Location: apps/ketchup-portal/src/pages/AuditLogs.tsx
 */

import { useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { Button, Card, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@smartpay/ui';
import { useQuery, useMutation } from '@tanstack/react-query';
import { adminAPI } from '@smartpay/api-client/ketchup';
import { Download } from 'lucide-react';

const PAGE_SIZE = 20;

export default function AuditLogs() {
  const [limit, setLimit] = useState(50);
  const [endpointPrefix, setEndpointPrefix] = useState('');
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit-logs', limit, endpointPrefix || undefined],
    queryFn: () =>
      adminAPI.queryAuditLogs({
        limit,
        endpoint_prefix: endpointPrefix || undefined,
      }),
  });

  const exportMutation = useMutation({
    mutationFn: () => adminAPI.exportAuditLogs(),
    onSuccess: (result) => {
      const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    },
  });

  const items = data?.items ?? [];
  const totalPages = Math.ceil(items.length / PAGE_SIZE) || 1;
  const pageData = items.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const formatDate = (d: string | undefined) => (d ? new Date(d).toLocaleString() : '—');

  return (
    <Layout title="Audit Logs" subtitle="Idempotency and API audit log query">
      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="text-sm text-muted-foreground block mb-1">Limit</label>
              <Input
                type="number"
                min={1}
                max={200}
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value) || 50)}
                className="w-24"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground block mb-1">Endpoint prefix (optional)</label>
              <Input
                placeholder="e.g. distribution"
                value={endpointPrefix}
                onChange={(e) => setEndpointPrefix(e.target.value)}
                className="w-48"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportMutation.mutate()}
              disabled={exportMutation.isPending || items.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export JSON
            </Button>
          </div>
        </Card>

        <Card className="p-0 overflow-hidden">
          {isLoading ? (
            <div className="p-6 text-center text-muted-foreground">Loading audit logs...</div>
          ) : pageData.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">No audit log entries found.</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Idempotency key</TableHead>
                    <TableHead>Endpoint</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageData.map((row, i) => (
                    <TableRow key={`${row.idempotency_key}-${i}`}>
                      <TableCell className="font-mono text-xs truncate max-w-[200px]">{row.idempotency_key}</TableCell>
                      <TableCell>{row.endpoint_prefix ?? '—'}</TableCell>
                      <TableCell>{row.response_status ?? '—'}</TableCell>
                      <TableCell>{formatDate(row.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {totalPages > 1 && (
                <div className="flex justify-between items-center p-3 border-t">
                  <span className="text-sm text-muted-foreground">
                    Page {page + 1} of {totalPages} · {items.length} total
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
                      Previous
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </Layout>
  );
}
