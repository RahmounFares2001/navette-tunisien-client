import express from "express";
import {
  clientCreateReservation,
  confirmPayment

} from "../../controllers/clientReservation/clientReservation-controller.js";

const router = express.Router();

// POST create client reservation
router.post("/", clientCreateReservation);
router.get('/confirm', confirmPayment);

export default router;