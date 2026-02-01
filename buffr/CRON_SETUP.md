# Compliance Scheduler Setup

This document explains how to set up automated compliance tasks:
- **Daily Trust Account Reconciliation** (PSD-3 requirement)
- **Monthly Compliance Report Generation** (PSD-1 requirement)

## Option 1: Vercel Cron Jobs (Recommended for Vercel Deployments)

Vercel supports cron jobs via `vercel.json` configuration.

### Step 1: Create `vercel.json` in project root

```json
{
  "crons": [
    {
      "path": "/api/cron/trust-account-reconcile",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/cron/compliance-report",
      "schedule": "0 9 10 * *"
    }
  ]
}
```

**Schedule Explanation:**
- `0 2 * * *` = Daily at 2:00 AM UTC (4:00 AM Africa/Windhoek)
- `0 9 10 * *` = 10th of each month at 9:00 AM UTC (11:00 AM Africa/Windhoek)

### Step 2: Create Cron API Endpoints

Create `app/api/cron/trust-account-reconcile.ts`:

```typescript
import { ExpoRequest } from 'expo-router/server';
import { performTrustAccountReconciliation } from '@/services/complianceScheduler';

export async function GET(req: ExpoRequest) {
  // Verify cron secret (Vercel sets this header)
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const result = await performTrustAccountReconciliation();
    return Response.json({ success: true, result });
  } catch (error) {
    console.error('[Cron] Reconciliation failed:', error);
    return Response.json({ success: false, error: String(error) }, { status: 500 });
  }
}
```

Create `app/api/cron/compliance-report.ts`:

```typescript
import { ExpoRequest } from 'expo-router/server';
import { generateMonthlyComplianceReport } from '@/services/complianceScheduler';

export async function GET(req: ExpoRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const result = await generateMonthlyComplianceReport();
    return Response.json({ success: true, result });
  } catch (error) {
    console.error('[Cron] Report generation failed:', error);
    return Response.json({ success: false, error: String(error) }, { status: 500 });
  }
}
```

### Step 3: Set Environment Variable

In Vercel dashboard, add:
```
CRON_SECRET=your-secret-key-here
```

---

## Option 2: System Cron Job

If running on a traditional server or Railway/Render:

### Step 1: Create Cron Script

Create `scripts/run-compliance-tasks.ts`:

```typescript
import { performTrustAccountReconciliation, generateMonthlyComplianceReport } from '../services/complianceScheduler';

async function main() {
  const task = process.argv[2];

  if (task === 'reconcile') {
    console.log('Running daily reconciliation...');
    const result = await performTrustAccountReconciliation();
    console.log('Result:', result);
  } else if (task === 'report') {
    console.log('Generating monthly report...');
    const result = await generateMonthlyComplianceReport();
    console.log('Result:', result);
  } else {
    console.log('Usage: node scripts/run-compliance-tasks.ts [reconcile|report]');
    process.exit(1);
  }
}

main().catch(console.error);
```

### Step 2: Edit Crontab

```bash
crontab -e
```

### Step 3: Add Cron Jobs

```bash
# Daily Trust Account Reconciliation at 2:00 AM (Africa/Windhoek = UTC+2, so 0:00 UTC)
0 0 * * * cd /path/to/buffr && /usr/local/bin/npx tsx scripts/run-compliance-tasks.ts reconcile >> /tmp/compliance-reconcile.log 2>&1

# Monthly Compliance Report on 10th at 9:00 AM (Africa/Windhoek = UTC+2, so 7:00 UTC)
0 7 10 * * cd /path/to/buffr && /usr/local/bin/npx tsx scripts/run-compliance-tasks.ts report >> /tmp/compliance-report.log 2>&1
```

**Adjust paths:**
- Replace `/path/to/buffr` with your actual project path
- Replace `/usr/local/bin/npx` with your npx path (find with `which npx`)

### Step 4: Verify Cron Jobs

```bash
# List your cron jobs
crontab -l

# Check cron logs (macOS)
tail -f /var/log/system.log | grep CRON

# Check cron logs (Linux)
tail -f /var/log/cron
```

---

## Option 3: AWS EventBridge / Google Cloud Scheduler

For cloud-native deployments:

### AWS EventBridge

1. Create Lambda function that calls the scheduler functions
2. Create EventBridge rules:
   - Daily rule: `cron(0 0 * * ? *)` (UTC)
   - Monthly rule: `cron(0 7 10 * ? *)` (UTC)

### Google Cloud Scheduler

1. Create Cloud Functions for each task
2. Schedule:
   - Daily: `0 0 * * *` (UTC)
   - Monthly: `0 7 10 * *` (UTC)

---

## Option 4: Railway Cron Jobs

Railway supports cron jobs via `railway.json`:

```json
{
  "cron": [
    {
      "command": "npx tsx services/complianceScheduler.ts --reconcile",
      "schedule": "0 0 * * *"
    },
    {
      "command": "npx tsx services/complianceScheduler.ts --report",
      "schedule": "0 7 10 * *"
    }
  ]
}
```

---

## Manual Execution (Testing)

You can run tasks manually for testing:

```bash
# Run reconciliation
npx tsx services/complianceScheduler.ts --reconcile

# Generate monthly report
npx tsx services/complianceScheduler.ts --report
```

---

## Environment Variables

Set these in your environment:

```bash
# Enable/disable tasks (default: enabled)
ENABLE_DAILY_RECONCILIATION=true
ENABLE_MONTHLY_REPORTS=true

# Database connection (required)
DATABASE_URL=postgresql://...

# Cron secret (for Vercel cron endpoints)
CRON_SECRET=your-secret-key
```

---

## Monitoring

Check logs for:
- `[Compliance Scheduler]` prefix for all scheduler messages
- Reconciliation results in `trust_account_reconciliations` table
- Generated reports in `compliance_report_files` table
- Audit logs in `audit_logs` table (event_type: `trust_account_reconciliation` or `compliance_report_generated`)

---

## Troubleshooting

**Task not running:**
- Check cron logs
- Verify environment variables
- Test manual execution first

**Database errors:**
- Verify DATABASE_URL is set correctly
- Check database connection
- Ensure tables exist (run migrations)

**Timezone issues:**
- All schedules are in UTC
- Adjust cron schedule for your timezone
- Africa/Windhoek is UTC+2
