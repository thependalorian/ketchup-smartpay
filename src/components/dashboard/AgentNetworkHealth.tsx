import { motion } from 'framer-motion';
import { Building2, TrendingUp, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { generateAgents } from '@/lib/mockData';
import { useMemo } from 'react';

export function AgentNetworkHealth() {
  const agents = useMemo(() => generateAgents(487), []);

  const stats = useMemo(() => {
    const active = agents.filter((a) => a.status === 'active').length;
    const lowLiquidity = agents.filter((a) => a.status === 'low_liquidity').length;
    const inactive = agents.filter((a) => a.status === 'inactive').length;
    const small = agents.filter((a) => a.type === 'small').length;
    const medium = agents.filter((a) => a.type === 'medium').length;
    const large = agents.filter((a) => a.type === 'large').length;
    const totalVolume = agents.reduce((sum, a) => sum + a.volumeToday, 0);
    const avgSuccessRate = agents.reduce((sum, a) => sum + a.successRate, 0) / agents.length;

    return { active, lowLiquidity, inactive, small, medium, large, totalVolume, avgSuccessRate };
  }, [agents]);

  const healthScore = ((stats.active / agents.length) * 100 * 0.6 + stats.avgSuccessRate * 0.4).toFixed(1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      className="rounded-xl border bg-card p-6"
    >
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold">Agent Network</h3>
            <p className="text-sm text-muted-foreground">{agents.length} registered agents</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold font-display text-success">{healthScore}%</p>
          <p className="text-xs text-muted-foreground">Health Score</p>
        </div>
      </div>

      {/* Status Overview */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-success/10 p-3 text-center">
          <div className="flex items-center justify-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <span className="text-lg font-bold text-success">{stats.active}</span>
          </div>
          <p className="text-xs text-muted-foreground">Active</p>
        </div>
        <div className="rounded-lg bg-warning/10 p-3 text-center">
          <div className="flex items-center justify-center gap-1.5">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <span className="text-lg font-bold text-warning">{stats.lowLiquidity}</span>
          </div>
          <p className="text-xs text-muted-foreground">Low Liquidity</p>
        </div>
        <div className="rounded-lg bg-muted p-3 text-center">
          <div className="flex items-center justify-center gap-1.5">
            <XCircle className="h-4 w-4 text-muted-foreground" />
            <span className="text-lg font-bold text-muted-foreground">{stats.inactive}</span>
          </div>
          <p className="text-xs text-muted-foreground">Inactive</p>
        </div>
      </div>

      {/* Agent Types */}
      <div className="mb-4">
        <p className="mb-2 text-sm font-medium text-muted-foreground">By Type</p>
        <div className="flex h-3 overflow-hidden rounded-full">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(stats.small / agents.length) * 100}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="bg-secondary"
          />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(stats.medium / agents.length) * 100}%` }}
            transition={{ duration: 0.8, delay: 0.1, ease: 'easeOut' }}
            className="bg-primary"
          />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(stats.large / agents.length) * 100}%` }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
            className="bg-accent"
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>Small ({stats.small})</span>
          <span>Medium ({stats.medium})</span>
          <span>Large ({stats.large})</span>
        </div>
      </div>

      {/* Today's Volume */}
      <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-success" />
          <span className="text-sm text-muted-foreground">Today's Volume</span>
        </div>
        <span className="font-semibold text-foreground">
          N${(stats.totalVolume / 1000000).toFixed(2)}M
        </span>
      </div>
    </motion.div>
  );
}
