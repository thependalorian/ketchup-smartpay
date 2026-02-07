/**
 * Railway start: runs the bundled vercel-entry (single CJS file).
 * Build with: pnpm run build:vercel
 * Then: node railway-start.cjs
 */
require('dotenv').config();
const mod = require('./dist/backend/src/vercel-entry.cjs');
const app = mod.default || mod;
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Ketchup SmartPay Backend running on port ${PORT}`);
});
