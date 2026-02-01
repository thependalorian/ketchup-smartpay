/**
 * Ketchup Authentication Middleware
 * 
 * Purpose: Authenticate Ketchup portal requests (full CRUD access)
 * Location: backend/src/api/middleware/ketchupAuth.ts
 */

import { Request, Response, NextFunction } from 'express';

const KETCHUP_API_KEY = process.env.KETCHUP_API_KEY || 'ketchup_dev_key';

export const ketchupAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const apiKey = req.headers['x-api-key'] as string;
    
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'MISSING_API_KEY',
          message: 'API key is required',
        },
      });
    }
    
    if (apiKey !== KETCHUP_API_KEY) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INVALID_API_KEY',
          message: 'Invalid API key for Ketchup portal',
        },
      });
    }
    
    // Add portal info to request
    (req as any).portal = 'ketchup';
    (req as any).permissions = ['read', 'write', 'delete']; // Full CRUD
    
    next();
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: error.message,
      },
    });
  }
};
