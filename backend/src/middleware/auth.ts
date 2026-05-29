import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

type TokenPayload = {
  id: number;
  role: 'admin' | 'worker' | 'user';
};

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;

  if (!token) {
    return res.status(401).json({ message: 'Missing auth token' });
  }

  try {
    req.auth = jwt.verify(token, process.env.JWT_SECRET as string) as TokenPayload;
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid auth token' });
  }
};

export const requireRole =
  (...roles: Array<'admin' | 'worker' | 'user'>) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    return next();
  };
