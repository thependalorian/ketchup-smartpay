/**
 * Beneficiaries Page - Ketchup Portal
 * Purpose: Manage beneficiaries with table, search, filters, pagination, Add/View/Edit modals
 * Location: apps/ketchup-portal/src/pages/Beneficiaries.tsx
 */

import { useState, useEffect } from 'react';
import { Layout } from '../components/layout/Layout';
import {
  Button, Card, Input, Label, Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription,
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@smartpay/ui';
import { Plus, Search, UserMinus, Users, Pencil, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { beneficiaryAPI } from '@smartpay/api-client/ketchup';
import type { CreateBeneficiaryDTO, UpdateBeneficiaryDTO, Dependant, CreateDependantDTO, UpdateDependantDTO } from '@smartpay/api-client';

const PAGE_SIZE = 10;
const REGIONS = ['Khomas', 'Erongo', 'Oshana', 'Omusati', 'Ohangwena', 'Oshikoto', 'Kavango East', 'Kavango West', 'Zambezi', 'Kunene', 'Otjozondjupa', 'Omaheke', 'Hardap', 'Karas'];
const GRANT_TYPES = ['social_grant', 'subsidy', 'pension', 'disability'];
const DEPENDANT_RELATIONSHIPS: Array<'child' | 'spouse' | 'guardian' | 'other'> = ['child', 'spouse', 'guardian', 'other'];

export default function Beneficiaries() {
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const [viewId, setViewId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [markDeceasedOpen, setMarkDeceasedOpen] = useState(false);
  const [addDependantOpen, setAddDependantOpen] = useState(false);
  const [editDependantId, setEditDependantId] = useState<string | null>(null);
  const [deleteDependantId, setDeleteDependantId] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const { data: beneficiaries = [], isLoading, isError, error } = useQuery({
    queryKey: ['beneficiaries', region, statusFilter],
    queryFn: () => beneficiaryAPI.getAll({ region: region || undefined, status: statusFilter || undefined }),
  });
  const { data: viewBeneficiary, isLoading: loadingView } = useQuery({
    queryKey: ['beneficiary', viewId],
    queryFn: () => beneficiaryAPI.getById(viewId!),
    enabled: !!viewId,
  });
  const createMutation = useMutation({
    mutationFn: (data: CreateBeneficiaryDTO) => beneficiaryAPI.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['beneficiaries'] }); setAddOpen(false); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBeneficiaryDTO }) => beneficiaryAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beneficiaries'] });
      setEditId(null);
      setMarkDeceasedOpen(false);
      if (viewId) queryClient.invalidateQueries({ queryKey: ['beneficiary', viewId] });
    },
  });
  const createDependantMutation = useMutation({
    mutationFn: ({ beneficiaryId, data }: { beneficiaryId: string; data: CreateDependantDTO }) => beneficiaryAPI.createDependant(beneficiaryId, data),
    onSuccess: () => {
      if (viewId) queryClient.invalidateQueries({ queryKey: ['dependants', viewId] });
      setAddDependantOpen(false);
    },
  });
  const updateDependantMutation = useMutation({
    mutationFn: ({ beneficiaryId, dependantId, data }: { beneficiaryId: string; dependantId: string; data: UpdateDependantDTO }) =>
      beneficiaryAPI.updateDependant(beneficiaryId, dependantId, data),
    onSuccess: () => {
      if (viewId) queryClient.invalidateQueries({ queryKey: ['dependants', viewId] });
      setEditDependantId(null);
    },
  });
  const deleteDependantMutation = useMutation({
    mutationFn: ({ beneficiaryId, dependantId }: { beneficiaryId: string; dependantId: string }) => beneficiaryAPI.deleteDependant(beneficiaryId, dependantId),
    onSuccess: () => {
      if (viewId) queryClient.invalidateQueries({ queryKey: ['dependants', viewId] });
      setDeleteDependantId(null);
    },
  });

  const filtered = beneficiaries.filter(
    (b) =>
      (b.name?.toLowerCase().includes(search.toLowerCase()) ||
        b.phone?.includes(search) ||
        (b as { nationalId?: string }).nationalId?.includes(search)) &&
      (region ? b.region === region : true) &&
      (statusFilter ? (b as { status?: string }).status === statusFilter : true)
  );
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const pageData = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <Layout title="Beneficiaries" subtitle="Manage beneficiary registry">
      <div className="space-y-6">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <p className="text-muted-foreground">
            Total: <span className="font-semibold text-foreground">{filtered.length.toLocaleString()}</span> beneficiaries
          </p>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, phone, ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">All regions</option>
              {REGIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
              <option value="pending">Pending</option>
              <option value="deceased">Deceased</option>
            </select>
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Beneficiary
            </Button>
          </div>
        </div>

        {/* Add Beneficiary modal */}
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent aria-describedby="add-beneficiary-desc">
            <DialogHeader>
              <DialogTitle>Add beneficiary</DialogTitle>
              <DialogDescription id="add-beneficiary-desc" className="sr-only">Enter name, phone, region and grant type to add a new beneficiary.</DialogDescription>
            </DialogHeader>
            <AddBeneficiaryForm
              onSubmit={(data) => createMutation.mutate(data)}
              onCancel={() => setAddOpen(false)}
              isSubmitting={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>

        {/* View Beneficiary dialog */}
        <Dialog open={!!viewId} onOpenChange={(open) => !open && (setViewId(null), setAddDependantOpen(false), setEditDependantId(null), setDeleteDependantId(null))}>
          <DialogContent aria-describedby="view-beneficiary-desc" className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Beneficiary details</DialogTitle>
              <DialogDescription id="view-beneficiary-desc" className="sr-only">View name, phone, region, grant type, status and dependants.</DialogDescription>
            </DialogHeader>
            {loadingView ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : viewBeneficiary ? (
              <ViewBeneficiaryContent
                beneficiary={viewBeneficiary}
                onClose={() => setViewId(null)}
                onEdit={() => { setEditId(viewBeneficiary.id); setViewId(null); }}
                onMarkDeceased={() => setMarkDeceasedOpen(true)}
                onAddDependant={() => setAddDependantOpen(true)}
                onEditDependant={(id) => setEditDependantId(id)}
                onDeleteDependant={(id) => setDeleteDependantId(id)}
                createDependantMutation={createDependantMutation}
                updateDependantMutation={updateDependantMutation}
                deleteDependantMutation={deleteDependantMutation}
                addDependantOpen={addDependantOpen}
                setAddDependantOpen={setAddDependantOpen}
                editDependantId={editDependantId}
                setEditDependantId={setEditDependantId}
                deleteDependantId={deleteDependantId}
                setDeleteDependantId={setDeleteDependantId}
              />
            ) : null}
          </DialogContent>
        </Dialog>

        {/* Mark deceased confirmation */}
        <AlertDialog open={markDeceasedOpen} onOpenChange={setMarkDeceasedOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Mark beneficiary as deceased</AlertDialogTitle>
              <AlertDialogDescription>
                This will set status to &quot;deceased&quot; and record the date. No new vouchers can be issued to this beneficiary. You can still view and edit the record.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => viewBeneficiary && updateMutation.mutate({ id: viewBeneficiary.id, data: { status: 'deceased', deceasedAt: new Date().toISOString() } })}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Mark deceased
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Edit Beneficiary modal */}
        <Dialog open={!!editId} onOpenChange={(open) => !open && setEditId(null)}>
          <DialogContent aria-describedby="edit-beneficiary-desc">
            <DialogHeader>
              <DialogTitle>Edit beneficiary</DialogTitle>
              <DialogDescription id="edit-beneficiary-desc" className="sr-only">Update name, phone, region or grant type for this beneficiary.</DialogDescription>
            </DialogHeader>
            {editId && (
              <EditBeneficiaryForm
                beneficiaryId={editId}
                onSuccess={() => setEditId(null)}
                onCancel={() => setEditId(null)}
                updateMutation={updateMutation}
              />
            )}
          </DialogContent>
        </Dialog>

        <Card>
          <div className="p-0">
            {isLoading ? (
              <div className="p-6 text-center text-muted-foreground">Loading beneficiaries...</div>
            ) : isError ? (
              <div className="p-6 text-center">
                <p className="text-destructive font-medium">Could not load beneficiaries.</p>
                <p className="text-sm text-muted-foreground mt-1">{error instanceof Error ? error.message : 'Please try again.'}</p>
              </div>
            ) : pageData.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                {filtered.length === 0 && beneficiaries.length === 0
                  ? 'No beneficiaries in the database yet. Add one to get started.'
                  : 'No beneficiaries match the current filters.'}
              </div>
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
                    {pageData.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell className="font-medium">{b.name}</TableCell>
                        <TableCell>{b.phone}</TableCell>
                        <TableCell>{b.region}</TableCell>
                        <TableCell>{(b as { grantType?: string }).grantType ?? '—'}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            (b as { status?: string }).status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                            (b as { status?: string }).status === 'pending' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' :
                            (b as { status?: string }).status === 'deceased' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {(b as { status?: string }).status ?? '—'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" onClick={() => setViewId(b.id)}>View</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t px-4 py-3">
                    <p className="text-sm text-muted-foreground">
                      Page {page + 1} of {totalPages} ({filtered.length} results)
                    </p>
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

function AddBeneficiaryForm({
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  onSubmit: (data: CreateBeneficiaryDTO) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [region, setRegion] = useState(REGIONS[0]);
  const [grantType, setGrantType] = useState(GRANT_TYPES[0]);
  const [status, setStatus] = useState<'active' | 'suspended' | 'pending' | 'deceased'>('active');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, phone, region, grantType, status });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1" required />
      </div>
      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1" required />
      </div>
      <div>
        <Label htmlFor="region">Region</Label>
        <select id="region" value={region} onChange={(e) => setRegion(e.target.value)} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
          {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <div>
        <Label htmlFor="grantType">Grant type</Label>
        <select id="grantType" value={grantType} onChange={(e) => setGrantType(e.target.value)} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
          {GRANT_TYPES.map((g) => <option key={g} value={g}>{g.replace('_', ' ')}</option>)}
        </select>
      </div>
      <div>
        <Label htmlFor="status">Status</Label>
        <select id="status" value={status} onChange={(e) => setStatus(e.target.value as 'active' | 'suspended' | 'pending' | 'deceased')} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="pending">Pending</option>
          <option value="deceased">Deceased</option>
        </select>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save'}</Button>
      </DialogFooter>
    </form>
  );
}

function EditBeneficiaryForm({
  beneficiaryId,
  onSuccess,
  onCancel,
  updateMutation,
}: {
  beneficiaryId: string;
  onSuccess: () => void;
  onCancel: () => void;
  updateMutation: { mutate: (args: { id: string; data: UpdateBeneficiaryDTO }) => void; isPending: boolean };
}) {
  const { data: beneficiary } = useQuery({
    queryKey: ['beneficiary', beneficiaryId],
    queryFn: () => beneficiaryAPI.getById(beneficiaryId),
  });
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [region, setRegion] = useState(REGIONS[0]);
  const [grantType, setGrantType] = useState(GRANT_TYPES[0]);
  const [status, setStatus] = useState<'active' | 'suspended' | 'pending' | 'deceased'>('active');

  useEffect(() => {
    if (beneficiary) {
      setName(beneficiary.name ?? '');
      setPhone(beneficiary.phone ?? '');
      setRegion((beneficiary.region as string) ?? REGIONS[0]);
      setGrantType((beneficiary as { grantType?: string }).grantType ?? GRANT_TYPES[0]);
      setStatus(((beneficiary as { status?: string }).status as 'active' | 'suspended' | 'pending' | 'deceased') ?? 'active');
    }
  }, [beneficiary]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      id: beneficiaryId,
      data: { name, phone, region, grantType, status: status as 'active' | 'suspended' | 'pending' | 'deceased' },
    });
  };

  if (!beneficiary) return <p className="text-sm text-muted-foreground">Loading...</p>;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="edit-name">Name</Label>
        <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1" required />
      </div>
      <div>
        <Label htmlFor="edit-phone">Phone</Label>
        <Input id="edit-phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1" required />
      </div>
      <div>
        <Label htmlFor="edit-region">Region</Label>
        <select id="edit-region" value={region} onChange={(e) => setRegion(e.target.value)} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
          {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <div>
        <Label htmlFor="edit-grantType">Grant type</Label>
        <select id="edit-grantType" value={grantType} onChange={(e) => setGrantType(e.target.value)} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
          {GRANT_TYPES.map((g) => <option key={g} value={g}>{g.replace('_', ' ')}</option>)}
        </select>
      </div>
      <div>
        <Label htmlFor="edit-status">Status</Label>
        <select id="edit-status" value={status} onChange={(e) => setStatus(e.target.value as 'active' | 'suspended' | 'pending' | 'deceased')} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="pending">Pending</option>
          <option value="deceased">Deceased</option>
        </select>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={updateMutation.isPending}>{updateMutation.isPending ? 'Saving...' : 'Save'}</Button>
      </DialogFooter>
    </form>
  );
}

/**
 * View Beneficiary content: details + Dependants section + Mark deceased.
 * Location: same file, used inside View Beneficiary dialog.
 */
function ViewBeneficiaryContent({
  beneficiary,
  onClose,
  onEdit,
  onMarkDeceased,
  onAddDependant,
  onEditDependant,
  onDeleteDependant,
  createDependantMutation,
  updateDependantMutation,
  deleteDependantMutation,
  addDependantOpen,
  setAddDependantOpen,
  editDependantId,
  setEditDependantId,
  deleteDependantId,
  setDeleteDependantId,
}: {
  beneficiary: { id: string; name: string; phone: string; region: string; status?: string; idNumber?: string; proxyName?: string; proxyIdNumber?: string; proxyPhone?: string; proxyRelationship?: string; deceasedAt?: string } & { grantType?: string };
  onClose: () => void;
  onEdit: () => void;
  onMarkDeceased: () => void;
  onAddDependant: () => void;
  onEditDependant: (id: string) => void;
  onDeleteDependant: (id: string) => void;
  createDependantMutation: { mutate: (args: { beneficiaryId: string; data: CreateDependantDTO }) => void; isPending: boolean };
  updateDependantMutation: { mutate: (args: { beneficiaryId: string; dependantId: string; data: UpdateDependantDTO }) => void; isPending: boolean };
  deleteDependantMutation: { mutate: (args: { beneficiaryId: string; dependantId: string }) => void; isPending: boolean };
  addDependantOpen: boolean;
  setAddDependantOpen: (v: boolean) => void;
  editDependantId: string | null;
  setEditDependantId: (v: string | null) => void;
  deleteDependantId: string | null;
  setDeleteDependantId: (v: string | null) => void;
}) {
  const status = (beneficiary.status ?? '') as string;
  const { data: dependants = [], isLoading: loadingDependants } = useQuery({
    queryKey: ['dependants', beneficiary.id],
    queryFn: () => beneficiaryAPI.getDependants(beneficiary.id),
    enabled: !!beneficiary.id,
  });
  const dependantToEdit = editDependantId ? dependants.find((d) => d.id === editDependantId) : null;
  const dependantToDelete = deleteDependantId ? dependants.find((d) => d.id === deleteDependantId) : null;

  return (
    <div className="space-y-4 text-sm">
      <div className="grid gap-2">
        <p><span className="font-medium text-muted-foreground">Name</span> {beneficiary.name}</p>
        <p><span className="font-medium text-muted-foreground">Phone</span> {beneficiary.phone}</p>
        {beneficiary.idNumber && <p><span className="font-medium text-muted-foreground">ID number</span> {beneficiary.idNumber}</p>}
        <p><span className="font-medium text-muted-foreground">Region</span> {beneficiary.region}</p>
        <p><span className="font-medium text-muted-foreground">Grant type</span> {beneficiary.grantType ?? '—'}</p>
        <p>
          <span className="font-medium text-muted-foreground">Status</span>{' '}
          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${status === 'deceased' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-muted'}`}>
            {status || '—'}
          </span>
          {beneficiary.deceasedAt && <span className="ml-2 text-muted-foreground">({new Date(beneficiary.deceasedAt).toLocaleDateString()})</span>}
        </p>
        {(beneficiary.proxyName || beneficiary.proxyPhone) && (
          <p><span className="font-medium text-muted-foreground">Proxy</span> {beneficiary.proxyName ?? '—'} {beneficiary.proxyPhone ? ` · ${beneficiary.proxyPhone}` : ''} {beneficiary.proxyRelationship ? ` (${beneficiary.proxyRelationship})` : ''}</p>
        )}
      </div>

      {/* Dependants */}
      <div className="border-t pt-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium flex items-center gap-2"><Users className="h-4 w-4" /> Dependants</h4>
          <Button type="button" variant="outline" size="sm" onClick={onAddDependant} disabled={status === 'deceased'}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>
        {loadingDependants ? (
          <p className="text-muted-foreground">Loading dependants...</p>
        ) : dependants.length === 0 ? (
          <p className="text-muted-foreground">No dependants recorded.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Relationship</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dependants.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.name}</TableCell>
                  <TableCell>{d.relationship}</TableCell>
                  <TableCell>{d.phone ?? '—'}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => onEditDependant(d.id)} disabled={status === 'deceased'}><Pencil className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => onDeleteDependant(d.id)} disabled={status === 'deceased'}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={addDependantOpen} onOpenChange={setAddDependantOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add dependant</DialogTitle></DialogHeader>
          <AddDependantForm
            beneficiaryId={beneficiary.id}
            onSubmit={(data) => createDependantMutation.mutate({ beneficiaryId: beneficiary.id, data })}
            onCancel={() => setAddDependantOpen(false)}
            isSubmitting={createDependantMutation.isPending}
          />
        </DialogContent>
      </Dialog>
      {dependantToEdit && (
        <Dialog open={!!editDependantId} onOpenChange={(open) => !open && setEditDependantId(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Edit dependant</DialogTitle></DialogHeader>
            <EditDependantForm
              beneficiaryId={beneficiary.id}
              dependant={dependantToEdit}
              onSubmit={(data) => updateDependantMutation.mutate({ beneficiaryId: beneficiary.id, dependantId: dependantToEdit.id, data })}
              onCancel={() => setEditDependantId(null)}
              isSubmitting={updateDependantMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      )}
      {dependantToDelete && (
        <AlertDialog open={!!deleteDependantId} onOpenChange={(open) => !open && setDeleteDependantId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove dependant</AlertDialogTitle>
              <AlertDialogDescription>Remove {dependantToDelete.name} from this beneficiary? This cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteDependantMutation.mutate({ beneficiaryId: beneficiary.id, dependantId: dependantToDelete.id })} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <DialogFooter className="flex-wrap gap-2">
        <Button variant="outline" onClick={onClose}>Close</Button>
        <Button variant="outline" onClick={onEdit}>Edit</Button>
        {status !== 'deceased' && (
          <Button variant="destructive" onClick={onMarkDeceased}><UserMinus className="h-4 w-4 mr-2" /> Mark deceased</Button>
        )}
      </DialogFooter>
    </div>
  );
}

function AddDependantForm({ beneficiaryId, onSubmit, onCancel, isSubmitting }: { beneficiaryId: string; onSubmit: (data: CreateDependantDTO) => void; onCancel: () => void; isSubmitting: boolean }) {
  const [name, setName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState<CreateDependantDTO['relationship']>('child');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [isProxy, setIsProxy] = useState(false);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, idNumber: idNumber || undefined, phone: phone || undefined, relationship, dateOfBirth: dateOfBirth || undefined, isProxy });
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
      <div><Label>Relationship</Label>
        <select value={relationship} onChange={(e) => setRelationship(e.target.value as CreateDependantDTO['relationship'])} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
          {DEPENDANT_RELATIONSHIPS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <div><Label>ID number (optional)</Label><Input value={idNumber} onChange={(e) => setIdNumber(e.target.value)} /></div>
      <div><Label>Phone (optional)</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
      <div><Label>Date of birth (optional)</Label><Input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} /></div>
      <div className="flex items-center gap-2"><input type="checkbox" checked={isProxy} onChange={(e) => setIsProxy(e.target.checked)} /><Label>Authorised to collect (proxy)</Label></div>
      <DialogFooter><Button type="button" variant="outline" onClick={onCancel}>Cancel</Button><Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save'}</Button></DialogFooter>
    </form>
  );
}

function EditDependantForm({
  beneficiaryId,
  dependant,
  onSubmit,
  onCancel,
  isSubmitting,
}: { beneficiaryId: string; dependant: Dependant; onSubmit: (data: UpdateDependantDTO) => void; onCancel: () => void; isSubmitting: boolean }) {
  const [name, setName] = useState(dependant.name);
  const [idNumber, setIdNumber] = useState(dependant.idNumber ?? '');
  const [phone, setPhone] = useState(dependant.phone ?? '');
  const [relationship, setRelationship] = useState<Dependant['relationship']>(dependant.relationship);
  const [dateOfBirth, setDateOfBirth] = useState(dependant.dateOfBirth ?? '');
  const [isProxy, setIsProxy] = useState(dependant.isProxy);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, idNumber: idNumber || undefined, phone: phone || undefined, relationship, dateOfBirth: dateOfBirth || undefined, isProxy });
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
      <div><Label>Relationship</Label>
        <select value={relationship} onChange={(e) => setRelationship(e.target.value as Dependant['relationship'])} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
          {DEPENDANT_RELATIONSHIPS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <div><Label>ID number (optional)</Label><Input value={idNumber} onChange={(e) => setIdNumber(e.target.value)} /></div>
      <div><Label>Phone (optional)</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
      <div><Label>Date of birth (optional)</Label><Input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} /></div>
      <div className="flex items-center gap-2"><input type="checkbox" checked={isProxy} onChange={(e) => setIsProxy(e.target.checked)} /><Label>Authorised to collect (proxy)</Label></div>
      <DialogFooter><Button type="button" variant="outline" onClick={onCancel}>Cancel</Button><Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save'}</Button></DialogFooter>
    </form>
  );
}
