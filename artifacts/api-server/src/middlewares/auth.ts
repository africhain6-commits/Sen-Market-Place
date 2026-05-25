import { type Request, type Response, type NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const userId = req.session?.userId;
  if (!userId) {
    res.status(401).json({ error: "Non authentifié" });
    return;
  }
  req.userId = userId;
  next();
}

export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const userId = req.session?.userId;
  if (userId) {
    req.userId = userId;
  }
  next();
}
