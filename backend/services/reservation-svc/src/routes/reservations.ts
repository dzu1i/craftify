import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { requireAdmin, requireLectorOrAdmin } from "../middleware/roles";

const router = Router();

/**
 * GET /reservations
 * Staff – list reservations (filters)
 * /reservations?timeSlotId=...&userId=...&status=booked|canceled
 */
router.get("/", requireAuth, requireLectorOrAdmin, async (req, res) => {
  const { timeSlotId, userId, status } = req.query;

  const reservations = await prisma.reservation.findMany({
    where: {
      ...(timeSlotId ? { timeSlotId: String(timeSlotId) } : {}),
      ...(userId ? { userId: String(userId) } : {}),
      ...(status ? { status: String(status) as any } : {}),
    },
    include: { timeSlot: true },
    orderBy: { createdAt: "desc" },
  });

  res.json(reservations);
});

/**
 * GET /reservations/by-event/:timeSlotId
 * Staff – list reservations for an event/time slot
 */
router.get(
  "/by-event/:timeSlotId",
  requireAuth,
  requireLectorOrAdmin,
  async (req, res) => {
    const { timeSlotId } = req.params;

    const reservations = await prisma.reservation.findMany({
      where: { timeSlotId },
      include: { timeSlot: true },
      orderBy: { createdAt: "desc" },
    });

    res.json(reservations);
  }
);

/**
 * GET /reservations/me
 * User – list my reservations
 */
router.get("/me", requireAuth, async (req, res) => {
  const userId = req.user!.id;

  const reservations = await prisma.reservation.findMany({
    where: { userId },
    include: { timeSlot: true },
    orderBy: { createdAt: "desc" },
  });

  res.json(reservations);
});

/**
 * GET /reservations/:id
 * Staff – reservation detail
 * IMPORTANT: must be after /me
 */
router.get("/:id", requireAuth, requireLectorOrAdmin, async (req, res) => {
  const { id } = req.params;

  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: { timeSlot: true },
  });

  if (!reservation) return res.status(404).json({ error: "Reservation not found" });
  res.json(reservation);
});

/**
 * POST /reservations
 * User – create reservation for logged user
 * (prevents duplicate booked reservation for same user+slot)
 */
router.post("/", requireAuth, async (req, res) => {
  const userId = req.user!.id;
  const { timeSlotId } = req.body;

  if (!timeSlotId) {
    return res.status(400).json({ error: "timeSlotId is required" });
  }

  // prevent duplicate booking for same user + same slot
  const existing = await prisma.reservation.findFirst({
    where: { userId, timeSlotId, status: "booked" },
    select: { id: true },
  });

  if (existing) {
    return res
      .status(409)
      .json({ error: "You already have a reservation for this event" });
  }

  // check capacity
  const slot = await prisma.timeSlot.findUnique({
    where: { id: timeSlotId },
    include: {
      reservations: {
        where: { status: "booked" },
        select: { id: true },
      },
    },
  });

  if (!slot) {
    return res.status(404).json({ error: "Event not found" });
  }

  if (slot.reservations.length >= slot.capacity) {
    return res.status(409).json({ error: "Event is full" });
  }

  const reservation = await prisma.reservation.create({
    data: {
      userId,
      timeSlotId,
      status: "booked",
    },
  });

  res.status(201).json(reservation);
});

/**
 * PATCH /reservations/:id/admin-cancel
 * Admin – cancel any reservation
 */
router.patch("/:id/admin-cancel", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;

  const reservation = await prisma.reservation.findUnique({ where: { id } });
  if (!reservation) return res.status(404).json({ error: "Reservation not found" });

  if (reservation.status === "canceled") {
    return res.json(reservation); // idempotent
  }

  const updated = await prisma.reservation.update({
    where: { id },
    data: { status: "canceled" },
  });

  res.json(updated);
});

/**
 * PATCH /reservations/:id/cancel
 * User – cancel own reservation (soft delete)
 */
router.patch("/:id/cancel", requireAuth, async (req, res) => {
  const userId = req.user!.id;
  const { id } = req.params;

  const reservation = await prisma.reservation.findUnique({
    where: { id },
  });

  if (!reservation || reservation.userId !== userId) {
    return res.status(404).json({ error: "Reservation not found" });
  }

  const updated = await prisma.reservation.update({
    where: { id },
    data: { status: "canceled" },
  });

  res.json(updated);
});

/**
 * PATCH /reservations/:id/reschedule
 * User – reschedule own reservation
 * - prevents rescheduling to same slot
 * - prevents duplicate booked reservation in target slot
 * - checks capacity of target slot
 */
router.patch("/:id/reschedule", requireAuth, async (req, res) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const { toTimeSlotId } = req.body;

  if (!toTimeSlotId) {
    return res.status(400).json({ error: "toTimeSlotId is required" });
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.findUnique({ where: { id } });

      if (!reservation || reservation.userId !== userId) {
        throw { status: 404, message: "Reservation not found" };
      }

      if (reservation.timeSlotId === toTimeSlotId) {
        throw { status: 400, message: "You are already booked for this event" };
      }

      const duplicateInTarget = await tx.reservation.findFirst({
        where: {
          userId,
          timeSlotId: toTimeSlotId,
          status: "booked",
        },
        select: { id: true },
      });

      if (duplicateInTarget) {
        throw { status: 409, message: "You already have a reservation for the target event" };
      }

      const slot = await tx.timeSlot.findUnique({
        where: { id: toTimeSlotId },
        include: {
          reservations: { where: { status: "booked" }, select: { id: true } },
        },
      });

      if (!slot) {
        throw { status: 404, message: "Target event not found" };
      }

      if (slot.reservations.length >= slot.capacity) {
        throw { status: 409, message: "Target event is full" };
      }

      return tx.reservation.update({
        where: { id },
        data: {
          timeSlotId: toTimeSlotId,
          status: "booked",
        },
      });
    });

    res.json({
      reservationId: updated.id,
      timeSlotId: updated.timeSlotId,
      status: updated.status,
    });
  } catch (err: any) {
    res
      .status(err.status ?? 500)
      .json({ error: err.message ?? "Reschedule failed" });
  }
});

export default router;
