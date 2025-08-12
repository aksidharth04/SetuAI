import express from 'express';
import { 
  uploadInvoice, 
  getInvoiceDetails, 
  getEngagementInvoices, 
  rateInvoice, 
  getInvoiceStats, 
  deleteInvoice,
  getInvoiceImage,
  upload 
} from './invoice.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requireVendorAdmin } from '../../middleware/role.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Upload invoice for an engagement (VENDOR_ADMIN only)
router.post('/engagements/:engagementId/upload', requireVendorAdmin, upload.single('invoice'), uploadInvoice);

// Get invoice details (accessible to both vendor and buyer)
router.get('/:invoiceId', getInvoiceDetails);

// Get all invoices for an engagement (accessible to both vendor and buyer)
router.get('/engagements/:engagementId', getEngagementInvoices);

// Rate an invoice (BUYER_ADMIN only - for rating vendor invoices)
router.post('/:invoiceId/rate', rateInvoice);

// Get invoice statistics for vendor (VENDOR_ADMIN only)
router.get('/stats/vendor', requireVendorAdmin, getInvoiceStats);

// Delete invoice (VENDOR_ADMIN only)
router.delete('/:invoiceId', requireVendorAdmin, deleteInvoice);

// Serve invoice image (accessible to both vendor and buyer)
router.get('/image/:imageId', getInvoiceImage);

export default router; 