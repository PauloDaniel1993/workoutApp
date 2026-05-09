import type { NextFunction, Request, Response } from "express"
import jwt from "jsonwebtoken"

import type { JwtPayload, UserRole } from "../types/auth"

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key"
export const JWT_EXPIRES_IN = "7d"

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const header = req.headers.authorization
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid Authorization header" })
    return
  }

  const token = header.slice("Bearer ".length).trim()
  if (!token) {
    res.status(401).json({ error: "Missing bearer token" })
    return
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
    }
    next()
  } catch {
    res.status(401).json({ error: "Invalid or expired token" })
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" })
      return
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: "Forbidden" })
      return
    }
    next()
  }
}
