import BaseStrategy from './BaseStrategy.js';

export default class IsoStrategy extends BaseStrategy {
  constructor() {
    super('iso');
  }

  async verify(ocrText, document) {
    try {
      console.log('ISO Strategy: Starting verification');
      
      // First, validate that this is actually an ISO document
      const typeValidation = this.validateDocumentType(ocrText);
      if (!typeValidation.isValid) {
        console.log('ISO Strategy: Document type validation failed:', typeValidation.reason);
        return {
          isValid: false,
          status: 'REJECTED',
          summary: typeValidation.reason,
          extractedData: {
            documentType: document.complianceDocument.name,
            error: 'Incorrect document type',
            details: typeValidation.reason
          }
        };
      }
      
      // For ISO certificates, skip layout comparison since they're issued by independent third-party bodies
      // and don't have a standard government format. Focus on AI extraction and API validation.
      console.log('ISO Strategy: Skipping layout comparison for ISO certificate (independent third-party issued)');
      
      // Always mark as valid for layout since ISO certificates have no standard format
      const isVerified = true;
      
      return {
        isValid: isVerified,
        status: isVerified ? 'PENDING_API_VALIDATION' : 'REJECTED',
        summary: 'ISO certificate format validation skipped (independent third-party issued)',
        extractedData: {
          documentType: document.complianceDocument.name,
          layoutSimilarity: 1.0, // Perfect similarity since we're not comparing
          note: 'ISO certificates are issued by independent third-party certification bodies'
        }
      };
    } catch (error) {
      console.error('ISO verification error:', error);
      return {
        isValid: false,
        status: 'PENDING_MANUAL_REVIEW',
        summary: 'Verification error: ' + error.message,
        extractedData: {}
      };
    }
  }
} 