import { motion } from 'framer-motion';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { generateRegionalStats, generateAgents, NAMIBIAN_REGIONS } from '@/lib/mockData';
import { MapPin, Users, Ticket, Building2, TrendingUp, ArrowUpRight } from 'lucide-react';
import { useState, useMemo } from 'react';

const regionalStats = generateRegionalStats();
const allAgents = generateAgents(487);

const Regions = () => {
  const [activeNav, setActiveNav] = useState('/regions');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  const regionsWithAgents = useMemo(() => {
    return regionalStats.map((region) => ({
      ...region,
      agents: allAgents.filter((a) => a.region === region.region).length,
      activeAgents: allAgents.filter((a) => a.region === region.region && a.status === 'active').length,
      redemptionRate: ((region.redeemed / region.vouchers) * 100).toFixed(1),
    })).sort((a, b) => b.beneficiaries - a.beneficiaries);
  }, []);

  const totals = useMemo(() => ({
    beneficiaries: regionsWithAgents.reduce((sum, r) => sum + r.beneficiaries, 0),
    vouchers: regionsWithAgents.reduce((sum, r) => sum + r.vouchers, 0),
    redeemed: regionsWithAgents.reduce((sum, r) => sum + r.redeemed, 0),
    agents: allAgents.length,
  }), [regionsWithAgents]);

  const selected = selectedRegion ? regionsWithAgents.find((r) => r.region === selectedRegion) : null;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeItem={activeNav} onNavigate={setActiveNav} />
      <main className="pl-[260px]">
        <Header title="Regions" subtitle="Geographic distribution across Namibia's 14 regions" />

        <div className="p-6 space-y-6">
          {/* Totals */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Total Beneficiaries', value: totals.beneficiaries.toLocaleString(), icon: Users, color: 'text-primary' },
              { label: 'Total Vouchers', value: totals.vouchers.toLocaleString(), icon: Ticket, color: 'text-secondary' },
              { label: 'Total Redeemed', value: totals.redeemed.toLocaleString(), icon: TrendingUp, color: 'text-success' },
              { label: 'Total Agents', value: totals.agents.toLocaleString(), icon: Building2, color: 'text-accent' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl border bg-card p-5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className={`text-2xl font-bold font-display ${stat.color}`}>{stat.value}</p>
                  </div>
                  <stat.icon className={`h-8 w-8 ${stat.color} opacity-20`} />
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Region List */}
            <div className="lg:col-span-2 space-y-3">
              <h3 className="font-display font-semibold text-lg">All Regions</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {regionsWithAgents.map((region, i) => (
                  <motion.button
                    key={region.region}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => setSelectedRegion(region.region)}
                    className={`group rounded-xl border p-4 text-left transition-all hover:shadow-lg ${
                      selectedRegion === region.region ? 'border-secondary bg-secondary/5 shadow-md' : 'bg-card hover:border-secondary/50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <MapPin className={`h-4 w-4 ${selectedRegion === region.region ? 'text-secondary' : 'text-muted-foreground'}`} />
                        <span className="font-semibold">{region.region}</span>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Beneficiaries</p>
                        <p className="font-semibold">{region.beneficiaries.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Agents</p>
                        <p className="font-semibold">{region.agents}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Redemption</p>
                        <p className="font-semibold text-success">{region.redemptionRate}%</p>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Selected Region Detail */}
            <div>
              <h3 className="font-display font-semibold text-lg mb-3">Region Details</h3>
              {selected ? (
                <motion.div
                  key={selected.region}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border bg-card p-6 space-y-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-accent">
                      <MapPin className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-display text-xl font-bold">{selected.region}</h4>
                      <p className="text-sm text-muted-foreground">Namibia</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {[
                      { label: 'Beneficiaries', value: selected.beneficiaries.toLocaleString() },
                      { label: 'Vouchers Issued', value: selected.vouchers.toLocaleString() },
                      { label: 'Vouchers Redeemed', value: selected.redeemed.toLocaleString() },
                      { label: 'Redemption Rate', value: `${selected.redemptionRate}%`, highlight: true },
                      { label: 'Total Agents', value: selected.agents.toString() },
                      { label: 'Active Agents', value: selected.activeAgents.toString() },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between py-2 border-b last:border-0">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className={`font-semibold ${item.highlight ? 'text-success' : ''}`}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <div className="rounded-xl border bg-muted/50 p-8 text-center">
                  <MapPin className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">Select a region to view details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Regions;
