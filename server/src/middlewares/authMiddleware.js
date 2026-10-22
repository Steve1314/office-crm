const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Verify JWT Token Middleware
 * Protects endpoints from unauthenticated access.
 */
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. Please login to continue.' 
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. Invalid authentication token.' 
      });
    }

    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'office_crm_jwt_super_secret_key_2026'
    );

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User session has expired or account was removed.' 
      });
    }

    if (user.status === 'Inactive') {
      return res.status(403).json({ 
        success: false, 
        message: 'Your account is deactivated. Please contact your Admin.' 
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication session expired or invalid. Please login again.' 
    });
  }
};

/**
 * Require Admin/Manager Role Middleware
 * Ensures only administrative staff can access sensitive actions.
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || !['admin', 'manager'].includes((req.user.role || '').toLowerCase())) {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. Administrative privileges required.' 
    });
  }
  next();
};

module.exports = {
  verifyToken,
  requireAdmin
};
