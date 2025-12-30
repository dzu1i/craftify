import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { requireAdmin } from "../middleware/roles";

const router = Router();

/**
 * GET /classtypes
 * Public – list class types (optionally by category)
 * /classtypes?categoryId=...
 */
router.get("/", async (req, res) => {
  const { categoryId } = req.query;

  const classTypes = await prisma.classType.findMany({
    where: categoryId ? { categoryId: String(categoryId) } : undefined,
    include: {
      category: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  res.json(classTypes);
});

/**
 * POST /classtypes
 * Admin – create new class type
 */
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const { name, categoryId } = req.body;

  if (!name || !categoryId) {
    return res.status(400).json({
      error: "name and categoryId are required",
    });
  }

  try {
    const classType = await prisma.classType.create({
      data: {
        name,
        categoryId,
      },
    });

    res.status(201).json(classType);
  } catch (e: any) {
    console.error(e);
    res.status(500).json({
      error: "Failed to create class type",
    });
  }
});

/**
 * PATCH /classtypes/:id
 * Admin
 */
router.patch("/:id", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, categoryId } = req.body;

  const exists = await prisma.classType.findUnique({ where: { id } });
  if (!exists) return res.status(404).json({ error: "Class type not found" });

  const updated = await prisma.classType.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(categoryId !== undefined ? { categoryId } : {}),
    },
  });

  res.json(updated);
});

/**
 * DELETE /classtypes/:id
 * Admin
 */
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;

  const exists = await prisma.classType.findUnique({ where: { id } });
  if (!exists) return res.status(404).json({ error: "Class type not found" });

  await prisma.classType.delete({ where: { id } });
  res.status(204).send();
});

export default router;
