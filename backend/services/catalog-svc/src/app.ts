import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { auditLog } from "./middleware/auditLog";
import { requireAuth } from "./middleware/auth";

import routes from "./routes";

dotenv.config();

const app = express();

const corsOrigins =
  process.env.CORS_ORIGIN?.split(",").map((o) => o.trim()).filter(Boolean) ?? [];
const corsConfig =
  corsOrigins.length > 0 ? { origin: corsOrigins, credentials: true } : undefined;

app.use(cors(corsConfig));
app.use(express.json());

app.use((req, _res, next) => {
  console.log(`[catalog-svc] ${req.method} ${req.path}`);
  next();
});

// Fake auth (zatím pouštíme všechny)
// app.use(requireAuth);

// Audit middleware
app.use(auditLog("catalog-svc"));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "catalog-svc" });
});

// Other routes
app.use("/", routes);

export default app;
