import BaseStrategy from './BaseStrategy.js';

/**
 * Strategy for verifying Certificate of Incorporation
 */
export default class IncorporationStrategy extends BaseStrategy {
  constructor() {
    super();
    this.requiredKeywords = [
      'Certificate of Incorporation',
      'Registrar of Companies',
      'Corporate Identity Number',
      'CIN',
      'Ministry of Corporate Affairs'
    ];
  }

  /**
   * Validates CIN (Corporate Identity Number) format
   * @param {string} cin - CIN to validate
   * @returns {Object} Validation result
   */
  _validateCIN(cin) {
    // CIN format: U72200TN2018PTC123456
    // 1st char: Listed status (U=Unlisted, L=Listed)
    // 5 digits: Industry code
    // 2 chars: State code
    // 4 digits: Year
    // 3 chars: Ownership (PLC/PTC)
    // 6 digits: ROC Registration number
    const cinRegex = /^[UL]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}$/;
    
    if (!cinRegex.test(cin)) {
      return {
        isValid: false,
        error: 'Invalid CIN format'
      };
    }

    return {
      isValid: true,
      components: {
        listedStatus: cin.charAt(0),
        industryCode: cin.substring(1, 6),
        stateCode: cin.substring(6, 8),
        yearOfIncorporation: cin.substring(8, 12),
        ownershipType: cin.substring(12, 15),
        registrationNumber: cin.substring(15)
      }
    };
  }

  /**
   * Extracts company details from text
   * @param {string} text - OCR text to search in
   * @returns {Object} Extracted company details
   */
  _extractCompanyDetails(text) {
    const details = {};
    
    // Look for company name
    const nameRegex = /(?:Name of (?:the )?Company|Company Name)\s*:?\s*([^\n]+)/i;
    const nameMatch = text.match(nameRegex);
    if (nameMatch) {
      details.name = nameMatch[1].trim();
    }

    // Look for registered office address
    const addressRegex = /(?:Registered|Corporate)\s+(?:Office|Address)\s*:?\s*([^\n]+(?:\n[^\n]+)*)/i;
    const addressMatch = text.match(addressRegex);
    if (addressMatch) {
      details.registeredOffice = addressMatch[1].trim().replace(/\n/g, ', ');
    }

    // Look for authorized capital
    const capitalRegex = /(?:Authorized|Nominal)\s+Capital\s*:?\s*(?:Rs\.?|INR)?\s*([\d,]+)/i;
    const capitalMatch = text.match(capitalRegex);
    if (capitalMatch) {
      details.authorizedCapital = capitalMatch[1].replace(/,/g, '');
    }

    // Look for company category/class
    const categoryRegex = /(?:Category|Class)\s*:?\s*([A-Za-z\s]+)/i;
    const categoryMatch = text.match(categoryRegex);
    if (categoryMatch) {
      details.category = categoryMatch[1].trim();
    }

    return details;
  }

  /**
   * Validates ROC seal presence
   * @param {string} text - OCR text to search in
   * @returns {boolean} Whether ROC seal is found
   */
  _validateROCSeal(text) {
    const rocKeywords = [
      'Under my hand and seal',
      'Given under my hand at',
      'Registrar of Companies',
      'ROC',
      'Digital Signature Certificate'
    ];

    return rocKeywords.some(keyword => 
      text.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  /**
   * Main verification method for Certificate of Incorporation
   * @param {string} ocrText - Extracted text from the document
   * @param {Object} document - The uploaded document record
   * @returns {Promise<Object>} Verification result
   */
  async verify(ocrText, document) {
    const summary = [];
    const extractedData = {};

    // Step 1: Check for required keywords
    const keywordCheck = this._checkKeywords(ocrText, this.requiredKeywords);
    if (keywordCheck.missing.length > 0) {
      return this._createResult(
        'REJECTED',
        `Missing required keywords: ${keywordCheck.missing.join(', ')}`,
        { missingKeywords: keywordCheck.missing }
      );
    }
    summary.push('Document appears to be a valid Certificate of Incorporation');

    // Step 2: Extract and validate CIN
    const cinMatch = ocrText.match(/[UL]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}/);
    if (!cinMatch) {
      return this._createResult(
        'REJECTED',
        'No valid CIN found in document',
        { error: 'CIN_NOT_FOUND' }
      );
    }

    const cin = cinMatch[0];
    const cinValidation = this._validateCIN(cin);
    if (!cinValidation.isValid) {
      return this._createResult(
        'REJECTED',
        `Invalid CIN: ${cinValidation.error}`,
        { error: 'INVALID_CIN' }
      );
    }

    extractedData.cin = cin;
    extractedData.cinComponents = cinValidation.components;
    summary.push(`Found valid CIN: ${cin}`);

    // Step 3: Extract company details
    const companyDetails = this._extractCompanyDetails(ocrText);
    if (Object.keys(companyDetails).length === 0) {
      return this._createResult(
        'PENDING_MANUAL_REVIEW',
        'Could not extract company details',
        { error: 'NO_COMPANY_DETAILS' }
      );
    }
    extractedData.company = companyDetails;
    
    if (companyDetails.name) {
      summary.push(`Company name: ${companyDetails.name}`);
    }
    if (companyDetails.authorizedCapital) {
      summary.push(`Authorized capital: Rs. ${companyDetails.authorizedCapital}`);
    }

    // Step 4: Check for ROC seal/signature
    if (!this._validateROCSeal(ocrText)) {
      return this._createResult(
        'PENDING_MANUAL_REVIEW',
        'Could not verify ROC seal or signature',
        extractedData
      );
    }
    summary.push('ROC seal/signature found');

    // Step 5: Extract and validate dates
    const dates = this._extractDates(ocrText);
    if (Object.keys(dates).length > 0) {
      extractedData.dates = dates;
      summary.push(`Found dates: ${Object.keys(dates).join(', ')}`);

      // Validate incorporation date against CIN year
      const incorporationYear = parseInt(cinValidation.components.yearOfIncorporation);
      const dateValues = Object.values(dates).map(d => new Date(d));
      const hasValidDate = dateValues.some(date => date.getFullYear() === incorporationYear);
      
      if (!hasValidDate) {
        return this._createResult(
          'REJECTED',
          'Incorporation date does not match CIN year',
          extractedData
        );
      }
    }

    // All local validations passed
    return this._createResult(
      'PENDING_API_VALIDATION',
      summary.join(' | '),
      extractedData
    );
  }
} 