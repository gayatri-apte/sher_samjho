import {getAuth} from "firebase-admin/auth";
import type {DecodedIdToken} from "firebase-admin/auth";
import type {Request, Response, NextFunction} from "express";
import {ensureUser} from "../db/users.repo";

/**
 * Verifies Bearer token and attaches decoded user to req.user.
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {NextFunction} next - Next middleware
 */
export async function requireAuth(
  req: Request & {user?: DecodedIdToken},
  res: Response,
  next: NextFunction
) {
  try {
    const header = req.headers.authorization;
    console.log("AUTH HEADER:", req.headers.authorization);

    if (!header?.startsWith("Bearer ")) {
      return res.status(401).json({error: "Unauthorized"});
    }

    const token = header.split("Bearer ")[1];
    const decoded = await getAuth().verifyIdToken(token);

    await ensureUser(decoded.uid, decoded.email ?? null);

    req.user = decoded;

    return next();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("AUTH ERROR:", err);
    return res.status(401).json({
      error: "Unauthorized",
      detail: msg,
    });
  }
}
