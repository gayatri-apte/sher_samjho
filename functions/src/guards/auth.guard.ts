import {getAuth} from "firebase-admin/auth";
import type {DecodedIdToken} from "firebase-admin/auth";
import type {Request, Response, NextFunction} from "express";
import {ensureUser} from "../db/users.repo";

export type AuthRequest = Request & {user?: DecodedIdToken};

/**
 * Decodes the Bearer token if present. Returns null for missing/invalid.
 * @param {Request} req - Express request
 * @return {Promise<DecodedIdToken | null>} Decoded token or null
 */
async function decode(req: Request): Promise<DecodedIdToken | null> {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length).trim();
  if (!token) return null;
  return getAuth().verifyIdToken(token);
}

/**
 * Verifies Bearer token and attaches decoded user to req.user.
 * Never logs the token itself.
 * @param {AuthRequest} req - Express request
 * @param {Response} res - Express response
 * @param {NextFunction} next - Next middleware
 */
export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const decoded = await decode(req);
    if (!decoded) {
      return res.status(401).json({error: "Unauthorized"});
    }
    await ensureUser(decoded);
    req.user = decoded;
    return next();
  } catch (err) {
    console.warn("Auth failed:", err instanceof Error ? err.message : err);
    return res.status(401).json({error: "Unauthorized"});
  }
}

/**
 * Attaches req.user when a valid token is sent, but never blocks.
 * Used for public endpoints that personalise or rate-limit per user.
 * @param {AuthRequest} req - Express request
 * @param {Response} _res - Express response
 * @param {NextFunction} next - Next middleware
 */
export async function optionalAuth(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) {
  try {
    const decoded = await decode(req);
    if (decoded) req.user = decoded;
  } catch {
    // invalid token on a public route: treat as anonymous
  }
  next();
}

/**
 * Allows only admins: custom claim `admin: true`, or an email listed in
 * ADMIN_EMAILS (comma separated, in functions/.env). Use after requireAuth.
 * @param {AuthRequest} req - Express request
 * @param {Response} res - Express response
 * @param {NextFunction} next - Next middleware
 */
export function requireAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const user = req.user;
  const allow = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const isAdmin =
    user?.admin === true ||
    (!!user?.email && user.email_verified !== false &&
      allow.includes(user.email.toLowerCase()));
  if (!isAdmin) {
    res.status(403).json({error: "Admins only"});
    return;
  }
  next();
}
