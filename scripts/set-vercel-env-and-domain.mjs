#!/usr/bin/env node
/**
 * Set Vercel env vars for portals only. Backend runs on Railway (not Vercel).
 * Uses Vercel REST API. Requires VERCEL_TOKEN in env or in secrets.local.
 * Run from repo root: node scripts/set-vercel-env-and-domain.mjs
 * Optional: BACKEND_URL=https://your-railway-url.up.railway.app to set VITE_API_URL for both portals.
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const TEAM_ID = 'team_MPOdmWd6KnPpGhXI9UYg2Opo';

const PROJECTS = {
  'ketchup-portal': { id: 'prj_Q5CVcnM1KcUTLWvgo1l4oHiDWU0k', envFile: 'apps/ketchup-portal/.env.local' },
  'government-portal': { id: 'prj_N1WNHJMWTE7sXqmEXxAIZDZaKWA8', envFile: 'apps/government-portal/.env.local' },
};
const SECRETS_LOCAL_FILE = 'secrets.local';

const PORTAL_KEYS = [
  'VITE_API_URL', 'VITE_API_KEY', 'VITE_APP_URL', 'VITE_APP_NAME', 'VITE_ENVIRONMENT',
  'VITE_APP_VERSION', 'VITE_ENABLE_ANALYTICS', 'VITE_ENABLE_SENTRY', 'VITE_SENTRY_DSN',
  'DATABASE_URL', 'BUFFR_API_URL', 'BUFFR_API_KEY',
];

function parseEnvFile(relPath) {
  const fullPath = resolve(REPO_ROOT, relPath);
  if (!existsSync(fullPath)) return {};
  const content = readFileSync(fullPath, 'utf8');
  const out = {};
  for (const line of content.split('\n')) {
    const trimmed = line.replace(/#.*/, '').trim();
    if (!trimmed || !trimmed.includes('=')) continue;
    const eq = trimmed.indexOf('=');
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))
      value = value.slice(1, -1);
    out[key] = value;
  }
  return out;
}

async function api(method, path, body = null) {
  let token = process.env.VERCEL_TOKEN;
  if (!token) {
    const secrets = parseEnvFile(SECRETS_LOCAL_FILE);
    token = secrets.VERCEL_TOKEN;
    if (token) process.env.VERCEL_TOKEN = token;
  }
  if (!token) throw new Error('VERCEL_TOKEN is required. Set it in env or in secrets.local. Create one at https://vercel.com/account/tokens');
  const url = `https://api.vercel.com${path}${path.includes('?') ? '&' : '?'}teamId=${TEAM_ID}`;
  const opts = {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  const text = await res.text();
  if (!res.ok) throw new Error(`Vercel API ${res.status}: ${text}`);
  return text ? JSON.parse(text) : null;
}

async function setEnv(projectId, key, value, type = 'plain') {
  await api('POST', `/v10/projects/${projectId}/env?upsert=true`, {
    key,
    value,
    type: key.includes('KEY') || key === 'DATABASE_URL' ? 'sensitive' : type,
    target: ['production', 'preview'],
  });
}

async function addDomain(projectId, name) {
  try {
    const out = await api('POST', `/v10/projects/${projectId}/domains`, { name });
    console.log('  Domain added:', out?.name ?? name);
    return out;
  } catch (e) {
    if (e.message?.includes('already in use') || e.message?.includes('exists') || e.message?.includes('already assigned')) {
      console.log('  Domain already assigned:', name);
      return null;
    }
    throw e;
  }
}

async function removeDomain(projectId, name) {
  try {
    await api('DELETE', `/v9/projects/${projectId}/domains/${name}`);
    console.log('  Removed from project:', name);
    return true;
  } catch (e) {
    if (e.message?.includes('404') || e.message?.includes('not found')) {
      console.log('  Not on this project:', name);
      return false;
    }
    throw e;
  }
}

async function main() {
  const domainOnly = process.argv.includes('--domain-only');
  const backendUrl = process.env.BACKEND_URL || process.env.VITE_API_URL_OVERRIDE;

  if (domainOnly) {
    console.log('Setting portal domains only (app.ketchup.cc, gov.ketchup.cc)...\n');
    const KETCHUP_PORTAL_ID = PROJECTS['ketchup-portal'].id;
    const GOV_PORTAL_ID = PROJECTS['government-portal'].id;
    const APP_DOMAIN = 'app.ketchup.cc';
    const GOV_DOMAIN = 'gov.ketchup.cc';
    await removeDomain(GOV_PORTAL_ID, APP_DOMAIN);
    await addDomain(KETCHUP_PORTAL_ID, APP_DOMAIN);
    await removeDomain(KETCHUP_PORTAL_ID, GOV_DOMAIN);
    await addDomain(GOV_PORTAL_ID, GOV_DOMAIN);
    console.log('\nDone. Backend is on Railway (api.ketchup.cc points there via DNS).');
    return;
  }

  console.log('Setting Vercel env for portals only (backend is on Railway)...\n');

  for (const [name, { id, envFile }] of Object.entries(PROJECTS)) {
    const env = { ...parseEnvFile(envFile) };
    if (backendUrl) {
      env.VITE_API_URL = backendUrl;
      console.log(`${name}: using BACKEND_URL for VITE_API_URL`);
    }
    const toSet = PORTAL_KEYS.filter((k) => env[k] != null && env[k] !== '');
    if (!toSet.length) {
      console.log(`${name}: no env file or no matching keys at ${envFile}`);
      continue;
    }
    console.log(`${name}: setting ${toSet.length} env vars`);
    for (const key of toSet) {
      await setEnv(id, key, env[key]);
      console.log('  ', key, '=', key.includes('KEY') || key === 'DATABASE_URL' ? '***' : String(env[key]).slice(0, 50));
    }
  }

  const KETCHUP_PORTAL_ID = PROJECTS['ketchup-portal'].id;
  const GOV_PORTAL_ID = PROJECTS['government-portal'].id;
  const APP_DOMAIN = 'app.ketchup.cc';
  const GOV_DOMAIN = 'gov.ketchup.cc';

  console.log('\nDomains (portals only):');
  console.log('  app.ketchup.cc → ketchup-portal');
  await removeDomain(GOV_PORTAL_ID, APP_DOMAIN);
  await addDomain(KETCHUP_PORTAL_ID, APP_DOMAIN);
  console.log('  gov.ketchup.cc → government-portal');
  await removeDomain(KETCHUP_PORTAL_ID, GOV_DOMAIN);
  await addDomain(GOV_PORTAL_ID, GOV_DOMAIN);

  console.log('\nDone. Portals env synced. Backend is on Railway. Redeploy portals: pnpm run deploy:ketchup && pnpm run deploy:government');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
