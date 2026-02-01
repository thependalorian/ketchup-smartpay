# Exchange Rate Cron Job Setup

This document explains how to set up automatic exchange rate fetching twice daily.

## Option 1: Built-in Scheduler (Recommended)

The exchange rate scheduler is **automatically enabled** when the Buffr AI server starts.

### How It Works

- Scheduler runs as part of the main server process
- Fetches rates at **8:00 AM and 8:00 PM UTC** daily
- Automatically checks fetch limits (twice daily)
- Stores rates in database

### Configuration

**Enable/Disable:**
```bash
# In buffr_ai_ts/.env
ENABLE_EXCHANGE_RATE_SCHEDULER=true   # Default: enabled
# ENABLE_EXCHANGE_RATE_SCHEDULER=false  # Disable if needed
```

**Start Server:**
```bash
cd buffr_ai_ts
npm run dev    # Development
npm start      # Production
```

The scheduler will automatically start and log:
```
[ExchangeRate Scheduler] 🚀 Starting exchange rate scheduler...
[ExchangeRate Scheduler] 📅 Schedule: 8:00 AM and 8:00 PM UTC daily
[ExchangeRate Scheduler] ✅ Scheduler started successfully
```

### Manual Fetch

You can also fetch rates manually:
```bash
npm run fetch-rates
```

---

## Option 2: System Cron Job

If you prefer to run the fetch script separately from the main server:

### Step 1: Make Script Executable

```bash
cd buffr_ai_ts
chmod +x scripts/fetch-exchange-rates.ts
```

### Step 2: Edit Crontab

```bash
crontab -e
```

### Step 3: Add Cron Job

Add this line to fetch at 8 AM and 8 PM UTC daily:

```bash
# Exchange Rate Fetch - Twice Daily (8 AM and 8 PM UTC)
0 8,20 * * * cd /path/to/buffr_ai_ts && /usr/local/bin/npx tsx scripts/fetch-exchange-rates.ts >> /tmp/exchange-rates.log 2>&1
```

**Adjust paths:**
- Replace `/path/to/buffr_ai_ts` with your actual path
- Replace `/usr/local/bin/npx` with your npx path (find with `which npx`)
- Log file location is optional (remove `>> /tmp/exchange-rates.log 2>&1` if not needed)

### Step 4: Verify Cron Job

```bash
# List your cron jobs
crontab -l

# Check cron logs (macOS)
tail -f /var/log/system.log | grep CRON

# Check cron logs (Linux)
tail -f /var/log/cron
```

### Alternative: Different Time Zones

**For Namibia (CAT - UTC+2):**
```bash
# Fetch at 10 AM and 10 PM Namibia time (8 AM and 8 PM UTC)
0 8,20 * * * cd /path/to/buffr_ai_ts && npx tsx scripts/fetch-exchange-rates.ts
```

**For Local Time (e.g., 9 AM and 9 PM):**
```bash
# Adjust times as needed
0 9,21 * * * cd /path/to/buffr_ai_ts && npx tsx scripts/fetch-exchange-rates.ts
```

---

## Option 3: PM2 Process Manager

If using PM2 for process management:

### Step 1: Install PM2

```bash
npm install -g pm2
```

### Step 2: Create PM2 Config

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'buffr-ai',
      script: 'dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'exchange-rates-fetcher',
      script: 'scripts/fetch-exchange-rates.ts',
      interpreter: 'npx',
      interpreter_args: 'tsx',
      cron_restart: '0 8,20 * * *',  // 8 AM and 8 PM UTC
      autorestart: false,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
```

### Step 3: Start with PM2

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Enable auto-start on system boot
```

---

## Verification

### Check Database

```sql
-- View latest rates
SELECT * FROM exchange_rates 
ORDER BY fetched_at DESC 
LIMIT 10;

-- Check fetch log
SELECT * FROM exchange_rate_fetch_log 
ORDER BY created_at DESC 
LIMIT 10;
```

### Check Logs

**Built-in Scheduler:**
- Logs appear in server console
- Look for `[ExchangeRate Scheduler]` messages

**System Cron:**
- Check log file: `tail -f /tmp/exchange-rates.log`
- Or check system logs

**PM2:**
```bash
pm2 logs exchange-rates-fetcher
```

---

## Troubleshooting

### Scheduler Not Running

1. **Check environment variable:**
   ```bash
   echo $ENABLE_EXCHANGE_RATE_SCHEDULER
   # Should be empty or 'true'
   ```

2. **Check server logs:**
   - Look for `[ExchangeRate Scheduler]` messages
   - Check for errors

3. **Manual test:**
   ```bash
   npm run fetch-rates
   ```

### Cron Job Not Running

1. **Check cron service:**
   ```bash
   # macOS
   sudo launchctl list | grep cron
   
   # Linux
   systemctl status cron
   ```

2. **Check cron permissions:**
   - Ensure script is executable
   - Check file paths are absolute
   - Verify npx path is correct

3. **Test cron syntax:**
   ```bash
   # Test with a simple command first
   0 8,20 * * * echo "Test" >> /tmp/cron-test.log
   ```

### Database Connection Issues

1. **Check DATABASE_URL:**
   ```bash
   # In buffr_ai_ts/.env
   DATABASE_URL=postgresql://...
   ```

2. **Test connection:**
   ```bash
   npm run fetch-rates
   ```

---

## Rate Limit Safety

The system automatically enforces twice-daily fetching:

- ✅ Checks `should_fetch_exchange_rates()` before each fetch
- ✅ Logs all fetches in `exchange_rate_fetch_log` table
- ✅ Prevents more than 2 fetches per day
- ✅ 60 requests/month = well under 100 limit

**Manual fetches are still allowed** but count toward the daily limit.

---

## Recommended Setup

**For Development:**
- Use built-in scheduler (Option 1)
- Easy to start/stop with server
- Logs visible in console

**For Production:**
- Use built-in scheduler (Option 1) - **Recommended**
- Or system cron (Option 2) if you prefer separation
- Or PM2 (Option 3) if already using PM2

---

**Last Updated:** December 18, 2025

