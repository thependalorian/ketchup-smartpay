/**
 * Regions Page - Ketchup Portal
 * Purpose: Regional performance overview
 */
import { Layout } from '../components/layout/Layout';
import { Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@smartpay/ui';
import { useQuery } from '@tanstack/react-query';
import { dashboardAPI } from '@smartpay/api-client/ketchup';

export default function Regions() {
  const { data: stats = [], isLoading } = useQuery({
    queryKey: ['regional-stats'],
    queryFn: () => dashboardAPI.getRegionalStats(),
  });

  const formatNumber = (n: number) => new Intl.NumberFormat('en-NA').format(n);

  return (
    <Layout title="Regions" subtitle="Regional performance overview">
      <div className="space-y-6">
        <Card>
          <div className="p-0">
            {isLoading ? (
              <div className="p-6 text-center text-muted-foreground">Loading regional stats...</div>
            ) : stats.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">No regional data yet.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Region</TableHead>
                    <TableHead>Beneficiaries</TableHead>
                    <TableHead>Vouchers</TableHead>
                    <TableHead>Redeemed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.map((s) => (
                    <TableRow key={s.region}>
                      <TableCell className="font-medium">{s.region}</TableCell>
                      <TableCell>{formatNumber(s.beneficiaries)}</TableCell>
                      <TableCell>{formatNumber(s.vouchers)}</TableCell>
                      <TableCell>{formatNumber(s.redeemed)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </Card>
      </div>
    </Layout>
  );
}
