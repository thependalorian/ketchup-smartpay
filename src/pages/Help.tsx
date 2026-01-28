import { motion } from 'framer-motion';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search,
  Book,
  MessageCircle,
  FileText,
  Video,
  ExternalLink,
  ChevronRight,
  HelpCircle,
  Mail,
  Phone,
} from 'lucide-react';
import { useState } from 'react';

const helpTopics = [
  { icon: Book, title: 'Getting Started', desc: 'Learn the basics of SmartPay platform', articles: 12 },
  { icon: FileText, title: 'Beneficiary Management', desc: 'Managing beneficiaries and enrollments', articles: 8 },
  { icon: FileText, title: 'Voucher Operations', desc: 'Issuing, tracking, and reconciling vouchers', articles: 15 },
  { icon: FileText, title: 'Agent Network', desc: 'Managing agents and liquidity', articles: 10 },
  { icon: FileText, title: 'API & Integrations', desc: 'Technical documentation for developers', articles: 20 },
  { icon: Video, title: 'Video Tutorials', desc: 'Step-by-step video guides', articles: 6 },
];

const faqs = [
  { q: 'How do I issue a batch of vouchers?', a: 'Navigate to Vouchers → Issue Batch, select beneficiaries and amounts, then confirm distribution.' },
  { q: 'What happens when an agent runs low on liquidity?', a: 'The system automatically alerts the agent and marks them as "Low Liquidity" in the dashboard.' },
  { q: 'How are voucher redemptions tracked in real-time?', a: 'Buffr Platform sends webhook notifications for each redemption, which are displayed in the Live Activity feed.' },
  { q: 'Can I export beneficiary data?', a: 'Yes, use the Export button on the Beneficiaries page to download CSV or Excel files.' },
];

const Help = () => {
  const [activeNav, setActiveNav] = useState('/help');
  const [search, setSearch] = useState('');

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeItem={activeNav} onNavigate={setActiveNav} />
      <main className="pl-[260px]">
        <Header title="Help & Support" subtitle="Documentation, guides, and support resources" />

        <div className="p-6 space-y-8 max-w-5xl">
          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative"
          >
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search help articles, guides, and documentation..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-12 pl-12 text-base"
            />
          </motion.div>

          {/* Quick Actions */}
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { icon: MessageCircle, title: 'Live Chat', desc: 'Chat with support team', action: 'Start Chat', color: 'bg-secondary/10 text-secondary' },
              { icon: Mail, title: 'Email Support', desc: 'support@ketchup.na', action: 'Send Email', color: 'bg-primary/10 text-primary' },
              { icon: Phone, title: 'Phone Support', desc: '+264 61 123 4567', action: 'Call Now', color: 'bg-accent/10 text-accent' },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl border bg-card p-5 flex items-center gap-4"
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${item.color}`}>
                  <item.icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
                <Button variant="ghost" size="sm">
                  {item.action}
                  <ExternalLink className="ml-2 h-3 w-3" />
                </Button>
              </motion.div>
            ))}
          </div>

          {/* Help Topics */}
          <div>
            <h3 className="font-display font-semibold text-lg mb-4">Browse Topics</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {helpTopics.map((topic, i) => (
                <motion.button
                  key={topic.title}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="group rounded-xl border bg-card p-5 text-left transition-all hover:shadow-lg hover:border-secondary/50"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <topic.icon className="h-5 w-5 text-muted-foreground group-hover:text-secondary transition-colors" />
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-1" />
                  </div>
                  <h4 className="font-semibold mb-1">{topic.title}</h4>
                  <p className="text-sm text-muted-foreground mb-2">{topic.desc}</p>
                  <span className="text-xs text-secondary font-medium">{topic.articles} articles</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* FAQs */}
          <div>
            <h3 className="font-display font-semibold text-lg mb-4">Frequently Asked Questions</h3>
            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-xl border bg-card p-5"
                >
                  <div className="flex items-start gap-3">
                    <HelpCircle className="h-5 w-5 text-secondary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold mb-1">{faq.q}</p>
                      <p className="text-sm text-muted-foreground">{faq.a}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Help;
