import express from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requireBuyerAdmin } from '../../middleware/role.middleware.js';
import {
  getBuyerEngagements,
  createEngagement,
  updateEngagement,
  getEngagementDetails,
  completeEngagement,
  deleteEngagement
} from './engagement.controller.js';

const router = express.Router();

// All routes require authentication and buyer admin role
router.use(authMiddleware);
router.use(requireBuyerAdmin);

// Get all engagements for the current buyer
router.get('/', getBuyerEngagements);

// Create a new engagement
router.post('/', createEngagement);

// Get engagement details
router.get('/:engagementId', getEngagementDetails);

// Update an engagement
router.put('/:engagementId', updateEngagement);

// Mark engagement as completed
router.put('/:engagementId/complete', completeEngagement);

// Delete an engagement
router.delete('/:engagementId', deleteEngagement);

export default router; 