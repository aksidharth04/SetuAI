import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const register = async (req, res) => {
  try {
    const { email, password, name, companyName, factoryLocation } = req.body;

    // Validate required fields
    if (!email || !password || !name || !companyName || !factoryLocation) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required'
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists'
      });
    }

    // Hash password
    const saltRounds = parseInt(process.env.SALT_ROUNDS) || 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create vendor and user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create vendor
      const vendor = await tx.vendor.create({
        data: {
          companyName,
          factoryLocation,
          complianceStatus: 'RED'
        }
      });

      // Create user
      const user = await tx.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          role: 'VENDOR_ADMIN',
          vendorId: vendor.id
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          vendorId: true,
          createdAt: true
        }
      });

      return { vendor, user };
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: result.user.id, email: result.user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Vendor registered successfully',
      data: {
        user: result.user,
        vendor: {
          id: result.vendor.id,
          companyName: result.vendor.companyName,
          factoryLocation: result.vendor.factoryLocation,
          complianceStatus: result.vendor.complianceStatus
        },
        token
      }
    });
  } catch (error) {
    console.error('Error registering vendor:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register vendor'
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Find user with vendor information
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        vendor: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Generate JWT token with role
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userWithoutPassword,
        token
      }
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to login'
    });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        vendor: {
          include: {
            uploadedDocuments: {
              include: {
                complianceDocument: true
              }
            }
          }
        }
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        vendor: true
      }
    });

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile'
    });
  }
}; 