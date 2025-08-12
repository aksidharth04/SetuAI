import prisma from '../../services/database.service.js';
import wageVerificationService from '../../services/wage.verification.service.js';
import { calculateVendorScore } from '../../services/compliance.scoring.service.js';

/**
 * Upload and verify wage file
 */
export const uploadWageFile = async (req, res) => {
  try {
    const vendorId = req.user.vendorId;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const { originalname, path } = req.file;
    
    // Process the wage file
    const wageData = await wageVerificationService.processWageFile(path, originalname);
    
    // Analyze wage data using AI
    const analysis = await wageVerificationService.analyzeWageData(wageData);
    
    // Create wage verification record
    const verification = await wageVerificationService.createWageVerification(
      vendorId,
      path,
      originalname,
      wageData,
      analysis
    );

    // Recalculate vendor compliance score
    await calculateVendorScore(vendorId);

    res.json({
      success: true,
      data: {
        verification,
        message: 'Wage file uploaded and analyzed successfully'
      }
    });
  } catch (error) {
    console.error('Error uploading wage file:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload wage file'
    });
  }
};

/**
 * Get all wage verifications for vendor
 */
export const getVendorWageVerifications = async (req, res) => {
  try {
    const vendorId = req.user.vendorId;
    
    const verifications = await wageVerificationService.getVendorWageVerifications(vendorId);
    
    res.json({
      success: true,
      data: verifications
    });
  } catch (error) {
    console.error('Error getting vendor wage verifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch wage verifications'
    });
  }
};

/**
 * Get specific wage verification details
 */
export const getWageVerification = async (req, res) => {
  try {
    const { verificationId } = req.params;
    const vendorId = req.user.vendorId;
    
    const verification = await wageVerificationService.getWageVerification(verificationId);
    
    if (!verification) {
      return res.status(404).json({
        success: false,
        error: 'Wage verification not found'
      });
    }
    
    // Ensure vendor can only access their own verifications
    if (verification.vendorId !== vendorId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    res.json({
      success: true,
      data: verification
    });
  } catch (error) {
    console.error('Error getting wage verification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch wage verification'
    });
  }
};

/**
 * Update wage verification status
 */
export const updateWageVerificationStatus = async (req, res) => {
  try {
    const { verificationId } = req.params;
    const { status } = req.body;
    const userId = req.user.id;
    const vendorId = req.user.vendorId;
    
    // Verify the verification belongs to the vendor
    const verification = await prisma.wageVerification.findFirst({
      where: {
        id: verificationId,
        vendorId: vendorId
      }
    });
    
    if (!verification) {
      return res.status(404).json({
        success: false,
        error: 'Wage verification not found'
      });
    }
    
    const updatedVerification = await wageVerificationService.updateWageVerificationStatus(
      verificationId,
      status,
      userId
    );
    
    // Recalculate vendor compliance score
    await calculateVendorScore(vendorId);
    
    res.json({
      success: true,
      data: updatedVerification
    });
  } catch (error) {
    console.error('Error updating wage verification status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update wage verification status'
    });
  }
};

/**
 * Get wage verification statistics for vendor
 */
export const getWageVerificationStats = async (req, res) => {
  try {
    const vendorId = req.user.vendorId;
    
    const verifications = await prisma.wageVerification.findMany({
      where: { vendorId },
      select: {
        verificationStatus: true,
        riskScore: true,
        totalWorkers: true,
        totalDiscrepancies: true,
        createdAt: true,
      }
    });
    
    const stats = {
      totalVerifications: verifications.length,
      verified: verifications.filter(v => v.verificationStatus === 'VERIFIED').length,
      pending: verifications.filter(v => v.verificationStatus === 'PENDING').length,
      rejected: verifications.filter(v => v.verificationStatus === 'REJECTED').length,
      pendingReview: verifications.filter(v => v.verificationStatus === 'PENDING_MANUAL_REVIEW').length,
      averageRiskScore: verifications.length > 0 
        ? verifications.reduce((sum, v) => sum + (v.riskScore || 0), 0) / verifications.length 
        : 0,
      totalWorkers: verifications.reduce((sum, v) => sum + (v.totalWorkers || 0), 0),
      totalDiscrepancies: verifications.reduce((sum, v) => sum + (v.totalDiscrepancies || 0), 0),
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting wage verification stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch wage verification statistics'
    });
  }
};

/**
 * Delete wage verification
 */
export const deleteWageVerification = async (req, res) => {
  try {
    const { verificationId } = req.params;
    const vendorId = req.user.vendorId;
    
    // Verify the verification belongs to the vendor
    const verification = await prisma.wageVerification.findFirst({
      where: {
        id: verificationId,
        vendorId: vendorId
      }
    });
    
    if (!verification) {
      return res.status(404).json({
        success: false,
        error: 'Wage verification not found'
      });
    }
    
    // Delete the verification and all related records
    await prisma.wageVerification.delete({
      where: { id: verificationId }
    });
    
    // Recalculate vendor compliance score
    await calculateVendorScore(vendorId);
    
    res.json({
      success: true,
      message: 'Wage verification deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting wage verification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete wage verification'
    });
  }
}; 