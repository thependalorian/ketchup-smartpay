/**
 * Open Banking Consents Page - Ketchup Portal
 * Purpose: Manage AIS/PIS consents
 */
import { Layout } from '../components/layout/Layout';
import { Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Button } from '@smartpay/ui';

export default function OpenBankingConsents() {
  const consents: { id?: string; type?: string; status?: string; expiresAt?: string }[] = [];
  const isLoading = false;

  const formatDate = (d: string | undefined) => (d ? new Date(d).toLocaleDateString('en-NA') : '—');

  return (
    <Layout title="Manage Consents" subtitle="Your banking consents (Open Banking)">
      <div className="space-y-6">
        <Card>
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-semibold">Active consents</h3>
            <Button size="sm">New consent</Button>
          </div>
          <div className="p-0">
            {isLoading ? (
              <div className="p-6 text-center text-muted-foreground">Loading consents...</div>
            ) : consents.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">No consents yet. Use &quot;New consent&quot; to authorize account access or payments.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Consent ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expires</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {consents.slice(0, 20).map((c: { id?: string; type?: string; status?: string; expiresAt?: string }) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-xs">{c.id ?? '—'}</TableCell>
                      <TableCell>{c.type ?? '—'}</TableCell>
                      <TableCell>{c.status ?? '—'}</TableCell>
                      <TableCell>{formatDate(c.expiresAt)}</TableCell>
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
