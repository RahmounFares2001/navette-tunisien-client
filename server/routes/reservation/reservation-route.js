import express from "express";
import {
  getAllReservations,
  getReservationById,
  updateReservation,
  createReservation,
  deleteReservation,
  getActiveReservationByLicenseId
} from "../../controllers/reservation/reservation-controller.js";

const router = express.Router();

// GET all reservations (admin)
router.get("/", getAllReservations);

// GET single reservation by ID
router.get("/:id", getReservationById);

// get reservation by licenseId
router.get("/license/:licenseIDNumber", getActiveReservationByLicenseId);

// PUT update reservation
router.put("/:id", updateReservation);

// PUT update status (admin)
router.put("/:id/status", updateReservation);

// POST create reservation
router.post("/", createReservation);

// DELETE reservation
router.delete("/:id", deleteReservation);

export default router;