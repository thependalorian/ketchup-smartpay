/**
 * Vouchers Page - Ketchup Portal
 * Purpose: View and manage vouchers with table, filters, View detail and Issue voucher modals
 * Location: apps/ketchup-portal/src/pages/Vouchers.tsx
 */

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import {
  Button, Card, Input, Label, Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  Dialog, DialogContent, DialogFooter, DialogTitle, DialogDescription,
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@smartpay/ui';
import { Plus, Search, Calendar, XCircle, RefreshCw, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { voucherAPI } from '@smartpay/api-client/ketchup';
import type { IssueVoucherDTO } from '@smartpay/api-client';
import { BeneficiarySelector } from '../components/beneficiary/BeneficiarySelector';

const PAGE_SIZE = 10;
const GRANT_TYPES = ['social_grant', 'subsidy', 'pension', 'disability'];

export default function Vouchers() {
  const [searchParams, setSearchParams] = useSearchParams();
  const viewFromUrl = searchParams.get('view');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');
  const [page, setPage] = useState(0);
  const [viewId, setViewId] = useState<string | null>(viewFromUrl);
  const [issueOpen, setIssueOpen] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (viewFromUrl && viewFromUrl !== viewId) setViewId(viewFromUrl);
  }, [viewFromUrl]);

  const { data: vouchers = [], isLoading } = useQuery({
    queryKey: ['vouchers', status],
    queryFn: () => voucherAPI.getAll({ status: status || undefined, limit: 500 }),
  });
  const { data: viewVoucher, isLoading: loadingView } = useQuery({
    queryKey: ['voucher', viewId],
    queryFn: () => voucherAPI.getById(viewId!),
    enabled: !!viewId,
  });
  const issueMutation = useMutation({
    mutationFn: (data: IssueVoucherDTO) => voucherAPI.issue(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['vouchers'] }); setIssueOpen(false); },
  });
  const extendMutation = useMutation({
    mutationFn: ({ id, expiryDate }: { id: string; expiryDate: string }) => voucherAPI.extendExpiry(id, expiryDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
      if (viewId) queryClient.invalidateQueries({ queryKey: ['voucher', viewId] });
    },
  });
  const cancelMutation = useMutation({
    mutationFn: (id: string) => voucherAPI.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
      if (viewId) queryClient.invalidateQueries({ queryKey: ['voucher', viewId] });
      setViewId(null);
      setSearchParams((p) => { p.delete('view'); return p; });
    },
  });
  const reissueMutation = useMutation({
    mutationFn: ({ id, cancelOld }: { id: string; cancelOld?: boolean }) => voucherAPI.reissue(id, { cancelOld }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
      if (viewId) queryClient.invalidateQueries({ queryKey: ['voucher', viewId] });
      setViewId(null);
      setSearchParams((p) => { p.delete('view'); return p; });
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => voucherAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
      setViewId(null);
      setSearchParams((p) => { p.delete('view'); return p; });
    },
  });

  const filtered = vouchers.filter(
    (v) =>
      (v.voucherCode?.toLowerCase().includes(search.toLowerCase()) ||
        (v as { beneficiaryName?: string }).beneficiaryName?.toLowerCase().includes(search.toLowerCase()) ||
        v.beneficiaryId?.includes(search)) &&
      (status ? (v.status === status) : true)
  );
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const pageData = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-NA', { style: 'currency', currency: 'NAD', minimumFractionDigits: 0 }).format(amount);
  const formatDate = (d: string | Date) => (d ? new Date(d).toLocaleDateString('en-NA', { dateStyle: 'short' }) : '—');
  // Ketchup assigns every voucher to a beneficiary; show name or ID (never "Unassigned")
  const beneficiaryDisplay = (v: { beneficiaryName?: string; beneficiaryId?: string }) =>
    (v as { beneficiaryName?: string }).beneficiaryName?.trim() || v.beneficiaryId || '—';
  const codeDisplay = (v: { voucherCode?: string; id?: string }) =>
    v.voucherCode?.trim() || (v.id ? `VC-${v.id.slice(0, 8)}` : '—');

  return (
    <Layout title="Vouchers" subtitle="View and manage all vouchers">
      <div className="space-y-6">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <p className="text-muted-foreground">
            Total: <span className="font-semibold text-foreground">{filtered.length}</span> vouchers
          </p>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by code, beneficiary..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="issued">Issued</option>
              <option value="delivered">Delivered</option>
              <option value="redeemed">Redeemed</option>
              <option value="expired">Expired</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <Button onClick={() => setIssueOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Issue voucher
            </Button>
          </div>
        </div>

        {/* View voucher dialog with Extend / Cancel / Reissue */}
        <Dialog open={!!viewId} onOpenChange={(open) => { if (!open) { setViewId(null); setSearchParams((p) => { p.delete('view'); return p; }); } }}>
          <DialogContent className="max-w-lg">
            <DialogTitle>Voucher details</DialogTitle>
            <DialogDescription className="sr-only">View code, beneficiary, amount, status and dates. Extend, cancel, or reissue when applicable.</DialogDescription>
            {loadingView ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : viewVoucher ? (
              <VoucherDetailContent
                voucher={viewVoucher}
                codeDisplay={codeDisplay}
                beneficiaryDisplay={beneficiaryDisplay}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
                onClose={() => { setViewId(null); setSearchParams((p) => { p.delete('view'); return p; }); }}
                onExtend={(expiryDate) => { extendMutation.mutate({ id: viewVoucher.id, expiryDate }); }}
                onCancel={() => cancelMutation.mutate(viewVoucher.id)}
                onReissue={() => reissueMutation.mutate({ id: viewVoucher.id, cancelOld: true })}
                onDelete={() => deleteMutation.mutate(viewVoucher.id)}
                extendPending={extendMutation.isPending}
                cancelPending={cancelMutation.isPending}
                reissuePending={reissueMutation.isPending}
                deletePending={deleteMutation.isPending}
                deleteError={deleteMutation.isError ? (deleteMutation.error as Error)?.message : null}
              />
            ) : null}
          </DialogContent>
        </Dialog>

        {/* Issue voucher modal */}
        <Dialog open={issueOpen} onOpenChange={setIssueOpen}>
          <DialogContent>
            <DialogTitle>Issue voucher</DialogTitle>
            <DialogDescription className="sr-only">Select beneficiary and amount to issue a new voucher.</DialogDescription>
            <IssueVoucherForm
              onSubmit={(data) => issueMutation.mutate(data)}
              onCancel={() => setIssueOpen(false)}
              isSubmitting={issueMutation.isPending}
            />
          </DialogContent>
        </Dialog>

        <Card>
          <div className="p-0">
            {isLoading ? (
              <div className="p-6 text-center text-muted-foreground">Loading vouchers...</div>
            ) : pageData.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">No vouchers found.</div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Beneficiary</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Issued</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pageData.map((v) => (
                      <TableRow key={v.id}>
                        <TableCell className="font-mono text-xs">{codeDisplay(v)}</TableCell>
                        <TableCell>{beneficiaryDisplay(v)}</TableCell>
                        <TableCell>{formatCurrency((v as { amount?: number }).amount ?? 0)}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            v.status === 'redeemed' ? 'bg-green-100 text-green-800' :
                            v.status === 'pending' || v.status === 'issued' ? 'bg-amber-100 text-amber-800' :
                            v.status === 'expired' ? 'bg-red-100 text-red-800' : 'bg-muted text-muted-foreground'
                          }`}>
                            {v.status ?? '—'}
                          </span>
                        </TableCell>
                        <TableCell>{formatDate((v as { createdAt?: string; issuedAt?: string }).issuedAt ?? (v as { createdAt?: string }).createdAt ?? '')}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" onClick={() => { setViewId(v.id); setSearchParams({ view: v.id }); }}>View</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t px-4 py-3">
                    <p className="text-sm text-muted-foreground">Page {page + 1} of {totalPages} ({filtered.length} results)</p>
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

/** Voucher detail body with Extend / Cancel / Reissue / Delete. Delete not allowed for redeemed (audit). */
function VoucherDetailContent({
  voucher,
  codeDisplay,
  beneficiaryDisplay,
  formatCurrency,
  formatDate,
  onClose,
  onExtend,
  onCancel,
  onReissue,
  onDelete,
  extendPending,
  cancelPending,
  reissuePending,
  deletePending,
  deleteError,
}: {
  voucher: { id: string; status: string; voucherCode?: string; beneficiaryName?: string; beneficiaryId?: string; amount?: number; issuedAt?: string; createdAt?: string; expiryDate?: string };
  codeDisplay: (v: { voucherCode?: string; id?: string }) => string;
  beneficiaryDisplay: (v: { beneficiaryName?: string; beneficiaryId?: string }) => string;
  formatCurrency: (n: number) => string;
  formatDate: (d: string | Date) => string;
  onClose: () => void;
  onExtend: (expiryDate: string) => void;
  onCancel: () => void;
  onReissue: () => void;
  onDelete: () => void;
  extendPending: boolean;
  cancelPending: boolean;
  reissuePending: boolean;
  deletePending: boolean;
  deleteError: string | null;
}) {
  const [extendDate, setExtendDate] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const canAct = voucher.status === 'issued' || voucher.status === 'delivered';
  const canDelete = voucher.status !== 'redeemed'; // Keep redeemed for audit
  const currentExpiry = voucher.expiryDate ? new Date(voucher.expiryDate) : null;
  const minExtend = currentExpiry && currentExpiry > new Date() ? currentExpiry.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-4 text-sm">
      {deleteError && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-destructive" role="alert">{deleteError}</p>
      )}
      <div className="space-y-2">
        <p><span className="font-medium text-muted-foreground">ID</span> <span className="font-mono text-xs">{voucher.id}</span></p>
        <p><span className="font-medium text-muted-foreground">Code</span> {codeDisplay(voucher)}</p>
        <p><span className="font-medium text-muted-foreground">Beneficiary</span> {beneficiaryDisplay(voucher)}</p>
        <p><span className="font-medium text-muted-foreground">Amount</span> {formatCurrency(voucher.amount ?? 0)}</p>
        <p><span className="font-medium text-muted-foreground">Status</span> {voucher.status}</p>
        <p><span className="font-medium text-muted-foreground">Issued</span> {formatDate(voucher.issuedAt ?? voucher.createdAt ?? '')}</p>
        <p><span className="font-medium text-muted-foreground">Expiry</span> {formatDate(voucher.expiryDate ?? '')}</p>
      </div>
      {canAct && (
        <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
          <p className="font-medium text-muted-foreground">Actions</p>
          <div className="flex flex-wrap gap-2 items-center">
            <Label htmlFor="extend-date" className="sr-only">New expiry date</Label>
            <Input
              id="extend-date"
              type="date"
              min={minExtend}
              value={extendDate}
              onChange={(e) => setExtendDate(e.target.value)}
              className="w-40"
            />
            <Button
              size="sm"
              variant="outline"
              disabled={!extendDate || extendPending}
              onClick={() => extendDate && onExtend(new Date(extendDate).toISOString())}
            >
              <Calendar className="h-4 w-4 mr-1" />
              {extendPending ? 'Extending...' : 'Extend'}
            </Button>
            <Button size="sm" variant="outline" disabled={cancelPending} onClick={onCancel}>
              <XCircle className="h-4 w-4 mr-1" />
              {cancelPending ? 'Cancelling...' : 'Cancel voucher'}
            </Button>
            <Button size="sm" variant="outline" disabled={reissuePending} onClick={onReissue}>
              <RefreshCw className="h-4 w-4 mr-1" />
              {reissuePending ? 'Reissuing...' : 'Reissue new voucher'}
            </Button>
          </div>
        </div>
      )}
      {canDelete && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <p className="font-medium text-muted-foreground mb-2">Danger zone</p>
          <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
            <Button size="sm" variant="destructive" disabled={deletePending} onClick={() => setDeleteConfirmOpen(true)}>
              <Trash2 className="h-4 w-4 mr-1" />
              {deletePending ? 'Deleting...' : 'Delete voucher'}
            </Button>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete voucher?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove this voucher and its related records. Redeemed vouchers cannot be deleted (audit trail). This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => { onDelete(); setDeleteConfirmOpen(false); }}
                  disabled={deletePending}
                >
                  {deletePending ? 'Deleting...' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Close</Button>
      </DialogFooter>
    </div>
  );
}

function IssueVoucherForm({
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  onSubmit: (data: IssueVoucherDTO) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const [beneficiaryId, setBeneficiaryId] = useState('');
  const [amount, setAmount] = useState('');
  const [grantType, setGrantType] = useState(GRANT_TYPES[0]);
  const [expiryDays, setExpiryDays] = useState('30');
  const [scheduledIssueAt, setScheduledIssueAt] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    const beneficiaryIdTrimmed = beneficiaryId.trim();
    const amt = parseInt(amount, 10);
    if (!beneficiaryIdTrimmed) {
      setValidationError('Beneficiary is required. Ketchup assigns every voucher to a beneficiary.');
      return;
    }
    if (isNaN(amt) || amt < 1) {
      setValidationError('Amount must be at least 1 NAD.');
      return;
    }
    let scheduled: string | undefined;
    if (scheduledIssueAt.trim()) {
      const d = new Date(scheduledIssueAt.trim());
      if (Number.isNaN(d.getTime())) {
        setValidationError('Scheduled issue date must be a valid date.');
        return;
      }
      if (d.getTime() < Date.now()) {
        setValidationError('Scheduled issue date must not be in the past.');
        return;
      }
      scheduled = d.toISOString();
    }
    const expiryNum = expiryDays ? parseInt(expiryDays, 10) : undefined;
    if (expiryNum !== undefined && (isNaN(expiryNum) || expiryNum < 1)) {
      setValidationError('Expiry days must be at least 1 when provided.');
      return;
    }
    onSubmit({
      beneficiaryId: beneficiaryIdTrimmed,
      amount: amt,
      grantType,
      expiryDays: expiryNum,
      scheduledIssueAt: scheduled,
    });
  };

  const minScheduleDate = new Date().toISOString().slice(0, 16);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {validationError && (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {validationError}
        </div>
      )}
      <BeneficiarySelector
        id="issue-beneficiary"
        label="Beneficiary (required)"
        value={beneficiaryId}
        onChange={(id) => { setBeneficiaryId(id); setValidationError(null); }}
        aria-describedby="issue-voucher-desc"
        error={validationError && !beneficiaryId ? validationError : undefined}
      />
      <div>
        <Label htmlFor="issue-amount">Amount (NAD) (required)</Label>
        <Input
          id="issue-amount"
          type="number"
          min={1}
          max={1000000}
          value={amount}
          onChange={(e) => { setAmount(e.target.value); setValidationError(null); }}
          className="mt-1"
          required
        />
      </div>
      <div>
        <Label htmlFor="issue-grantType">Grant type</Label>
        <select id="issue-grantType" value={grantType} onChange={(e) => setGrantType(e.target.value)} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
          {GRANT_TYPES.map((g) => <option key={g} value={g}>{g.replace('_', ' ')}</option>)}
        </select>
      </div>
      <div>
        <Label htmlFor="issue-expiryDays">Expiry (days)</Label>
        <Input id="issue-expiryDays" type="number" min={1} max={365} value={expiryDays} onChange={(e) => setExpiryDays(e.target.value)} className="mt-1" placeholder="30" />
      </div>
      <div>
        <Label htmlFor="issue-scheduled">Schedule issuance date (optional)</Label>
        <Input
          id="issue-scheduled"
          type="datetime-local"
          min={minScheduleDate}
          value={scheduledIssueAt}
          onChange={(e) => setScheduledIssueAt(e.target.value)}
          className="mt-1"
          aria-describedby="issue-scheduled-hint"
        />
        <p id="issue-scheduled-hint" className="mt-1 text-xs text-muted-foreground">Leave empty to issue immediately. Future date sets when the voucher is effective.</p>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Issuing...' : 'Issue voucher'}</Button>
      </DialogFooter>
    </form>
  );
}
