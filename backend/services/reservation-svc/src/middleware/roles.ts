import type { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";

export type Role = "USER" | "LECTOR" | "ADMIN";

declare global {
  namespace Express {
    interface Request {
      role?: Role;
      // interně pro cache (není nutné exportovat ven)
      _roleLoaded?: boolean;
    }
  }
}

function getUserId(req: Request): string | undefined {
  return (req.user as any)?.id ?? (req.user as any)?.sub;
}

async function loadRole(req: Request): Promise<Role> {
  if (req._roleLoaded && req.role) return req.role;

  const userId = getUserId(req);
  if (!userId) return "USER";

  const row = await prisma.userRole.findUnique({ where: { userId } });
  const role = (row?.role as Role) ?? "USER";

  req.role = role;
  req._roleLoaded = true;

  return role;
}

export function requireRole(...allowed: Role[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    try {
      const role = await loadRole(req);

      if (!allowed.includes(role)) {
        return res.status(403).json({ error: "Forbidden" });
      }

      return next();
    } catch (e) {
      return res.status(500).json({ error: "Failed to load user role" });
    }
  };
}

export const requireAdmin = requireRole("ADMIN");
export const requireLectorOrAdmin = requireRole("LECTOR", "ADMIN");
export const requireUserOrAbove = requireRole("USER", "LECTOR", "ADMIN");
