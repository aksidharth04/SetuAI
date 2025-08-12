import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/marketplace/vendors - Get all published vendors with filtering and pagination
export const getVendors = async (req, res) => {
  try {
    const { 
      search, 
      status, 
      location, 
      page = 1, 
      limit = 10 
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where = {
      isPublished: true
    };

    // Add search filter
    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: 'insensitive' } },
        { factoryLocation: { contains: search, mode: 'insensitive' } },
        { marketplaceProfile: { companyDescription: { contains: search, mode: 'insensitive' } } }
      ];
    }

    // Add status filter
    if (status) {
      where.complianceStatus = status.toUpperCase();
    }

    // Add location filter
    if (location) {
      where.factoryLocation = { contains: location, mode: 'insensitive' };
    }

    // Get vendors with marketplace profiles
    const vendors = await prisma.vendor.findMany({
      where,
      include: {
        marketplaceProfile: true,
        _count: {
          select: {
            uploadedDocuments: true
          }
        }
      },
      skip,
      take,
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get total count for pagination
    const total = await prisma.vendor.count({ where });

    res.json({
      success: true,
      data: {
        vendors: vendors.map(vendor => ({
          id: vendor.id,
          companyName: vendor.companyName,
          factoryLocation: vendor.factoryLocation,
          complianceStatus: vendor.complianceStatus,
          overallComplianceScore: vendor.overallComplianceScore,
          documentCount: vendor._count.uploadedDocuments,
          marketplaceProfile: vendor.marketplaceProfile,
          createdAt: vendor.createdAt
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vendors'
    });
  }
};

// GET /api/marketplace/vendors/:vendorId - Get single vendor with full details
export const getVendor = async (req, res) => {
  try {
    const { vendorId } = req.params;

    const vendor = await prisma.vendor.findFirst({
      where: {
        id: vendorId,
        isPublished: true
      },
      include: {
        marketplaceProfile: true,
        uploadedDocuments: {
          include: {
            complianceDocument: true,
            history: {
              include: {
                changedByUser: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              },
              orderBy: {
                timestamp: 'desc'
              }
            }
          },
          orderBy: {
            uploadedAt: 'desc'
          }
        }
      }
    });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found or not published'
      });
    }

    // Calculate compliance statistics
    const totalDocuments = vendor.uploadedDocuments.length;
    const verifiedDocuments = vendor.uploadedDocuments.filter(
      doc => doc.verificationStatus === 'VERIFIED'
    ).length;
    const pendingDocuments = vendor.uploadedDocuments.filter(
      doc => doc.verificationStatus === 'PENDING' || doc.verificationStatus === 'PENDING_MANUAL_REVIEW'
    ).length;
    const rejectedDocuments = vendor.uploadedDocuments.filter(
      doc => doc.verificationStatus === 'REJECTED'
    ).length;

    res.json({
      success: true,
      data: {
        vendor: {
          id: vendor.id,
          companyName: vendor.companyName,
          factoryLocation: vendor.factoryLocation,
          complianceStatus: vendor.complianceStatus,
          overallComplianceScore: vendor.overallComplianceScore,
          marketplaceProfile: vendor.marketplaceProfile,
          complianceStats: {
            total: totalDocuments,
            verified: verifiedDocuments,
            pending: pendingDocuments,
            rejected: rejectedDocuments,
            verifiedPercentage: totalDocuments > 0 ? (verifiedDocuments / totalDocuments) * 100 : 0
          },
          documents: vendor.uploadedDocuments.map(doc => ({
            id: doc.id,
            originalFilename: doc.originalFilename,
            verificationStatus: doc.verificationStatus,
            verificationSummary: doc.verificationSummary,
            uploadedAt: doc.uploadedAt,
            lastVerifiedAt: doc.lastVerifiedAt,
            riskScore: doc.riskScore,
            complianceDocument: {
              id: doc.complianceDocument.id,
              name: doc.complianceDocument.name,
              description: doc.complianceDocument.description,
              pillar: doc.complianceDocument.pillar,
              issuingAuthority: doc.complianceDocument.issuingAuthority
            },
            history: doc.history.map(log => ({
              id: log.id,
              action: log.action,
              details: log.details,
              timestamp: log.timestamp,
              changedBy: log.changedByUser.name,
              previousStatus: log.previousStatus,
              newStatus: log.newStatus,
              verificationMethod: log.verificationMethod
            }))
          })),
          createdAt: vendor.createdAt,
          updatedAt: vendor.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Error fetching vendor:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vendor'
    });
  }
}; 