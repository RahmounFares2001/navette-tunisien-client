import express from "express";
import { checkAndUpdateReservations } from "../../controllers/cron/cronController.js";

const router = express.Router();

router.get("/run-daily-job", checkAndUpdateReservations);

export default router;
