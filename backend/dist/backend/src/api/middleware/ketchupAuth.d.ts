/**
 * Ketchup Authentication Middleware
 *
 * Purpose: Authenticate Ketchup portal requests (full CRUD access)
 * Location: backend/src/api/middleware/ketchupAuth.ts
 */
import { Request, Response, NextFunction } from 'express';
export declare const ketchupAuth: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=ketchupAuth.d.ts.map