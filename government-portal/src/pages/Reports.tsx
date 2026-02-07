/**
 * Reports - Government Portal
 * Generate and list government reports
 */
import { Link } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Card, Button } from '@smartpay/ui';
import { useQuery } from '@tanstack/react-query';
import { reportsAPI } from '@smartpay/api-client/government';

export default function Reports() {
  const { data: reportList = [], isLoading } = useQuery({
    queryKey: ['gov-reports'],
    queryFn: () => reportsAPI.listReports(),
  });

  const reportListArray = Array.isArray(reportList) ? reportList : [];

  return (
    <Layout title="Reports" subtitle="Generate government reports">
      <div className="space-y-6">
        <p className="text-muted-foreground">Access audit, analytics, and regional reports from the sections below.</p>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="p-6 flex flex-col">
            <h3 className="font-semibold text-lg mb-2">Audit reports</h3>
            <p className="text-sm text-muted-foreground flex-1 mb-4">Beneficiary, transaction, and compliance audit data.</p>
            <Button asChild variant="outline" size="sm" className="w-fit"><Link to="/audit">Open audit</Link></Button>
          </Card>
          <Card className="p-6 flex flex-col">
            <h3 className="font-semibold text-lg mb-2">Financial analytics</h3>
            <p className="text-sm text-muted-foreground flex-1 mb-4">Spend trend and grant type breakdown.</p>
            <Button asChild variant="outline" size="sm" className="w-fit"><Link to="/analytics">Open analytics</Link></Button>
          </Card>
          <Card className="p-6 flex flex-col">
            <h3 className="font-semibold text-lg mb-2">Regional performance</h3>
            <p className="text-sm text-muted-foreground flex-1 mb-4">Performance by region with export.</p>
            <Button asChild variant="outline" size="sm" className="w-fit"><Link to="/regions">Open regions</Link></Button>
          </Card>
        </div>
        <Card className="p-6">
          <h3 className="font-semibold mb-2">Report history</h3>
          {isLoading ? <p className="text-sm text-muted-foreground">Loading...</p> : reportListArray.length === 0 ? <p className="text-sm text-muted-foreground">No reports generated yet.</p> : (
            <ul className="text-sm space-y-2">
              {(reportListArray as Record<string, unknown>[]).slice(0, 10).map((r: Record<string, unknown>, i: number) => (
                <li key={i}>{String(r.name ?? r.id ?? 'Report')} — {r.created_at ? new Date(String(r.created_at)).toLocaleDateString() : '—'}</li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </Layout>
  );
}
