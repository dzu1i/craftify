import { Router, type Request, type Response } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

const router = Router();

/**
 * GET /me
 * Returns { userId, role }
 */
router.get("/", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).user?.sub;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const roleRow = await prisma.userRole.findUnique({ where: { userId } });
  const role = roleRow?.role ?? "USER";

  return res.json({ userId, role });
});

export default router;