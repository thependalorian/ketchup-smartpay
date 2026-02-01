/**
 * Dashboard - Government Portal
 */
import { Link } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { MetricCard, Card, Button } from '@smartpay/ui';
import { Shield, CheckCircle2, AlertTriangle, TrendingUp, Eye, Users, FileText, MapPin } from 'lucide-react';

const Dashboard = () => {
  return (
    <Layout title="Government Dashboard" subtitle="Ministry of Finance oversight portal">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <MetricCard title="Compliance Score" value="98.5%" icon={Shield} trend={+1.2} />
        <MetricCard title="PSD Status" value="100%" icon={CheckCircle2} trend={0} />
        <MetricCard title="Open Incidents" value="0" icon={AlertTriangle} trend={0} />
        <MetricCard title="System Uptime" value="99.92%" icon={TrendingUp} trend={+0.02} />
      </div>
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Quick access</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Button asChild variant="outline" size="sm" className="justify-start"><Link to="/compliance"><Shield className="h-4 w-4 mr-2" /> Compliance</Link></Button>
          <Button asChild variant="outline" size="sm" className="justify-start"><Link to="/vouchers"><Eye className="h-4 w-4 mr-2" /> Voucher monitoring</Link></Button>
          <Button asChild variant="outline" size="sm" className="justify-start"><Link to="/beneficiaries"><Users className="h-4 w-4 mr-2" /> Beneficiary registry</Link></Button>
          <Button asChild variant="outline" size="sm" className="justify-start"><Link to="/audit"><FileText className="h-4 w-4 mr-2" /> Audit reports</Link></Button>
          <Button asChild variant="outline" size="sm" className="justify-start"><Link to="/analytics"><TrendingUp className="h-4 w-4 mr-2" /> Financial analytics</Link></Button>
          <Button asChild variant="outline" size="sm" className="justify-start"><Link to="/regions"><MapPin className="h-4 w-4 mr-2" /> Regional performance</Link></Button>
        </div>
      </Card>
    </Layout>
  );
};
export default Dashboard;
