import { type Request, type Response, type NextFunction } from "express";

declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

function extractBearerToken(req: Request): string | null {
  const auth = req.headers["authorization"];
  if (auth && auth.startsWith("Bearer ")) {
    return auth.slice(7).trim();
  }
  return null;
}

function getUserIdFromSessionStore(
  req: Request,
  sessionId: string,
): Promise<number | null> {
  return new Promise((resolve) => {
    req.sessionStore.get(sessionId, (err, session) => {
      if (err || !session) return resolve(null);
      const userId = (session as { userId?: number }).userId;
      resolve(userId ?? null);
    });
  });
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  let userId = req.session?.userId;

  if (!userId) {
    const token = extractBearerToken(req);
    if (token) {
      userId = (await getUserIdFromSessionStore(req, token)) ?? undefined;
    }
  }

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
  let userId = req.session?.userId;

  if (!userId) {
    const token = extractBearerToken(req);
    if (token) {
      userId = (await getUserIdFromSessionStore(req, token)) ?? undefined;
    }
  }

  if (userId) {
    req.userId = userId;
  }

  next();
}
