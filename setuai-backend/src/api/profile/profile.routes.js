import express from 'express';
import { getProfile, updateProfile, togglePublish } from './profile.controller.js';
import { requireVendorAdmin } from '../../middleware/role.middleware.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication and VENDOR_ADMIN role
router.use(authMiddleware);
router.use(requireVendorAdmin);

// GET /api/profile - Get vendor's marketplace profile
router.get('/', getProfile);

// PUT /api/profile - Update vendor's marketplace profile
router.put('/', updateProfile);

// POST /api/profile/publish - Toggle vendor's published status
router.post('/publish', togglePublish);

export default router; 