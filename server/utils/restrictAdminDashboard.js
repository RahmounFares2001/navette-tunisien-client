import { verifyAdmin } from './verifyAdmin.js';

export const restrictAdminDashboard = async (req, res, next) => {
  try {
    // Log access attempt
    ('Attempting to access admin dashboard', {
      path: req.originalUrl,
      method: req.method,
    });

    // Allow public routes (e.g., /login, /api/*) to bypass admin check
    if (!req.originalUrl.startsWith('/adminDashboard')) {
      return next();
    }

    // Use verifyAdmin to check if user is an authenticated admin
    await verifyAdmin(req, res, (error) => {
      if (error) {
        ('Admin access denied, redirecting to login', {
          path: req.originalUrl,
          error: error.message,
        });
        return res.redirect(`${process.env.DOMAIN}/login`); 
      }
      // Admin verified, proceed to route
      ('Admin access granted', {
        adminId: req.admin.id,
        email: req.admin.email,
        path: req.originalUrl,
      });
      next();
    });
  } catch (error) {
    console.error('restrictAdminDashboard error:', {
      message: error.message,
      stack: error.stack,
      path: req.originalUrl,
    });
    return res.redirect(`${process.env.DOMAIN}/login`); 
  }
};