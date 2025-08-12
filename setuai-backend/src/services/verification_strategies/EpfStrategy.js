import BaseStrategy from './BaseStrategy.js';

export default class EpfStrategy extends BaseStrategy {
  constructor() {
    super('epf-ecr-challan');
  }

  async verify(ocrText, document) {
    try {
      console.log('EPF Strategy: Starting verification');
      console.log('EPF Strategy: Document type:', document.complianceDocument.name);

      // Compare with reference image for layout validation
      console.log('EPF Strategy: Starting document comparison');
      const comparison = await this.compareWithReference(document.filePath);
      console.log('EPF Strategy: Document comparison result:', comparison);
      
      // Document is valid if layout similarity >= 75%
      const isVerified = comparison.similarity >= 0.75;

      // Prepare verification summary
      let summary = [];
      if (comparison.similarity < 0.75) {
        summary.push(comparison.details);
        summary.push('Document layout does not match the expected format (similarity less than 75%)');
      }
      if (isVerified) {
        summary.push('Document format validation passed');
      }

      const result = {
        isValid: isVerified,
        status: isVerified ? 'PENDING_API_VALIDATION' : 'REJECTED',
        summary: summary.join('. '),
        extractedData: {
          documentType: document.complianceDocument.name,
          layoutSimilarity: comparison.similarity
        }
      };

      console.log('EPF Strategy: Verification result:', result);
      return result;
    } catch (error) {
      console.error('EPF verification error:', error);
      return {
        isValid: false,
        status: 'PENDING_MANUAL_REVIEW',
        summary: `Verification error: ${error.message}`,
        extractedData: {}
      };
    }
  }
}
