import express from 'express';
import { uploadDocument, getAllDocumentsForVendor } from './document.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { upload } from '../../services/upload.service.js';

const router = express.Router();

// All document routes require authentication
router.use(authMiddleware);

// Upload document route
router.post('/upload', upload.single('document'), uploadDocument);

// Get vendor's documents
router.get('/vendor-documents', getAllDocumentsForVendor);

export default router; 