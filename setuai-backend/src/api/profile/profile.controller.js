import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/profile - Get vendor's marketplace profile
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user with vendor information
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        vendor: {
          include: {
            marketplaceProfile: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        vendor: {
          id: user.vendor.id,
          companyName: user.vendor.companyName,
          factoryLocation: user.vendor.factoryLocation,
          isPublished: user.vendor.isPublished,
          marketplaceProfile: user.vendor.marketplaceProfile
        }
      }
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile'
    });
  }
};

// PUT /api/profile - Update vendor's marketplace profile
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { companyDescription, contactEmail, websiteUrl, logoUrl } = req.body;

    // Get user with vendor information
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        vendor: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Upsert marketplace profile
    const marketplaceProfile = await prisma.marketplaceProfile.upsert({
      where: {
        vendorId: user.vendor.id
      },
      update: {
        companyDescription,
        contactEmail,
        websiteUrl,
        logoUrl
      },
      create: {
        vendorId: user.vendor.id,
        companyDescription,
        contactEmail,
        websiteUrl,
        logoUrl
      }
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        marketplaceProfile
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
};

// POST /api/profile/publish - Toggle vendor's published status
export const togglePublish = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user with vendor information
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        vendor: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Toggle the isPublished field
    const updatedVendor = await prisma.vendor.update({
      where: { id: user.vendor.id },
      data: {
        isPublished: !user.vendor.isPublished
      }
    });

    res.json({
      success: true,
      message: `Profile ${updatedVendor.isPublished ? 'published' : 'unpublished'} successfully`,
      data: {
        isPublished: updatedVendor.isPublished
      }
    });
  } catch (error) {
    console.error('Error toggling publish status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle publish status'
    });
  }
}; 