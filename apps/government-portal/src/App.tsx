/**
 * Government Portal - Main App Component
 * 
 * Purpose: Main application component with routing for Government oversight
 * Location: apps/government-portal/src/App.tsx
 */

import { Toaster } from '@smartpay/ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Pages
import Dashboard from './pages/Dashboard';
import Compliance from './pages/Compliance';
import ImpactDashboard from './pages/ImpactDashboard';
import VoucherMonitoring from './pages/VoucherMonitoring';
import BeneficiaryRegistry from './pages/BeneficiaryRegistry';
import AuditReports from './pages/AuditReports';
import Analytics from './pages/Analytics';
import AgentNetwork from './pages/AgentNetwork';
import RegionalPerformance from './pages/RegionalPerformance';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Help from './pages/Help';
import NotFound from './pages/NotFound';

// Create query client with read-only optimizations
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000, // 10 minutes (longer for read-only data)
      refetchOnWindowFocus: true, // Refetch on focus for latest data
      retry: 3, // Retry failed queries
    },
  },
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <BrowserRouter>
        <Routes>
          {/* Main Routes */}
          <Route path="/" element={<Dashboard />} />
          <Route path="/compliance" element={<Compliance />} />
          <Route path="/impact" element={<ImpactDashboard />} />
          <Route path="/vouchers" element={<VoucherMonitoring />} />
          <Route path="/beneficiaries" element={<BeneficiaryRegistry />} />
          <Route path="/audit" element={<AuditReports />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/agents" element={<AgentNetwork />} />
          <Route path="/regions" element={<RegionalPerformance />} />
          <Route path="/reports" element={<Reports />} />
          
          {/* Settings & Help */}
          <Route path="/settings" element={<Settings />} />
          <Route path="/help" element={<Help />} />
          
          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
