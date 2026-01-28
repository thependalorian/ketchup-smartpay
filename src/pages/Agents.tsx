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
import { generateAgents, NAMIBIAN_REGIONS } from '@/lib/mockData';
import {
  Search,
  Building2,
  Store,
  Warehouse,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MapPin,
  DollarSign,
} from 'lucide-react';
import { useState, useMemo } from 'react';

const allAgents = generateAgents(487);

const Agents = () => {
  const [activeNav, setActiveNav] = useState('/agents');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    return allAgents.filter((a) => {
      const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase()) || a.id.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === 'all' || a.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
      const matchesRegion = regionFilter === 'all' || a.region === regionFilter;
      return matchesSearch && matchesType && matchesStatus && matchesRegion;
    });
  }, [search, typeFilter, statusFilter, regionFilter]);

  const stats = useMemo(() => ({
    total: allAgents.length,
    active: allAgents.filter((a) => a.status === 'active').length,
    lowLiquidity: allAgents.filter((a) => a.status === 'low_liquidity').length,
    inactive: allAgents.filter((a) => a.status === 'inactive').length,
    totalLiquidity: allAgents.reduce((sum, a) => sum + a.liquidity, 0),
    totalVolume: allAgents.reduce((sum, a) => sum + a.volumeToday, 0),
  }), []);

  const formatCurrency = (amount: number) => {
    if (amount >= 1_000_000) return `N$${(amount / 1_000_000).toFixed(2)}M`;
    if (amount >= 1_000) return `N$${(amount / 1_000).toFixed(1)}K`;
    return `N$${amount.toLocaleString()}`;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'small': return Store;
      case 'medium': return Building2;
      case 'large': return Warehouse;
      default: return Store;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeItem={activeNav} onNavigate={setActiveNav} />
      <main className="pl-[260px]">
        <Header title="Agent Network" subtitle="Monitor cash-out agent performance and liquidity" />

        <div className="p-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-6 gap-4">
            {[
              { label: 'Total Agents', value: stats.total, icon: Building2, color: 'bg-primary/10 text-primary' },
              { label: 'Active', value: stats.active, icon: CheckCircle2, color: 'bg-success/10 text-success' },
              { label: 'Low Liquidity', value: stats.lowLiquidity, icon: AlertTriangle, color: 'bg-warning/10 text-warning' },
              { label: 'Inactive', value: stats.inactive, icon: XCircle, color: 'bg-muted text-muted-foreground' },
              { label: 'Total Liquidity', value: formatCurrency(stats.totalLiquidity), icon: DollarSign, color: 'bg-secondary/10 text-secondary' },
              { label: "Today's Volume", value: formatCurrency(stats.totalVolume), icon: TrendingUp, color: 'bg-accent/10 text-accent' },
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
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-lg font-bold font-display">{typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search agents..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-64 pl-10" />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-32"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="small">Small</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="large">Large</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="low_liquidity">Low Liquidity</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Region" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Regions</SelectItem>
                {NAMIBIAN_REGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Agent Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.slice(0, 20).map((agent, i) => {
              const Icon = getTypeIcon(agent.type);
              return (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="group rounded-xl border bg-card p-4 transition-all hover:shadow-lg hover:border-secondary/50"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        agent.type === 'large' ? 'bg-accent/10 text-accent' :
                        agent.type === 'medium' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'
                      }`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-sm line-clamp-1">{agent.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{agent.id}</p>
                      </div>
                    </div>
                    <StatusBadge variant={agent.status} size="sm">
                      {agent.status === 'low_liquidity' ? 'Low' : agent.status}
                    </StatusBadge>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{agent.region}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Liquidity</span>
                      <span className="font-semibold">{formatCurrency(agent.liquidity)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Today</span>
                      <span className="font-medium">{agent.transactionsToday} txns • {formatCurrency(agent.volumeToday)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Success Rate</span>
                      <span className={`font-semibold ${agent.successRate >= 98 ? 'text-success' : agent.successRate >= 95 ? 'text-warning' : 'text-destructive'}`}>
                        {agent.successRate.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {filtered.length > 20 && (
            <div className="text-center">
              <Button variant="outline">Load More ({filtered.length - 20} remaining)</Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Agents;
