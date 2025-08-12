import express from 'express';
import { getChecklist, seedChecklist } from './compliance.controller.js';

const router = express.Router();

// Public routes
router.get('/checklist', getChecklist);

// Internal route for seeding data (in production, this should be protected)
router.post('/seed', seedChecklist);

export default router; 