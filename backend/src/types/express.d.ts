import 'express';

declare module 'express-serve-static-core' {
  interface Request {
    auth?: {
      id: number;
      role: 'admin' | 'worker' | 'user';
    };
  }
}
