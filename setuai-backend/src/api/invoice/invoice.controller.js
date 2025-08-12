import { PrismaClient } from '@prisma/client';
import InvoiceExtractionService from '../../services/invoice.extraction.service.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();
const invoiceService = new InvoiceExtractionService();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, JPG, and PDF files are allowed.'), false);
    }
  }
});

// Upload and process invoice
export const uploadInvoice = async (req, res) => {
  try {
    console.log('🔵 [INVOICE_DEBUG] Starting invoice upload');
    
    const { engagementId } = req.params;
    const vendorId = req.user.vendorId;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    // Validate engagement exists and belongs to vendor
    const engagement = await prisma.buyerEngagement.findFirst({
      where: {
        id: engagementId,
        vendorId: vendorId
      }
    });

    if (!engagement) {
      return res.status(404).json({
        success: false,
        error: 'Engagement not found or access denied'
      });
    }

    // Process invoice with AI extraction
    const result = await invoiceService.processInvoiceUpload(
      req.file.buffer,
      req.file.mimetype,
      vendorId,
      engagementId
    );

    // Check for fake invoice detection
    const verification = result.data.extraction.verification;
    
    if (!verification.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid invoice format',
        details: verification.reason
      });
    }

    if (!verification.isAuthentic || verification.authenticityScore < 0.6) {
      return res.status(400).json({
        success: false,
        error: 'Invoice authenticity verification failed',
        details: {
          reason: verification.reason,
          authenticityScore: verification.authenticityScore,
          redFlags: verification.redFlags,
          authenticityChecks: verification.authenticityChecks
        }
      });
    }

    // Log suspicious activity if authenticity score is low
    if (verification.authenticityScore < 0.8) {
      console.log('⚠️ [INVOICE_DEBUG] Low authenticity score detected:', {
        vendorId,
        engagementId,
        authenticityScore: verification.authenticityScore,
        redFlags: verification.redFlags
      });
    }

    console.log('🔵 [INVOICE_DEBUG] Invoice upload completed successfully');

    res.json({
      success: true,
      data: {
        ...result.data,
        verification: {
          isAuthentic: verification.isAuthentic,
          authenticityScore: verification.authenticityScore,
          redFlags: verification.redFlags,
          authenticityChecks: verification.authenticityChecks
        }
      }
    });

  } catch (error) {
    console.error('🔴 [INVOICE_DEBUG] Error in invoice upload:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get invoice details
export const getInvoiceDetails = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const userRole = req.user.role;
    const vendorId = req.user.vendorId;

    let invoice;
    
    if (userRole === 'VENDOR_ADMIN') {
      // Vendor can only see their own invoices
      invoice = await prisma.invoice.findFirst({
        where: {
          id: invoiceId,
          vendorId: vendorId
        },
        include: {
          items: true,
          invoiceImage: true,
          ratings: {
            include: {
              rater: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      });
    } else if (userRole === 'BUYER_ADMIN') {
      // Buyer can see invoices for engagements they're involved in
      invoice = await prisma.invoice.findFirst({
        where: {
          id: invoiceId,
          engagement: {
            buyerId: req.user.id
          }
        },
        include: {
          items: true,
          invoiceImage: true,
          ratings: {
            include: {
              rater: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      });
    } else {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    res.json({
      success: true,
      data: { invoice }
    });

  } catch (error) {
    console.error('🔴 [INVOICE_DEBUG] Error getting invoice details:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get invoices for an engagement
export const getEngagementInvoices = async (req, res) => {
  try {
    const { engagementId } = req.params;
    const userRole = req.user.role;
    const vendorId = req.user.vendorId;

    let engagement;
    
    if (userRole === 'VENDOR_ADMIN') {
      // Validate engagement belongs to vendor
      engagement = await prisma.buyerEngagement.findFirst({
        where: {
          id: engagementId,
          vendorId: vendorId
        }
      });
    } else if (userRole === 'BUYER_ADMIN') {
      // Validate engagement belongs to buyer
      engagement = await prisma.buyerEngagement.findFirst({
        where: {
          id: engagementId,
          buyerId: req.user.id
        }
      });
    } else {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    if (!engagement) {
      return res.status(404).json({
        success: false,
        error: 'Engagement not found or access denied'
      });
    }

    const invoices = await prisma.invoice.findMany({
      where: {
        engagementId: engagementId
      },
      include: {
        items: true,
        invoiceImage: true,
        ratings: {
          include: {
            rater: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: { invoices }
    });

  } catch (error) {
    console.error('🔴 [INVOICE_DEBUG] Error getting engagement invoices:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Rate an invoice
export const rateInvoice = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const { rating, review } = req.body;
    const userId = req.user.id;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: 'Rating must be between 1 and 5'
      });
    }

    // Check if invoice exists and user has access
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId
      },
      include: {
        engagement: true
      }
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    // Check if user is buyer for this engagement
    if (invoice.engagement.buyerId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Only the buyer can rate this invoice.'
      });
    }

    // Create or update rating
    const invoiceRating = await prisma.invoiceRating.upsert({
      where: {
        invoiceId_raterId: {
          invoiceId: invoiceId,
          raterId: userId
        }
      },
      update: {
        rating: rating,
        review: review,
        updatedAt: new Date()
      },
      create: {
        invoiceId: invoiceId,
        raterId: userId,
        rating: rating,
        review: review
      }
    });

    res.json({
      success: true,
      data: { rating: invoiceRating }
    });

  } catch (error) {
    console.error('🔴 [INVOICE_DEBUG] Error rating invoice:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get invoice statistics for vendor
export const getInvoiceStats = async (req, res) => {
  try {
    const vendorId = req.user.vendorId;

    const stats = await prisma.invoice.groupBy({
      by: ['extractionQuality'],
      where: {
        vendorId: vendorId
      },
      _count: {
        id: true
      },
      _avg: {
        confidence: true,
        totalAmount: true
      }
    });

    const totalInvoices = await prisma.invoice.count({
      where: {
        vendorId: vendorId
      }
    });

    const averageRating = await prisma.invoiceRating.aggregate({
      where: {
        invoice: {
          vendorId: vendorId
        }
      },
      _avg: {
        rating: true
      }
    });

    res.json({
      success: true,
      data: {
        totalInvoices,
        averageRating: averageRating._avg.rating || 0,
        qualityStats: stats,
        recentInvoices: await prisma.invoice.findMany({
          where: {
            vendorId: vendorId
          },
          include: {
            engagement: true,
            ratings: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 5
        })
      }
    });

  } catch (error) {
    console.error('🔴 [INVOICE_DEBUG] Error getting invoice stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Delete invoice
export const deleteInvoice = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const vendorId = req.user.vendorId;

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        vendorId: vendorId
      },
      include: {
        invoiceImage: true
      }
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    // Delete the invoice (cascade will handle related records)
    await prisma.invoice.delete({
      where: {
        id: invoiceId
      }
    });

    res.json({
      success: true,
      message: 'Invoice deleted successfully'
    });

  } catch (error) {
    console.error('🔴 [INVOICE_DEBUG] Error deleting invoice:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Serve invoice image
export const getInvoiceImage = async (req, res) => {
  try {
    const { imageId } = req.params;
    const userRole = req.user.role;
    const vendorId = req.user.vendorId;

    let invoiceImage;
    
    if (userRole === 'VENDOR_ADMIN') {
      // Vendor can only see their own invoice images
      invoiceImage = await prisma.invoiceImage.findFirst({
        where: {
          id: imageId,
          vendorId: vendorId
        }
      });
    } else if (userRole === 'BUYER_ADMIN') {
      // Buyer can see invoice images for engagements they're involved in
      invoiceImage = await prisma.invoiceImage.findFirst({
        where: {
          id: imageId,
          invoice: {
            engagement: {
              buyerId: req.user.id
            }
          }
        }
      });
    } else {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    if (!invoiceImage) {
      return res.status(404).json({
        success: false,
        error: 'Invoice image not found'
      });
    }

    // Serve the image file
    const imagePath = `./public/${invoiceImage.filePath}`;
    
    // Check if file exists
    const fs = await import('fs');
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({
        success: false,
        error: 'Image file not found'
      });
    }

    // Set appropriate headers
    res.setHeader('Content-Type', invoiceImage.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${invoiceImage.filename}"`);
    
    // Stream the file
    const fileStream = fs.createReadStream(imagePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('🔴 [INVOICE_DEBUG] Error serving invoice image:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export { upload }; 