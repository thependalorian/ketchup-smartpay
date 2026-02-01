/**
 * Agents Page - Ketchup Portal
 * Purpose: Agent management with table, filters, and View detail modal
 * Location: apps/ketchup-portal/src/pages/Agents.tsx
 */

import { useState } from 'react';
import { Layout } from '../components/layout/Layout';
import {
  Button, Card, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription,
} from '@smartpay/ui';
import { Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { agentAPI } from '@smartpay/api-client/ketchup';
import type { Agent } from '@smartpay/api-client/ketchup';

const PAGE_SIZE = 10;

export default function Agents() {
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const [viewAgent, setViewAgent] = useState<Agent | null>(null);

  const { data: agentsResponse, isLoading } = useQuery({
    queryKey: ['agents', region, status],
    queryFn: () => agentAPI.getAll({ region: region || undefined, status: status || undefined }),
  });
  const { data: stats } = useQuery({ queryKey: ['agent-stats'], queryFn: () => agentAPI.getStats() });

  const agents = Array.isArray(agentsResponse) ? agentsResponse : (agentsResponse?.data ?? []);
  const filtered = agents.filter(
    (a) =>
      a.name?.toLowerCase().includes(search.toLowerCase()) &&
      (region ? a.region === region : true) &&
      (status ? a.status === status : true)
  );
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const pageData = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const formatCurrency = (n: number) => new Intl.NumberFormat('en-NA', { style: 'currency', currency: 'NAD', minimumFractionDigits: 0 }).format(n);

  return (
    <Layout title="Agents" subtitle="Agent network management">
      <div className="space-y-6">
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4"><p className="text-sm text-muted-foreground">Total agents</p><p className="text-2xl font-semibold">{stats.total}</p></Card>
            <Card className="p-4"><p className="text-sm text-muted-foreground">Active</p><p className="text-2xl font-semibold text-green-600">{stats.active}</p></Card>
            <Card className="p-4"><p className="text-sm text-muted-foreground">Volume today</p><p className="text-2xl font-semibold">{formatCurrency(stats.totalVolumeToday ?? 0)}</p></Card>
            <Card className="p-4"><p className="text-sm text-muted-foreground">Avg success rate</p><p className="text-2xl font-semibold">{((stats.avgSuccessRate ?? 0) * 100).toFixed(1)}%</p></Card>
          </div>
        )}
        <div className="flex flex-wrap justify-between items-center gap-4">
          <p className="text-muted-foreground">Total: <span className="font-semibold text-foreground">{filtered.length}</span> agents</p>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by name..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 w-64" />
            </div>
            <select value={region} onChange={(e) => setRegion(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">All regions</option>
              <option value="Khomas">Khomas</option>
              <option value="Erongo">Erongo</option>
              <option value="Oshana">Oshana</option>
              <option value="Otjozondjupa">Otjozondjupa</option>
            </select>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="low_liquidity">Low liquidity</option>
            </select>
          </div>
        </div>

        {/* View Agent dialog */}
        <Dialog open={!!viewAgent} onOpenChange={(open) => !open && setViewAgent(null)}>
          <DialogContent aria-describedby="agent-details-desc">
            <DialogHeader>
              <DialogTitle>Agent details</DialogTitle>
              <DialogDescription id="agent-details-desc" className="sr-only">View name, type, region, status, liquidity and transaction stats for this agent.</DialogDescription>
            </DialogHeader>
            {viewAgent ? (
              <div className="space-y-3 text-sm">
                <p><span className="font-medium text-muted-foreground">Name</span> {viewAgent.name}</p>
                <p><span className="font-medium text-muted-foreground">Type</span> {viewAgent.type}</p>
                <p><span className="font-medium text-muted-foreground">Region</span> {viewAgent.region}</p>
                <p><span className="font-medium text-muted-foreground">Status</span> {viewAgent.status}</p>
                <p><span className="font-medium text-muted-foreground">Liquidity</span> {formatCurrency(viewAgent.liquidity ?? 0)}</p>
                <p><span className="font-medium text-muted-foreground">Transactions today</span> {viewAgent.transactionsToday ?? 0}</p>
                <p><span className="font-medium text-muted-foreground">Volume today</span> {formatCurrency(viewAgent.volumeToday ?? 0)}</p>
                <p><span className="font-medium text-muted-foreground">Success rate</span> {((viewAgent.successRate ?? 0) * 100).toFixed(1)}%</p>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setViewAgent(null)}>Close</Button>
                </DialogFooter>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>

        <Card>
          <div className="p-0">
            {isLoading ? (
              <div className="p-6 text-center text-muted-foreground">Loading agents...</div>
            ) : pageData.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">No agents found.</div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Region</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Liquidity</TableHead>
                      <TableHead>Transactions today</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pageData.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{a.name}</TableCell>
                        <TableCell className="capitalize">{a.type}</TableCell>
                        <TableCell>{a.region}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${a.status === 'active' ? 'bg-green-100 text-green-800' : a.status === 'low_liquidity' ? 'bg-amber-100 text-amber-800' : 'bg-muted text-muted-foreground'}`}>{a.status}</span>
                        </TableCell>
                        <TableCell>{formatCurrency(a.liquidity ?? 0)}</TableCell>
                        <TableCell>{a.transactionsToday ?? 0}</TableCell>
                        <TableCell className="text-right"><Button variant="outline" size="sm" onClick={() => setViewAgent(a)}>View</Button></TableCell>
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
