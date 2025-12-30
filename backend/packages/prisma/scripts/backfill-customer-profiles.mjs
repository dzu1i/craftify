import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 1) unikátní userId z Reservation
  const reservations = await prisma.reservation.findMany({
    select: { userId: true },
    distinct: ["userId"],
  });
  const userIds = reservations.map((r) => r.userId);

  if (userIds.length === 0) {
    console.log("✅ No reservations found, nothing to backfill.");
    return;
  }

  // 2) existující profily
  const existing = await prisma.customerProfile.findMany({
    where: { userId: { in: userIds } },
    select: { userId: true },
  });
  const existingSet = new Set(existing.map((e) => e.userId));

  // 3) missing profily (id neřešíme – DB si ho udělá přes @default(cuid()))
  const missing = userIds
    .filter((id) => !existingSet.has(id))
    .map((userId) => ({
      userId,
      email: null,
      fullName: null,
    }));

  if (missing.length === 0) {
    console.log("✅ No missing CustomerProfiles.");
    return;
  }

  const result = await prisma.customerProfile.createMany({
    data: missing,
    skipDuplicates: true,
  });

  console.log(`✅ Created ${result.count} CustomerProfiles.`);
}

main()
  .catch((e) => {
    console.error("❌ Backfill failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });