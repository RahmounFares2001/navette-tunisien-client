import express from 'express';
import { verifyAdmin } from '../../utils/verifyAdmin.js';
import { getDashboardData } from '../../controllers/dashboard/dashboard-controller.js';

const router = express.Router();

// Get dashboard data
router.get('/', verifyAdmin, getDashboardData);

export default router;