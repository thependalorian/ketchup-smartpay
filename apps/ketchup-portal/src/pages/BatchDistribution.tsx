/**
 * Batch Distribution Page - Ketchup Portal
 * Purpose: Batch voucher distribution to Buffr
 */
import { useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { Button, Card, Input } from '@smartpay/ui';
import { Send } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { voucherAPI, distributionAPI } from '@smartpay/api-client/ketchup';

export default function BatchDistribution() {
  const [voucherIdsInput, setVoucherIdsInput] = useState('');
  const queryClient = useQueryClient();

  const { data: vouchers = [] } = useQuery({
    queryKey: ['vouchers-pending'],
    queryFn: () => voucherAPI.getAll({ status: 'pending', limit: 100 }),
  });

  const batchMutation = useMutation({
    mutationFn: (ids: string[]) => distributionAPI.batch(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
      setVoucherIdsInput('');
    },
  });

  const handleBatch = () => {
    const ids = voucherIdsInput.split(/[\n,\s]+/).map((s) => s.trim()).filter(Boolean);
    if (ids.length) batchMutation.mutate(ids);
  };

  const pendingCount = vouchers.filter((v) => v.status === 'pending' || (v as { status?: string }).status === 'issued').length;

  return (
    <Layout title="Batch Distribution" subtitle="Distribute vouchers to Buffr in batch">
      <div className="space-y-6 max-w-2xl">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-2">
            Pending vouchers available: <span className="font-semibold text-foreground">{pendingCount}</span>
          </p>
          <p className="text-sm text-muted-foreground mb-4">Enter voucher IDs (one per line or comma-separated) to distribute in batch.</p>
          <textarea
            value={voucherIdsInput}
            onChange={(e) => setVoucherIdsInput(e.target.value)}
            placeholder="voucher-id-1&#10;voucher-id-2"
            rows={6}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <div className="mt-4 flex gap-2">
            <Button onClick={handleBatch} disabled={!voucherIdsInput.trim() || batchMutation.isPending}>
              <Send className="h-4 w-4 mr-2" />
              {batchMutation.isPending ? 'Distributing...' : 'Distribute batch'}
            </Button>
            {batchMutation.isSuccess && batchMutation.data && (
              <span className="text-sm text-green-600">
                {batchMutation.data.successful ?? 0} sent, {batchMutation.data.failed ?? 0} failed
              </span>
            )}
            {batchMutation.isError && <span className="text-sm text-red-600">Error distributing</span>}
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold mb-2">Single voucher distribution</h3>
          <p className="text-sm text-muted-foreground mb-4">Distribute one voucher by ID.</p>
          <SingleDisburse />
        </Card>
      </div>
    </Layout>
  );
}

function SingleDisburse() {
  const [voucherId, setVoucherId] = useState('');
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (id: string) => distributionAPI.disburse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
      setVoucherId('');
    },
  });
  return (
    <div className="flex gap-2">
      <Input placeholder="Voucher ID" value={voucherId} onChange={(e) => setVoucherId(e.target.value)} className="max-w-xs" />
      <Button onClick={() => voucherId && mutation.mutate(voucherId)} disabled={!voucherId || mutation.isPending}>
        {mutation.isPending ? 'Sending...' : 'Disburse'}
      </Button>
      {mutation.isError && <span className="text-sm text-red-600">Error</span>}
    </div>
  );
}
