import type {Response, NextFunction} from "express";
import type {AuthRequest} from "./auth.guard";

type Bucket = {count: number; resetAt: number};

/**
 * Small in-memory fixed-window rate limiter (per function instance).
 * Not a global quota, but it stops a single client from looping on the
 * paid AI endpoints (Gemini, Vision, TTS) and burning the budget.
 * @param {string} name - Limiter name (separate buckets per name)
 * @param {number} max - Max requests per window
 * @param {number} windowMs - Window length in ms
 * @return {Function} Express middleware
 */
export function rateLimit(name: string, max: number, windowMs = 60_000) {
  const buckets = new Map<string, Bucket>();

  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const forwarded = String(req.headers["x-forwarded-for"] || "")
      .split(",")[0]
      .trim();
    const who = req.user?.uid || forwarded || req.ip || "anon";
    const key = `${name}:${who}`;
    const now = Date.now();

    let b = buckets.get(key);
    if (!b || b.resetAt <= now) {
      b = {count: 0, resetAt: now + windowMs};
      buckets.set(key, b);
    }
    b.count += 1;

    if (buckets.size > 5000) {
      for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
    }

    if (b.count > max) {
      const retry = Math.ceil((b.resetAt - now) / 1000);
      res.setHeader("Retry-After", String(retry));
      res.status(429).json({
        error: `Too many requests. Try again in ${retry}s.`,
      });
      return;
    }
    next();
  };
}
