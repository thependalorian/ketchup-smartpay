/**
 * Beneficiary Registry - Government Portal
 * Read-only view of national beneficiary database
 */
import { useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { Button, Card, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@smartpay/ui';
import { Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { monitoringAPI } from '@smartpay/api-client/government';

const PAGE_SIZE = 10;
const REGIONS = ['Khomas', 'Erongo', 'Oshana', 'Omusati', 'Ohangwena', 'Oshikoto', 'Kavango East', 'Kavango West', 'Zambezi', 'Kunene', 'Otjozondjupa', 'Omaheke', 'Hardap', 'Karas'];
export default function BeneficiaryRegistry() {
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [viewId, setViewId] = useState<string | null>(null);

  const { data: beneficiaries = [], isLoading } = useQuery({
    queryKey: ['gov-beneficiaries', region, statusFilter, page],
    queryFn: () => monitoringAPI.getBeneficiaryRegistry({
      page: page + 1,
      limit: PAGE_SIZE,
      region: region || undefined,
      status: statusFilter || undefined,
    }),
  });

  const filtered = beneficiaries.filter(
    (b: Record<string, unknown>) =>
      String(b.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      String(b.phone ?? '').includes(search) ||
      String((b as { national_id?: string }).national_id ?? '').includes(search)
  );
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const pageData = filtered.slice(0, PAGE_SIZE);
  const selected = viewId ? beneficiaries.find((b: Record<string, unknown>) => b.id === viewId) : null;

  return (
    <Layout title="Beneficiary Registry" subtitle="View national beneficiary database (read-only)">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
          <p className="text-muted-foreground">Total: <span className="font-semibold text-foreground">{beneficiaries.length}</span> beneficiaries (page)</p>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by name, phone, ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 w-full sm:w-48 md:w-64" />
            </div>
            <select value={region} onChange={(e) => setRegion(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">All regions</option>
              {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="deceased">Deceased</option>
            </select>
          </div>
        </div>
        <Card>
          <div className="p-0">
            {isLoading ? (
              <div className="p-6 text-center text-muted-foreground">Loading...</div>
            ) : pageData.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">No beneficiaries found.</div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Region</TableHead>
                      <TableHead>Grant type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pageData.map((b: Record<string, unknown>) => (
                      <TableRow key={String(b.id)}>
                        <TableCell className="font-medium">{String(b.name ?? '—')}</TableCell>
                        <TableCell>{String(b.phone ?? '—')}</TableCell>
                        <TableCell>{String(b.region ?? '—')}</TableCell>
                        <TableCell>{String((b as { grant_type?: string }).grant_type ?? '—')}</TableCell>
                        <TableCell>
                          {String(b.status ?? '—') === 'deceased' ? (
                            <span className="inline-flex items-center rounded-md bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400">
                              Deceased
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                              {String(b.status ?? '—')}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" onClick={() => setViewId(b.id as string)}>View</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-t px-4 py-3">
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
      <Dialog open={!!viewId} onOpenChange={(open) => !open && setViewId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Beneficiary details</DialogTitle>
            <DialogDescription className="sr-only">View beneficiary name, phone, region, grant type and status.</DialogDescription>
          </DialogHeader>
          {selected ? (
            <div className="space-y-3 text-sm">
              <p><span className="font-medium text-muted-foreground">Name</span> {String(selected.name ?? '—')}</p>
              <p><span className="font-medium text-muted-foreground">Phone</span> {String(selected.phone ?? '—')}</p>
              <p><span className="font-medium text-muted-foreground">Region</span> {String(selected.region ?? '—')}</p>
              <p><span className="font-medium text-muted-foreground">Grant type</span> {String((selected as { grant_type?: string }).grant_type ?? '—')}</p>
              <p><span className="font-medium text-muted-foreground">Status</span>{' '}
                {String(selected.status ?? '—') === 'deceased' ? (
                  <span className="inline-flex items-center rounded-md bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400">
                    Deceased
                  </span>
                ) : (
                  String(selected.status ?? '—')
                )}
              </p>
              <DialogFooter><Button variant="outline" onClick={() => setViewId(null)}>Close</Button></DialogFooter>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
