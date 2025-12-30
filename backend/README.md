## Environment setup for Mac

Copy env examples and fill in values:

- services/catalog-svc/.env.example -> services/catalog-svc/.env
- services/reservation-svc/.env.example -> services/reservation-svc/.env
- packages/prisma/.env.example -> packages/prisma/.env (if using prisma scripts)

Then:

pnpm install
pnpm -w exec prisma generate --schema packages/prisma/schema.prisma
pnpm dev:all