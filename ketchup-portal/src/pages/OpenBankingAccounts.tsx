/**
 * Open Banking Accounts Page - Ketchup Portal
 * Purpose: View connected bank accounts (AIS)
 */
import { Layout } from '../components/layout/Layout';
import { Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Button } from '@smartpay/ui';

export default function OpenBankingAccounts() {
  const accounts: { id?: string; name?: string; type?: string; currency?: string }[] = [];
  const isLoading = false;

  return (
    <Layout title="My Accounts" subtitle="Connected bank accounts (Open Banking AIS)">
      <div className="space-y-6">
        <Card>
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-semibold">Bank accounts</h3>
            <Button size="sm">Link account</Button>
          </div>
          <div className="p-0">
            {isLoading ? (
              <div className="p-6 text-center text-muted-foreground">Loading accounts...</div>
            ) : accounts.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">No linked accounts. Use &quot;Link account&quot; to connect via Open Banking.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account name</TableHead>
                    <TableHead>Account ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Currency</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.slice(0, 20).map((a: { id?: string; name?: string; type?: string; currency?: string }) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.name ?? '—'}</TableCell>
                      <TableCell className="font-mono text-xs">{a.id ?? '—'}</TableCell>
                      <TableCell>{a.type ?? '—'}</TableCell>
                      <TableCell>{a.currency ?? 'NAD'}</TableCell>
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
