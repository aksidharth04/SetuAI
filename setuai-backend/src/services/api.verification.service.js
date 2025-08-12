import govApiClient from './gov.api.client.js';
import { PrismaClient } from '@prisma/client';
import { config } from '../config/index.js';

const prisma = new PrismaClient();

/**
 * Service for handling API-based document verification
 */
class ApiVerificationService {
  /**
   * Verifies a document with the appropriate external API
   * @param {Object} document - The document to verify
   * @param {Object} extractedData - Data extracted from the document
   * @returns {Promise<Object>} Verification result
   */
  async verifyDocument(document) {
    try {
      console.log('API Verification: Starting verification for document:', document.id);
      console.log('API Verification: Document data:', document.extractedData);
      
      // The document processor now passes the full document object,
      // but the extracted data is what we need for verification.
      const dataForApi = document.extractedData || {};
      
      // Handle AI extraction result structure - extract fields from nested structure
      const extractedFields = dataForApi.extractedFields || dataForApi;
      
      let apiResult;
      
      switch (document.complianceDocument.name) {
        case 'GSTIN Certificate':
          apiResult = await govApiClient.verifyGstin(extractedFields.gstin);
          break;
          
        case 'Certificate of Incorporation':
          apiResult = await govApiClient.verifyCin(extractedFields.cin);
          break;
          
        case 'Factory License Form 4':
        case 'Factory License':
          apiResult = await govApiClient.verifyFactoryLicense(extractedFields.licenseNo);
          break;

        case 'ESIC Registration':
          const code = extractedFields.esicCode || extractedFields.code;
          if (!code) {
            throw new Error('ESIC code is required for API verification');
          }
          apiResult = await govApiClient.verifyEsic(code);
          break;
          
        case 'EPF Registration':
          apiResult = await govApiClient.verifyEpf(extractedFields.code);
          break;
          
        case 'EPF ECR Challan':
          if (!extractedFields.trrn) {
            console.error('API Verification: TRRN missing from extracted data:', dataForApi);
            throw new Error('TRRN is required for ECR Challan verification');
          }
          apiResult = await govApiClient.verifyTrrn(extractedFields.trrn);
          break;
          
        case 'Fire NOC':
          apiResult = await govApiClient.verifyFireNoc(extractedFields.nocNumber);
          break;
          
        case 'TNPCB Consent to Operate':
        case 'TNPCB Consent':
          apiResult = await govApiClient.verifyTnpcb(extractedFields.consentOrderNo);
          break;
          
        case 'ISO 9001 Certificate':
        case 'ISO 14001 Certificate':
        case 'ISO 45001 Certificate':
          apiResult = await govApiClient.verifyIso(extractedFields.certificateNumber);
          break;
          
        case 'OEKO-TEX Standard 100':
          apiResult = await govApiClient.verifyOekoTex(extractedFields.certificateNumber);
          break;
          
        case 'GOTS Certificate':
          apiResult = await govApiClient.verifyGots(extractedFields.licenseNumber);
          break;
          
        default:
          console.log(`API Verification: No API verification available for ${document.complianceDocument.name}, marking as successful.`);
          apiResult = { isValid: true, status: 'VERIFIED', details: 'No external API verification required for this document type.' };
      }

      // Update document with API verification result
      await this._updateDocumentStatus(document.id, document.vendor.users[0]?.id, apiResult);

      return apiResult;
    } catch (error) {
      console.error('API Verification Error:', error);
      
      // Update document status to indicate API verification failure
      await this._updateDocumentStatus(document.id, document.vendor.users[0]?.id, {
        isValid: false,
        status: 'PENDING_MANUAL_REVIEW',
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Updates the document's status and creates an audit log
   * @private
   */
  async _updateDocumentStatus(documentId, userId, result) {
    if (!documentId) {
      console.error('[_updateDocumentStatus] documentId is missing, cannot update status.');
      return;
    }

    try {
      console.log('[_updateDocumentStatus] Updating document:', documentId);
      console.log('[_updateDocumentStatus] Result:', result);
      console.log('[_updateDocumentStatus] Result isValid:', result.isValid);
      
      const currentDoc = await prisma.uploadedDocument.findUnique({ where: { id: documentId } });
      console.log('[_updateDocumentStatus] Current document status:', currentDoc.verificationStatus);

      const finalUserId = userId || 'SYSTEM'; // Fallback to SYSTEM user if no user is found
      const newStatus = result.isValid ? 'VERIFIED' : 'REJECTED';
      
      console.log('[_updateDocumentStatus] Setting new status to:', newStatus);

      await prisma.uploadedDocument.update({
        where: { id: documentId },
        data: {
          verificationStatus: newStatus,
          verificationSummary: result.details || result.error || 'API verification processed.',
          apiVerificationId: result.transactionId || null, // Assuming the API returns a transactionId
          history: {
            create: {
              action: 'API_VERIFY',
              details: JSON.stringify(result),
              changedByUserId: finalUserId,
              previousStatus: currentDoc.verificationStatus,
              newStatus: newStatus,
              verificationMethod: 'API',
            },
          },
        },
      });
      
      console.log('[_updateDocumentStatus] Document updated successfully');
    } catch (error) {
      console.error(`[_updateDocumentStatus] Failed to update document ${documentId}:`, error);
      // We don't re-throw here to prevent crashing the main process if only the logging fails
    }
  }

  /**
   * Verifies GSTIN with GST Portal
   * @param {string} gstin - GSTIN to verify
   * @returns {Promise<Object>} Verification result
   */
  async _verifyGstin(gstin) {
    return await this._retryApiCall(() => govApiClient.verifyGstin(gstin));
  }

  /**
   * Verifies CIN with MCA Portal
   * @param {string} cin - CIN to verify
   * @returns {Promise<Object>} Verification result
   */
  async _verifyCin(cin) {
    return await this._retryApiCall(() => govApiClient.verifyCin(cin));
  }

  /**
   * Verifies EPF code and payment status
   * @param {string} epfCode - EPF establishment code
   * @param {string} trrn - Transaction reference number (optional)
   * @returns {Promise<Object>} Verification result
   */
  async _verifyEpf(epfCode, trrn = null) {
    return await this._retryApiCall(() => govApiClient.verifyEpf(epfCode, trrn));
  }

  /**
   * Verifies ESIC registration
   * @param {string} esicCode - ESIC code to verify
   * @returns {Promise<Object>} Verification result
   */
  async _verifyEsic(esicCode) {
    return await this._retryApiCall(() => govApiClient.verifyEsic(esicCode));
  }

  /**
   * Verifies TNPCB consent
   * @param {string} consentNumber - Consent order number
   * @returns {Promise<Object>} Verification result
   */
  async _verifyTnpcbConsent(consentNumber) {
    return await this._retryApiCall(() => govApiClient.verifyTnpcbConsent(consentNumber));
  }

  /**
   * Verifies Fire NOC
   * @param {string} nocNumber - NOC number to verify
   * @returns {Promise<Object>} Verification result
   */
  async _verifyFireNoc(nocNumber) {
    return await this._retryApiCall(() => govApiClient.verifyFireNoc(nocNumber));
  }

  /**
   * Verifies ISO certificate
   * @param {string} certNumber - Certificate number to verify
   * @param {string} standard - ISO standard (e.g., '9001', '14001')
   * @returns {Promise<Object>} Verification result
   */
  async _verifyIsoCertificate(certNumber, standard) {
    return await this._retryApiCall(() => govApiClient.verifyIsoCertificate(certNumber, standard));
  }

  /**
   * Verifies OEKO-TEX certificate
   * @param {string} certNumber - Certificate number to verify
   * @returns {Promise<Object>} Verification result
   */
  async _verifyOekoTex(certNumber) {
    return await this._retryApiCall(() => govApiClient.verifyOekoTex(certNumber));
  }

  /**
   * Verifies GOTS certificate
   * @param {string} licenseNo - License number to verify
   * @returns {Promise<Object>} Verification result
   */
  async _verifyGots(licenseNo) {
    return await this._retryApiCall(() => govApiClient.verifyGots(licenseNo));
  }

  /**
   * Retries an API call with exponential backoff
   * @param {Function} apiCall - The API call to retry
   * @returns {Promise<Object>} API call result
   */
  async _retryApiCall(apiCall) {
    let attempt = 0;
    let lastError;

    while (attempt < config.verification.maxRetries) {
      try {
        return await apiCall();
      } catch (error) {
        lastError = error;
        attempt++;

        if (attempt === config.verification.maxRetries) {
          break;
        }

        // Exponential backoff
        const delay = config.verification.retryDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }
}

export default new ApiVerificationService(); 