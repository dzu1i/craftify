import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { requireAdmin } from "../middleware/roles";
import { TimeSlotStatus } from "@prisma/client";

const router = Router();

const allowedStatuses = new Set<TimeSlotStatus>(Object.values(TimeSlotStatus));

function parseDateOrFail(value: any, fieldName: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw { status: 400, message: `${fieldName} must be a valid date` };
  }
  return d;
}

/**
 * GET /events
 * Public – list published upcoming events
 */
router.get("/", async (_req, res) => {
  const now = new Date();

  const events = await prisma.timeSlot.findMany({
    where: {
      status: "published",
      startAt: { gte: now },
    },
    include: {
      classType: { include: { category: true } },
      venue: true,
    },
    orderBy: { startAt: "asc" },
  });

  // spočítat booked rezervace pro všechny events najednou
  const ids = events.map((e) => e.id);

  const counts =
    ids.length === 0
      ? []
      : await prisma.reservation.groupBy({
          by: ["timeSlotId"],
          where: {
            timeSlotId: { in: ids },
            status: "booked",
          },
          _count: { _all: true },
        });

  const bookedMap = new Map(counts.map((c) => [c.timeSlotId, c._count._all]));

  const enriched = events.map((e) => {
    const bookedCount = bookedMap.get(e.id) ?? 0;
    const spotsLeft = Math.max(0, e.capacity - bookedCount);
    return { ...e, bookedCount, spotsLeft };
  });

  res.json(enriched);
});

/**
 * POST /events
 * Admin – create & publish new event (time slot)
 */
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const { title, description, classTypeId, venueId, startAt, endAt, capacity, price } = req.body;

  if (!title || !classTypeId || !venueId || !startAt || !endAt || capacity == null || price == null) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  let start: Date;
  let end: Date;
  try {
    start = parseDateOrFail(startAt, "startAt");
    end = parseDateOrFail(endAt, "endAt");
  } catch (e: any) {
    return res.status(e.status ?? 400).json({ error: e.message ?? "Invalid date" });
  }

  const event = await prisma.timeSlot.create({
    data: {
      title,
      description: description ?? null,
      classTypeId,
      venueId,
      startAt: start,
      endAt: end,
      capacity: Number(capacity),
      price: Number(price),
      status: "published",
    },
  });

  res.status(201).json(event);
});

/**
 * GET /events/:id
 * Public
 */
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  const event = await prisma.timeSlot.findUnique({
    where: { id },
    include: {
      classType: { include: { category: true } },
      venue: true,
    },
  });

  if (!event) return res.status(404).json({ error: "Event not found" });

  const bookedCount = await prisma.reservation.count({
    where: { timeSlotId: id, status: "booked" },
  });

  const spotsLeft = Math.max(0, event.capacity - bookedCount);

  res.json({ ...event, bookedCount, spotsLeft });
});

/**
 * PATCH /events/:id
 * Admin
 */
router.patch("/:id", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { title, classTypeId, venueId, startAt, endAt, capacity, price, status } = req.body;

  const exists = await prisma.timeSlot.findUnique({ where: { id } });
  if (!exists) return res.status(404).json({ error: "Event not found" });

  try {
    let parsedStatus: TimeSlotStatus | undefined;

    if (status !== undefined) {
      if (!allowedStatuses.has(status as TimeSlotStatus)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      parsedStatus = status as TimeSlotStatus;
    }

    const updated = await prisma.timeSlot.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(classTypeId !== undefined ? { classTypeId } : {}),
        ...(venueId !== undefined ? { venueId } : {}),
        ...(startAt !== undefined ? { startAt: parseDateOrFail(startAt, "startAt") } : {}),
        ...(endAt !== undefined ? { endAt: parseDateOrFail(endAt, "endAt") } : {}),
        ...(capacity !== undefined ? { capacity: Number(capacity) } : {}),
        ...(price !== undefined ? { price: Number(price) } : {}),
        ...(parsedStatus !== undefined ? { status: parsedStatus } : {}),
      },
    });

    res.json(updated);
  } catch (e: any) {
    return res.status(e.status ?? 500).json({ error: e.message ?? "Failed to update event" });
  }
});

/**
 * DELETE /events/:id
 * Admin
 */
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;

  const exists = await prisma.timeSlot.findUnique({ where: { id } });
  if (!exists) return res.status(404).json({ error: "Event not found" });

  await prisma.timeSlot.delete({ where: { id } });
  res.status(204).send();
});

export default router;
