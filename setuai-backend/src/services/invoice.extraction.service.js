import { GoogleGenAI } from '@google/genai';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

export default class InvoiceExtractionService {
  constructor() {
    // Initialize the service
  }

  async extractInvoiceData(imageBuffer, mimeType, vendorId) {
    try {
      console.log('🔵 [INVOICE_DEBUG] Starting invoice extraction for vendor:', vendorId);
      
      // Convert image buffer to base64
      const base64Image = imageBuffer.toString('base64');
      
      // Extract text using OCR first
      const ocrText = await this.performOCR(base64Image, mimeType);
      console.log('🔵 [INVOICE_DEBUG] OCR text extracted:', ocrText.substring(0, 200) + '...');
      
      // Use Gemini to analyze and extract structured data
      const extractedData = await this.analyzeInvoiceWithGemini(ocrText, base64Image, mimeType);
      
      // Validate and enhance the extracted data
      const validatedData = await this.validateAndEnhanceData(extractedData, vendorId);
      
      console.log('🔵 [INVOICE_DEBUG] Invoice extraction completed successfully');
      return validatedData;
      
    } catch (error) {
      console.error('🔴 [INVOICE_DEBUG] Error in invoice extraction:', error);
      throw new Error(`Invoice extraction failed: ${error.message}`);
    }
  }

  async performOCR(base64Image, mimeType) {
    try {
      // Use Gemini's vision capabilities for OCR
      const model = ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: "Extract all text from this invoice image. Return only the raw text content without any formatting or analysis. Focus on extracting all visible text including numbers, dates, amounts, and any other text elements."
              },
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Image
                }
              }
            ]
          }
        ]
      });

      const response = await model;
      return response.text || '';
      
    } catch (error) {
      console.error('🔴 [INVOICE_DEBUG] OCR error:', error);
      throw new Error(`OCR processing failed: ${error.message}`);
    }
  }

  async analyzeInvoiceWithGemini(ocrText, base64Image, mimeType) {
    try {
      const prompt = this.buildInvoiceAnalysisPrompt(ocrText);
      
      const model = ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: prompt
              },
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Image
                }
              }
            ]
          }
        ]
      });

      const response = await model;
      const content = response.text;
      
      console.log('🔵 [INVOICE_DEBUG] Gemini analysis response:', content.substring(0, 200) + '...');
      
      return this.parseInvoiceResponse(content);
      
    } catch (error) {
      console.error('🔴 [INVOICE_DEBUG] Gemini analysis error:', error);
      throw new Error(`Invoice analysis failed: ${error.message}`);
    }
  }

  buildInvoiceAnalysisPrompt(ocrText) {
    return `Analyze this invoice image and extract all relevant information.

CRITICAL: You MUST wrap your entire response in \`\`\`json and \`\`\` tags and follow this EXACT schema:
{
  "verification": {
    "isValid": boolean,
    "isAuthentic": boolean,
    "reason": "string explaining verification result",
    "authenticityScore": number between 0 and 1,
    "redFlags": ["array of suspicious indicators"],
    "authenticityChecks": {
      "formatConsistency": boolean,
      "logoAuthenticity": boolean,
      "numberingPattern": boolean,
      "taxCalculation": boolean,
      "contactInfo": boolean,
      "professionalLayout": boolean
    }
  },
  "invoice": {
    "invoiceNumber": "string",
    "invoiceDate": "string (DD/MM/YYYY format only)",
    "dueDate": "string (DD/MM/YYYY format only) or null",
    "vendorName": "string",
    "vendorAddress": "string",
    "vendorGstin": "string or null",
    "vendorPhone": "string or null",
    "vendorEmail": "string or null",
    "buyerName": "string",
    "buyerAddress": "string",
    "buyerGstin": "string or null",
    "buyerPhone": "string or null",
    "buyerEmail": "string or null",
    "currency": "string (default: INR)",
    "subtotal": "number",
    "taxAmount": "number",
    "totalAmount": "number",
    "paymentTerms": "string or null",
    "paymentMethod": "string or null",
    "notes": "string or null"
  },
  "items": [
    {
      "description": "string",
      "quantity": "number",
      "unit": "string",
      "unitPrice": "number",
      "totalPrice": "number",
      "taxRate": "number or null",
      "taxAmount": "number or null"
    }
  ],
  "confidence": "number between 0 and 1",
  "extractionQuality": "string (HIGH/MEDIUM/LOW)",
  "missingFields": ["array of missing field names"],
  "warnings": ["array of warning messages"]
}

OCR Text to analyze:
${ocrText}

IMPORTANT INSTRUCTIONS:
1. Extract ALL line items from the invoice
2. Calculate totals accurately
3. Identify tax breakdowns (CGST, SGST, IGST)
4. Extract vendor and buyer details completely
5. Handle different invoice formats and layouts
6. Provide confidence score based on clarity and completeness
7. List any missing or unclear fields
8. Include warnings for any data quality issues
9. ALWAYS format dates as DD/MM/YYYY (e.g., "30/06/2017")
10. Ensure all monetary values are numbers (not strings)
11. Extract complete addresses including city, state, and PIN code

AUTHENTICITY VERIFICATION:
- Check for professional formatting and layout
- Verify GSTIN format (15 characters for Indian businesses)
- Validate tax calculations (GST rates: 5%, 12%, 18%, 28%)
- Check for consistent numbering patterns
- Verify contact information completeness
- Look for official letterhead and branding
- Validate date formats and logical dates
- Check for mathematical consistency in calculations

RED FLAGS TO DETECT:
- Inconsistent formatting or poor layout
- Invalid GSTIN format
- Incorrect tax calculations
- Missing essential business information
- Suspicious numbering patterns
- Unrealistic amounts or quantities
- Missing or invalid contact details
- Poor image quality or obvious editing
- Inconsistent fonts or styling
- Missing official letterhead or branding

Return the response in the exact JSON format specified above.`;
  }

  parseInvoiceResponse(responseText) {
    try {
      // Extract JSON between ```json and ``` tags
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
      if (!jsonMatch) {
        console.error('🔴 [INVOICE_DEBUG] No JSON block found in response');
        throw new Error('Invalid response format: No JSON block found');
      }
      
      const parsed = JSON.parse(jsonMatch[1]);
      
      // Validate required fields
      if (!parsed.verification || typeof parsed.verification.isValid !== 'boolean' || !parsed.invoice || !parsed.items || typeof parsed.confidence !== 'number') {
        throw new Error('Invalid response schema: Missing required fields or verification fields');
      }

      return {
        verification: parsed.verification,
        invoice: parsed.invoice,
        items: parsed.items,
        confidence: parsed.confidence,
        extractionQuality: parsed.extractionQuality || 'MEDIUM',
        missingFields: parsed.missingFields || [],
        warnings: parsed.warnings || []
      };

    } catch (error) {
      console.error('🔴 [INVOICE_DEBUG] Error parsing invoice response:', error);
      throw new Error(`Failed to parse invoice response: ${error.message}`);
    }
  }

  async validateAndEnhanceData(extractedData, vendorId) {
    try {
      // Get vendor information for validation
      const vendor = await prisma.vendor.findUnique({
        where: { id: vendorId },
        select: {
          id: true,
          companyName: true,
          factoryLocation: true
        }
      });

      if (!vendor) {
        throw new Error('Vendor not found');
      }

      // Enhance and validate the extracted data
      const enhancedData = {
        ...extractedData,
        verification: {
          ...extractedData.verification,
          authenticityScore: extractedData.verification.authenticityScore || 0.5, // Default to 0.5 if not provided
          redFlags: extractedData.verification.redFlags || [],
          authenticityChecks: {
            formatConsistency: extractedData.verification.authenticityChecks?.formatConsistency || false,
            logoAuthenticity: extractedData.verification.authenticityChecks?.logoAuthenticity || false,
            numberingPattern: extractedData.verification.authenticityChecks?.numberingPattern || false,
            taxCalculation: extractedData.verification.authenticityChecks?.taxCalculation || false,
            contactInfo: extractedData.verification.authenticityChecks?.contactInfo || false,
            professionalLayout: extractedData.verification.authenticityChecks?.professionalLayout || false
          }
        },
        invoice: {
          ...extractedData.invoice,
          // Validate vendor information
          vendorName: extractedData.invoice.vendorName || vendor.companyName,
          vendorGstin: extractedData.invoice.vendorGstin || null, // GSTIN not stored in vendor model
          // Ensure required fields have defaults
          currency: extractedData.invoice.currency || 'INR',
          subtotal: extractedData.invoice.subtotal || 0,
          taxAmount: extractedData.invoice.taxAmount || 0,
          totalAmount: extractedData.invoice.totalAmount || 0
        },
        // Validate items
        items: extractedData.items.map(item => ({
          ...item,
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice || 0,
          totalPrice: item.totalPrice || (item.quantity * item.unitPrice)
        })),
        // Add metadata
        metadata: {
          vendorId: vendor.id,
          extractedAt: new Date().toISOString(),
          vendorValidation: {
            nameMatch: this.calculateNameSimilarity(extractedData.invoice.vendorName, vendor.companyName),
            gstinMatch: extractedData.invoice.vendorGstin ? true : false // GSTIN validation based on presence only
          }
        }
      };

      return enhancedData;

    } catch (error) {
      console.error('🔴 [INVOICE_DEBUG] Error validating data:', error);
      throw new Error(`Data validation failed: ${error.message}`);
    }
  }

  calculateNameSimilarity(name1, name2) {
    if (!name1 || !name2) return 0;
    
    const normalize = (str) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normalized1 = normalize(name1);
    const normalized2 = normalize(name2);
    
    if (normalized1 === normalized2) return 1;
    
    // Simple similarity calculation
    const longer = normalized1.length > normalized2.length ? normalized1 : normalized2;
    const shorter = normalized1.length > normalized2.length ? normalized2 : normalized1;
    
    if (longer.length === 0) return 1;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  async saveInvoiceImage(imageBuffer, mimeType, vendorId, engagementId) {
    try {
      // Generate unique filename
      const timestamp = Date.now();
      const filename = `invoice_${vendorId}_${engagementId}_${timestamp}.${mimeType.split('/')[1]}`;
      const filePath = `uploads/invoices/${filename}`;
      
      // Ensure the uploads directory exists
      const fs = await import('fs');
      const path = await import('path');
      const uploadsDir = './public/uploads/invoices';
      
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      // Save file to disk
      const fullPath = path.join('./public', filePath);
      fs.writeFileSync(fullPath, imageBuffer);
      
      // Save to database
      const invoiceImage = await prisma.invoiceImage.create({
        data: {
          filename,
          filePath,
          mimeType,
          vendorId,
          engagementId,
          uploadedAt: new Date()
        }
      });

      console.log('🔵 [INVOICE_DEBUG] Invoice image saved:', invoiceImage.id);
      return invoiceImage;

    } catch (error) {
      console.error('🔴 [INVOICE_DEBUG] Error saving invoice image:', error);
      throw new Error(`Failed to save invoice image: ${error.message}`);
    }
  }

  async createInvoiceRecord(extractedData, invoiceImageId, engagementId) {
    try {
      // Parse and validate dates
      const parseDate = (dateString) => {
        if (!dateString) return null;
        
        // Try different date formats
        const dateFormats = [
          'YYYY-MM-DD',
          'DD/MM/YYYY',
          'MM/DD/YYYY',
          'DD-MM-YYYY',
          'MM-DD-YYYY',
          'YYYY/MM/DD'
        ];
        
        for (const format of dateFormats) {
          try {
            // Simple date parsing for common formats
            if (format === 'YYYY-MM-DD') {
              const date = new Date(dateString);
              if (!isNaN(date.getTime())) return date;
            } else if (format === 'DD/MM/YYYY') {
              const [day, month, year] = dateString.split('/');
              const date = new Date(year, month - 1, day);
              if (!isNaN(date.getTime())) return date;
            } else if (format === 'MM/DD/YYYY') {
              const [month, day, year] = dateString.split('/');
              const date = new Date(year, month - 1, day);
              if (!isNaN(date.getTime())) return date;
            } else if (format === 'DD-MM-YYYY') {
              const [day, month, year] = dateString.split('-');
              const date = new Date(year, month - 1, day);
              if (!isNaN(date.getTime())) return date;
            } else if (format === 'MM-DD-YYYY') {
              const [month, day, year] = dateString.split('-');
              const date = new Date(year, month - 1, day);
              if (!isNaN(date.getTime())) return date;
            } else if (format === 'YYYY/MM/DD') {
              const [year, month, day] = dateString.split('/');
              const date = new Date(year, month - 1, day);
              if (!isNaN(date.getTime())) return date;
            }
          } catch (error) {
            continue;
          }
        }
        
        // If no format works, try the default Date constructor
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) return date;
        
        // If all else fails, return current date
        console.warn('🔶 [INVOICE_DEBUG] Could not parse date:', dateString, 'using current date');
        return new Date();
      };

      console.log('🔵 [INVOICE_DEBUG] Raw invoice date:', extractedData.invoice.invoiceDate);
      console.log('🔵 [INVOICE_DEBUG] Raw due date:', extractedData.invoice.dueDate);
      
      const invoiceDate = parseDate(extractedData.invoice.invoiceDate);
      const dueDate = parseDate(extractedData.invoice.dueDate);
      
      console.log('🔵 [INVOICE_DEBUG] Parsed invoice date:', invoiceDate);
      console.log('🔵 [INVOICE_DEBUG] Parsed due date:', dueDate);

      // Validate required fields
      if (!extractedData.invoice.invoiceNumber) {
        throw new Error('Invoice number is required');
      }

      // Create invoice record
      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber: extractedData.invoice.invoiceNumber || 'INV-' + Date.now(),
          invoiceDate: invoiceDate,
          dueDate: dueDate,
          vendorName: extractedData.invoice.vendorName,
          vendorAddress: extractedData.invoice.vendorAddress,
          vendorGstin: extractedData.invoice.vendorGstin,
          vendorPhone: extractedData.invoice.vendorPhone,
          vendorEmail: extractedData.invoice.vendorEmail,
          buyerName: extractedData.invoice.buyerName,
          buyerAddress: extractedData.invoice.buyerAddress,
          buyerGstin: extractedData.invoice.buyerGstin,
          buyerPhone: extractedData.invoice.buyerPhone,
          buyerEmail: extractedData.invoice.buyerEmail,
          currency: extractedData.invoice.currency,
          subtotal: extractedData.invoice.subtotal,
          taxAmount: extractedData.invoice.taxAmount,
          totalAmount: extractedData.invoice.totalAmount,
          paymentTerms: extractedData.invoice.paymentTerms,
          paymentMethod: extractedData.invoice.paymentMethod,
          notes: extractedData.invoice.notes,
          confidence: extractedData.confidence,
          extractionQuality: extractedData.extractionQuality,
          missingFields: extractedData.missingFields,
          warnings: extractedData.warnings,
          verificationStatus: extractedData.verification.isValid && extractedData.verification.isAuthentic ? 'VERIFIED' : 'REJECTED',
          invoiceImageId,
          engagementId,
          createdAt: new Date()
        }
      });

      // Create invoice items
      const invoiceItems = await Promise.all(
        extractedData.items.map(item =>
          prisma.invoiceItem.create({
            data: {
              invoiceId: invoice.id,
              description: item.description,
              quantity: item.quantity,
              unit: item.unit,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              taxRate: item.taxRate,
              taxAmount: item.taxAmount
            }
          })
        )
      );

      console.log('🔵 [INVOICE_DEBUG] Invoice record created:', invoice.id);
      return { invoice, items: invoiceItems };

    } catch (error) {
      console.error('🔴 [INVOICE_DEBUG] Error creating invoice record:', error);
      throw new Error(`Failed to create invoice record: ${error.message}`);
    }
  }

  async processInvoiceUpload(imageBuffer, mimeType, vendorId, engagementId) {
    try {
      console.log('🔵 [INVOICE_DEBUG] Starting complete invoice processing');
      
      // Extract invoice data
      const extractedData = await this.extractInvoiceData(imageBuffer, mimeType, vendorId);
      
      // Validate extracted data meets minimum requirements
      if (!extractedData.invoice.invoiceNumber || !extractedData.invoice.invoiceDate) {
        throw new Error('Invoice extraction failed: Missing required fields (invoice number or date)');
      }
      
      if (!extractedData.invoice.vendorName || !extractedData.invoice.buyerName) {
        throw new Error('Invoice extraction failed: Missing vendor or buyer information');
      }
      
      if (!extractedData.invoice.totalAmount || extractedData.invoice.totalAmount <= 0) {
        throw new Error('Invoice extraction failed: Invalid or missing total amount');
      }
      
      // Save invoice image
      const invoiceImage = await this.saveInvoiceImage(imageBuffer, mimeType, vendorId, engagementId);
      
      // Create invoice record
      const invoiceRecord = await this.createInvoiceRecord(extractedData, invoiceImage.id, engagementId);
      
      console.log('🔵 [INVOICE_DEBUG] Invoice processing completed successfully');
      console.log('🔵 [INVOICE_DEBUG] Verification data:', extractedData.verification);
      
      return {
        success: true,
        data: {
          invoice: invoiceRecord.invoice,
          items: invoiceRecord.items,
          image: invoiceImage,
          extraction: {
            confidence: extractedData.confidence,
            quality: extractedData.extractionQuality,
            missingFields: extractedData.missingFields,
            warnings: extractedData.warnings,
            verification: extractedData.verification
          }
        }
      };

    } catch (error) {
      console.error('🔴 [INVOICE_DEBUG] Error in invoice processing:', error);
      throw new Error(`Invoice processing failed: ${error.message}`);
    }
  }
} 