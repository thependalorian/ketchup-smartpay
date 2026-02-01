/**
 * Webhook Monitoring Page - Ketchup Portal
 * Purpose: View webhook events and retry failed deliveries
 */
import { useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { Button, Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@smartpay/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { webhookAPI } from '@smartpay/api-client/ketchup';

const PAGE_SIZE = 15;

export default function WebhookMonitoring() {
  const [page, setPage] = useState(0);
  const queryClient = useQueryClient();

  const { data: eventsRaw, isLoading } = useQuery({
    queryKey: ['webhooks'],
    queryFn: async () => {
      try {
        return await webhookAPI.getAll({ limit: 100 });
      } catch {
        return [];
      }
    },
  });

  const events = Array.isArray(eventsRaw) ? eventsRaw : [];
  const totalPages = Math.ceil(events.length / PAGE_SIZE) || 1;
  const pageData = events.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const formatDate = (d: string | undefined) => (d ? new Date(d).toLocaleString('en-NA') : '—');

  return (
    <Layout title="Webhook Monitoring" subtitle="Webhook delivery events">
      <div className="space-y-6">
        <p className="text-muted-foreground">Total events: <span className="font-semibold text-foreground">{events.length}</span></p>
        <Card>
          <div className="p-0">
            {isLoading ? (
              <div className="p-6 text-center text-muted-foreground">Loading webhook events...</div>
            ) : pageData.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">No webhook events found.</div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event type</TableHead>
                      <TableHead>Voucher ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Attempts</TableHead>
                      <TableHead>Last attempt</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pageData.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="font-medium">{(e as { eventType?: string }).eventType ?? '—'}</TableCell>
                        <TableCell className="font-mono text-xs">{(e as { voucherId?: string }).voucherId ?? '—'}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${(e as { status?: string }).status === 'delivered' ? 'bg-green-100 text-green-800' : (e as { status?: string }).status === 'failed' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                            {(e as { status?: string }).status ?? '—'}
                          </span>
                        </TableCell>
                        <TableCell>{(e as { deliveryAttempts?: number }).deliveryAttempts ?? '—'}</TableCell>
                        <TableCell>{formatDate((e as { lastAttemptAt?: string }).lastAttemptAt ?? e.timestamp)}</TableCell>
                        <TableCell className="text-right">
                          {(e as { status?: string }).status === 'failed' && (
                            <RetryButton id={e.id} onSuccess={() => queryClient.invalidateQueries({ queryKey: ['webhooks'] })} />
                          )}
                        </TableCell>
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

function RetryButton({ id, onSuccess }: { id: string; onSuccess: () => void }) {
  const mutation = useMutation({
    mutationFn: () => webhookAPI.retry(id),
    onSuccess,
  });
  return (
    <Button variant="outline" size="sm" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
      {mutation.isPending ? 'Retrying...' : 'Retry'}
    </Button>
  );
}
