import BaseStrategy from './BaseStrategy.js';

export default class EsicStrategy extends BaseStrategy {
  constructor() {
    super('esic');
  }

  async verify(ocrText, document) {
    try {
      console.log('ESIC Strategy: Starting verification');
      
      // Compare with reference image for layout validation
      const comparison = await this.compareWithReference(document.filePath);
      console.log('ESIC Strategy: Document comparison result:', comparison);
      
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
          documentType: 'ESIC Registration Certificate',
          layoutSimilarity: comparison.similarity
        }
      };
    } catch (error) {
      console.error('ESIC verification error:', error);
      return {
        isValid: false,
        status: 'PENDING_MANUAL_REVIEW',
        summary: 'Verification error: ' + error.message,
        extractedData: {}
      };
    }
  }
} 