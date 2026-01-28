import { motion } from 'framer-motion';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  User,
  Bell,
  Shield,
  Database,
  Globe,
  Key,
  Mail,
  Building2,
  Save,
} from 'lucide-react';
import { useState } from 'react';

const Settings = () => {
  const [activeNav, setActiveNav] = useState('/settings');
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    lowLiquidity: true,
    dailyReport: true,
  });

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeItem={activeNav} onNavigate={setActiveNav} />
      <main className="pl-[260px]">
        <Header title="Settings" subtitle="Configure platform settings and preferences" />

        <div className="p-6 max-w-4xl">
          <div className="space-y-8">
            {/* Organization */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border bg-card p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-display font-semibold">Organization</h3>
                  <p className="text-sm text-muted-foreground">Manage organization details</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Organization Name</Label>
                  <Input defaultValue="Ministry of Finance" />
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Input defaultValue="Namibia" disabled />
                </div>
                <div className="space-y-2">
                  <Label>Contact Email</Label>
                  <Input defaultValue="admin@mof.gov.na" />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input defaultValue="+264 61 209 2111" />
                </div>
              </div>
            </motion.div>

            {/* Notifications */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-xl border bg-card p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
                  <Bell className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <h3 className="font-display font-semibold">Notifications</h3>
                  <p className="text-sm text-muted-foreground">Configure alert preferences</p>
                </div>
              </div>
              <div className="space-y-4">
                {[
                  { key: 'email', label: 'Email Notifications', desc: 'Receive alerts via email' },
                  { key: 'push', label: 'Push Notifications', desc: 'Browser push notifications' },
                  { key: 'sms', label: 'SMS Alerts', desc: 'Critical alerts via SMS' },
                  { key: 'lowLiquidity', label: 'Low Liquidity Alerts', desc: 'Agent network liquidity warnings' },
                  { key: 'dailyReport', label: 'Daily Summary', desc: 'Receive daily disbursement reports' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch
                      checked={notifications[item.key as keyof typeof notifications]}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, [item.key]: checked })}
                    />
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Security */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-xl border bg-card p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                  <Shield className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-display font-semibold">Security</h3>
                  <p className="text-sm text-muted-foreground">Manage security settings</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                  </div>
                  <Button variant="outline" size="sm">Enable</Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium">API Keys</p>
                    <p className="text-sm text-muted-foreground">Manage integration credentials</p>
                  </div>
                  <Button variant="outline" size="sm">Manage Keys</Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium">Session Timeout</p>
                    <p className="text-sm text-muted-foreground">Auto logout after inactivity</p>
                  </div>
                  <span className="text-sm font-medium">30 minutes</span>
                </div>
              </div>
            </motion.div>

            {/* Integration */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-xl border bg-card p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                  <Globe className="h-5 w-5 text-success" />
                </div>
                <div>
                  <h3 className="font-display font-semibold">Integrations</h3>
                  <p className="text-sm text-muted-foreground">Connected services and APIs</p>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { name: 'Buffr Platform', status: 'Connected', color: 'text-success' },
                  { name: 'Bank of Namibia IPS', status: 'Connected', color: 'text-success' },
                  { name: 'NamPost Network', status: 'Connected', color: 'text-success' },
                  { name: 'SMS Gateway', status: 'Active', color: 'text-success' },
                ].map((int) => (
                  <div key={int.name} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
                    <span className="font-medium">{int.name}</span>
                    <span className={`text-sm font-medium ${int.color}`}>{int.status}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <div className="flex justify-end">
              <Button className="gradient-accent text-accent-foreground">
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;
