/**
 * Analytics Page - Ketchup Portal
 * Purpose: Monthly trend and redemption channel analytics with CSV export
 */
import { Layout } from '../components/layout/Layout';
import { Button, Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@smartpay/ui';
import { Download } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { dashboardAPI } from '@smartpay/api-client/ketchup';
import { getRedemptionChannelColor } from '../constants/channelColors';

function downloadCSV(headers: string[], rows: string[][], filename: string) {
  const line = (arr: string[]) => arr.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',');
  const csv = [line(headers), ...rows.map((r) => line(r))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export default function Analytics() {
  const { data: monthlyTrend = [], isLoading: loadingTrend } = useQuery({
    queryKey: ['monthly-trend'],
    queryFn: () => dashboardAPI.getMonthlyTrend(12),
  });
  const { data: channels = [], isLoading: loadingChannels } = useQuery({
    queryKey: ['redemption-channels'],
    queryFn: () => dashboardAPI.getRedemptionChannels(),
  });

  const exportMonthlyTrend = () => {
    const headers = ['Month', 'Issued', 'Redeemed', 'Expired'];
    const rows = monthlyTrend.map((m) => [m.month, String(m.issued), String(m.redeemed), String(m.expired)]);
    downloadCSV(headers, rows, 'analytics-monthly-trend.csv');
  };
  const exportChannels = () => {
    const headers = ['Channel', 'Count', 'Percentage'];
    const rows = channels.map((c) => [c.channel, String(c.count), String(c.percentage?.toFixed(1) ?? 0)]);
    downloadCSV(headers, rows, 'analytics-redemption-channels.csv');
  };

  return (
    <Layout title="Analytics" subtitle="Detailed analytics and insights">
      <div className="space-y-6">
        <Card>
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-semibold">Monthly trend (last 12 months)</h3>
            <Button variant="outline" size="sm" onClick={exportMonthlyTrend} disabled={monthlyTrend.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
          <div className="p-0">
            {loadingTrend ? (
              <div className="p-6 text-center text-muted-foreground">Loading...</div>
            ) : monthlyTrend.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">No trend data yet.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead>Issued</TableHead>
                    <TableHead>Redeemed</TableHead>
                    <TableHead>Expired</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyTrend.map((m) => (
                    <TableRow key={m.month}>
                      <TableCell className="font-medium">{m.month}</TableCell>
                      <TableCell>{m.issued}</TableCell>
                      <TableCell>{m.redeemed}</TableCell>
                      <TableCell>{m.expired}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </Card>
        <Card>
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-semibold">Redemption channels</h3>
            <Button variant="outline" size="sm" onClick={exportChannels} disabled={channels.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
          <div className="p-0">
            {loadingChannels ? (
              <div className="p-6 text-center text-muted-foreground">Loading...</div>
            ) : channels.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">No channel data yet.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Channel</TableHead>
                    <TableHead>Count</TableHead>
                    <TableHead>Percentage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {channels.map((c) => (
                    <TableRow key={c.channel}>
                      <TableCell className="font-medium">
                        <span
                          className="inline-block w-3 h-3 rounded-full mr-2 align-middle"
                          style={{ backgroundColor: getRedemptionChannelColor(c.channel) }}
                          aria-hidden
                        />
                        {c.channel.replace(/_/g, ' ')}
                      </TableCell>
                      <TableCell>{c.count}</TableCell>
                      <TableCell>{c.percentage?.toFixed(1) ?? 0}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </Card>
      </div>
    </Layout>
  );
}
