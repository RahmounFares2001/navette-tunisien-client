import express from 'express';
import { verifyAdmin } from '../../utils/verifyAdmin.js';

const router = express.Router();

router.get('/', verifyAdmin, (req, res) => {
  res.status(200).json({ success: true, admin: req.admin });
});

export default router;
