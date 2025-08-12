import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Get all engagements for a buyer
export const getBuyerEngagements = async (req, res) => {
  try {
    const buyerId = req.user.id;
    
    const engagements = await prisma.buyerEngagement.findMany({
      where: { buyerId },
      include: {
        vendor: {
          include: {
            marketplaceProfile: true
          }
        },
        engagementHistory: {
          orderBy: { createdAt: 'desc' },
          take: 5 // Get last 5 history entries
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json({
      success: true,
      data: { engagements }
    });
  } catch (error) {
    console.error('Error fetching buyer engagements:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch engagements'
    });
  }
};

// Create a new engagement
export const createEngagement = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { vendorId, engagementStatus, priority, notes, dealValue, dealCurrency, dealType } = req.body;

    // Allow multiple engagements with the same vendor
    console.log('=== ENGAGEMENT CREATION DEBUG ===');
    console.log('Buyer ID:', buyerId);
    console.log('Vendor ID:', vendorId);
    console.log('Engagement data:', req.body);

    // Verify vendor exists and is published
    const vendor = await prisma.vendor.findFirst({
      where: { id: vendorId, isPublished: true }
    });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found or not published'
      });
    }



    const engagement = await prisma.buyerEngagement.create({
      data: {
        buyerId,
        vendorId,
        engagementStatus: engagementStatus || 'PENDING',
        priority: priority || 'MEDIUM',
        notes,
        dealValue: dealValue ? parseFloat(dealValue) : null,
        dealCurrency: dealCurrency || 'INR',
        dealType,
        lastContact: new Date(),
        nextFollowUp: req.body.nextFollowUp ? new Date(req.body.nextFollowUp) : null
      },
      include: {
        vendor: {
          include: {
            marketplaceProfile: true
          }
        }
      }
    });

    // Create initial history entry
    await prisma.engagementHistory.create({
      data: {
        engagementId: engagement.id,
        action: 'ENGAGEMENT_CREATED',
        details: 'Initial engagement created',
        newStatus: engagement.engagementStatus,
        newPriority: engagement.priority
      }
    });

    res.json({
      success: true,
      data: { engagement }
    });
  } catch (error) {
    console.error('Error creating engagement:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create engagement'
    });
  }
};

// Update an engagement
export const updateEngagement = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { engagementId } = req.params;
    const { engagementStatus, priority, notes, dealValue, dealCurrency, dealType, nextFollowUp } = req.body;

    console.log('=== UPDATE ENGAGEMENT DEBUG ===');
    console.log('Buyer ID:', buyerId);
    console.log('Engagement ID:', engagementId);
    console.log('Update data:', req.body);

    // Get current engagement
    const currentEngagement = await prisma.buyerEngagement.findFirst({
      where: { id: engagementId, buyerId }
    });

    if (!currentEngagement) {
      return res.status(404).json({
        success: false,
        error: 'Engagement not found'
      });
    }

    // Prepare update data
    const updateData = {};
    if (engagementStatus) updateData.engagementStatus = engagementStatus;
    if (priority) updateData.priority = priority;
    if (notes !== undefined) updateData.notes = notes;
    if (dealValue !== undefined) updateData.dealValue = dealValue ? parseFloat(dealValue) : null;
    if (dealCurrency) updateData.dealCurrency = dealCurrency;
    if (dealType) updateData.dealType = dealType;
    if (nextFollowUp) updateData.nextFollowUp = new Date(nextFollowUp);
    
    updateData.lastContact = new Date();
    updateData.updatedAt = new Date();

    const updatedEngagement = await prisma.buyerEngagement.update({
      where: { id: engagementId },
      data: updateData,
      include: {
        vendor: {
          include: {
            marketplaceProfile: true
          }
        }
      }
    });

    // Create history entry for the update
    const historyData = {
      engagementId,
      action: 'ENGAGEMENT_UPDATED',
      details: 'Engagement details updated'
    };

    if (engagementStatus && engagementStatus !== currentEngagement.engagementStatus) {
      historyData.previousStatus = currentEngagement.engagementStatus;
      historyData.newStatus = engagementStatus;
      historyData.details = `Status changed from ${currentEngagement.engagementStatus} to ${engagementStatus}`;
    }

    if (priority && priority !== currentEngagement.priority) {
      historyData.previousPriority = currentEngagement.priority;
      historyData.newPriority = priority;
      historyData.details = `Priority changed from ${currentEngagement.priority} to ${priority}`;
    }

    await prisma.engagementHistory.create({
      data: historyData
    });

    res.json({
      success: true,
      data: { engagement: updatedEngagement }
    });
  } catch (error) {
    console.error('Error updating engagement:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update engagement'
    });
  }
};

// Get engagement details with full history
export const getEngagementDetails = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { engagementId } = req.params;

    const engagement = await prisma.buyerEngagement.findFirst({
      where: { id: engagementId, buyerId },
      include: {
        vendor: {
          include: {
            marketplaceProfile: true,
            uploadedDocuments: {
              include: {
                complianceDocument: true
              }
            }
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

    res.json({
      success: true,
      data: { engagement }
    });
  } catch (error) {
    console.error('Error fetching engagement details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch engagement details'
    });
  }
};

// Mark engagement as completed
export const completeEngagement = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { engagementId } = req.params;
    const { completionNotes } = req.body;

    console.log('=== COMPLETE ENGAGEMENT DEBUG ===');
    console.log('Buyer ID:', buyerId);
    console.log('Engagement ID:', engagementId);
    console.log('Completion notes:', completionNotes);

    // Verify the engagement belongs to this buyer
    const engagement = await prisma.buyerEngagement.findFirst({
      where: { id: engagementId, buyerId }
    });

    if (!engagement) {
      return res.status(404).json({
        success: false,
        error: 'Engagement not found'
      });
    }

    // Update engagement status to completed
    const updatedEngagement = await prisma.buyerEngagement.update({
      where: { id: engagementId },
      data: {
        engagementStatus: 'COMPLETED',
        notes: completionNotes ? `${engagement.notes || ''}\n\n[COMPLETED] ${completionNotes}` : engagement.notes,
        lastContact: new Date()
      },
      include: {
        vendor: {
          include: {
            marketplaceProfile: true
          }
        }
      }
    });

    // Create history entry for completion
    await prisma.engagementHistory.create({
      data: {
        engagementId,
        action: 'ENGAGEMENT_COMPLETED',
        details: completionNotes || 'Engagement marked as completed',
        previousStatus: engagement.engagementStatus,
        newStatus: 'COMPLETED'
      }
    });

    res.json({
      success: true,
      data: { engagement: updatedEngagement }
    });
  } catch (error) {
    console.error('Error completing engagement:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete engagement'
    });
  }
};

// Delete an engagement
export const deleteEngagement = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { engagementId } = req.params;

    const engagement = await prisma.buyerEngagement.findFirst({
      where: { id: engagementId, buyerId }
    });

    if (!engagement) {
      return res.status(404).json({
        success: false,
        error: 'Engagement not found'
      });
    }

    await prisma.buyerEngagement.delete({
      where: { id: engagementId }
    });

    res.json({
      success: true,
      message: 'Engagement deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting engagement:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete engagement'
    });
  }
}; 