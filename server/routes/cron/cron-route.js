import express from 'express';
import { updateStatuses } from '../../controllers/cron/cron-controller.js';

const router = express.Router();

// Run cron job to update statuses
router.get('/update-statuses', updateStatuses);

export default router;