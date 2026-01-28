import { motion, AnimatePresence } from 'framer-motion';
import { Activity, ArrowDownRight, ArrowUpRight, Clock, Wallet, Building2, Store } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ActivityItem {
  id: string;
  type: 'redemption' | 'issuance' | 'agent_status';
  message: string;
  amount?: number;
  timestamp: Date;
  icon: React.ElementType;
  iconBg: string;
}

const generateActivity = (): ActivityItem => {
  const types: ActivityItem['type'][] = ['redemption', 'redemption', 'redemption', 'issuance', 'agent_status'];
  const type = types[Math.floor(Math.random() * types.length)];
  
  const regions = ['Khomas', 'Erongo', 'Oshana', 'Omusati', 'Kavango East'];
  const methods = ['wallet credit', 'agent cash-out', 'merchant payment'];
  const agents = ['Shoprite Windhoek', 'OK Foods Oshakati', 'Local Mart Rundu'];
  
  switch (type) {
    case 'redemption':
      const amount = [500, 1000, 2000, 3000, 6000][Math.floor(Math.random() * 5)];
      const method = methods[Math.floor(Math.random() * methods.length)];
      return {
        id: Math.random().toString(36).substr(2, 9),
        type,
        message: `Voucher redeemed via ${method} in ${regions[Math.floor(Math.random() * regions.length)]}`,
        amount,
        timestamp: new Date(),
        icon: method.includes('wallet') ? Wallet : method.includes('agent') ? Building2 : Store,
        iconBg: 'bg-success/10 text-success',
      };
    case 'issuance':
      return {
        id: Math.random().toString(36).substr(2, 9),
        type,
        message: `Batch of ${Math.floor(Math.random() * 50 + 10)} vouchers issued to ${regions[Math.floor(Math.random() * regions.length)]}`,
        timestamp: new Date(),
        icon: ArrowUpRight,
        iconBg: 'bg-info/10 text-info',
      };
    case 'agent_status':
      const agent = agents[Math.floor(Math.random() * agents.length)];
      const statuses = ['went online', 'reported low liquidity', 'completed 50+ transactions'];
      return {
        id: Math.random().toString(36).substr(2, 9),
        type,
        message: `${agent} ${statuses[Math.floor(Math.random() * statuses.length)]}`,
        timestamp: new Date(),
        icon: Building2,
        iconBg: 'bg-secondary/10 text-secondary',
      };
    default:
      return {
        id: Math.random().toString(36).substr(2, 9),
        type: 'redemption',
        message: 'Unknown activity',
        timestamp: new Date(),
        icon: Activity,
        iconBg: 'bg-muted',
      };
  }
};

export function LiveActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>(() =>
    Array.from({ length: 5 }, generateActivity)
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setActivities((prev) => [generateActivity(), ...prev.slice(0, 4)]);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return date.toLocaleTimeString('en-NA', { hour: '2-digit', minute: '2-digit' });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NA', {
      style: 'currency',
      currency: 'NAD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.7 }}
      className="rounded-xl border bg-card"
    >
      <div className="flex items-center justify-between border-b p-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
              <Activity className="h-5 w-5 text-accent" />
            </div>
            <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-accent" />
            </span>
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold">Live Activity</h3>
            <p className="text-sm text-muted-foreground">Real-time voucher & network events</p>
          </div>
        </div>
      </div>

      <div className="divide-y">
        <AnimatePresence mode="popLayout">
          {activities.map((activity) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, height: 0, x: -20 }}
              animate={{ opacity: 1, height: 'auto', x: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-start gap-4 px-6 py-4"
            >
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${activity.iconBg}`}>
                <activity.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground">{activity.message}</p>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {formatTime(activity.timestamp)}
                  {activity.amount && (
                    <>
                      <span>•</span>
                      <span className="font-medium text-foreground">{formatCurrency(activity.amount)}</span>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
