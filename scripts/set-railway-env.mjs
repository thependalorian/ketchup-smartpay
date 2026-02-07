#!/usr/bin/env node
/**
 * Push backend environment variables to Railway from backend/.env.local and secrets.local.
 * Run from repo root: node scripts/set-railway-env.mjs
 * Requires: railway CLI linked (railway link) and logged in (railway login).
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');

const BACKEND_KEYS = [
  'DATABASE_URL',
  'GOVERNMENT_API_KEY',
  'KETCHUP_API_KEY',
  'API_KEY',
  'KETCHUP_SMARTPAY_API_KEY',
  'BUFFR_API_URL',
  'BUFFR_API_KEY',
  'BUFFR_WEBHOOK_SECRET',
];

const BACKEND_ENV_FILE = 'backend/.env.local';
const SECRETS_FILE = 'secrets.local';

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

function main() {
  const backendEnv = parseEnvFile(BACKEND_ENV_FILE);
  const secrets = parseEnvFile(SECRETS_FILE);
  const merged = { ...secrets, ...backendEnv };

  const toSet = {};
  for (const key of BACKEND_KEYS) {
    const value = merged[key];
    if (value != null && String(value).trim() !== '') toSet[key] = String(value).trim();
  }

  if (Object.keys(toSet).length === 0) {
    console.error('No backend env vars found in', BACKEND_ENV_FILE, 'or', SECRETS_FILE);
    console.error('Expected keys:', BACKEND_KEYS.join(', '));
    process.exit(1);
  }

  console.log('Setting', Object.keys(toSet).length, 'variables on Railway...');
  for (const [key, value] of Object.entries(toSet)) {
    const arg = `${key}=${value}`;
    try {
      execSync('railway', ['variable', 'set', arg], {
        stdio: 'inherit',
        cwd: REPO_ROOT,
      });
      console.log('  Set', key);
    } catch (err) {
      console.error('  Failed to set', key, err.message);
    }
  }
  console.log('Done.');
}

main();
