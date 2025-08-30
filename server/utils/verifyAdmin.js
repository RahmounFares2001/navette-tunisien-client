import jwt from 'jsonwebtoken';
import { Admin } from '../models/models.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

export const verifyAdmin = async (req, res, next) => {
  try {
    // (token)

    // Extract token from cookies
    const token = req.cookies.admin_token;
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }
    (token)

    // Verify JWT
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded.id || !decoded.email) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    // Find admin by ID and check isAdmin
    const admin = await Admin.findById(decoded.id).select('email isAdmin');
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Admin not found' });
    }
    if (!admin.isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized as admin' });
    }
    (admin)

    // Attach admin data to request
    req.admin = { id: admin._id, email: admin.email };
    next();
  } catch (error) {
    console.error('verifyAdmin error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired' });
    }
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};