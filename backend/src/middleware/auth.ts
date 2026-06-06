import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extending Express Request to carry user info after token verification
export interface AuthRequest extends Request {
  user?: { userId: string; username: string };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  // Token comes in header like: "Bearer eyJ..."
  // split(' ')[1] grabs the part after "Bearer "
  const token = req.headers.authorization?.split(' ')[1];

  // No token = not logged in = block immediately
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    // jwt.verify checks signature + expiry
    // if valid → returns the payload we stored inside ({ userId, username })
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      username: string;
    };

    req.user = decoded; // attach to request so routes can use it
    next();             // pass to route handler
  } catch {
    // token is fake, expired, or tampered
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}