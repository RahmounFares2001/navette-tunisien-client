// routes/car/car-route.js
import express from "express";
import {
  getAllCars,
  getAllCarsClient,
  getCarById,
  createCar,
  updateCar,
  deleteCar
} from "../../controllers/car/car-controller.js";

const router = express.Router();

router.get("/", getAllCars);
router.get("/clientCars", getAllCarsClient);
router.get("/:id", getCarById);
router.post("/", createCar);
router.put("/:id", updateCar);
router.delete("/:id", deleteCar);

export default router;
