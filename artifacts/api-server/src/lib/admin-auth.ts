import crypto from "crypto";
import type { Request, Response, NextFunction } from "express";

const ADMIN_TOKENS = new Set<string>();

export function createAdminToken(): string {
  const token = crypto.randomBytes(32).toString("hex");
  ADMIN_TOKENS.add(token);
  setTimeout(() => ADMIN_TOKENS.delete(token), 8 * 60 * 60 * 1000);
  return token;
}

export function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers["x-admin-token"] as string | undefined;
  if (!token || !ADMIN_TOKENS.has(token)) {
    res.status(401).json({ error: "Admin authentication required" });
    return;
  }
  next();
}
