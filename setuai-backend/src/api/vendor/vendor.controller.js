// src/api/vendor/vendor.controller.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getVendorProfile = async (req, res) => {
  try {
    const vendorId = req.user.vendorId;

    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true
          }
        },
        uploadedDocuments: {
          include: {
            complianceDocument: true,
            history: {
              include: {
                changedByUser: {
                  select: {
                    name: true,
                    email: true
                  }
                }
              },
              orderBy: { timestamp: 'desc' },
              take: 5
            }
          },
          orderBy: { uploadedAt: 'desc' }
        }
      }
    });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }

    const totalDocuments = vendor.uploadedDocuments.length;
    const verifiedDocuments = vendor.uploadedDocuments.filter(
      doc => doc.verificationStatus === 'VERIFIED'
    ).length;
    const pendingDocuments = vendor.uploadedDocuments.filter(
      doc => doc.verificationStatus === 'PENDING'
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
          createdAt: vendor.createdAt,
          updatedAt: vendor.updatedAt
        },
        users: vendor.users,
        documents: vendor.uploadedDocuments,
        statistics: {
          totalDocuments,
          verifiedDocuments,
          pendingDocuments,
          rejectedDocuments,
          compliancePercentage: totalDocuments > 0 ? Math.round((verifiedDocuments / totalDocuments) * 100) : 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching vendor profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vendor profile'
    });
  }
};

export const updateVendorProfile = async (req, res) => {
  try {
    const vendorId = req.user.vendorId;
    const { companyName, factoryLocation } = req.body;

    if (!companyName || !factoryLocation) {
      return res.status(400).json({
        success: false,
        error: 'Company name and factory location are required'
      });
    }

    const updatedVendor = await prisma.vendor.update({
      where: { id: vendorId },
      data: {
        companyName,
        factoryLocation
      }
    });

    res.json({
      success: true,
      message: 'Vendor profile updated successfully',
      data: {
        id: updatedVendor.id,
        companyName: updatedVendor.companyName,
        factoryLocation: updatedVendor.factoryLocation,
        complianceStatus: updatedVendor.complianceStatus,
        updatedAt: updatedVendor.updatedAt
      }
    });
  } catch (error) {
    console.error('Error updating vendor profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update vendor profile'
    });
  }
};

export const getComplianceStatus = async (req, res) => {
  try {
    const vendorId = req.user.vendorId;

    const [complianceDocuments, uploadedDocuments] = await Promise.all([
      prisma.complianceDocument.findMany({
        orderBy: { pillar: 'asc' }
      }),
      prisma.uploadedDocument.findMany({
        where: { vendorId },
        include: {
          complianceDocument: true
        }
      })
    ]);

    const uploadedDocsMap = new Map();
    uploadedDocuments.forEach(doc => {
      uploadedDocsMap.set(doc.complianceDocumentId, doc);
    });

    const complianceStatus = complianceDocuments.map(complianceDoc => {
      const uploadedDoc = uploadedDocsMap.get(complianceDoc.id);
      return {
        complianceDocument: complianceDoc,
        uploadedDocument: uploadedDoc || null,
        status: uploadedDoc ? uploadedDoc.verificationStatus : 'MISSING',
        isUploaded: !!uploadedDoc
      };
    });

    const totalRequired = complianceStatus.length;
    const verified = complianceStatus.filter(item => item.status === 'VERIFIED').length;
    const pending = complianceStatus.filter(item => item.status === 'PENDING').length;
    const missing = complianceStatus.filter(item => item.status === 'MISSING').length;
    const rejected = complianceStatus.filter(item => item.status === 'REJECTED').length;

    let overallStatus = 'RED';
    if (verified === totalRequired) {
      overallStatus = 'GREEN';
    } else if (verified > 0 || pending > 0) {
      overallStatus = 'AMBER';
    }

    res.json({
      success: true,
      data: {
        complianceStatus,
        summary: {
          totalRequired,
          verified,
          pending,
          missing,
          rejected,
          overallStatus
        }
      }
    });
  } catch (error) {
    console.error('Error fetching compliance status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch compliance status'
    });
  }
};

export const getVendorReport = async (req, res) => {
  try {
    const vendorId = req.user.vendorId;

    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      select: {
        overallComplianceScore: true,
        complianceStatus: true,
      }
    });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }

    const allRequiredDocs = await prisma.complianceDocument.findMany();
    const vendorUploadedDocs = await prisma.uploadedDocument.findMany({
      where: { vendorId: vendorId },
    });

    const uploadedDocsMap = new Map(vendorUploadedDocs.map(doc => [doc.complianceDocumentId, doc]));

    const documentsForReport = allRequiredDocs.map(reqDoc => {
      const uploadedDoc = uploadedDocsMap.get(reqDoc.id);
      return {
        id: uploadedDoc ? uploadedDoc.id : reqDoc.id,
        complianceDocument: {
          name: reqDoc.name,
          pillar: reqDoc.pillar,
        },
        verificationStatus: uploadedDoc ? uploadedDoc.verificationStatus : 'MISSING',
        riskScore: uploadedDoc ? uploadedDoc.riskScore : 0,
        filePath: uploadedDoc ? uploadedDoc.filePath : null,
      };
    });

    res.json({
      success: true,
      data: {
        overallScore: vendor.overallComplianceScore,
        complianceStatus: vendor.complianceStatus,
        documents: documentsForReport,
      }
    });

  } catch (error) {
    console.error('Error fetching vendor report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vendor report'
    });
  }
};

// Get buyer requests for a vendor
export const getBuyerRequests = async (req, res) => {
  try {
    const vendorId = req.user.vendorId;
    
    const buyerRequests = await prisma.buyerEngagement.findMany({
      where: { vendorId },
      include: {
        buyer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        engagementHistory: {
          orderBy: { createdAt: 'desc' },
          take: 3 // Get last 3 history entries
        }
      },
      orderBy: [
        { priority: 'desc' }, // URGENT first, then HIGH, MEDIUM, LOW
        { createdAt: 'desc' }
      ]
    });

    // Group by priority
    const groupedRequests = {
      URGENT: buyerRequests.filter(req => req.priority === 'URGENT'),
      HIGH: buyerRequests.filter(req => req.priority === 'HIGH'),
      MEDIUM: buyerRequests.filter(req => req.priority === 'MEDIUM'),
      LOW: buyerRequests.filter(req => req.priority === 'LOW')
    };

    res.json({
      success: true,
      data: { 
        buyerRequests,
        groupedRequests,
        summary: {
          total: buyerRequests.length,
          urgent: groupedRequests.URGENT.length,
          high: groupedRequests.HIGH.length,
          medium: groupedRequests.MEDIUM.length,
          low: groupedRequests.LOW.length
        }
      }
    });
  } catch (error) {
    console.error('Error fetching buyer requests:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch buyer requests'
    });
  }
};

// Get vendor engagements
export const getVendorEngagements = async (req, res) => {
  try {
    const vendorId = req.user.vendorId;

    console.log('🔵 [VENDOR_DEBUG] Fetching engagements for vendor:', vendorId);

    const engagements = await prisma.buyerEngagement.findMany({
      where: { vendorId },
      include: {
        buyer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log('🔵 [VENDOR_DEBUG] Found engagements:', engagements.length);

    res.json({
      success: true,
      data: { engagements }
    });
  } catch (error) {
    console.error('🔴 [VENDOR_DEBUG] Error fetching vendor engagements:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vendor engagements'
    });
  }
};

// Get vendor engagement details
export const getVendorEngagementDetails = async (req, res) => {
  try {
    const vendorId = req.user.vendorId;
    const { engagementId } = req.params;

    console.log('🔵 [VENDOR_DEBUG] Fetching engagement details:', engagementId);

    const engagement = await prisma.buyerEngagement.findFirst({
      where: { id: engagementId, vendorId },
      include: {
        buyer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        engagementHistory: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!engagement) {
      return res.status(404).json({
        success: false,
        error: 'Engagement not found'
      });
    }

    console.log('🔵 [VENDOR_DEBUG] Engagement details found');

    res.json({
      success: true,
      data: { engagement }
    });
  } catch (error) {
    console.error('🔴 [VENDOR_DEBUG] Error fetching engagement details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch engagement details'
    });
  }
};

// Update engagement status (vendor responding to buyer)
export const updateEngagementResponse = async (req, res) => {
  try {
    const vendorId = req.user.vendorId;
    const { engagementId } = req.params;
    const { response, notes, nextAction, engagementStatus } = req.body;

    console.log('🔵 [VENDOR_DEBUG] Updating engagement response:', engagementId);
    console.log('🔵 [VENDOR_DEBUG] New status:', engagementStatus);
    console.log('🔵 [VENDOR_DEBUG] Response data:', { response, notes, nextAction });

    // Verify the engagement belongs to this vendor
    const engagement = await prisma.buyerEngagement.findFirst({
      where: { id: engagementId, vendorId }
    });

    if (!engagement) {
      return res.status(404).json({
        success: false,
        error: 'Engagement not found'
      });
    }

    // Prepare update data
    const updateData = {
      notes: notes || engagement.notes,
      lastContact: new Date(),
      nextFollowUp: nextAction ? new Date(nextAction) : engagement.nextFollowUp
    };

    // Update status if provided
    if (engagementStatus && engagementStatus !== engagement.engagementStatus) {
      updateData.engagementStatus = engagementStatus;
      console.log('🔵 [VENDOR_DEBUG] Status change:', engagement.engagementStatus, '→', engagementStatus);
    }

    // Update engagement
    const updatedEngagement = await prisma.buyerEngagement.update({
      where: { id: engagementId },
      data: updateData,
      include: {
        buyer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Create history entry
    await prisma.engagementHistory.create({
      data: {
        engagementId,
        action: 'VENDOR_RESPONSE',
        details: `Vendor responded: ${response}`,
        previousStatus: engagement.engagementStatus,
        newStatus: updatedEngagement.engagementStatus
      }
    });

    console.log('🔵 [VENDOR_DEBUG] Engagement updated successfully');

    res.json({
      success: true,
      data: { engagement: updatedEngagement }
    });
  } catch (error) {
    console.error('🔴 [VENDOR_DEBUG] Error updating engagement response:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update engagement response'
    });
  }
};
