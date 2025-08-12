import express from 'express';
import multer from 'multer';
import path from 'path';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';
import {
  uploadWageFile,
  getVendorWageVerifications,
  getWageVerification,
  updateWageVerificationStatus,
  getWageVerificationStats,
  deleteWageVerification
} from './wage-verification.controller.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/wage-verification/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.csv', '.xlsx', '.xls'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and Excel files are allowed'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Apply role middleware to ensure only vendors can access wage verification
router.use(requireRole(['VENDOR_ADMIN', 'SYSTEM_ADMIN']));

// Routes
router.post('/upload', upload.single('wageFile'), uploadWageFile);
router.get('/vendor', getVendorWageVerifications);
router.get('/stats', getWageVerificationStats);
router.get('/:verificationId', getWageVerification);
router.put('/:verificationId/status', updateWageVerificationStatus);
router.delete('/:verificationId', deleteWageVerification);

export default router; 