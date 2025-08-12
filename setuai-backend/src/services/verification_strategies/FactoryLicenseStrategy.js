import BaseStrategy from './BaseStrategy.js';

export default class FactoryLicenseStrategy extends BaseStrategy {
  constructor() {
    super('factory');
  }

  async verify(ocrText, document) {
    try {
      console.log('Factory License Strategy: Starting verification');
      
      // First, validate that this is actually a Factory License document
      const typeValidation = this.validateDocumentType(ocrText);
      if (!typeValidation.isValid) {
        console.log('Factory License Strategy: Document type validation failed:', typeValidation.reason);
        return {
          isValid: false,
          status: 'REJECTED',
          summary: typeValidation.reason,
          extractedData: {
            documentType: 'Factory License',
            error: 'Incorrect document type',
            details: typeValidation.reason
          }
        };
      }
      
      // Compare with reference image for layout validation
      const comparison = await this.compareWithReference(document.filePath);
      console.log('Factory License Strategy: Document comparison result:', comparison);
      
      // Document is valid if layout similarity >= 75%
      const isVerified = comparison.similarity >= 0.75;
      
      let summary = [];
      if (comparison.similarity < 0.75) {
        summary.push(comparison.details);
        summary.push('Document layout does not match the expected format (similarity less than 75%)');
      }
      if (isVerified) {
        summary.push('Document format validation passed');
      }
      
      return {
        isValid: isVerified,
        status: isVerified ? 'PENDING_API_VALIDATION' : 'REJECTED',
        summary: summary.join('. '),
        extractedData: {
          documentType: 'Factory License',
          layoutSimilarity: comparison.similarity
        }
      };
    } catch (error) {
      console.error('Factory License verification error:', error);
      return {
        isValid: false,
        status: 'PENDING_MANUAL_REVIEW',
        summary: 'Verification error: ' + error.message,
        extractedData: {}
      };
    }
  }
} 