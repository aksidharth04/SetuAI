import BaseStrategy from './BaseStrategy.js';

/**
 * Strategy for verifying OEKO-TEX Standard 100 Certificate
 */
export default class OekoTexStrategy extends BaseStrategy {
  constructor() {
    super('oeko-tex');
  }

  async verify(ocrText, document) {
    try {
      console.log('OEKO-TEX Strategy: Starting verification');
      
      // For OEKO-TEX certificates, skip layout comparison since they're issued by independent third-party bodies
      // and don't have a standard government format. Focus on AI extraction and API validation.
      console.log('OEKO-TEX Strategy: Skipping layout comparison for OEKO-TEX certificate (independent third-party issued)');
      
      // Always mark as valid for layout since OEKO-TEX certificates have no standard format
      const isVerified = true;
      
      return {
        isValid: isVerified,
        status: isVerified ? 'PENDING_API_VALIDATION' : 'REJECTED',
        summary: 'OEKO-TEX certificate format validation skipped (independent third-party issued)',
        extractedData: {
          documentType: 'OEKO-TEX Standard 100',
          layoutSimilarity: 1.0, // Perfect similarity since we're not comparing
          note: 'OEKO-TEX certificates are issued by independent third-party certification bodies'
        }
      };
    } catch (error) {
      console.error('OEKO-TEX verification error:', error);
      return {
        isValid: false,
        status: 'PENDING_MANUAL_REVIEW',
        summary: 'Verification error: ' + error.message,
        extractedData: {}
      };
    }
  }
} 