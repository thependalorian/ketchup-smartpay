/**
 * Ketchup SmartPay Backend API - Express app
 *
 * Location: backend/src/app.ts
 * Purpose: Express app definition for both local server and Vercel serverless.
 * Vercel uses this file as the function entry (export default app); local dev uses index.ts which calls app.listen().
 */
import 'dotenv/config';
import { type Express } from 'express';
declare const app: Express;
export default app;
//# sourceMappingURL=app.d.ts.map