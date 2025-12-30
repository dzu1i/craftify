import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import meRouter from "./routes/me";

import { requireAuth } from "./middleware/auth";

import routes from "./routes";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use((req, _res, next) => {
  console.log(`[reservation-svc] ${req.method} ${req.path}`);
  next();
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "reservation-svc" });
});

app.use("/me", meRouter);
// Other routes
app.use("/", routes);

export default app;
