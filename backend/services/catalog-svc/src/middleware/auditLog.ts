import type { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";

export async function writeAudit(params: {
  action: string;
  actorId?: string;
  entity?: string;
  entityId?: string;
  meta?: unknown;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        action: params.action,
        actorId: params.actorId,
        entity: params.entity,
        entityId: params.entityId,
        meta: params.meta as any,
      },
    });
  } catch (e) {
    console.warn("auditLog failed", e);
  }
}

/**
 * Express middleware – zapisuje základní audit každého requestu
 */
export function auditLog(service: string) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    await writeAudit({
      action: `${req.method} ${req.path}`,
      actorId: req.user?.sub,
      meta: { service },
    });
    next();
  };
}
