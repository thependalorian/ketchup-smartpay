/**
 * Async route handler wrapper
 *
 * Location: backend/src/utils/asyncHandler.ts
 * Purpose: Pass async route rejections to Express error handler so we get JSON 500
 *          instead of FUNCTION_INVOCATION_FAILED on Vercel.
 */

import { Request, Response, NextFunction } from 'express';

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
