import axios from 'axios';
import { config } from '../config/index.js';
import { getCache, setCache } from './cache.service.js';

const { apiEndpoints } = config;

/**
 * A client for interacting with various government and third-party APIs for document verification.
 * Implements caching to avoid hitting rate limits.
 */
class GovApiClient {
  constructor() {
    this.api = axios.create({
      timeout: 15000, // 15-second timeout for API calls
    });
  }

  async _makeRequest(cacheKey, url, options = {}) {
    const cachedData = getCache(cacheKey);
    if (cachedData) {
      console.log(`[GovApiClient] Cache hit for ${cacheKey}`);
      return cachedData;
    }

    console.log(`[GovApiClient] Cache miss for ${cacheKey}. Making live API call to ${url}`);

    try {
      const response = await this.api.get(url, options);
      
      // Cache the successful response for 24 hours
      setCache(cacheKey, response.data, 86400);
      
      return response.data;
    } catch (error) {
      console.error(`[GovApiClient] API request failed for ${url}:`, error.response?.data || error.message);
      // Don't cache errors, but throw them to be handled by the verification service
      throw new Error(error.response?.data?.message || 'API request failed');
    }
  }

  // --- GSTIN Verification ---
  async verifyGstin(gstin) {
    if (!gstin) throw new Error('GSTIN is required');
    console.log(`[GovApiClient] Mocking GSTIN verification for ${gstin}`);
    return { 
      isValid: true, 
      status: 'VERIFIED', 
      details: 'GSTIN verification completed successfully (mocked)',
      transactionId: `gstin-mock-${Date.now()}`
    };
  }

  // --- CIN Verification ---
  async verifyCin(cin) {
    if (!cin) throw new Error('CIN is required');
    console.log(`[GovApiClient] Mocking CIN verification for ${cin}`);
    return { 
      isValid: true, 
      status: 'VERIFIED', 
      details: 'CIN verification completed successfully (mocked)',
      transactionId: `cin-mock-${Date.now()}`
    };
  }
  
  // --- Factory License Verification ---
  async verifyFactoryLicense(licenseNo) {
    if (!licenseNo) throw new Error('Factory License Number is required');
    console.log(`[GovApiClient] Mocking Factory License verification for ${licenseNo}`);
    return { 
      isValid: true, 
      status: 'VERIFIED', 
      details: 'Factory License verification completed successfully (mocked)',
      transactionId: `factory-license-mock-${Date.now()}`
    };
  }
  
  // --- ESIC Verification ---
  async verifyEsic(esicCode) {
    if (!esicCode) throw new Error('ESIC Code is required');
    console.log(`[GovApiClient] Mocking ESIC verification for ${esicCode}`);
    return { 
      isValid: true, 
      status: 'VERIFIED', 
      details: 'ESIC verification completed successfully (mocked)',
      transactionId: `esic-mock-${Date.now()}`
    };
  }

  // --- EPF Verification ---
  async verifyEpf(epfCode) {
    if (!epfCode) throw new Error('EPF Code is required');
    console.log(`[GovApiClient] Mocking EPF verification for ${epfCode}`);
    return { 
      isValid: true, 
      status: 'VERIFIED', 
      details: 'EPF verification completed successfully (mocked)',
      transactionId: `epf-mock-${Date.now()}`
    };
  }
  
  // --- EPF TRRN Verification ---
  async verifyTrrn(trrn) {
    if (!trrn) throw new Error('TRRN is required');
    console.log(`[GovApiClient] Mocking TRRN verification for ${trrn}`);
    return { 
      isValid: true, 
      status: 'VERIFIED', 
      details: 'TRRN verification completed successfully (mocked)',
      transactionId: `mock-${Date.now()}`
    };
  }

  // --- TNPCB Consent Verification ---
  async verifyTnpcb(orderNo) {
    if (!orderNo) throw new Error('TNPCB Order Number is required');
    console.log(`[GovApiClient] Mocking TNPCB verification for ${orderNo}`);
    return { 
      isValid: true, 
      status: 'VERIFIED', 
      details: 'TNPCB verification completed successfully (mocked)',
      transactionId: `tnpcb-mock-${Date.now()}`
    };
  }
  
  // --- ISO Certificate Verification ---
  async verifyIso(certNo) {
    if (!certNo) throw new Error('ISO Certificate Number is required');
    console.log(`[GovApiClient] Mocking ISO verification for ${certNo}`);
    return { 
      isValid: true, 
      status: 'VERIFIED', 
      details: 'ISO verification completed successfully (mocked)',
      transactionId: `iso-mock-${Date.now()}`
    };
  }
  
  // --- OEKO-TEX Certificate Verification ---
  async verifyOekoTex(certNo) {
    if (!certNo) throw new Error('OEKO-TEX Certificate Number is required');
    console.log(`[GovApiClient] Mocking OEKO-TEX verification for ${certNo}`);
    return { 
      isValid: true, 
      status: 'VERIFIED', 
      details: 'OEKO-TEX verification completed successfully (mocked)',
      transactionId: `oeko-tex-mock-${Date.now()}`
    };
  }
  
  // --- GOTS Certificate Verification ---
  async verifyGots(licenseNo) {
    if (!licenseNo) throw new Error('GOTS License Number is required');
    console.log(`[GovApiClient] Mocking GOTS verification for ${licenseNo}`);
    return { 
      isValid: true, 
      status: 'VERIFIED', 
      details: 'GOTS verification completed successfully (mocked)',
      transactionId: `gots-mock-${Date.now()}`
    };
  }

  // --- Fire NOC Verification ---
  async verifyFireNoc(applicationNumber) {
    if (!applicationNumber) throw new Error('Application Number is required');
    console.log(`[GovApiClient] Mocking Fire NOC verification for ${applicationNumber}`);
    return { 
      isValid: true, 
      status: 'VERIFIED', 
      details: 'Fire NOC verification completed successfully (mocked)',
      transactionId: `fire-noc-mock-${Date.now()}`
    };
  }
}

export default new GovApiClient(); 