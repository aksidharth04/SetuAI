import BaseStrategy from './BaseStrategy.js';

export default class FireNocStrategy extends BaseStrategy {
  constructor() {
    super('fire-noc');
  }

  async verify(ocrText, document) {
    try {
      console.log('Fire NOC Strategy: Starting verification');
      
      // Compare with reference image for layout validation
      const comparison = await this.compareWithReference(document.filePath);
      console.log('Fire NOC Strategy: Document comparison result:', comparison);
      
      // Document is valid if layout similarity >= 70%
      const isVerified = comparison.similarity >= 0.7;
      
      let summary = [];
      if (comparison.similarity < 0.7) {
        summary.push(comparison.details);
      }
      if (isVerified) {
        summary.push('Document format validation passed');
      }
      
      return {
        isValid: isVerified,
        status: isVerified ? 'PENDING_API_VALIDATION' : 'REJECTED',
        summary: summary.join('. '),
        extractedData: {
          documentType: 'Fire NOC',
          layoutSimilarity: comparison.similarity
        }
      };
    } catch (error) {
      console.error('Fire NOC verification error:', error);
      return {
        isValid: false,
        status: 'PENDING_MANUAL_REVIEW',
        summary: 'Verification error: ' + error.message,
        extractedData: {}
      };
    }
  }
} 