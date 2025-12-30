import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { requireAdmin } from "../middleware/roles";

const router = Router();

/**
 * GET /categories
 * Public – list all categories
 */
router.get("/", async (_req, res) => {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  res.json(categories);
});

/**
 * POST /categories
 * Admin – create new category
 */
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const { name } = req.body;

  if (!name || typeof name !== "string") {
    return res.status(400).json({ error: "Name is required" });
  }

  try {
    const category = await prisma.category.create({
      data: { name },
    });

    res.status(201).json(category);
  } catch (e: any) {
    // Prisma unique constraint violation
    if (e.code === "P2002") {
      return res.status(409).json({ error: "Category already exists" });
    }

    console.error(e);
    res.status(500).json({ error: "Failed to create category" });
  }
});

/**
 * PATCH /categories/:id
 * Admin
 */
router.patch("/:id", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  if (name !== undefined && typeof name !== "string") {
    return res.status(400).json({ error: "name must be a string" });
  }

  const exists = await prisma.category.findUnique({ where: { id } });
  if (!exists) return res.status(404).json({ error: "Category not found" });

  try {
    const updated = await prisma.category.update({
      where: { id },
      data: { ...(name !== undefined ? { name } : {}) },
    });

    res.json(updated);
  } catch (e: any) {
    if (e.code === "P2002") return res.status(409).json({ error: "Category already exists" });
    console.error(e);
    res.status(500).json({ error: "Failed to update category" });
  }
});

/**
 * DELETE /categories/:id
 * Admin
 */
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;

  const exists = await prisma.category.findUnique({ where: { id } });
  if (!exists) return res.status(404).json({ error: "Category not found" });

  await prisma.category.delete({ where: { id } });
  res.status(204).send();
});


export default router;
