/**
 * Compliance Admin Page - Ketchup Portal
 * Purpose: Monthly stats and generate BoN compliance report (moved from Buffr per PRD).
 * Location: apps/ketchup-portal/src/pages/ComplianceAdmin.tsx
 */

import { useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { Button, Card } from '@smartpay/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '@smartpay/api-client/ketchup';
import { FileText, Download } from 'lucide-react';

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

export default function ComplianceAdmin() {
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(currentMonth);
  const queryClient = useQueryClient();

  const { data: monthlyStats, isLoading } = useQuery({
    queryKey: ['admin-compliance-monthly-stats', year, month],
    queryFn: () => adminAPI.getMonthlyStats(year, month),
  });

  const generateMutation = useMutation({
    mutationFn: () => adminAPI.generateComplianceReport(year, month),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-compliance-monthly-stats', year, month] }),
  });

  return (
    <Layout title="Compliance Admin" subtitle="Monthly stats and BoN report generation">
      <div className="space-y-6">
        <Card className="p-6">
          <h3 className="font-semibold mb-2">Monthly stats</h3>
          <p className="text-sm text-muted-foreground mb-4">Select year and month to view compliance statistics.</p>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="text-sm text-muted-foreground block mb-1">Year</label>
              <input
                type="number"
                min={2020}
                max={currentYear + 1}
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value) || currentYear)}
                className="border rounded px-3 py-2 w-24"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground block mb-1">Month</label>
              <select
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value))}
                className="border rounded px-3 py-2 w-32"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {new Date(2000, m - 1, 1).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {isLoading ? (
            <p className="text-muted-foreground text-sm mt-4">Loading...</p>
          ) : monthlyStats != null ? (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <pre className="text-xs overflow-auto max-h-80 whitespace-pre-wrap">
                {typeof monthlyStats === 'object'
                  ? JSON.stringify(monthlyStats, null, 2)
                  : String(monthlyStats)}
              </pre>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm mt-4">No data for this period.</p>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-2">Generate report</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Generate Bank of Namibia monthly compliance report for the selected period.
          </p>
          <Button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending || isLoading}
          >
            <FileText className="h-4 w-4 mr-2" />
            {generateMutation.isPending ? 'Generating...' : `Generate report (${year}-${String(month).padStart(2, '0')})`}
          </Button>
          {generateMutation.isSuccess && (
            <p className="text-sm text-green-600 mt-2">Report generated successfully.</p>
          )}
          {generateMutation.isError && (
            <p className="text-sm text-destructive mt-2">
              {generateMutation.error instanceof Error ? generateMutation.error.message : 'Generation failed.'}
            </p>
          )}
        </Card>
      </div>
    </Layout>
  );
}
