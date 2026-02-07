/**
 * Financial Analytics - Government Portal
 *
 * Drill-down: Financial summary / Spend trend / Grant types → Individual transactions (smallest unit).
 * Always trace to smallest datapoint: individual redeemed voucher (transaction).
 * Location: apps/government-portal/src/pages/Analytics.tsx
 */

import { useState } from 'react';
import { Layout } from '../components/layout/Layout';
import {
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Button,
} from '@smartpay/ui';
import { Download, Eye } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '@smartpay/api-client/government';
import { VoucherDetailDialog } from '../components/VoucherDetailDialog';
import { BeneficiaryDetailDialog } from '../components/BeneficiaryDetailDialog';

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

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-NA', { style: 'currency', currency: 'NAD', minimumFractionDigits: 0 }).format(n);
}

function formatDate(v: string | null | undefined) {
  if (!v) return '—';
  try {
    return new Date(v).toLocaleString();
  } catch {
    return String(v);
  }
}

const TRANSACTIONS_PAGE_SIZE = 20;

export default function Analytics() {
  const [drillGrantType, setDrillGrantType] = useState<string | null>(null);
  const [drillMonth, setDrillMonth] = useState<string | null>(null);
  const [transactionsPage, setTransactionsPage] = useState(1);
  const [viewVoucherId, setViewVoucherId] = useState<string | null>(null);
  const [viewBeneficiaryId, setViewBeneficiaryId] = useState<string | null>(null);

  const { data: financial } = useQuery({
    queryKey: ['gov-financial'],
    queryFn: () => analyticsAPI.getFinancialSummary(),
  });
  const { data: spendTrend = [], isLoading: loadingTrend } = useQuery({
    queryKey: ['gov-spend-trend'],
    queryFn: () => analyticsAPI.getSpendTrend(),
  });
  const { data: grantTypes = [], isLoading: loadingGrant } = useQuery({
    queryKey: ['gov-grant-types'],
    queryFn: () => analyticsAPI.getGrantTypeBreakdown(),
  });

  const transactionsParams = {
    page: transactionsPage,
    limit: TRANSACTIONS_PAGE_SIZE,
    ...(drillGrantType && { grantType: drillGrantType }),
    ...(drillMonth && { month: drillMonth }),
  };
  const { data: transactionsData, isLoading: loadingTransactions } = useQuery({
    queryKey: ['gov-transactions', transactionsParams],
    queryFn: () => analyticsAPI.getTransactions(transactionsParams),
  });

  const transactions = (transactionsData?.transactions ?? []) as Record<string, unknown>[];
  const transactionsTotal = transactionsData?.total ?? 0;
  const transactionsLimit = transactionsData?.limit ?? TRANSACTIONS_PAGE_SIZE;
  const transactionsTotalPages = Math.ceil(transactionsTotal / transactionsLimit) || 1;

  const formatCurrencyFn = formatCurrency;
  const f = financial && typeof financial === 'object' ? (financial as Record<string, unknown>) : {};
  const exportSpendTrend = () => {
    const headers = ['Month', 'Total spend', 'Total transactions'];
    const rows = (spendTrend as Record<string, unknown>[]).map((r) => [
      String(r.month ?? ''),
      String(r.total_spend ?? ''),
      String(r.total_transactions ?? ''),
    ]);
    downloadCSV(headers, rows, 'analytics-spend-trend.csv');
  };
  const exportGrantTypes = () => {
    const headers = ['Grant type', 'Total vouchers', 'Total amount', 'Unique beneficiaries'];
    const rows = (grantTypes as Record<string, unknown>[]).map((r) => [
      String(r.grant_type ?? ''),
      String(r.total_vouchers ?? ''),
      String(r.total_amount ?? ''),
      String(r.unique_beneficiaries ?? ''),
    ]);
    downloadCSV(headers, rows, 'analytics-grant-types.csv');
  };

  const monthStr = (m: unknown) => {
    if (!m) return '—';
    const s = String(m);
    try {
      const d = new Date(s);
      return d.toLocaleDateString('en-NA', { month: 'short', year: 'numeric' });
    } catch {
      return s;
    }
  };

  return (
    <Layout title="Financial Analytics" subtitle="Drill down to individual transactions">
      <div className="space-y-6">
        {f && Object.keys(f).length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Total disbursed</p>
              <p className="text-2xl font-semibold">{formatCurrencyFn(Number(f.total_disbursed ?? 0))}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Total transactions</p>
              <p className="text-2xl font-semibold">{Number(f.total_transactions ?? 0).toLocaleString()}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Avg transaction</p>
              <p className="text-2xl font-semibold">{formatCurrencyFn(Number(f.avg_transaction_amount ?? 0))}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Unique beneficiaries</p>
              <p className="text-2xl font-semibold">{Number(f.unique_beneficiaries ?? 0).toLocaleString()}</p>
            </Card>
          </div>
        )}

        {/* Spend trend: click month → drill to transactions for that month */}
        <Card>
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-semibold">Spend trend (last 12 months)</h3>
            <Button variant="outline" size="sm" onClick={exportSpendTrend} disabled={spendTrend.length === 0}>
              <Download className="h-4 w-4 mr-2" /> Export CSV
            </Button>
          </div>
          <div className="p-0">
            {loadingTrend ? (
              <div className="p-6 text-center text-muted-foreground">Loading…</div>
            ) : spendTrend.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">No trend data yet.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead>Total spend</TableHead>
                    <TableHead>Transactions</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(spendTrend as Record<string, unknown>[]).map((r: Record<string, unknown>, i: number) => {
                    const monthRaw = r.month;
                    const monthStrVal = monthRaw ? (typeof monthRaw === 'string' ? monthRaw : new Date(monthRaw as string).toISOString().slice(0, 7)) : '';
                    const isDrill = drillMonth === monthStrVal;
                    return (
                      <TableRow
                        key={String(r.month ?? i)}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setDrillMonth(drillMonth === monthStrVal ? null : monthStrVal)}
                      >
                        <TableCell className="font-medium">{monthStr(r.month)}</TableCell>
                        <TableCell>{formatCurrencyFn(Number(r.total_spend ?? 0))}</TableCell>
                        <TableCell>{Number(r.total_transactions ?? 0).toLocaleString()}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDrillGrantType(null);
                              setDrillMonth(monthStrVal);
                              setTransactionsPage(1);
                            }}
                          >
                            {isDrill ? 'Hide transactions' : 'View transactions'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </Card>

        {/* Grant type breakdown: click row → drill to transactions for that grant type */}
        <Card>
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-semibold">Grant type breakdown</h3>
            <Button variant="outline" size="sm" onClick={exportGrantTypes} disabled={grantTypes.length === 0}>
              <Download className="h-4 w-4 mr-2" /> Export CSV
            </Button>
          </div>
          <div className="p-0">
            {loadingGrant ? (
              <div className="p-6 text-center text-muted-foreground">Loading…</div>
            ) : grantTypes.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">No data yet.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Grant type</TableHead>
                    <TableHead>Total vouchers</TableHead>
                    <TableHead>Total amount</TableHead>
                    <TableHead>Unique beneficiaries</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(grantTypes as Record<string, unknown>[]).map((r: Record<string, unknown>, i: number) => {
                    const gt = String(r.grant_type ?? '');
                    const isDrill = drillGrantType === gt;
                    return (
                      <TableRow
                        key={String(r.grant_type ?? i)}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setDrillGrantType(drillGrantType === gt ? null : gt)}
                      >
                        <TableCell className="font-medium">{gt || '—'}</TableCell>
                        <TableCell>{Number(r.total_vouchers ?? 0).toLocaleString()}</TableCell>
                        <TableCell>{formatCurrencyFn(Number(r.total_amount ?? 0))}</TableCell>
                        <TableCell>{Number(r.unique_beneficiaries ?? 0).toLocaleString()}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDrillMonth(null);
                              setDrillGrantType(gt);
                              setTransactionsPage(1);
                            }}
                          >
                            {isDrill ? 'Hide transactions' : 'View transactions'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </Card>

        {/* Drill-down: Individual transactions (smallest data point) */}
        <Card>
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-semibold">
              Individual transactions
              {drillGrantType && ` (grant type: ${drillGrantType})`}
              {drillMonth && !drillGrantType && ` (month: ${monthStr(drillMonth)})`}
            </h3>
            {(drillGrantType || drillMonth) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDrillGrantType(null);
                  setDrillMonth(null);
                  setTransactionsPage(1);
                }}
              >
                Clear filter
              </Button>
            )}
          </div>
          <div className="p-0">
            {loadingTransactions ? (
              <div className="p-6 text-center text-muted-foreground">Loading transactions…</div>
            ) : transactions.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                No transactions match the current filters. Select a grant type or month above to filter.
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Beneficiary</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Grant type</TableHead>
                      <TableHead>Redeemed</TableHead>
                      <TableHead>Region</TableHead>
                      <TableHead>Channel</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((t) => (
                      <TableRow key={String(t.id)}>
                        <TableCell className="font-mono text-xs">{String(t.voucher_code ?? t.id ?? '—')}</TableCell>
                        <TableCell>{String(t.beneficiary_name ?? t.beneficiary_id ?? '—')}</TableCell>
                        <TableCell>{formatCurrencyFn(Number(t.amount ?? 0))}</TableCell>
                        <TableCell>{String(t.grant_type ?? '—')}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">{formatDate(t.redeemed_at as string)}</TableCell>
                        <TableCell>{String(t.region ?? '—')}</TableCell>
                        <TableCell>{String(t.redemption_method ?? '—')}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewVoucherId(t.id as string)}
                          >
                            <Eye className="h-4 w-4 mr-1" /> View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {transactionsTotalPages > 1 && (
                  <div className="p-2 flex flex-col sm:flex-row justify-between items-center gap-4 border-t">
                    <span className="text-xs sm:text-sm text-muted-foreground">
                      Page {transactionsPage} of {transactionsTotalPages} ({transactionsTotal} total)
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={transactionsPage <= 1}
                        onClick={() => setTransactionsPage((p) => Math.max(1, p - 1))}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={transactionsPage >= transactionsTotalPages}
                        onClick={() => setTransactionsPage((p) => p + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </Card>
      </div>

      <VoucherDetailDialog
        voucherId={viewVoucherId}
        onClose={() => setViewVoucherId(null)}
        onViewBeneficiary={(id) => {
          setViewVoucherId(null);
          setViewBeneficiaryId(id);
        }}
      />
      <BeneficiaryDetailDialog beneficiaryId={viewBeneficiaryId} onClose={() => setViewBeneficiaryId(null)} />
    </Layout>
  );
}
