#!/usr/bin/env node
/**
 * Test all Ketchup Portal API connections
 * Run from repo root: node scripts/test-api-connections.mjs
 * Requires: backend/.env.local (for API_KEY and BASE_URL)
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Load API key from backend .env.local (auth uses API_KEY; portal may send KETCHUP_API_KEY)
let API_KEY = process.env.API_KEY || '';
let BASE_URL = process.env.VITE_API_URL || 'http://localhost:3001';

try {
  const envPath = join(root, 'backend', '.env.local');
  const env = readFileSync(envPath, 'utf8');
  env.split('\n').forEach((line) => {
    const m = line.match(/^\s*([^#=]+)=(.*)$/);
    if (m) {
      const key = m[1].trim();
      const val = m[2].trim().replace(/^["']|["']$/g, '');
      if (key === 'API_KEY') API_KEY = val;
    }
  });
} catch (e) {
  console.log('Note: backend/.env.local not found, using env vars or defaults');
}

const API_BASE = `${BASE_URL}/api/v1`;
const headers = {
  'Content-Type': 'application/json',
  ...(API_KEY && { 'X-API-Key': API_KEY }),
};

const endpoints = [
  { name: 'Dashboard metrics', path: '/dashboard/metrics' },
  { name: 'Dashboard monthly trend', path: '/dashboard/monthly-trend', params: '?months=12' },
  { name: 'Dashboard redemption channels', path: '/dashboard/redemption-channels' },
  { name: 'Dashboard regional stats', path: '/dashboard/regional-stats' },
  { name: 'Vouchers list', path: '/vouchers', params: '?limit=10' },
  { name: 'Agents list', path: '/agents', params: '?limit=10' },
  { name: 'Agents stats', path: '/agents/stats' },
  { name: 'Status events (recent)', path: '/status-events', params: '?limit=10' },
  { name: 'Beneficiaries list', path: '/beneficiaries', params: '?limit=5' },
];

async function testOne(name, path, params = '') {
  const url = `${API_BASE}${path}${params || ''}`;
  try {
    const res = await fetch(url, { headers });
    const text = await res.text();
    let data = null;
    try {
      data = JSON.parse(text);
    } catch (_) {}

    const ok = res.ok;
    const status = res.status;
    let summary = '';
    let detail = '';
    if (data) {
      if (data.success === false) summary = data.error || 'error';
      else if (data.data != null) {
        const d = data.data;
        if (Array.isArray(d)) {
          summary = `array[${d.length}]`;
          if (d.length > 0 && typeof d[0] === 'object') detail = JSON.stringify(d[0]).slice(0, 60) + '…';
        } else if (typeof d === 'object' && d.data != null && Array.isArray(d.data)) {
          summary = `paginated[${d.data.length}]`;
          detail = d.total != null ? `total=${d.total}` : '';
        } else if (typeof d === 'object') {
          summary = 'object';
          const keys = Object.keys(d).filter((k) => typeof d[k] === 'number');
          if (keys.length) detail = keys.map((k) => `${k}=${d[k]}`).join(', ');
        } else summary = 'ok';
      } else summary = 'ok';
    } else summary = text.slice(0, 50);

    return { name, ok, status, summary, detail, data };
  } catch (err) {
    return { name, ok: false, status: 0, summary: err.message, detail: '', data: null };
  }
}

async function main() {
  console.log('Testing API connections');
  console.log('BASE_URL:', BASE_URL);
  console.log('API_KEY:', API_KEY ? `${API_KEY.slice(0, 20)}...` : '(none)');
  console.log('');

  const results = [];
  for (const e of endpoints) {
    const r = await testOne(e.name, e.path, e.params);
    results.push(r);
    const icon = r.ok ? '✓' : '✗';
    const status = r.status || '-';
    const extra = r.detail ? ` (${r.detail})` : '';
    console.log(`${icon} ${e.name}: HTTP ${status} ${r.summary}${extra}`);
  }

  console.log('');
  const failed = results.filter((r) => !r.ok);
  if (failed.length) {
    console.log('Failed endpoints:');
    failed.forEach((r) => console.log('  -', r.name, r.status, r.summary));
  }
  const passed = results.filter((r) => r.ok);
  console.log(`\nResult: ${passed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
}

main();
