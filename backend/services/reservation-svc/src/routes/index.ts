import { Router } from "express";
import reservations from "./reservations";

const router = Router();

router.use("/reservations", reservations);

export default router;
