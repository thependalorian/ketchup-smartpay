/**
 * Impact Dashboard – Analytics for government and partners (PRD Section 9, G2P 4.0).
 * Uses government analytics API: financial summary + grant type breakdown (read-only).
 * Location: apps/government-portal/src/pages/ImpactDashboard.tsx
 */

import { Layout } from '../components/layout/Layout';
import { Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@smartpay/ui';
import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '@smartpay/api-client/government';

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-NA', { style: 'currency', currency: 'NAD', minimumFractionDigits: 0 }).format(n);
}

export default function ImpactDashboard() {
  const { data: financial, isLoading: loadingFinancial } = useQuery({
    queryKey: ['gov-impact-financial'],
    queryFn: () => analyticsAPI.getFinancialSummary(),
  });
  const { data: grantTypes = [], isLoading: loadingGrantTypes } = useQuery({
    queryKey: ['gov-impact-grant-types'],
    queryFn: () => analyticsAPI.getGrantTypeBreakdown(),
  });

  const fin = financial && typeof financial === 'object' ? (financial as Record<string, unknown>) : {};
  const totalDisbursed = Number(fin.total_disbursed ?? 0);
  const totalTransactions = Number(fin.total_transactions ?? 0);
  const uniqueBeneficiaries = Number(fin.unique_beneficiaries ?? 0);
  const avgAmount = Number(fin.avg_transaction_amount ?? 0);
  const isLoading = loadingFinancial || loadingGrantTypes;

  return (
    <Layout title="Impact Dashboard" subtitle="Social impact, financial inclusion, and sustainability KPIs">
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Beneficiaries reached</p>
            <p className="text-2xl font-semibold">{isLoading ? '—' : uniqueBeneficiaries.toLocaleString()}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Total disbursed</p>
            <p className="text-2xl font-semibold">{isLoading ? '—' : formatCurrency(totalDisbursed)}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Transactions (redeemed)</p>
            <p className="text-2xl font-semibold">{isLoading ? '—' : totalTransactions.toLocaleString()}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Avg transaction</p>
            <p className="text-2xl font-semibold">{isLoading ? '—' : formatCurrency(avgAmount)}</p>
          </Card>
        </div>
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Grant type breakdown</h3>
          {loadingGrantTypes ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (grantTypes as Record<string, unknown>[]).length === 0 ? (
            <p className="text-sm text-muted-foreground">No grant type data yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Grant type</TableHead>
                  <TableHead className="text-right">Vouchers</TableHead>
                  <TableHead className="text-right">Total amount</TableHead>
                  <TableHead className="text-right">Beneficiaries</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(grantTypes as Record<string, unknown>[]).map((row: Record<string, unknown>, i: number) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{String(row.grant_type ?? '—')}</TableCell>
                    <TableCell className="text-right">{Number(row.total_vouchers ?? 0).toLocaleString()}</TableCell>
                    <TableCell className="text-right">{formatCurrency(Number(row.total_amount ?? 0))}</TableCell>
                    <TableCell className="text-right">{Number(row.unique_beneficiaries ?? 0).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </Layout>
  );
}
