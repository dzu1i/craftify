import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { requireAdmin } from "../middleware/roles";

const router = Router();

/**
 * GET /venues
 * Public – list all venues
 */
router.get("/", async (_req, res) => {
  const venues = await prisma.venue.findMany({
    orderBy: { name: "asc" },
  });

  res.json(venues);
});

/**
 * POST /venues
 * Admin – create venue
 */
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const { name, address, city } = req.body;

  if (!name || typeof name !== "string") {
    return res.status(400).json({ error: "name is required" });
  }

  const venue = await prisma.venue.create({
    data: {
      name,
      address: address ?? null,
      city: city ?? null,
    },
  });

  res.status(201).json(venue);
});

/**
 * PATCH /venues/:id
 * Admin 
 */
router.patch("/:id", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, address, city } = req.body;

  const exists = await prisma.venue.findUnique({ where: { id } });
  if (!exists) return res.status(404).json({ error: "Venue not found" });

  const updated = await prisma.venue.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(address !== undefined ? { address } : {}),
      ...(city !== undefined ? { city } : {}),
    },
  });

  res.json(updated);
});

/**
 * DELETE /venues/:id
 * Admin
 */
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;

  const exists = await prisma.venue.findUnique({ where: { id } });
  if (!exists) return res.status(404).json({ error: "Venue not found" });

  await prisma.venue.delete({ where: { id } });
  res.status(204).send();
});

export default router;
