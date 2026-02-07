/**
 * Ketchup Portal - Main App Component
 * 
 * Purpose: Main application component with routing (NO ProfileContext)
 * Location: apps/ketchup-portal/src/App.tsx
 */

import { Toaster } from '@smartpay/ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Pages
import Dashboard from './pages/Dashboard';
import Beneficiaries from './pages/Beneficiaries';
import Vouchers from './pages/Vouchers';
import BatchDistribution from './pages/BatchDistribution';
import StatusMonitor from './pages/StatusMonitor';
import WebhookMonitoring from './pages/WebhookMonitoring';
import Reconciliation from './pages/Reconciliation';
import Agents from './pages/Agents';
import MobileUnits from './pages/MobileUnits';
import ATMManagement from './pages/ATMManagement';
import POSTerminals from './pages/POSTerminals';
import Regions from './pages/Regions';
import Analytics from './pages/Analytics';
import Reports from './pages/Reports';
import MapPage from './pages/MapPage';
import Settings from './pages/Settings';
import Help from './pages/Help';
import Notifications from './pages/Notifications';
import NotFound from './pages/NotFound';
import SmartPayMonitoring from './pages/SmartPayMonitoring';
import AuditLogs from './pages/AuditLogs';
import TrustAccount from './pages/TrustAccount';
import ComplianceAdmin from './pages/ComplianceAdmin';

// Open Banking Pages
import OpenBankingDashboard from './pages/OpenBankingDashboard';
import OpenBankingAccounts from './pages/OpenBankingAccounts';
import OpenBankingPayments from './pages/OpenBankingPayments';
import OpenBankingConsents from './pages/OpenBankingConsents';

// Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          {/* Main Routes */}
          <Route path="/" element={<Dashboard />} />
          <Route path="/beneficiaries" element={<Beneficiaries />} />
          <Route path="/vouchers" element={<Vouchers />} />
          <Route path="/batch-distribution" element={<BatchDistribution />} />
          <Route path="/status-monitor" element={<StatusMonitor />} />
          <Route path="/webhooks" element={<WebhookMonitoring />} />
          <Route path="/reconciliation" element={<Reconciliation />} />
          <Route path="/agents" element={<Agents />} />
          <Route path="/mobile-units" element={<MobileUnits />} />
          <Route path="/atms" element={<ATMManagement />} />
          <Route path="/pos-terminals" element={<POSTerminals />} />
          <Route path="/regions" element={<Regions />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/admin/smartpay-monitoring" element={<SmartPayMonitoring />} />
          <Route path="/admin/audit-logs" element={<AuditLogs />} />
          <Route path="/admin/trust-account" element={<TrustAccount />} />
          <Route path="/admin/compliance" element={<ComplianceAdmin />} />

          {/* Open Banking Routes */}
          <Route path="/open-banking" element={<OpenBankingDashboard />} />
          <Route path="/open-banking/accounts" element={<OpenBankingAccounts />} />
          <Route path="/open-banking/payments" element={<OpenBankingPayments />} />
          <Route path="/open-banking/consents" element={<OpenBankingConsents />} />
          
          {/* Settings & Help */}
          <Route path="/settings" element={<Settings />} />
          <Route path="/help" element={<Help />} />
          <Route path="/notifications" element={<Notifications />} />
          
          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
