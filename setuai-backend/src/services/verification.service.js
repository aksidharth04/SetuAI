import GstinStrategy from './verification_strategies/GstinStrategy.js';
import EpfStrategy from './verification_strategies/EpfStrategy.js';
import EsicStrategy from './verification_strategies/EsicStrategy.js';
import FireNocStrategy from './verification_strategies/FireNocStrategy.js';
import FactoryLicenseStrategy from './verification_strategies/FactoryLicenseStrategy.js';
import TnpcbStrategy from './verification_strategies/TnpcbStrategy.js';
import IsoStrategy from './verification_strategies/IsoStrategy.js';
import OekoTexStrategy from './verification_strategies/OekoTexStrategy.js';
import GotsStrategy from './verification_strategies/GotsStrategy.js';
import IncorporationStrategy from './verification_strategies/IncorporationStrategy.js';
import EpfRegistrationStrategy from './verification_strategies/EpfRegistrationStrategy.js';
import EsicRegistrationStrategy from './verification_strategies/EsicRegistrationStrategy.js';
import AIExtractionService from './ai.extraction.service.js';

const aiExtractionService = new AIExtractionService();

class VerificationService {
  constructor() {
    this.strategies = {
      'GSTIN Certificate': new GstinStrategy(),
      'EPF Registration': new EpfRegistrationStrategy(),
      'EPF ECR Challan': new EpfStrategy(),
      'ESIC Registration': new EsicRegistrationStrategy(),
      'Fire NOC': new FireNocStrategy(),
      'Factory License': new FactoryLicenseStrategy(),
      'Factory License Form 4': new FactoryLicenseStrategy(),
      'TNPCB Consent to Operate': new TnpcbStrategy(),
      'TNPCB Consent': new TnpcbStrategy(),
      'ISO 9001 Certificate': new IsoStrategy(),
      'ISO 9001': new IsoStrategy(),
      'ISO 14001 Certificate': new IsoStrategy(),
      'ISO 14001': new IsoStrategy(),
      'ISO 45001 Certificate': new IsoStrategy(),
      'ISO 45001': new IsoStrategy(),
      'ISO Certificate': new IsoStrategy(),
      'OEKO-TEX Standard 100': new OekoTexStrategy(),
      'OEKO-TEX': new OekoTexStrategy(),
      'GOTS Certificate': new GotsStrategy(),
      'GOTS': new GotsStrategy(),
      'Certificate of Incorporation': new IncorporationStrategy()
    };
  }

  async verifyDocument(document, ocrText) {
    const documentType = document.complianceDocument.name;
    console.log('Verification Service: Starting verification for document type:', documentType);

    try {
      // Use AI extraction and verification for all document types
      const aiResult = await aiExtractionService.extractDocumentInfo(ocrText, documentType, document.vendor);
      console.log('Verification Service: AI verification result:', aiResult);

      // If AI verification failed, reject the document
      if (!aiResult.isValid) {
        return {
          status: 'REJECTED',
          summary: aiResult.reason || 'Document did not pass AI verification.',
          confidence: aiResult.confidence || 0,
          extractedData: {
            error: 'AI Validation Failed',
            details: aiResult.reason,
            confidence: aiResult.confidence || 0,
          },
        };
      }

      // If AI is valid, check for a reference image and compare layout
      const strategy = this.strategies[documentType];
      if (strategy && strategy.referenceImagePath) {
        const comparison = await strategy.compareWithReference(document.filePath);
        console.log('Verification Service: Layout comparison result:', comparison);

        if (comparison.similarity < 0.75) {
          return {
            status: 'REJECTED',
            summary: `Document layout similarity is too low (${(comparison.similarity * 100).toFixed(1)}%).`,
            confidence: aiResult.confidence || 0,
            extractedData: { ...aiResult.extractedData, layoutSimilarity: comparison.similarity },
          };
        }
      }

      // Document passed all checks
      return {
        status: 'VERIFIED',
        summary: 'Document verified successfully by AI' + (strategy && strategy.referenceImagePath ? ' and layout comparison.' : '.'),
        confidence: aiResult.confidence || 0,
        extractedData: aiResult.extractedData,
      };
    } catch (error) {
      console.error('Verification Service: Verification error:', error);
      return {
        status: 'PENDING_MANUAL_REVIEW',
        summary: `An error occurred during verification: ${error.message}`,
        confidence: 0,
        extractedData: null,
      };
    }
  }
}

export default new VerificationService();
