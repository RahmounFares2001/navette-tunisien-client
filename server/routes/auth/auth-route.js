import { Router } from 'express';
import { loginAdmin, logoutAdmin, sendResetEmail, resetPassword } from '../../controllers/auth/auth-controller.js';

const router = Router();

// Admin login route
router.post('/login', loginAdmin);

// Admin logout route
router.post('/logout', logoutAdmin);

// Forgot password - send reset email
router.post('/forgot-password', sendResetEmail);

// Reset password
router.post('/reset-password', resetPassword);

export default router;