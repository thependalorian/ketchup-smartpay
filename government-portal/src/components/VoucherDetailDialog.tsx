/**
 * VoucherDetailDialog
 *
 * Purpose: Drill-down to smallest unit – single voucher by id.
 * Used by Regional Performance (region vouchers) and Analytics (transactions).
 * Location: apps/government-portal/src/components/VoucherDetailDialog.tsx
 */

import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
} from '@smartpay/ui';
import { monitoringAPI } from '@smartpay/api-client/government';

interface VoucherDetailDialogProps {
  voucherId: string | null;
  onClose: () => void;
  onViewBeneficiary?: (beneficiaryId: string) => void;
}

function formatDate(v: string | null | undefined) {
  if (!v) return '—';
  try {
    return new Date(v).toLocaleString();
  } catch {
    return String(v);
  }
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-NA', { style: 'currency', currency: 'NAD', minimumFractionDigits: 0 }).format(n);
}

export function VoucherDetailDialog({
  voucherId,
  onClose,
  onViewBeneficiary,
}: VoucherDetailDialogProps) {
  const { data: voucher, isLoading, error } = useQuery({
    queryKey: ['gov-voucher', voucherId],
    queryFn: () => monitoringAPI.getVoucherById(voucherId!),
    enabled: !!voucherId,
  });

  const v = voucher as Record<string, unknown> | undefined;
  const beneficiaryId = v?.beneficiary_id as string | undefined;

  return (
    <Dialog open={!!voucherId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Voucher details</DialogTitle>
          <DialogDescription className="sr-only">View voucher ID, amount, status and redemption details.</DialogDescription>
        </DialogHeader>
        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {error && <p className="text-sm text-destructive">Failed to load voucher.</p>}
        {v && !error && (
          <div className="grid gap-2 text-sm">
            <div className="grid grid-cols-[120px_1fr] gap-1">
              <span className="text-muted-foreground">ID</span>
              <span className="font-mono">{String(v.id ?? '—')}</span>
              <span className="text-muted-foreground">Code</span>
              <span>{String(v.voucher_code ?? '—')}</span>
              <span className="text-muted-foreground">Status</span>
              <span>{String(v.status ?? '—')}</span>
              <span className="text-muted-foreground">Amount</span>
              <span>{formatCurrency(Number(v.amount ?? 0))}</span>
              <span className="text-muted-foreground">Grant type</span>
              <span>{String(v.grant_type ?? '—')}</span>
              <span className="text-muted-foreground">Region</span>
              <span>{String(v.region ?? '—')}</span>
              <span className="text-muted-foreground">Redemption</span>
              <span>{String(v.redemption_method ?? '—')}</span>
              <span className="text-muted-foreground">Issued</span>
              <span>{formatDate(v.issued_at as string)}</span>
              <span className="text-muted-foreground">Expiry</span>
              <span>{formatDate(v.expiry_date as string)}</span>
              <span className="text-muted-foreground">Redeemed</span>
              <span>{formatDate(v.redeemed_at as string)}</span>
              <span className="text-muted-foreground">Beneficiary</span>
              <span>
                {beneficiaryId && onViewBeneficiary ? (
                  <Button
                    type="button"
                    variant="link"
                    className="h-auto p-0 text-primary"
                    onClick={() => onViewBeneficiary(beneficiaryId)}
                  >
                    {String(v.beneficiary_name ?? v.beneficiary_id ?? 'View')}
                  </Button>
                ) : (
                  String(v.beneficiary_name ?? v.beneficiary_id ?? '—')
                )}
              </span>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
