import express from 'express';
import { verifyAdmin } from '../../utils/verifyAdmin.js';
import { createVehicle, getAllVehicles, getVehicleById, updateVehicle, deleteVehicle } from '../../controllers/vehicle/vehicle-controller.js';

const router = express.Router();

// Create a new vehicle
router.post('/', verifyAdmin, createVehicle);

// Get all vehicles
router.get('/', getAllVehicles);

// Get a single vehicle by ID
router.get('/:id', verifyAdmin, getVehicleById);

// Update a vehicle
router.put('/:id', verifyAdmin, updateVehicle);

// Delete a vehicle
router.delete('/:id', verifyAdmin, deleteVehicle);

export default router;