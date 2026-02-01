/**
 * Audit Reports - Government Portal
 */
import { Layout } from '../components/layout/Layout';
import { Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@smartpay/ui';
import { useQuery } from '@tanstack/react-query';
import { auditAPI } from '@smartpay/api-client/government';

export default function AuditReports() {
  const { data: beneficiaryAudit } = useQuery({ queryKey: ['gov-audit-beneficiaries'], queryFn: () => auditAPI.getBeneficiaryAudit() });
  const { data: transactionAudit = [], isLoading: loadingTx } = useQuery({ queryKey: ['gov-audit-transactions'], queryFn: () => auditAPI.getTransactionAudit() });
  const { data: complianceAudit = [], isLoading: loadingComp } = useQuery({ queryKey: ['gov-audit-compliance'], queryFn: () => auditAPI.getComplianceAudit() });
  const ben = beneficiaryAudit && typeof beneficiaryAudit === 'object' ? (beneficiaryAudit as Record<string, unknown>) : null;
  return (
    <Layout title="Audit Reports" subtitle="Comprehensive audit trail and reports">
      <div className="space-y-6">
        {ben && Object.keys(ben).length > 0 && (
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Beneficiary data quality</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <p><span className="text-muted-foreground">Total records</span> <span className="font-semibold">{Number(ben.total_records ?? 0).toLocaleString()}</span></p>
              <p><span className="text-muted-foreground">Missing phone</span> <span className="font-semibold">{Number(ben.missing_phone ?? 0).toLocaleString()}</span></p>
              <p><span className="text-muted-foreground">Missing email</span> <span className="font-semibold">{Number(ben.missing_email ?? 0).toLocaleString()}</span></p>
              <p><span className="text-muted-foreground">Unique IDs</span> <span className="font-semibold">{Number(ben.unique_ids ?? 0).toLocaleString()}</span></p>
              <p><span className="text-muted-foreground">Duplicate IDs</span> <span className="font-semibold text-amber-600">{Number(ben.duplicate_ids ?? 0).toLocaleString()}</span></p>
            </div>
          </Card>
        )}
        <Card>
          <h3 className="p-4 border-b font-semibold">Transaction audit (recent)</h3>
          <div className="p-0">
            {loadingTx ? <div className="p-6 text-center text-muted-foreground">Loading...</div> : (transactionAudit as unknown[]).length === 0 ? <div className="p-6 text-center text-muted-foreground">No transaction audit data yet.</div> : (
              <Table>
                <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Type</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>Timestamp</TableHead></TableRow></TableHeader>
                <TableBody>
                  {(transactionAudit as Record<string, unknown>[]).slice(0, 20).map((r: Record<string, unknown>, i: number) => (
                    <TableRow key={String(r.id ?? i)}>
                      <TableCell className="font-mono text-xs">{String(r.id ?? '—')}</TableCell>
                      <TableCell>{String(r.type ?? '—')}</TableCell>
                      <TableCell>{Number(r.amount ?? 0).toLocaleString()}</TableCell>
                      <TableCell>{String(r.status ?? '—')}</TableCell>
                      <TableCell>{r.timestamp ? new Date(String(r.timestamp)).toLocaleString() : '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </Card>
        <Card>
          <h3 className="p-4 border-b font-semibold">Compliance audit</h3>
          <div className="p-0">
            {loadingComp ? <div className="p-6 text-center text-muted-foreground">Loading...</div> : (complianceAudit as unknown[]).length === 0 ? <div className="p-6 text-center text-muted-foreground">No compliance audit data yet.</div> : (
              <Table>
                <TableHeader><TableRow><TableHead>Check type</TableHead><TableHead>Coverage ratio</TableHead><TableHead>Status</TableHead><TableHead>Check date</TableHead></TableRow></TableHeader>
                <TableBody>
                  {(complianceAudit as Record<string, unknown>[]).map((r: Record<string, unknown>, i: number) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{String(r.check_type ?? '—')}</TableCell>
                      <TableCell>{String(r.coverage_ratio ?? '—')}</TableCell>
                      <TableCell>{String(r.status ?? '—')}</TableCell>
                      <TableCell>{r.check_date ? new Date(String(r.check_date)).toLocaleDateString() : '—'}</TableCell>
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
