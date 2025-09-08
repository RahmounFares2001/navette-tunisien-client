import express from 'express';
import { verifyAdmin } from '../../utils/verifyAdmin.js';
import { createExcursion, getAllExcursions, getExcursionById, updateExcursion, deleteExcursion } from '../../controllers/excursion/excursion-controller.js';

const router = express.Router();

// Create a new excursion
router.post('/', verifyAdmin, createExcursion);

// Get all excursions
router.get('/', getAllExcursions);

// Get a single excursion by ID
router.get('/:id', getExcursionById);

// Update an excursion
router.put('/:id', verifyAdmin, updateExcursion);

// Delete an excursion
router.delete('/:id', verifyAdmin, deleteExcursion);

export default router;