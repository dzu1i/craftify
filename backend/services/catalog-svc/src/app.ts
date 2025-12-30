import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { auditLog } from "./middleware/auditLog";
import { requireAuth } from "./middleware/auth";

import routes from "./routes";

dotenv.config();

const app = express();

app.use(cors());
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
