import { motion } from 'framer-motion';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { generateBeneficiaries, generateVouchers, NAMIBIAN_REGIONS } from '@/lib/mockData';
import { Search, Download, Send, ChevronLeft, ChevronRight, Ticket, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { useState, useMemo } from 'react';

const beneficiaries = generateBeneficiaries(200);
const allVouchers = generateVouchers(beneficiaries, 800);

const Vouchers = () => {
  const [activeNav, setActiveNav] = useState('/vouchers');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const perPage = 12;

  const filtered = useMemo(() => {
    return allVouchers.filter((v) => {
      const matchesSearch =
        v.id.toLowerCase().includes(search.toLowerCase()) ||
        v.beneficiaryName.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
      const matchesRegion = regionFilter === 'all' || v.region === regionFilter;
      return matchesSearch && matchesStatus && matchesRegion;
    });
  }, [search, statusFilter, regionFilter]);

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-NA', { style: 'currency', currency: 'NAD', minimumFractionDigits: 0 }).format(amount);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-NA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const stats = useMemo(() => ({
    issued: allVouchers.filter((v) => v.status === 'issued').length,
    delivered: allVouchers.filter((v) => v.status === 'delivered').length,
    redeemed: allVouchers.filter((v) => v.status === 'redeemed').length,
    expired: allVouchers.filter((v) => v.status === 'expired').length,
    totalValue: allVouchers.reduce((sum, v) => sum + v.amount, 0),
  }), []);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeItem={activeNav} onNavigate={setActiveNav} />
      <main className="pl-[260px]">
        <Header title="Vouchers" subtitle="Issue and track government vouchers" />

        <div className="p-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-5 gap-4">
            {[
              { label: 'Total Value', value: formatCurrency(stats.totalValue), icon: Ticket, color: 'bg-primary/10 text-primary' },
              { label: 'Issued', value: stats.issued, icon: Send, color: 'bg-info/10 text-info' },
              { label: 'Delivered', value: stats.delivered, icon: Clock, color: 'bg-secondary/10 text-secondary' },
              { label: 'Redeemed', value: stats.redeemed, icon: CheckCircle2, color: 'bg-success/10 text-success' },
              { label: 'Expired', value: stats.expired, icon: XCircle, color: 'bg-destructive/10 text-destructive' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl border bg-card p-4"
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.color}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-xl font-bold font-display">{typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search voucher ID or beneficiary..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-72 pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="issued">Issued</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="redeemed">Redeemed</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={regionFilter} onValueChange={setRegionFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  {NAMIBIAN_REGIONS.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button size="sm" className="gradient-accent text-accent-foreground">
                <Send className="mr-2 h-4 w-4" />
                Issue Batch
              </Button>
            </div>
          </div>

          {/* Table */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl border bg-card"
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Voucher ID</TableHead>
                  <TableHead>Beneficiary</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Grant Type</TableHead>
                  <TableHead>Issued</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((v) => (
                  <TableRow key={v.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-mono text-xs">{v.id}</TableCell>
                    <TableCell className="font-medium">{v.beneficiaryName}</TableCell>
                    <TableCell className="text-muted-foreground">{v.region}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(v.amount)}</TableCell>
                    <TableCell className="capitalize">{v.grantType.replace('_', ' ')}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(v.issuedAt)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(v.expiryDate)}</TableCell>
                    <TableCell>
                      <StatusBadge variant={v.status}>{v.status}</StatusBadge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * perPage + 1}-{Math.min(page * perPage, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" disabled={page === 1} onClick={() => setPage(page - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">{page} / {totalPages}</span>
                <Button variant="outline" size="icon" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Vouchers;
