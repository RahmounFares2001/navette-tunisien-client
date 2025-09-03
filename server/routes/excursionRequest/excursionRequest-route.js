import express from 'express';
import { verifyAdmin } from '../../utils/verifyAdmin.js';
import { createExcursionRequest, getAllExcursionRequests, getExcursionRequestById, updateExcursionRequest, deleteExcursionRequest } from '../../controllers/excursionRequest/excursionRequest-controller.js';

const router = express.Router();

// Create a new excursion request
router.post('/', createExcursionRequest);

// Get all excursion
router.get('/', verifyAdmin, getAllExcursionRequests);

// Get a single excursion request by
router.get('/:id', verifyAdmin, getExcursionRequestById);

// Update an excursion
router.put('/:id', verifyAdmin, updateExcursionRequest);

// Delete an excursion
router.delete('/:id', verifyAdmin, deleteExcursionRequest);

export default router;