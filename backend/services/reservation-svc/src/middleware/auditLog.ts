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
    // audit nesmí shodit request
    console.warn("auditLog failed", e);
  }
}
