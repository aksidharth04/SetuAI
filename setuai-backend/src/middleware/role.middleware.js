import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const requireRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      // Check if user has required role
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions'
        });
      }

      // Add user role to request for use in controllers
      req.userRole = req.user.role;
      next();
    } catch (error) {
      console.error('Role middleware error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };
};

export const requireVendorAdmin = requireRole(['VENDOR_ADMIN']);
export const requireBuyerAdmin = requireRole(['BUYER_ADMIN']);
export const requireSystemAdmin = requireRole(['SYSTEM_ADMIN']); 