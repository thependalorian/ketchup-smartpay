/**
 * ATM Management Page – Ketchup Portal
 *
 * Purpose: Manage ATMs (location, status, cash level, replenishment assignment).
 * Location: apps/ketchup-portal/src/pages/ATMManagement.tsx
 */

import { useState } from 'react';
import { Layout } from '../components/layout/Layout';
import {
  Button,
  Card,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@smartpay/ui';
import { Plus, Pencil } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { atmsAPI } from '@smartpay/api-client/ketchup';
import type { Atm, AtmStats } from '@smartpay/api-client/ketchup';

const NAMIBIAN_REGIONS = [
  'Khomas', 'Erongo', 'Oshana', 'Omusati', 'Ohangwena', 'Oshikoto',
  'Kavango East', 'Kavango West', 'Zambezi', 'Kunene', 'Otjozondjupa', 'Omaheke', 'Hardap', 'Karas',
];

const ATM_STATUSES = ['operational', 'offline', 'maintenance', 'low_cash'] as const;

export default function ATMManagement() {
  const [region, setRegion] = useState('');
  const [status, setStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingAtm, setEditingAtm] = useState<Atm | null>(null);
  const [form, setForm] = useState({
    terminalId: '',
    location: '',
    region: '',
    status: 'operational',
    cashLevelPercent: '',
    mobileUnitId: '',
  });
  const queryClient = useQueryClient();

  const { data: list = [], isLoading } = useQuery({
    queryKey: ['atms', region, status],
    queryFn: () => atmsAPI.getAll({ region: region || undefined, status: status || undefined }),
  });
  const { data: stats } = useQuery({
    queryKey: ['atms-stats'],
    queryFn: () => atmsAPI.getStats(),
  });

  const createMutation = useMutation({
    mutationFn: (body: { terminalId: string; location: string; region?: string; status?: string; cashLevelPercent?: number; mobileUnitId?: string }) =>
      atmsAPI.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['atms'] });
      queryClient.invalidateQueries({ queryKey: ['atms-stats'] });
      setShowForm(false);
      setForm({ terminalId: '', location: '', region: '', status: 'operational', cashLevelPercent: '', mobileUnitId: '' });
    },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof atmsAPI.update>[1] }) =>
      atmsAPI.update(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['atms'] });
      queryClient.invalidateQueries({ queryKey: ['atms-stats'] });
      setEditingAtm(null);
    },
  });

  const openEdit = (atm: Atm) => {
    setEditingAtm(atm);
    setForm({
      terminalId: atm.terminalId,
      location: atm.location,
      region: atm.region ?? '',
      status: atm.status,
      cashLevelPercent: atm.cashLevelPercent != null ? String(atm.cashLevelPercent) : '',
      mobileUnitId: atm.mobileUnitId ?? '',
    });
  };

  return (
    <Layout title="ATM Management" subtitle="Manage ATMs: location, status, cash level, replenishment">
      <div className="space-y-6">
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Total ATMs</p>
              <p className="text-2xl font-semibold">{(stats as AtmStats).total}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Operational</p>
              <p className="text-2xl font-semibold text-green-600">{(stats as AtmStats).operational}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Offline</p>
              <p className="text-2xl font-semibold text-red-600">{(stats as AtmStats).offline}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Maintenance</p>
              <p className="text-2xl font-semibold text-amber-600">{(stats as AtmStats).maintenance}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Low cash</p>
              <p className="text-2xl font-semibold text-orange-600">{(stats as AtmStats).lowCash}</p>
            </Card>
          </div>
        )}

        <div className="flex flex-wrap justify-between items-center gap-4">
          <p className="text-muted-foreground">
            Total: <span className="font-semibold text-foreground">{list.length}</span> ATMs
          </p>
          <div className="flex items-center gap-2">
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">All regions</option>
              {NAMIBIAN_REGIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">All statuses</option>
              {ATM_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <Button size="sm" onClick={() => { setEditingAtm(null); setForm({ terminalId: '', location: '', region: '', status: 'operational', cashLevelPercent: '', mobileUnitId: '' }); setShowForm(true); }}>
              <Plus className="h-4 w-4 mr-1" /> Add ATM
            </Button>
          </div>
        </div>

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add ATM</DialogTitle>
              <DialogDescription>Register a new ATM (terminal ID and location required).</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <label className="block font-medium">Terminal ID *</label>
              <Input placeholder="e.g. ATM-WHK-001" value={form.terminalId} onChange={(e) => setForm((f) => ({ ...f, terminalId: e.target.value }))} />
              <label className="block font-medium">Location *</label>
              <Input placeholder="e.g. Windhoek Branch A" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
              <label className="block font-medium">Region</label>
              <select value={form.region} onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="">—</option>
                {NAMIBIAN_REGIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <label className="block font-medium">Status</label>
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                {ATM_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <label className="block font-medium">Cash level % (0–100)</label>
              <Input type="number" min={0} max={100} placeholder="e.g. 75" value={form.cashLevelPercent} onChange={(e) => setForm((f) => ({ ...f, cashLevelPercent: e.target.value }))} />
              <label className="block font-medium">Mobile unit ID (replenishment)</label>
              <Input placeholder="Optional" value={form.mobileUnitId} onChange={(e) => setForm((f) => ({ ...f, mobileUnitId: e.target.value }))} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button
                disabled={!form.terminalId.trim() || !form.location.trim() || createMutation.isPending}
                onClick={() =>
                  createMutation.mutate({
                    terminalId: form.terminalId.trim(),
                    location: form.location.trim(),
                    region: form.region || undefined,
                    status: form.status,
                    cashLevelPercent: form.cashLevelPercent ? Number(form.cashLevelPercent) : undefined,
                    mobileUnitId: form.mobileUnitId.trim() || undefined,
                  })
                }
              >
                {createMutation.isPending ? 'Adding…' : 'Add ATM'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!editingAtm} onOpenChange={(open) => { if (!open) setEditingAtm(null); }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit ATM</DialogTitle>
              <DialogDescription>Update location, status, or cash level.</DialogDescription>
            </DialogHeader>
            {editingAtm && (
              <div className="space-y-3 text-sm">
                <label className="block font-medium">Terminal ID *</label>
                <Input placeholder="Terminal ID" value={form.terminalId} onChange={(e) => setForm((f) => ({ ...f, terminalId: e.target.value }))} />
                <label className="block font-medium">Location *</label>
                <Input placeholder="Location" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
                <label className="block font-medium">Region</label>
                <select value={form.region} onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">—</option>
                  {NAMIBIAN_REGIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <label className="block font-medium">Status</label>
                <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                  {ATM_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <label className="block font-medium">Cash level % (0–100)</label>
                <Input type="number" min={0} max={100} value={form.cashLevelPercent} onChange={(e) => setForm((f) => ({ ...f, cashLevelPercent: e.target.value }))} />
                <label className="block font-medium">Mobile unit ID (replenishment)</label>
                <Input placeholder="Optional" value={form.mobileUnitId} onChange={(e) => setForm((f) => ({ ...f, mobileUnitId: e.target.value }))} />
            </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingAtm(null)}>Cancel</Button>
              {editingAtm && (
                <Button
                  disabled={!form.terminalId.trim() || !form.location.trim() || updateMutation.isPending}
                  onClick={() =>
                    updateMutation.mutate({
                      id: editingAtm.id,
                      body: {
                        terminalId: form.terminalId.trim(),
                        location: form.location.trim(),
                        region: form.region || null,
                        status: form.status,
                        cashLevelPercent: form.cashLevelPercent ? Number(form.cashLevelPercent) : null,
                        mobileUnitId: form.mobileUnitId.trim() || null,
                      },
                    })
                  }
                >
                  {updateMutation.isPending ? 'Saving…' : 'Save'}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Card>
          <div className="p-0">
            {isLoading ? (
              <div className="p-6 text-center text-muted-foreground">Loading ATMs...</div>
            ) : list.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                <p>No ATMs found.</p>
                <p className="text-xs mt-1">Use “Add ATM” to register an ATM. Run backend migrations to create the <code className="bg-muted px-1 rounded">atms</code> table.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Terminal ID</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Cash %</TableHead>
                    <TableHead>Last serviced</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(list as Atm[]).map((atm) => (
                    <TableRow key={atm.id}>
                      <TableCell className="font-medium">{atm.terminalId}</TableCell>
                      <TableCell>{atm.location}</TableCell>
                      <TableCell>{atm.region ?? '—'}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            atm.status === 'operational' ? 'bg-green-100 text-green-800' :
                            atm.status === 'offline' ? 'bg-red-100 text-red-800' :
                            atm.status === 'maintenance' ? 'bg-amber-100 text-amber-800' :
                            'bg-orange-100 text-orange-800'
                          }`}
                        >
                          {atm.status}
                        </span>
                      </TableCell>
                      <TableCell>{atm.cashLevelPercent != null ? `${atm.cashLevelPercent}%` : '—'}</TableCell>
                      <TableCell>{atm.lastServicedAt ? new Date(atm.lastServicedAt).toLocaleDateString() : '—'}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(atm)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
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
