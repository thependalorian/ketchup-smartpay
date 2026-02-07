/**
 * BeneficiaryDetailDialog
 *
 * Purpose: Drill-down to smallest unit – single beneficiary by id.
 * Used from VoucherDetailDialog and anywhere a beneficiary link is shown.
 * Location: apps/government-portal/src/components/BeneficiaryDetailDialog.tsx
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

interface BeneficiaryDetailDialogProps {
  beneficiaryId: string | null;
  onClose: () => void;
}

function formatDate(v: string | null | undefined) {
  if (!v) return '—';
  try {
    return new Date(v).toLocaleString();
  } catch {
    return String(v);
  }
}

export function BeneficiaryDetailDialog({ beneficiaryId, onClose }: BeneficiaryDetailDialogProps) {
  const { data: beneficiary, isLoading, error } = useQuery({
    queryKey: ['gov-beneficiary', beneficiaryId],
    queryFn: () => monitoringAPI.getBeneficiaryById(beneficiaryId!),
    enabled: !!beneficiaryId,
  });

  const b = beneficiary as Record<string, unknown> | undefined;

  return (
    <Dialog open={!!beneficiaryId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Beneficiary details</DialogTitle>
          <DialogDescription className="sr-only">View beneficiary ID, name, region, grant type and status.</DialogDescription>
        </DialogHeader>
        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {error && <p className="text-sm text-destructive">Failed to load beneficiary.</p>}
        {b && !error && (
          <div className="grid gap-2 text-sm">
            <div className="grid grid-cols-[120px_1fr] gap-1">
              <span className="text-muted-foreground">ID</span>
              <span className="font-mono">{String(b.id ?? '—')}</span>
              <span className="text-muted-foreground">Name</span>
              <span>{String(b.name ?? '—')}</span>
              <span className="text-muted-foreground">Phone</span>
              <span>{String(b.phone ?? '—')}</span>
              <span className="text-muted-foreground">Region</span>
              <span>{String(b.region ?? '—')}</span>
              <span className="text-muted-foreground">Grant type</span>
              <span>{String(b.grant_type ?? '—')}</span>
              <span className="text-muted-foreground">Status</span>
              <span>{String(b.status ?? '—')}</span>
              <span className="text-muted-foreground">ID number</span>
              <span>{String(b.id_number ?? '—')}</span>
              <span className="text-muted-foreground">Enrolled</span>
              <span>{formatDate(b.enrolled_at as string)}</span>
              <span className="text-muted-foreground">Last payment</span>
              <span>{formatDate(b.last_payment as string)}</span>
              <span className="text-muted-foreground">Deceased</span>
              <span>{b.deceased_at ? formatDate(b.deceased_at as string) : '—'}</span>
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
