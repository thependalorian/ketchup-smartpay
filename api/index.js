/**
 * Vercel serverless entry for Ketchup SmartPay Backend.
 * Location: api/index.js
 *
 * Loads the bundled vercel-entry.js (single file with DB and routes inlined).
 * Do not fall back to unbundled app.js — it requires backend/dist/backend/src/database/connection
 * which is not available in the serverless function.
 */

import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getPathFromRequest(req) {
  const pathFromQuery =
    (req.query && typeof req.query.path === 'string' && req.query.path) ||
    (req.query && Array.isArray(req.query.path) && req.query.path?.[0]);
  if (pathFromQuery != null && pathFromQuery !== '') return pathFromQuery.startsWith('/') ? pathFromQuery : `/${pathFromQuery}`;
  const raw = (req.url || req.originalUrl || '/').split('?')[0];
  const pathStr = raw.replace(/^\/api\/?/, '') || '/';
  return pathStr.startsWith('/') ? pathStr : `/${pathStr}`;
}

let app = null;
let appPromise = null;

async function getApp() {
  if (app) return app;
  if (appPromise) return appPromise;

  appPromise = (async () => {
    // Vercel: process.cwd() is project root; includeFiles puts backend/dist at project root
    const relPath = path.join('backend', 'dist', 'backend', 'src', 'vercel-entry.cjs');
    const pathsToTry = [
      path.join(process.cwd(), relPath),
      path.join(__dirname, '..', relPath),
    ];
    let lastErr;
    for (const entryPath of pathsToTry) {
      try {
        const mod = await import(pathToFileURL(entryPath).href);
        app = mod.default;
        if (typeof app === 'function' && !app.listen) app = app();
        return app;
      } catch (err) {
        lastErr = err;
        console.error('Failed to import bundled entry at', entryPath, err?.message);
      }
    }
    throw lastErr;
  })();

  return appPromise;
}

export default async function handler(req, res) {
  try {
    const path = getPathFromRequest(req);
    
    if (path === '/health' && req.method === 'GET') {
      res.status(200).json({
        status: 'healthy',
        source: 'api-handler',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Fallback: return empty dashboard metrics so portals can load if Express/DB fails
    const emptyMetrics = {
      totalBeneficiaries: 0,
      activeBeneficiaries: 0,
      deceasedBeneficiaries: 0,
      totalVouchersIssued: 0,
      vouchersRedeemed: 0,
      vouchersExpired: 0,
      totalDisbursement: 0,
      monthlyDisbursement: 0,
      activeAgents: 0,
      totalAgents: 0,
      networkHealthScore: 100,
    };
    if (path.includes('dashboard/metrics') && req.method === 'GET') {
      const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace(/^Bearer\s+/i, '');
      if (apiKey) {
        res.status(200).json({ success: true, data: emptyMetrics });
        return;
      }
    }

    const expressApp = await getApp();
    req.url = path;

    try {
      return new Promise((resolve, reject) => {
        const done = () => {
          if (!res.headersSent) {
            res.status(500).json({
              success: false,
              error: 'Internal server error',
              message: 'Response not sent before handler finished.',
            });
          }
          resolve();
        };
        res.on('finish', done);
        res.on('close', done);
        res.on('error', (err) => {
          console.error('api/index.js res error:', err);
          if (!res.headersSent) res.status(500).json({ success: false, error: String(err?.message || err) });
          resolve();
        });
        expressApp(req, res);
        setTimeout(done, 25000);
      });
    } catch (expressErr) {
      console.error('api/index.js express call error:', expressErr);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: 'Express error',
          message: expressErr?.message || String(expressErr),
        });
      }
    }
  } catch (err) {
    console.error('api/index.js handler error:', err);
    res.status(503).json({
      error: 'Function error',
      message: err?.message || String(err),
      hint: 'Backend Express app failed to load in serverless; /health is available.',
    });
  }
}
