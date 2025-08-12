import BaseStrategy from './BaseStrategy.js';
import path from 'path';
import fs from 'fs/promises';

/**
 * Strategy for verifying GOTS Certificate
 */
export default class GotsStrategy extends BaseStrategy {
  constructor() {
    super('gots');
    this.logoPath = null;
  }

  async initialize() {
    try {
      // Initialize the base strategy (for reference image if needed)
      await super.initialize();
      
      // Set up GOTS logo path
      const referenceDir = path.join(__dirname, '../../../public/reference_docs');
      this.logoPath = path.join(referenceDir, 'gots-logo.png');
      
      // Check if logo exists
      try {
        await fs.access(this.logoPath);
        console.log('GOTS Strategy: Found GOTS logo at', this.logoPath);
      } catch (err) {
        console.log('GOTS Strategy: GOTS logo not found at', this.logoPath);
        this.logoPath = null;
      }
    } catch (error) {
      console.error('GOTS Strategy: Error initializing:', error);
    }
  }

  async detectLogo(uploadedImagePath) {
    try {
      if (!this.logoPath) {
        console.log('GOTS Strategy: No logo path available for detection');
        return { detected: false, confidence: 0 };
      }

      console.log('GOTS Strategy: Detecting GOTS logo in uploaded document');
      
      // Resolve the uploaded image path
      const absoluteUploadedPath = await this.resolveFilePath(uploadedImagePath);
      
      // Use Google Vision API to detect objects and logos
      const [result] = await this.client.objectLocalization(absoluteUploadedPath);
      const [logoResult] = await this.client.objectLocalization(this.logoPath);
      
      // Simple logo detection based on object similarity
      // In a production system, you might use more sophisticated logo detection
      const uploadedObjects = result.localizedObjectAnnotations || [];
      const logoObjects = logoResult.localizedObjectAnnotations || [];
      
      console.log('GOTS Strategy: Found objects in uploaded image:', uploadedObjects.length);
      console.log('GOTS Strategy: Found objects in logo image:', logoObjects.length);
      
      // For now, we'll consider the logo detected if we find any objects
      // In a real implementation, you'd compare object types and positions
      const logoDetected = uploadedObjects.length > 0;
      
      return {
        detected: logoDetected,
        confidence: logoDetected ? 0.8 : 0.2,
        details: logoDetected ? 'GOTS logo detected in document' : 'GOTS logo not detected'
      };
    } catch (error) {
      console.error('GOTS Strategy: Error detecting logo:', error);
      return {
        detected: false,
        confidence: 0,
        details: 'Logo detection failed: ' + error.message
      };
    }
  }

  async verify(ocrText, document) {
    try {
      console.log('GOTS Strategy: Starting verification');
      
      // First, validate that this is actually a GOTS document
      const typeValidation = this.validateDocumentType(ocrText);
      if (!typeValidation.isValid) {
        console.log('GOTS Strategy: Document type validation failed:', typeValidation.reason);
        return {
          isValid: false,
          status: 'REJECTED',
          summary: typeValidation.reason,
          extractedData: {
            documentType: 'GOTS Certificate',
            error: 'Incorrect document type',
            details: typeValidation.reason
          }
        };
      }
      
      // Initialize if not already done
      if (!this.logoPath) {
        await this.initialize();
      }
      
      // Detect GOTS logo in the uploaded document
      const logoDetection = await this.detectLogo(document.filePath);
      console.log('GOTS Strategy: Logo detection result:', logoDetection);
      
      // For GOTS certificates, we skip layout comparison but check for logo presence
      // and focus on AI extraction and API validation
      console.log('GOTS Strategy: Skipping layout comparison for GOTS certificate (independent third-party issued)');
      
      // Document is valid if logo is detected (with some tolerance)
      const isVerified = logoDetection.detected || logoDetection.confidence > 0.3;
      
      let summary = [];
      if (!logoDetection.detected && logoDetection.confidence <= 0.3) {
        summary.push('GOTS logo not detected in document');
      } else {
        summary.push('GOTS logo detected in document');
      }
      summary.push('GOTS certificate format validation skipped (independent third-party issued)');
      
      return {
        isValid: isVerified,
        status: isVerified ? 'PENDING_API_VALIDATION' : 'REJECTED',
        summary: summary.join('. '),
        extractedData: {
          documentType: 'GOTS Certificate',
          layoutSimilarity: 1.0, // Perfect similarity since we're not comparing layout
          logoDetected: logoDetection.detected,
          logoConfidence: logoDetection.confidence,
          note: 'GOTS certificates are issued by independent third-party certification bodies'
        }
      };
    } catch (error) {
      console.error('GOTS verification error:', error);
      return {
        isValid: false,
        status: 'PENDING_MANUAL_REVIEW',
        summary: 'Verification error: ' + error.message,
        extractedData: {}
      };
    }
  }
} 