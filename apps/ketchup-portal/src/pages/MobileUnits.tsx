/**
 * SmartPay Mobile Page – Ketchup Portal
 *
 * Purpose: Fleet management for SmartPay Mobile (agents type=mobile_unit). List, stats, view detail
 * with Equipment (list + Issue/Return) and Drivers list (Phase 2).
 * Location: apps/ketchup-portal/src/pages/MobileUnits.tsx
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
import { Search, Package, Users, Activity } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mobileUnitsAPI } from '@smartpay/api-client/ketchup';
import type {
  MobileUnit,
  MobileUnitEquipment,
  MobileUnitDriver,
  EquipmentType,
} from '@smartpay/api-client/ketchup';

const PAGE_SIZE = 10;
const NAMIBIAN_REGIONS = [
  'Khomas', 'Erongo', 'Oshana', 'Omusati', 'Ohangwena', 'Oshikoto',
  'Kavango East', 'Kavango West', 'Zambezi', 'Kunene', 'Otjozondjupa', 'Omaheke', 'Hardap', 'Karas',
];

type DetailTab = 'info' | 'equipment' | 'drivers' | 'activity';

export default function MobileUnits() {
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const [viewUnit, setViewUnit] = useState<MobileUnit | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>('info');
  const [issueForm, setIssueForm] = useState({ equipmentTypeCode: '', assetId: '', notes: '' });
  const [showIssueForm, setShowIssueForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: unitsResponse, isLoading } = useQuery({
    queryKey: ['mobile-units', region, status],
    queryFn: () => mobileUnitsAPI.getAll({ region: region || undefined, status: status || undefined }),
  });
  const { data: stats } = useQuery({
    queryKey: ['mobile-units-stats'],
    queryFn: () => mobileUnitsAPI.getStats(),
  });

  const unitId = viewUnit?.id ?? '';
  const { data: equipmentList = [] } = useQuery({
    queryKey: ['mobile-units-equipment', unitId],
    queryFn: () => mobileUnitsAPI.getEquipment(unitId),
    enabled: !!unitId,
  });
  const { data: driversList = [] } = useQuery({
    queryKey: ['mobile-units-drivers', unitId],
    queryFn: () => mobileUnitsAPI.getDrivers(unitId),
    enabled: !!unitId,
  });
  const { data: equipmentTypes = [] } = useQuery({
    queryKey: ['mobile-units-equipment-types'],
    queryFn: () => mobileUnitsAPI.getEquipmentTypes(),
    enabled: showIssueForm,
  });

  const issueMutation = useMutation({
    mutationFn: (body: { equipmentTypeCode: string; assetId: string; notes?: string }) =>
      mobileUnitsAPI.issueEquipment(unitId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mobile-units-equipment', unitId] });
      queryClient.invalidateQueries({ queryKey: ['mobile-units-activity', unitId] });
      setShowIssueForm(false);
      setIssueForm({ equipmentTypeCode: '', assetId: '', notes: '' });
    },
  });
  const returnMutation = useMutation({
    mutationFn: (equipmentId: string) => mobileUnitsAPI.returnEquipment(unitId, equipmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mobile-units-equipment', unitId] });
      queryClient.invalidateQueries({ queryKey: ['mobile-units-activity', unitId] });
    },
  });

  const { data: activityList = [] } = useQuery({
    queryKey: ['mobile-units-activity', unitId],
    queryFn: () => mobileUnitsAPI.getActivity(unitId),
    enabled: !!unitId,
  });

  const maintenanceMutation = useMutation({
    mutationFn: (body: { type: string; description: string; partsUsed?: string; cost?: number; meterReading?: string }) =>
      mobileUnitsAPI.postMaintenance(unitId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mobile-units-activity', unitId] });
      setShowMaintenanceForm(false);
      setMaintenanceForm({ type: 'inspection', description: '', partsUsed: '', cost: '', meterReading: '' });
    },
  });

  const raw = unitsResponse as { data?: MobileUnit[] } | undefined;
  const list = Array.isArray(raw) ? raw : (raw?.data ?? []);
  const filtered = list.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) &&
      (region ? u.region === region : true) &&
      (status ? u.status === status : true)
  );
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const pageData = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-NA', { style: 'currency', currency: 'NAD', minimumFractionDigits: 0 }).format(n);

  return (
    <Layout title="Mobile Units" subtitle="Fleet management: equipment, drivers, activity">
      <div className="space-y-6">
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Total units</p>
              <p className="text-2xl font-semibold">{stats.total}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-2xl font-semibold text-green-600">{stats.active}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Down</p>
              <p className="text-2xl font-semibold text-red-600">{stats.down ?? 0}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Volume today</p>
              <p className="text-2xl font-semibold">{formatCurrency(stats.totalVolumeToday ?? 0)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Success rate</p>
              <p className="text-2xl font-semibold">{(stats.avgSuccessRate != null && stats.avgSuccessRate <= 1 ? (stats.avgSuccessRate ?? 0) * 100 : Math.min(100, Number(stats.avgSuccessRate) || 0)).toFixed(1)}%</p>
            </Card>
          </div>
        )}

        <div className="flex flex-wrap justify-between items-center gap-4">
          <p className="text-muted-foreground">
            Total: <span className="font-semibold text-foreground">{filtered.length}</span> SmartPay Mobile
          </p>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name..."
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
              <option value="active">Active</option>
              <option value="down">Down</option>
              <option value="inactive">Inactive</option>
              <option value="low_liquidity">Low liquidity</option>
            </select>
          </div>
        </div>

        <Dialog
          open={!!viewUnit}
          onOpenChange={(open) => {
            if (!open) {
              setViewUnit(null);
              setDetailTab('info');
              setShowIssueForm(false);
              setShowMaintenanceForm(false);
            }
          }}
        >
          <DialogContent aria-describedby="mobile-unit-details-desc" className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>SmartPay Mobile unit details</DialogTitle>
              <DialogDescription id="mobile-unit-details-desc" className="sr-only">
                Unit info, Equipment (list, Issue/Return), Drivers list.
              </DialogDescription>
            </DialogHeader>
            {viewUnit ? (
              <div className="space-y-4 text-sm">
                <div className="flex gap-2 border-b pb-2">
                  <Button
                    variant={detailTab === 'info' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDetailTab('info')}
                  >
                    Info
                  </Button>
                  <Button
                    variant={detailTab === 'equipment' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDetailTab('equipment')}
                  >
                    <Package className="h-4 w-4 mr-1" /> Equipment
                  </Button>
                  <Button
                    variant={detailTab === 'drivers' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDetailTab('drivers')}
                  >
                    <Users className="h-4 w-4 mr-1" /> Drivers
                  </Button>
                  <Button
                    variant={detailTab === 'activity' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDetailTab('activity')}
                  >
                    <Activity className="h-4 w-4 mr-1" /> Activity
                  </Button>
                </div>

                {detailTab === 'info' && (
                  <div className="space-y-2">
                    <p><span className="font-medium text-muted-foreground">Name</span> {viewUnit.name}</p>
                    <p><span className="font-medium text-muted-foreground">Region</span> {viewUnit.region}</p>
                    <p><span className="font-medium text-muted-foreground">Status</span> {viewUnit.status}</p>
                    <p><span className="font-medium text-muted-foreground">Liquidity</span> {formatCurrency(viewUnit.liquidity ?? 0)}</p>
                    <p><span className="font-medium text-muted-foreground">Transactions today</span> {viewUnit.transactionsToday ?? 0}</p>
                    <p><span className="font-medium text-muted-foreground">Volume today</span> {formatCurrency(viewUnit.volumeToday ?? 0)}</p>
                  </div>
                )}

                {detailTab === 'equipment' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="font-medium">Equipment</p>
                      <Button size="sm" onClick={() => setShowIssueForm(!showIssueForm)}>
                        {showIssueForm ? 'Cancel' : 'Issue equipment'}
                      </Button>
                    </div>
                    {showIssueForm && (
                      <Card className="p-4 space-y-3">
                        <label className="block text-xs font-medium">Type</label>
                        <select
                          value={issueForm.equipmentTypeCode}
                          onChange={(e) => setIssueForm((f) => ({ ...f, equipmentTypeCode: e.target.value }))}
                          className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                        >
                          <option value="">Select type</option>
                          {(equipmentTypes as EquipmentType[]).map((t) => (
                            <option key={t.code} value={t.code}>{t.label}</option>
                          ))}
                        </select>
                        <label className="block text-xs font-medium">Asset ID</label>
                        <Input
                          placeholder="Asset or serial number"
                          value={issueForm.assetId}
                          onChange={(e) => setIssueForm((f) => ({ ...f, assetId: e.target.value }))}
                          className="text-sm"
                        />
                        <label className="block text-xs font-medium">Notes (optional)</label>
                        <Input
                          placeholder="Condition notes"
                          value={issueForm.notes}
                          onChange={(e) => setIssueForm((f) => ({ ...f, notes: e.target.value }))}
                          className="text-sm"
                        />
                        <Button
                          size="sm"
                          disabled={!issueForm.equipmentTypeCode || !issueForm.assetId || issueMutation.isPending}
                          onClick={() =>
                            issueMutation.mutate({
                              equipmentTypeCode: issueForm.equipmentTypeCode,
                              assetId: issueForm.assetId,
                              notes: issueForm.notes || undefined,
                            })
                          }
                        >
                          {issueMutation.isPending ? 'Issuing…' : 'Issue'}
                        </Button>
                      </Card>
                    )}
                    {equipmentList.length === 0 ? (
                      <p className="text-muted-foreground text-xs">No equipment recorded. Use “Issue equipment” to add.</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Asset ID</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Issued</TableHead>
                            <TableHead className="w-[80px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(equipmentList as MobileUnitEquipment[]).map((eq) => (
                            <TableRow key={eq.id}>
                              <TableCell className="font-medium">{eq.assetId}</TableCell>
                              <TableCell>{eq.equipmentTypeCode}</TableCell>
                              <TableCell>{eq.status}</TableCell>
                              <TableCell>{eq.issuedAt ? new Date(eq.issuedAt).toLocaleDateString() : '—'}</TableCell>
                              <TableCell>
                                {eq.status !== 'returned' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={returnMutation.isPending}
                                    onClick={() => returnMutation.mutate(eq.id)}
                                  >
                                    Return
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                )}

                {detailTab === 'drivers' && (
                  <div className="space-y-4">
                    <p className="font-medium">Drivers</p>
                    {driversList.length === 0 ? (
                      <p className="text-muted-foreground text-xs">No drivers assigned.</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>ID number</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(driversList as MobileUnitDriver[]).map((d) => (
                            <TableRow key={d.id}>
                              <TableCell className="font-medium">{d.name}</TableCell>
                              <TableCell>{d.idNumber ?? '—'}</TableCell>
                              <TableCell>{d.role}</TableCell>
                              <TableCell>{d.status}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                )}

                <DialogFooter>
                  <Button variant="outline" onClick={() => setViewUnit(null)}>Close</Button>
                </DialogFooter>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>

        <Card>
          <div className="p-0">
            {isLoading ? (
              <div className="p-6 text-center text-muted-foreground">Loading mobile units...</div>
            ) : pageData.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground space-y-2">
                <p>No mobile units found.</p>
                <p className="text-xs max-w-md mx-auto">
                  Data comes from the <code className="bg-muted px-1 rounded">agents</code> table where <code className="bg-muted px-1 rounded">type = mobile_unit</code>. Run <code className="bg-muted px-1 rounded">pnpm run migrate</code> then <code className="bg-muted px-1 rounded">pnpm run seed</code> from <code className="bg-muted px-1 rounded">backend</code> to seed 30 mobile units (29 active, 1 down). Equipment, Drivers, and Activity are in the unit detail modal (click View on a row).
                </p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Region</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Liquidity</TableHead>
                      <TableHead>Transactions today</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pageData.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.name}</TableCell>
                        <TableCell>{u.region}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              u.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : u.status === 'down'
                                  ? 'bg-red-100 text-red-800'
                                  : u.status === 'low_liquidity'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {u.status}
                          </span>
                        </TableCell>
                        <TableCell>{formatCurrency(u.liquidity ?? 0)}</TableCell>
                        <TableCell>{u.transactionsToday ?? 0}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" onClick={() => setViewUnit(u)}>View</Button>
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
