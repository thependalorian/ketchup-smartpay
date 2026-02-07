/**
 * POS Terminal Management Page – Ketchup Portal
 *
 * Purpose: Manage POS terminals (agent/merchant assignment, status).
 * Location: apps/ketchup-portal/src/pages/POSTerminals.tsx
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
import { posTerminalsAPI } from '@smartpay/api-client/ketchup';
import type { PosTerminal } from '@smartpay/api-client/ketchup';

const POS_STATUSES = ['active', 'inactive', 'maintenance'] as const;

export default function POSTerminals() {
  const [status, setStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingTerminal, setEditingTerminal] = useState<PosTerminal | null>(null);
  const [form, setForm] = useState({
    terminalId: '',
    agentId: '',
    merchantId: '',
    status: 'active',
    deviceId: '',
  });
  const queryClient = useQueryClient();

  const { data: list = [], isLoading } = useQuery({
    queryKey: ['pos-terminals', status],
    queryFn: () => posTerminalsAPI.getAll({ status: status || undefined }),
  });

  const createMutation = useMutation({
    mutationFn: (body: { terminalId: string; agentId?: string; merchantId?: string; status?: string; deviceId?: string }) =>
      posTerminalsAPI.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pos-terminals'] });
      setShowForm(false);
      setForm({ terminalId: '', agentId: '', merchantId: '', status: 'active', deviceId: '' });
    },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof posTerminalsAPI.update>[1] }) =>
      posTerminalsAPI.update(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pos-terminals'] });
      setEditingTerminal(null);
    },
  });

  const openEdit = (terminal: PosTerminal) => {
    setEditingTerminal(terminal);
    setForm({
      terminalId: terminal.terminalId,
      agentId: terminal.agentId ?? '',
      merchantId: terminal.merchantId ?? '',
      status: terminal.status,
      deviceId: terminal.deviceId ?? '',
    });
  };

  return (
    <Layout title="POS Terminals" subtitle="Manage POS terminals: agent/merchant assignment, status">
      <div className="space-y-6">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <p className="text-muted-foreground">
            Total: <span className="font-semibold text-foreground">{list.length}</span> POS terminals
          </p>
          <div className="flex items-center gap-2">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">All statuses</option>
              {POS_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <Button size="sm" onClick={() => { setEditingTerminal(null); setForm({ terminalId: '', agentId: '', merchantId: '', status: 'active', deviceId: '' }); setShowForm(true); }}>
              <Plus className="h-4 w-4 mr-1" /> Add POS terminal
            </Button>
          </div>
        </div>

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add POS terminal</DialogTitle>
              <DialogDescription>Register a new POS terminal (terminal ID required).</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <label className="block font-medium">Terminal ID *</label>
              <Input placeholder="e.g. POS-001" value={form.terminalId} onChange={(e) => setForm((f) => ({ ...f, terminalId: e.target.value }))} />
              <label className="block font-medium">Agent ID (UUID)</label>
              <Input placeholder="Optional" value={form.agentId} onChange={(e) => setForm((f) => ({ ...f, agentId: e.target.value }))} />
              <label className="block font-medium">Merchant ID</label>
              <Input placeholder="Optional" value={form.merchantId} onChange={(e) => setForm((f) => ({ ...f, merchantId: e.target.value }))} />
              <label className="block font-medium">Status</label>
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                {POS_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <label className="block font-medium">Device ID</label>
              <Input placeholder="Optional" value={form.deviceId} onChange={(e) => setForm((f) => ({ ...f, deviceId: e.target.value }))} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button
                disabled={!form.terminalId.trim() || createMutation.isPending}
                onClick={() =>
                  createMutation.mutate({
                    terminalId: form.terminalId.trim(),
                    agentId: form.agentId.trim() || undefined,
                    merchantId: form.merchantId.trim() || undefined,
                    status: form.status,
                    deviceId: form.deviceId.trim() || undefined,
                  })
                }
              >
                {createMutation.isPending ? 'Adding…' : 'Add terminal'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!editingTerminal} onOpenChange={(open) => { if (!open) setEditingTerminal(null); }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit POS terminal</DialogTitle>
              <DialogDescription>Update terminal ID, agent/merchant, or status.</DialogDescription>
            </DialogHeader>
            {editingTerminal && (
              <div className="space-y-3 text-sm">
                <label className="block font-medium">Terminal ID *</label>
                <Input value={form.terminalId} onChange={(e) => setForm((f) => ({ ...f, terminalId: e.target.value }))} />
                <label className="block font-medium">Agent ID (UUID)</label>
                <Input placeholder="Optional" value={form.agentId} onChange={(e) => setForm((f) => ({ ...f, agentId: e.target.value }))} />
                <label className="block font-medium">Merchant ID</label>
                <Input placeholder="Optional" value={form.merchantId} onChange={(e) => setForm((f) => ({ ...f, merchantId: e.target.value }))} />
                <label className="block font-medium">Status</label>
                <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                  {POS_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <label className="block font-medium">Device ID</label>
                <Input value={form.deviceId} onChange={(e) => setForm((f) => ({ ...f, deviceId: e.target.value }))} />
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingTerminal(null)}>Cancel</Button>
              {editingTerminal && (
                <Button
                  disabled={!form.terminalId.trim() || updateMutation.isPending}
                  onClick={() =>
                    updateMutation.mutate({
                      id: editingTerminal.id,
                      body: {
                        terminalId: form.terminalId.trim(),
                        agentId: form.agentId.trim() || null,
                        merchantId: form.merchantId.trim() || null,
                        status: form.status,
                        deviceId: form.deviceId.trim() || null,
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
              <div className="p-6 text-center text-muted-foreground">Loading POS terminals...</div>
            ) : list.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                <p>No POS terminals found.</p>
                <p className="text-xs mt-1">Use “Add POS terminal” to register one. Run backend migrations to create the <code className="bg-muted px-1 rounded">pos_terminals</code> table.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Terminal ID</TableHead>
                    <TableHead>Agent ID</TableHead>
                    <TableHead>Merchant ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Provisioned</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(list as PosTerminal[]).map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.terminalId}</TableCell>
                      <TableCell className="font-mono text-xs">{t.agentId ?? '—'}</TableCell>
                      <TableCell>{t.merchantId ?? '—'}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            t.status === 'active' ? 'bg-green-100 text-green-800' :
                            t.status === 'maintenance' ? 'bg-amber-100 text-amber-800' :
                            'bg-muted text-muted-foreground'
                          }`}
                        >
                          {t.status}
                        </span>
                      </TableCell>
                      <TableCell>{t.provisionedAt ? new Date(t.provisionedAt).toLocaleDateString() : '—'}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(t)}>
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
