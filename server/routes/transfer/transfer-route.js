import express from 'express';
import { verifyAdmin } from '../../utils/verifyAdmin.js';
import { createTransfer, getTransferById, updateTransfer, deleteTransfer, getAllTransfers } from '../../controllers/transfer/transfer-controller.js';

const router = express.Router();

// Create a new transfer (no admin verification)
router.post('/', createTransfer);

// Get all transfers (admin only)
router.get('/', verifyAdmin, getAllTransfers);

// Get a single transfer by ID (admin only)
router.get('/:id', verifyAdmin, getTransferById);

// Update a transfer (admin only)
router.put('/:id', verifyAdmin, updateTransfer);

// Delete a transfer (admin only)
router.delete('/:id', verifyAdmin, deleteTransfer);

export default router;