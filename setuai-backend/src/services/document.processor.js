// src/services/document.processor.js
import prisma from './database.service.js';
import { extractTextFromFile } from './ocr.service.js';
import verificationService from './verification.service.js';
import apiVerificationService from './api.verification.service.js';
import { calculateDocumentScore, calculateVendorScore } from './risk.scoring.service.js';

export const processDocument = async (documentId, userId) => {
  try {
    const document = await prisma.uploadedDocument.findUnique({
      where: { id: documentId },
      include: {
        complianceDocument: true,
        vendor: {
          include: {
            users: {
              where: { role: 'VENDOR_ADMIN' },
              take: 1
            }
          }
        }
      }
    });

    if (!document) {
      throw new Error('Document not found');
    }

    const effectiveUserId = userId || document.vendor.users[0]?.id || 'SYSTEM';
    const extractedText = await extractTextFromFile(document.filePath);
    const verificationResult = await verificationService.verifyDocument(document, extractedText);

    // Store verification details including confidence score for scoring service
    const verificationDetails = {
      confidenceScore: verificationResult.confidence || 0,
      verificationMethod: 'AI',
      extractedData: verificationResult.extractedData,
      verificationSummary: verificationResult.summary
    };

    const updatedDocument = await prisma.uploadedDocument.update({
      where: { id: documentId },
      data: {
        verificationStatus: verificationResult.status,
        verificationSummary: verificationResult.summary,
        extractedData: verificationResult.extractedData,
        verificationDetails: verificationDetails,
        lastVerifiedAt: new Date(),
        history: {
          create: {
            action: 'LOCAL_VERIFY',
            details: `Local verification result: ${verificationResult.summary}`,
            changedByUser: { connect: { id: effectiveUserId } },
            previousStatus: document.verificationStatus,
            newStatus: verificationResult.status,
            verificationMethod: 'LOCAL',
          }
        }
      },
    });

    await calculateDocumentScore(documentId);
    await calculateVendorScore(document.vendorId);

    if (verificationResult.isValid && verificationResult.status === 'PENDING_API_VALIDATION') {
      apiVerificationService.verifyDocument(updatedDocument).catch(async (error) => {
        await handleVerificationFailure(documentId, 'API verification failed: ' + error.message, true);
      });
    }

    return { success: true, status: updatedDocument.verificationStatus };
  } catch (error) {
    await handleVerificationFailure(documentId, `Processing failed: ${error.message}`);
    throw error;
  }
};

const handleVerificationFailure = async (documentId, errorMessage, isApiError = false) => {
  if (!documentId) return;

  try {
    const document = await prisma.uploadedDocument.findUnique({ where: { id: documentId } });
    if (!document) return;

    await prisma.uploadedDocument.update({
      where: { id: documentId },
      data: {
        verificationStatus: 'PENDING_MANUAL_REVIEW',
        verificationSummary: errorMessage,
        verificationDetails: {
          confidenceScore: 0,
          verificationMethod: isApiError ? 'API' : 'LOCAL',
          error: errorMessage
        },
        history: {
          create: {
            action: isApiError ? 'API_VERIFY_FAIL' : 'LOCAL_VERIFY_FAIL',
            details: errorMessage,
            changedByUser: { connect: { id: 'SYSTEM' } },
            previousStatus: document.verificationStatus,
            newStatus: 'PENDING_MANUAL_REVIEW',
            verificationMethod: isApiError ? 'API' : 'LOCAL',
          }
        }
      }
    });
    
    await calculateDocumentScore(documentId);
    await calculateVendorScore(document.vendorId);
  } catch (err) {
    console.error(`Failed to handle verification failure for doc ${documentId}:`, err);
  }
};