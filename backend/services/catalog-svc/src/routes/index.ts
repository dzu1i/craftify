import { Router } from "express";
import categories from "./categories";
import classtypes from "./classtypes";
import venues from "./venues";
import events from "./events";

const router = Router();

router.use("/categories", categories);
router.use("/classtypes", classtypes);
router.use("/venues", venues);
router.use("/events", events);

export default router;
