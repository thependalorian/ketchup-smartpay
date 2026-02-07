/**
 * Voucher Monitoring - Government Portal
 * Monitor voucher distribution and redemption (stats read-only)
 */
import { Layout } from '../components/layout/Layout';
import { Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@smartpay/ui';
import { useQuery } from '@tanstack/react-query';
import { monitoringAPI } from '@smartpay/api-client/government';

export default function VoucherMonitoring() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['gov-voucher-stats'],
    queryFn: () => monitoringAPI.getVoucherStats(),
  });

  const s = stats && typeof stats === 'object' ? (stats as Record<string, unknown>) : {};
  const total = Number(s.total ?? 0);
  const distributed = Number(s.distributed ?? 0);
  const redeemed = Number(s.redeemed ?? 0);
  const pending = Number(s.pending ?? 0);
  const failed = Number(s.failed ?? 0);
  const totalAmount = Number(s.total_amount ?? 0);
  const formatCurrency = (n: number) => new Intl.NumberFormat('en-NA', { style: 'currency', currency: 'NAD', minimumFractionDigits: 0 }).format(n);

  return (
    <Layout title="Voucher Monitoring" subtitle="Monitor voucher distribution and redemption">
      <div className="space-y-6">
        {!isLoading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4"><p className="text-sm text-muted-foreground">Total vouchers</p><p className="text-2xl font-semibold">{total.toLocaleString()}</p></Card>
            <Card className="p-4"><p className="text-sm text-muted-foreground">Distributed</p><p className="text-2xl font-semibold text-blue-600">{distributed.toLocaleString()}</p></Card>
            <Card className="p-4"><p className="text-sm text-muted-foreground">Redeemed</p><p className="text-2xl font-semibold text-green-600">{redeemed.toLocaleString()}</p></Card>
            <Card className="p-4"><p className="text-sm text-muted-foreground">Pending</p><p className="text-2xl font-semibold text-amber-600">{pending.toLocaleString()}</p></Card>
          </div>
        )}
        <Card>
          <h3 className="p-4 border-b font-semibold">Voucher statistics</h3>
          <div className="p-0">
            {isLoading ? (
              <div className="p-6 text-center text-muted-foreground">Loading...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Metric</TableHead>
                    <TableHead>Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow><TableCell>Total vouchers</TableCell><TableCell>{total.toLocaleString()}</TableCell></TableRow>
                  <TableRow><TableCell>Distributed</TableCell><TableCell>{distributed.toLocaleString()}</TableCell></TableRow>
                  <TableRow><TableCell>Redeemed</TableCell><TableCell>{redeemed.toLocaleString()}</TableCell></TableRow>
                  <TableRow><TableCell>Pending</TableCell><TableCell>{pending.toLocaleString()}</TableCell></TableRow>
                  <TableRow><TableCell>Failed</TableCell><TableCell>{failed.toLocaleString()}</TableCell></TableRow>
                  <TableRow><TableCell>Total amount (NAD)</TableCell><TableCell>{formatCurrency(totalAmount)}</TableCell></TableRow>
                </TableBody>
              </Table>
            )}
          </div>
        </Card>
      </div>
    </Layout>
  );
}
