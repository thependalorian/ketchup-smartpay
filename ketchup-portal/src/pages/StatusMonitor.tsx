/**
 * Status Monitor Page - Ketchup Portal
 * Purpose: View voucher status events
 * Location: apps/ketchup-portal/src/pages/StatusMonitor.tsx
 */

import { useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { Button, Card, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@smartpay/ui';
import { Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { statusEventsAPI } from '@smartpay/api-client/ketchup';

const PAGE_SIZE = 15;

export default function StatusMonitor() {
  const [search, setSearch] = useState('');
  const [voucherIdFilter, setVoucherIdFilter] = useState('');
  const [page, setPage] = useState(0);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['status-events', voucherIdFilter],
    queryFn: () => (voucherIdFilter ? statusEventsAPI.getByVoucherId(voucherIdFilter) : statusEventsAPI.getRecent(100)),
  });

  const filtered = events.filter(
    (e) =>
      (e.voucherId?.toLowerCase().includes(search.toLowerCase()) || e.voucher_id?.toLowerCase().includes(search.toLowerCase())) &&
      (voucherIdFilter ? (e.voucherId === voucherIdFilter || e.voucher_id === voucherIdFilter) : true)
  );
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const pageData = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const formatDate = (d: string | undefined) => (d ? new Date(d).toLocaleString('en-NA') : '—');

  return (
    <Layout title="Status Monitor" subtitle="Voucher status events and history">
      <div className="space-y-6">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <p className="text-muted-foreground">Total events: <span className="font-semibold text-foreground">{filtered.length}</span></p>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by voucher ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 w-64" />
            </div>
            <Input placeholder="Filter by voucher ID" value={voucherIdFilter} onChange={(e) => setVoucherIdFilter(e.target.value)} className="w-48" />
          </div>
        </div>
        <Card>
          <div className="p-0">
            {isLoading ? (
              <div className="p-6 text-center text-muted-foreground">Loading status events...</div>
            ) : pageData.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">No status events found.</div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Voucher ID</TableHead>
                      <TableHead>From → To</TableHead>
                      <TableHead>Triggered by</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pageData.map((e, i) => (
                      <TableRow key={e.id ?? `${e.voucherId ?? e.voucher_id}-${i}`}>
                        <TableCell className="font-mono text-xs">{e.voucherId ?? e.voucher_id ?? '—'}</TableCell>
                        <TableCell>
                          <span className="text-muted-foreground">{(e as { from_status?: string }).from_status ?? e.status ?? '—'}</span>
                          <span className="mx-1">→</span>
                          <span className="font-medium">{(e as { to_status?: string }).to_status ?? e.status ?? '—'}</span>
                        </TableCell>
                        <TableCell>{(e as { triggered_by?: string }).triggered_by ?? '—'}</TableCell>
                        <TableCell>{formatDate(e.timestamp)}</TableCell>
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
