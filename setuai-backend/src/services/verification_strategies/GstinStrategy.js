import BaseStrategy from './BaseStrategy.js';

export default class GstinStrategy extends BaseStrategy {
  constructor() {
    super('gstin');
  }

  async verify(ocrText, document) {
    try {
      console.log('GSTIN Strategy: Starting verification');
      
      // Compare with reference image for layout validation
      const comparison = await this.compareWithReference(document.filePath);
      console.log('GSTIN Strategy: Document comparison result:', comparison);
      
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
          documentType: 'GSTIN Certificate',
          layoutSimilarity: comparison.similarity
        }
      };
    } catch (error) {
      console.error('GSTIN verification error:', error);
      return {
        isValid: false,
        status: 'PENDING_MANUAL_REVIEW',
        summary: 'Verification error: ' + error.message,
        extractedData: {}
      };
    }
  }
} 