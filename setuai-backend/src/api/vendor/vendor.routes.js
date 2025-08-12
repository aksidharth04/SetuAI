// src/api/vendor/vendor.routes.js
import express from 'express';
import { getVendorProfile, updateVendorProfile, getComplianceStatus, getVendorReport, getBuyerRequests, getVendorEngagements, getVendorEngagementDetails, updateEngagementResponse } from './vendor.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';

const router = express.Router();

// All vendor routes require authentication
router.use(authMiddleware);

router.get('/profile', getVendorProfile);
router.put('/profile', updateVendorProfile);
router.get('/compliance-status', getComplianceStatus);
router.get('/report', getVendorReport);

// Buyer requests for vendors
router.get('/buyer-requests', getBuyerRequests);
router.put('/buyer-requests/:engagementId/respond', updateEngagementResponse); // New report endpoint

// Vendor engagement history
router.get('/engagements', getVendorEngagements);
router.get('/engagements/:engagementId', getVendorEngagementDetails);

export default router;
