/**
 * Reconciliation Page - Ketchup Portal
 * Purpose: Run reconciliation and view records
 * Location: apps/ketchup-portal/src/pages/Reconciliation.tsx
 */

import { useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { Button, Card, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@smartpay/ui';
import { Download } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reconciliationAPI } from '@smartpay/api-client/ketchup';

const today = new Date().toISOString().slice(0, 10);

/** When true, do not filter by date so all reconciliation records are shown. */
const ALL_DATES = '';

function downloadCSV(headers: string[], rows: string[][], filename: string) {
  const line = (arr: string[]) => arr.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',');
  const csv = [line(headers), ...rows.map((r) => line(r))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export default function Reconciliation() {
  const [dateFilter, setDateFilter] = useState<string>(ALL_DATES);
  const [matchFilter, setMatchFilter] = useState<'all' | 'matched' | 'discrepancy'>('all');
  const [page, setPage] = useState(0);
  const queryClient = useQueryClient();
  const PAGE_SIZE = 15;

  const { data: recordsRaw, isLoading, isError, error } = useQuery({
    queryKey: ['reconciliation-records', dateFilter, matchFilter],
    queryFn: () =>
      reconciliationAPI.getRecords({
        date: dateFilter || undefined,
        match: matchFilter,
        limit: 200,
      }),
    retry: false,
  });

  const runMutation = useMutation({
    mutationFn: (d: string) => reconciliationAPI.reconcile(d),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reconciliation-records'] }),
  });

  const records = Array.isArray(recordsRaw) ? recordsRaw : [];
  const totalPages = Math.ceil(records.length / PAGE_SIZE) || 1;
  const pageData = records.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const handleExportCSV = () => {
    const headers = ['Voucher ID', 'Ketchup status', 'Buffr status', 'Match', 'Discrepancy', 'Last verified'];
    const rows = records.map((r) => [
      r.voucherId,
      r.ketchupStatus,
      r.buffrStatus,
      r.match ? 'Yes' : 'No',
      r.discrepancy ?? '',
      r.lastVerified ?? '',
    ]);
    downloadCSV(headers, rows, `reconciliation-${dateFilter || 'all'}.csv`);
  };

  const formatDate = (d: string | undefined) => (d ? new Date(d).toLocaleString('en-NA') : '—');

  const isBackendUnavailable =
    isError &&
    error instanceof Error &&
    (error.message.includes('Failed to fetch') || error.message.includes('Connection refused') || error.message.includes('NetworkError'));

  return (
    <Layout title="Reconciliation" subtitle="Verify Ketchup vs Buffr voucher status">
      <div className="space-y-6">
        {isBackendUnavailable && (
          <Card className="p-4 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Backend unavailable.</strong> Start the API server: in <code className="rounded bg-amber-100 dark:bg-amber-900/50 px-1">smartpay-connect/backend</code> run <code className="rounded bg-amber-100 dark:bg-amber-900/50 px-1">pnpm run dev</code> (default port 3001).
            </p>
          </Card>
        )}
        <Card className="p-6">
          <h3 className="font-semibold mb-2">Run reconciliation</h3>
          <p className="text-sm text-muted-foreground mb-4">Verify voucher status for a date, or show all records.</p>
          <div className="flex flex-wrap gap-2 items-center">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={dateFilter === ALL_DATES}
                onChange={(e) => setDateFilter(e.target.checked ? ALL_DATES : today)}
                className="rounded border-input"
                aria-label="Show all dates"
              />
              All dates
            </label>
            {dateFilter !== ALL_DATES && (
              <>
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-40"
                />
                <Button onClick={() => runMutation.mutate(dateFilter)} disabled={runMutation.isPending}>
              {runMutation.isPending ? 'Running...' : 'Run reconciliation'}
            </Button>
            {runMutation.isSuccess && runMutation.data && (
              <span className="text-sm text-green-600">
                Match rate: {((runMutation.data.matchRate ?? 0) * 100).toFixed(1)}% ({runMutation.data.matched}/{runMutation.data.totalVouchers})
              </span>
            )}
              </>
            )}
          </div>
        </Card>
        <div className="flex flex-wrap justify-between items-center gap-4">
          <p className="text-muted-foreground">Records: <span className="font-semibold text-foreground">{records.length}</span></p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={records.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <select value={matchFilter} onChange={(e) => setMatchFilter(e.target.value as 'all' | 'matched' | 'discrepancy')} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="all">All</option>
              <option value="matched">Matched only</option>
              <option value="discrepancy">Discrepancies only</option>
            </select>
          </div>
        </div>
        <Card>
          <div className="p-0">
            {isLoading ? (
              <div className="p-6 text-center text-muted-foreground">Loading records...</div>
            ) : pageData.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">No reconciliation records found.</div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Voucher ID</TableHead>
                      <TableHead>Ketchup status</TableHead>
                      <TableHead>Buffr status</TableHead>
                      <TableHead>Match</TableHead>
                      <TableHead>Discrepancy</TableHead>
                      <TableHead>Last verified</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pageData.map((r, i) => (
                      <TableRow key={r.voucherId + String(i)}>
                        <TableCell className="font-mono text-xs">{r.voucherId}</TableCell>
                        <TableCell>{r.ketchupStatus}</TableCell>
                        <TableCell>{r.buffrStatus}</TableCell>
                        <TableCell>{r.match ? '✓' : '✗'}</TableCell>
                        <TableCell className="text-red-600">{r.discrepancy ?? '—'}</TableCell>
                        <TableCell>{formatDate(r.lastVerified)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t px-4 py-3">
                    <p className="text-sm text-muted-foreground">Page {page + 1} of {totalPages}</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                      <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>Next</Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </Card>
      </div>
    </Layout>
  );
}
