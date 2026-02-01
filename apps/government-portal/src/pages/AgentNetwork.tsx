/**
 * Agent Network Status - Government Portal
 * Monitor agent network performance (read-only)
 */
import { useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { Button, Card, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@smartpay/ui';
import { Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { monitoringAPI } from '@smartpay/api-client/government';

const PAGE_SIZE = 10;

export default function AgentNetwork() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [viewAgent, setViewAgent] = useState<Record<string, unknown> | null>(null);

  const { data: agents = [], isLoading } = useQuery({
    queryKey: ['gov-agents'],
    queryFn: () => monitoringAPI.getAgentNetwork(),
  });

  const filtered = agents.filter((a: Record<string, unknown>) =>
    String(a.name ?? '').toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const pageData = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const formatCurrency = (n: number) => new Intl.NumberFormat('en-NA', { style: 'currency', currency: 'NAD', minimumFractionDigits: 0 }).format(n);

  return (
    <Layout title="Agent Network Status" subtitle="Monitor agent network performance">
      <div className="space-y-6">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <p className="text-muted-foreground">Total: <span className="font-semibold text-foreground">{filtered.length}</span> agents</p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 w-64" />
          </div>
        </div>
        <Card>
          <div className="p-0">
            {isLoading ? (
              <div className="p-6 text-center text-muted-foreground">Loading...</div>
            ) : pageData.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">No agents found.</div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Region</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Liquidity</TableHead>
                      <TableHead>Success rate</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pageData.map((a: Record<string, unknown>) => (
                      <TableRow key={String(a.id)}>
                        <TableCell className="font-medium">{String(a.name ?? '—')}</TableCell>
                        <TableCell>{String(a.location ?? '—')}</TableCell>
                        <TableCell>{String(a.region ?? '—')}</TableCell>
                        <TableCell>{String(a.status ?? '—')}</TableCell>
                        <TableCell>{formatCurrency(Number(a.liquidity_balance ?? 0))}</TableCell>
                        <TableCell>{Number(a.success_rate ?? 0) ? `${Number(a.success_rate) * 100}%` : '—'}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" onClick={() => setViewAgent(a)}>View</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {totalPages > 1 && (
                  <div className="flex justify-between border-t px-4 py-3">
                    <p className="text-sm text-muted-foreground">Page {page + 1} of {totalPages}</p>
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
      <Dialog open={!!viewAgent} onOpenChange={(open) => !open && setViewAgent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agent details</DialogTitle>
            <DialogDescription className="sr-only">View agent name, location, region, status, liquidity and success rate.</DialogDescription>
          </DialogHeader>
          {viewAgent ? (
            <div className="space-y-3 text-sm">
              <p><span className="font-medium text-muted-foreground">Name</span> {String(viewAgent.name ?? '—')}</p>
              <p><span className="font-medium text-muted-foreground">Location</span> {String(viewAgent.location ?? '—')}</p>
              <p><span className="font-medium text-muted-foreground">Region</span> {String(viewAgent.region ?? '—')}</p>
              <p><span className="font-medium text-muted-foreground">Status</span> {String(viewAgent.status ?? '—')}</p>
              <p><span className="font-medium text-muted-foreground">Liquidity</span> {formatCurrency(Number(viewAgent.liquidity_balance ?? 0))}</p>
              <p><span className="font-medium text-muted-foreground">Success rate</span> {Number(viewAgent.success_rate) ? `${Number(viewAgent.success_rate) * 100}%` : '—'}</p>
              <DialogFooter><Button variant="outline" onClick={() => setViewAgent(null)}>Close</Button></DialogFooter>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
