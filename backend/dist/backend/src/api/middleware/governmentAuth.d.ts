/**
 * Government Authentication Middleware
 *
 * Purpose: Authenticate Government portal requests (read-only access by default)
 * Location: backend/src/api/middleware/governmentAuth.ts
 */
import { Request, Response, NextFunction } from 'express';
export declare const governmentAuth: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=governmentAuth.d.ts.map