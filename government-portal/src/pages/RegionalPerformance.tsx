/**
 * Regional Performance - Government Portal
 *
 * Drill-down: Country summary → Regions → Region vouchers → Single voucher → Beneficiary.
 * Location: apps/government-portal/src/pages/RegionalPerformance.tsx
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
  Badge,
} from '@smartpay/ui';
import { Download, ChevronRight, Eye } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { monitoringAPI } from '@smartpay/api-client/government';
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

const PAGE_SIZE = 20;

export default function RegionalPerformance() {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [regionPage, setRegionPage] = useState(1);
  const [viewVoucherId, setViewVoucherId] = useState<string | null>(null);
  const [viewBeneficiaryId, setViewBeneficiaryId] = useState<string | null>(null);

  const { data: summary } = useQuery({
    queryKey: ['gov-regions-summary'],
    queryFn: () => monitoringAPI.getRegionalSummary(),
  });
  const { data: regions = [], isLoading } = useQuery({
    queryKey: ['gov-regions'],
    queryFn: () => monitoringAPI.getRegionalPerformance(),
  });
  const { data: regionVouchersData, isLoading: loadingVouchers } = useQuery({
    queryKey: ['gov-region-vouchers', selectedRegion, regionPage],
    queryFn: () =>
      monitoringAPI.getRegionVouchers(selectedRegion!, { page: regionPage, limit: PAGE_SIZE }),
    enabled: !!selectedRegion,
  });

  const regionVouchers = (regionVouchersData as { vouchers?: unknown[]; total?: number } | undefined)?.vouchers ?? [];
  const regionTotal = (regionVouchersData as { total?: number } | undefined)?.total ?? 0;
  const totalPages = Math.ceil(regionTotal / PAGE_SIZE) || 1;

  const s = summary as Record<string, unknown> | undefined;
  const handleExport = () => {
    const headers = ['Region', 'Total beneficiaries', 'Total vouchers', 'Total amount', 'Redemption rate %'];
    const rows = (regions as Record<string, unknown>[]).map((r) => [
      String(r.region ?? ''),
      String(r.total_beneficiaries ?? ''),
      String(r.total_vouchers ?? ''),
      String(r.total_amount ?? ''),
      String((Number(r.redemption_rate) || 0).toFixed(1)),
    ]);
    downloadCSV(headers, rows, 'regional-performance.csv');
  };

  return (
    <Layout title="Regional Performance" subtitle="Performance by region — drill to voucher and beneficiary">
      <div className="space-y-6">
        {/* Country-level summary (smallest unit = one row of aggregates; drill via regions) */}
        {s && Object.keys(s).length > 0 && (
          <Card className="p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Country summary</h3>
            <div className="flex flex-wrap gap-4">
              <span className="font-semibold">Vouchers: {Number(s.total_vouchers ?? 0).toLocaleString()}</span>
              <span>Beneficiaries: {Number(s.total_beneficiaries ?? 0).toLocaleString()}</span>
              <span>Total amount: {formatCurrency(Number(s.total_amount ?? 0))}</span>
              <span>Redemption rate: {(Number(s.redemption_rate) || 0).toFixed(1)}%</span>
              <div className="flex gap-2">
                <Badge variant="secondary">Issued {Number(s.issued ?? 0)}</Badge>
                <Badge variant="secondary">Delivered {Number(s.delivered ?? 0)}</Badge>
                <Badge variant="default">Redeemed {Number(s.redeemed ?? 0)}</Badge>
                <Badge variant="outline">Expired {Number(s.expired ?? 0)}</Badge>
                <Badge variant="destructive">Failed {Number(s.failed ?? 0)}</Badge>
                <Badge variant="outline">Pending {Number(s.pending ?? 0)}</Badge>
              </div>
            </div>
          </Card>
        )}

        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={regions.length === 0}>
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
        </div>

        <Card>
          <div className="p-0">
            {isLoading ? (
              <div className="p-6 text-center text-muted-foreground">Loading…</div>
            ) : regions.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">No regional data yet.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead></TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead>Total beneficiaries</TableHead>
                    <TableHead>Total vouchers</TableHead>
                    <TableHead>Total amount</TableHead>
                    <TableHead>Redemption rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(regions as Record<string, unknown>[]).map((r: Record<string, unknown>, i: number) => (
                    <TableRow
                      key={String(r.region ?? i)}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedRegion(selectedRegion === r.region ? null : (r.region as string))}
                    >
                      <TableCell className="w-8">
                        <ChevronRight
                          className={`h-4 w-4 transition-transform ${selectedRegion === r.region ? 'rotate-90' : ''}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{String(r.region ?? '—')}</TableCell>
                      <TableCell>{Number(r.total_beneficiaries ?? 0).toLocaleString()}</TableCell>
                      <TableCell>{Number(r.total_vouchers ?? 0).toLocaleString()}</TableCell>
                      <TableCell>{formatCurrency(Number(r.total_amount ?? 0))}</TableCell>
                      <TableCell>{(Number(r.redemption_rate) || 0).toFixed(1)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </Card>

        {/* Drill-down: vouchers in selected region (smallest unit = individual voucher) */}
        {selectedRegion && (
          <Card>
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-semibold">Vouchers in {selectedRegion}</h3>
              <Button variant="ghost" size="sm" onClick={() => setSelectedRegion(null)}>
                Close
              </Button>
            </div>
            <div className="p-0">
              {loadingVouchers ? (
                <div className="p-6 text-center text-muted-foreground">Loading vouchers…</div>
              ) : regionVouchers.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">No vouchers in this region.</div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Beneficiary</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Redeemed</TableHead>
                        <TableHead>Channel</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(regionVouchers as Record<string, unknown>[]).map((v: Record<string, unknown>) => (
                        <TableRow key={String(v.id)}>
                          <TableCell className="font-mono text-xs">{String(v.voucher_code ?? v.id ?? '—')}</TableCell>
                          <TableCell>{String(v.beneficiary_name ?? v.beneficiary_id ?? '—')}</TableCell>
                          <TableCell>{formatCurrency(Number(v.amount ?? 0))}</TableCell>
                          <TableCell><Badge variant="outline">{String(v.status ?? '—')}</Badge></TableCell>
                          <TableCell className="text-muted-foreground text-xs">{formatDate(v.redeemed_at as string)}</TableCell>
                          <TableCell>{String(v.redemption_method ?? '—')}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewVoucherId(v.id as string);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" /> View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {totalPages > 1 && (
                    <div className="p-2 flex justify-between items-center border-t">
                      <span className="text-sm text-muted-foreground">
                        Page {regionPage} of {totalPages} ({regionTotal} total)
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={regionPage <= 1}
                          onClick={() => setRegionPage((p) => Math.max(1, p - 1))}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={regionPage >= totalPages}
                          onClick={() => setRegionPage((p) => p + 1)}
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
        )}
      </div>

      <VoucherDetailDialog
        voucherId={viewVoucherId}
        onClose={() => setViewVoucherId(null)}
        onViewBeneficiary={(id) => {
          setViewVoucherId(null);
          setViewBeneficiaryId(id);
        }}
      />
      <BeneficiaryDetailDialog
        beneficiaryId={viewBeneficiaryId}
        onClose={() => setViewBeneficiaryId(null)}
      />
    </Layout>
  );
}
