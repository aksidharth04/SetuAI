import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

export default class AIExtractionService {
  constructor() {
    // No need to store model instance, we'll use ai.models directly
  }

  async extractDocumentInfo(ocrText, documentType, vendorInfo = null) {
    try {
      const prompt = this.buildExtractionPrompt(ocrText, documentType, vendorInfo);
      console.log('Sending prompt to Gemini:', prompt.substring(0, 100) + '...');
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
      });

      console.log('Raw Gemini response:', response);

      if (!response) {
        throw new Error('No response received from Gemini API');
      }

      // Access the response text correctly from Gemini response
      const content = response.text;
      console.log('AI Response text:', content);

      // Validate that we got a string response
      if (typeof content !== 'string') {
        throw new Error(`Invalid response type from Gemini API: ${typeof content}`);
      }

      return this.parseAIResponse(content);
    } catch (error) {
      console.error('AI Extraction error:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        response: error.response
      });
      throw new Error(`AI extraction failed: ${error.message}`);
    }
  }

      buildExtractionPrompt(ocrText, documentType, vendorInfo) {
      // Base prompt with strict schema enforcement
      let base = `Analyze this document OCR text and verify if it is a valid ${documentType}.

CRITICAL: You MUST wrap your entire response in \`\`\`json and \`\`\` tags and follow this EXACT schema:
{
  "verification": {
    "isValid": boolean,
    "reason": "string explaining why valid/invalid"
  },
  "extractedFields": {
    // Document-specific fields will be defined below
  },
  "confidence": number between 0 and 1
}

OCR Text to analyze:
${ocrText}

`;

      switch (documentType) {
      case 'EPF Registration':
        return base + `
  IMPORTANT: This must be an EPF REGISTRATION document, NOT an EPF ECR Challan or any other EPF-related document.
  
  A valid EPF Registration document MUST have:
  1. Clear mention of "EMPLOYEES' PROVIDENT FUND" organization or "EPFO"
  2. Must be a REGISTRATION or INTIMATION document (NOT a challan, return, or payment document)
  3. A valid EPF code number in either:
     - Modern format: [STATE][OFFICE][NUMBER] (e.g., PUPUN0304683000)
     - Legacy format: XX/XXX/XXXXXXX/XXX
  4. Clear establishment details (name and address)
  5. Date of registration/issue
  6. Official formatting indicating it's a government document (any of):
     - Official letterhead
     - PF office details
     - Ministry reference
     - Document title/reference number

  REJECT if:
  - It's an EPF ECR Challan (contains TRRN, ECR ID, or payment details)
  - It's a monthly return or payment document
  - It's any other EPF-related document that is not specifically a registration certificate

  Extract these fields if document is valid:
  - code: EPF registration code (in any valid format)
  - establishmentName: Name of the establishment
  - establishmentAddress: Full address
  - dateOfIssue: Date of registration
  - issuingAuthority: EPF office details
  - validityPeriod: If mentioned

  Return verification result as:
  - isValid: true ONLY if this is specifically an EPF Registration document
  - reason: Explain why valid/invalid, including which format checks passed
  - confidence: Your confidence in this verification (0-1)

  Note: Modern EPF documents may use digital formats without physical stamps/signatures. Focus on content authenticity rather than physical marks.

  IMPORTANT: You MUST return your response in this exact JSON format:
  {
    "verification": {
      "isValid": boolean,
      "reason": "detailed explanation"
    },
    "extractedFields": {
      "code": "string",
      "establishmentName": "string",
      "establishmentAddress": "string",
      "dateOfIssue": "string",
      "issuingAuthority": "string",
      "validityPeriod": "string or null"
    },
    "confidence": number
  }`;

      case 'EPF ECR Challan':
        return base + `
A valid EPF ECR Challan MUST have:
1. At least one of:
   - Transaction Reference Number (TRRN)
   - Electronic Challan cum Return (ECR) number
   - Payment confirmation reference
2. Establishment details:
   - Name
   - EPF code (any valid format)
3. Payment/contribution details:
   - Wage month and year
   - Any of these contribution types:
     * EPF (employer/employee)
     * EPS
     * EDLI
4. Amount details:
   - Either total amount or
   - Contribution breakup

Extract these fields if document is valid:
- trrn: Transaction reference number (if present)
- establishmentCode: EPF establishment code
- establishmentName: Name of establishment
- ecrId: ECR identification (if present)
- duesForWageMonth: Month of wages
- duesForWageYear: Year of wages
- epfEmployerShare: Employer EPF share (if shown)
- epfEmployeeShare: Employee EPF share (if shown)
- epsEmployerShare: EPS share (if shown)
- edliEmployerShare: EDLI share (if shown)
- totalWages: Total wages (if shown)
- grandTotal: Total amount

Return verification result as:
- isValid: true if document contains required elements and appears authentic
- reason: Explain which required elements were found and format checks passed
- confidence: Your confidence in this verification (0-1)

Note: Modern ECR challans may be in various formats (PDF/printout/screenshot). Focus on verifying the presence of key information rather than specific formatting.

IMPORTANT: You MUST return your response in this exact JSON format:
{
  "verification": {
    "isValid": boolean,
    "reason": "detailed explanation"
  },
  "extractedFields": {
    "trrn": "string or null",
    "establishmentCode": "string",
    "establishmentName": "string",
    "ecrId": "string or null",
    "duesForWageMonth": "string",
    "duesForWageYear": "string",
    "epfEmployerShare": number or null,
    "epfEmployeeShare": number or null,
    "epsEmployerShare": number or null,
    "edliEmployerShare": number or null,
    "totalWages": number or null,
    "grandTotal": number
  },
  "confidence": number
}`;

      case 'ESIC Registration':
        return base + `
REQUIREMENTS:
A valid ESIC Registration document MUST contain:
1. Clear heading "EMPLOYEES' STATE INSURANCE CORPORATION"
2. 17-digit ESIC code number
3. Complete establishment details
4. Date of registration/issue
5. Official letterhead or logo
6. Issuing authority details

REJECT if:
- Missing ESIC header/logo
- Invalid code format
- Missing registration details
- Not an original registration document
- Application form instead of certificate

Your response MUST follow this exact schema:
{
  "verification": {
    "isValid": boolean,
    "reason": "Detailed explanation of why valid/invalid"
  },
  "extractedFields": {
    "esicCode": "string - 17-digit code",
    "establishmentName": "string - full registered name",
    "establishmentAddress": "string - complete address",
    "dateOfRegistration": "string - DD/MM/YYYY",
    "issuingAuthority": "string - issuing office details",
    "employerName": "string - name of employer",
    "validityPeriod": "string or null - if mentioned",
    "hasOfficialStamp": "boolean - true if stamp present"
  },
  "confidence": number between 0 and 1
}`;

      case 'TNPCB Consent':
        return base + `
REQUIREMENTS:
A valid TNPCB Consent document MUST contain:
1. Tamil Nadu Pollution Control Board letterhead/logo
2. Complete consent order number
3. Issue date and validity period
4. Establishment details matching application
5. Authorized signature/stamp
6. Industry category and details

REJECT if:
- Missing TNPCB branding
- Expired consent
- Incomplete consent number
- Missing signature/stamp
- Application form instead of consent order

Your response MUST follow this exact schema:
{
  "verification": {
    "isValid": boolean,
    "reason": "Detailed explanation of why valid/invalid"
  },
  "extractedFields": {
    "consentOrderNumber": "string - full consent number",
    "establishmentName": "string - full registered name",
    "establishmentAddress": "string - complete address",
    "issueDate": "string - DD/MM/YYYY",
    "validUntil": "string - DD/MM/YYYY",
    "proprietorName": "string - name of proprietor/authorized person",
    "industryType": "string - type of industry/category",
    "hasOfficialStamp": "boolean - true if stamp present",
    "hasSignature": "boolean - true if signed",
    "hasTnpcbLogo": "boolean - true if logo present"
  },
  "confidence": number between 0 and 1
}`;

      case 'ISO 9001':
      case 'ISO 14001':
      case 'ISO 45001':
        const isoStandard = documentType;
        return base + `
REQUIREMENTS:
A valid ${isoStandard} Certificate MUST contain:
1. Clear mention of "${isoStandard}" standard
2. Accredited certification body details
3. Organization name and scope
4. Valid certificate number
5. Issue and expiry dates
6. Accreditation marks/symbols

REJECT if:
- Wrong ISO standard mentioned
- Expired certificate
- Missing accreditation marks
- Invalid certification body
- Draft or provisional certificate

Your response MUST follow this exact schema:
{
  "verification": {
    "isValid": boolean,
    "reason": "Detailed explanation of why valid/invalid"
  },
  "extractedFields": {
    "certificateNumber": "string - unique certificate ID",
    "isoStandard": "string - exact standard number",
    "organizationName": "string - certified organization",
    "organizationAddress": "string - complete address",
    "scope": "string - certification scope",
    "issueDate": "string - DD/MM/YYYY",
    "validUntil": "string - DD/MM/YYYY",
    "certificationBody": "string - name of certification body",
    "accreditationDetails": "string - accreditation information",
    "hasValidMarks": "boolean - true if accreditation marks present"
  },
  "confidence": number between 0 and 1
}`;

      case 'GOTS':
        return base + `
REQUIREMENTS:
A valid GOTS Certificate MUST contain:
1. Global Organic Textile Standard logo
2. Authorized certification body details
3. License/certificate number
4. Scope of certification
5. Valid certification period
6. Product categories covered

REJECT if:
- Missing GOTS logo
- Expired certificate
- Unauthorized certification body
- Incomplete product scope
- Draft or provisional status

Your response MUST follow this exact schema:
{
  "verification": {
    "isValid": boolean,
    "reason": "Detailed explanation of why valid/invalid"
  },
  "extractedFields": {
    "licenseNumber": "string - certificate number",
    "organizationName": "string - certified organization",
    "organizationAddress": "string - complete address",
    "productScope": "string - certified products/categories",
    "issueDate": "string - DD/MM/YYYY",
    "validUntil": "string - DD/MM/YYYY",
    "certificationBody": "string - issuing body name",
    "standardVersion": "string - GOTS version number",
    "hasGotsLogo": "boolean - true if logo present",
    "hasValidMarks": "boolean - true if certification marks present"
  },
  "confidence": number between 0 and 1
}`;

      case 'OEKO-TEX':
        return base + `
REQUIREMENTS:
A valid OEKO-TEX Certificate MUST contain:
1. OEKO-TEX logo and branding
2. Valid certificate number
3. Product class/category
4. Testing institute details
5. Test criteria/standards
6. Validity period

REJECT if:
- Missing OEKO-TEX branding
- Expired certificate
- Invalid product classification
- Missing test criteria
- Unauthorized testing institute

Your response MUST follow this exact schema:
{
  "verification": {
    "isValid": boolean,
    "reason": "Detailed explanation of why valid/invalid"
  },
  "extractedFields": {
    "certificateNumber": "string - unique certificate number",
    "organizationName": "string - certified company",
    "organizationAddress": "string - complete address",
    "productClass": "string - product category/class",
    "testCriteria": "string - testing standards met",
    "issueDate": "string - DD/MM/YYYY",
    "validUntil": "string - DD/MM/YYYY",
    "instituteDetails": "string - testing institute name",
    "hasOekoTexLogo": "boolean - true if logo present",
    "hasValidMarks": "boolean - true if marks present"
  },
  "confidence": number between 0 and 1
}`;

      case 'Fire NOC':
        return base + `
REQUIREMENTS:
A valid Fire NOC Certificate MUST contain:
1. Fire Department letterhead/logo
2. NOC/Certificate number
3. Establishment details
4. Validity period
5. Fire safety compliance details
6. Authorized signature/stamp

REJECT if:
- Not on official letterhead
- Expired NOC
- Provisional/temporary clearance
- Incomplete safety details
- Missing authorization

Your response MUST follow this exact schema:
{
  "verification": {
    "isValid": boolean,
    "reason": "Detailed explanation of why valid/invalid"
  },
  "extractedFields": {
    "nocNumber": "string - certificate/NOC number",
    "establishmentName": "string - full name",
    "establishmentAddress": "string - complete address",
    "issueDate": "string - DD/MM/YYYY",
    "validUntil": "string - DD/MM/YYYY",
    "issuingAuthority": "string - fire department details",
    "buildingType": "string - type of establishment",
    "floorArea": "string or null - area details if mentioned",
    "hasOfficialStamp": "boolean - true if stamped",
    "hasSignature": "boolean - true if signed"
  },
  "confidence": number between 0 and 1
}`;

      case 'EPF Registration':
        return base + `
REQUIREMENTS:
A valid EPF Registration document MUST contain:
1. Clear mention of "EMPLOYEES' PROVIDENT FUND" or "EPFO"
2. Registration/Intimation document (NOT challan/return)
3. Valid EPF code number in either format:
   - Modern: [STATE][OFFICE][NUMBER] (e.g., PUPUN0304683000)
   - Legacy: XX/XXX/XXXXXXX/XXX
4. Establishment details
5. Date of registration
6. Official formatting (letterhead/office details)

REJECT if:
- EPF ECR Challan (has TRRN/ECR ID)
- Monthly return document
- Payment document
- Application form
- Invalid code format

Your response MUST follow this exact schema:
{
  "verification": {
    "isValid": boolean,
    "reason": "Detailed explanation of why valid/invalid"
  },
  "extractedFields": {
    "epfCode": "string - registration code",
    "establishmentName": "string - full name",
    "establishmentAddress": "string - complete address",
    "dateOfRegistration": "string - DD/MM/YYYY",
    "issuingAuthority": "string - EPF office details",
    "employerName": "string - name of employer",
    "validityPeriod": "string or null - if mentioned",
    "hasOfficialStamp": "boolean - true if stamped"
  },
  "confidence": number between 0 and 1
}`;

      case 'EPF ECR Challan':
        return base + `
REQUIREMENTS:
A valid EPF ECR Challan MUST contain:
1. Transaction Reference Number (TRRN) or ECR ID
2. Establishment details with EPF code
3. Wage month and year
4. Payment/contribution details
5. Total amount
6. Payment confirmation

REJECT if:
- Registration document
- Monthly return without payment
- Draft/unconfirmed payment
- Invalid establishment code

Your response MUST follow this exact schema:
{
  "verification": {
    "isValid": boolean,
    "reason": "Detailed explanation of why valid/invalid"
  },
  "extractedFields": {
    "trrn": "string - transaction reference",
    "ecrId": "string or null - ECR number if present",
    "establishmentCode": "string - EPF code",
    "establishmentName": "string - full name",
    "wageMonth": "string - month of wages",
    "wageYear": "string - year of wages",
    "totalAmount": "string - total payment amount",
    "paymentDate": "string - DD/MM/YYYY",
    "hasPaymentConfirmation": "boolean - true if payment confirmed"
  },
  "confidence": number between 0 and 1
}`;

      case 'Factory License':
        return base + `
REQUIREMENTS:
A valid Factory License document MUST contain:
1. Clear mention of "Factory License" or "Registration and License to work a factory"
2. Issuing authority (Directorate of Industrial Safety and Health)
3. License/Registration number
4. Factory name and complete address
5. Validity period or expiry date
6. Maximum workers and horsepower allowed
7. License holder's name

REJECT if:
- Missing any of the above required elements
- Not issued by proper authority
- Expired license
- Provisional or temporary license
- Application form instead of actual license

Your response MUST follow this exact schema:
{
  "verification": {
    "isValid": boolean,
    "reason": "Detailed explanation of why valid/invalid"
  },
  "extractedFields": {
    "licenseNumber": "string - registration/license number",
    "factoryName": "string - full registered name",
    "licenseHolderName": "string - name of licensee",
    "factoryAddress": "string - complete address",
    "validUntil": "string - expiry date",
    "maxWorkers": "string - maximum workers allowed",
    "maxHorsePower": "string - maximum HP allowed",
    "issueDate": "string - date of issue",
    "issuingAuthority": "string - name of issuing office/authority"
  },
  "confidence": number between 0 and 1
}`;

      default:
        return base + `
Your response MUST follow this exact schema:
{
  "verification": {
    "isValid": boolean,
    "reason": "string explaining verification result"
  },
  "extractedFields": {
    "documentTitle": "string - full title as shown",
    "registrationNumber": "string - any unique identifier",
    "organizationName": "string - name of organization",
    "issueDate": "string - date of issue if present",
    "expiryDate": "string - expiry date if present",
    "issuingAuthority": "string - who issued this document"
  },
  "confidence": number between 0 and 1
}`;
    }
  }

        parseAIResponse(responseText) {
        try {
          // Extract JSON between ```json and ``` tags
          const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
          if (!jsonMatch) {
            console.error('AI Response: No JSON block found between ```json tags');
            return { isValid: false, reason: 'AI response format error: No JSON block found', confidence: 0, extractedData: null };
          }
          
          const parsed = JSON.parse(jsonMatch[1]);
          
          // Strict schema validation
          if (!parsed.verification || typeof parsed.verification.isValid !== 'boolean' || !parsed.verification.reason) {
            console.error('AI Response: Missing or invalid verification object:', parsed);
            return { isValid: false, reason: 'AI response schema error: Invalid verification object', confidence: 0, extractedData: null };
          }

          if (!parsed.extractedFields) {
            console.error('AI Response: Missing extractedFields object:', parsed);
            return { isValid: false, reason: 'AI response schema error: Missing extractedFields', confidence: 0, extractedData: null };
          }

          if (typeof parsed.confidence !== 'number' || parsed.confidence < 0 || parsed.confidence > 1) {
            console.error('AI Response: Invalid confidence value:', parsed.confidence);
            return { isValid: false, reason: 'AI response schema error: Invalid confidence value', confidence: 0, extractedData: null };
          }

          return {
            isValid: parsed.verification.isValid,
            reason: parsed.verification.reason,
            confidence: parsed.confidence,
            extractedData: parsed.extractedFields
          };

    } catch (error) {
      console.error('Error parsing AI response:', error);
      return { isValid: false, reason: 'Failed to parse AI response as JSON.', confidence: 0, extractedData: null };
    }
  }
} 