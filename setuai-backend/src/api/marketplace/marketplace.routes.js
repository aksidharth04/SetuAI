import express from 'express';
import { getVendors, getVendor } from './marketplace.controller.js';
import { requireBuyerAdmin, requireVendorAdmin } from '../../middleware/role.middleware.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/marketplace/vendors - Get all published vendors with filtering and pagination
// Allow both BUYER_ADMIN and VENDOR_ADMIN roles
router.get('/vendors', (req, res, next) => {
  const { role } = req.user;
  if (role === 'BUYER_ADMIN' || role === 'VENDOR_ADMIN' || role === 'SYSTEM_ADMIN') {
    next();
  } else {
    res.status(403).json({
      success: false,
      error: 'Insufficient permissions'
    });
  }
}, getVendors);

// GET /api/marketplace/vendors/:vendorId - Get single vendor with full details
// Allow both BUYER_ADMIN and VENDOR_ADMIN roles
router.get('/vendors/:vendorId', (req, res, next) => {
  const { role } = req.user;
  if (role === 'BUYER_ADMIN' || role === 'VENDOR_ADMIN' || role === 'SYSTEM_ADMIN') {
    next();
  } else {
    res.status(403).json({
      success: false,
      error: 'Insufficient permissions'
    });
  }
}, getVendor);

export default router; 