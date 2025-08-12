import multer from 'multer';
import { processDocument } from '../../services/document.processor.js';
import prisma from '../../services/database.service.js';
import { upload as uploadService } from '../../services/upload.service.js';

// Controller to handle document uploads
export const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const { complianceDocumentId } = req.body;
    const { vendorId } = req.user; // Assuming auth middleware adds user to req
    const userId = req.user.id; // Get user ID from authenticated user

    // Create document record in database
    const document = await prisma.uploadedDocument.create({
      data: {
        vendorId,
        complianceDocumentId,
        filePath: req.uploadedFilePath, // Use the path set by upload service
        originalFilename: req.file.originalname,
        verificationStatus: 'PENDING',
      },
    });

    // Start background processing
    processDocument(document.id, userId).catch(err => {
      console.error('Background processing error:', err);
    });

    res.status(201).json({ 
      message: 'Document uploaded successfully and is being processed.',
      documentId: document.id
    });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ error: 'Failed to upload document.' });
  }
};

// Controller to get a specific document
export const getDocumentById = async (req, res) => {
  try {
    const { id } = req.params;
    const document = await prisma.uploadedDocument.findUnique({
      where: { id },
      include: {
        complianceDocument: true,
        history: {
          orderBy: {
            timestamp: 'desc'
          },
          include: {
            changedByUser: {
              select: { name: true }
            }
          }
        }
      }
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json(document);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve document' });
  }
};

// Controller to get all documents for a vendor
export const getAllDocumentsForVendor = async (req, res) => {
  try {
    const { vendorId } = req.user;
    
    // First get all compliance documents
    const complianceDocuments = await prisma.complianceDocument.findMany();
    
    // Then get all uploaded documents for this vendor
    const uploadedDocuments = await prisma.uploadedDocument.findMany({
      where: { vendorId },
      include: {
        complianceDocument: true,
      },
      orderBy: {
        uploadedAt: 'desc'
      }
    });

    // Create a map of compliance documents with their uploaded versions
    const documentsMap = complianceDocuments.map(compliance => {
      const uploads = uploadedDocuments.filter(
        upload => upload.complianceDocumentId === compliance.id
      );
      
      return {
        id: compliance.id,
        name: compliance.name,
        description: compliance.description,
        pillar: compliance.pillar,
        issuingAuthority: compliance.issuingAuthority,
        uploadedDocuments: uploads || []
      };
    });

    res.json({ documents: documentsMap });
  } catch (error) {
    console.error('Failed to retrieve documents:', error);
    res.status(500).json({ error: 'Failed to retrieve documents' });
  }
}; 