import vision from '@google-cloud/vision';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default class BaseStrategy {
  constructor(documentType) {
    this.documentType = documentType;
    
    // Get the key file path from environment or use default
    const keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(process.cwd(), 'solid-mountain-432007-m8-f0e24df43ad8.json');
    
    this.client = new vision.ImageAnnotatorClient({
      keyFilename: keyFilename,
    });

    this.referenceImagePath = null;

    // Define required keywords/phrases for each document type
    this.documentTypeValidators = {
      'gstin': {
        required: ['GOODS AND SERVICES TAX', 'CERTIFICATE OF REGISTRATION', 'GSTIN', 'Form GST REG-06', 'Government of India', 'Central Board of Indirect Taxes'],
        anyOf: ['Tax Period', 'Principal Place of Business', 'Legal Name', 'Trade Name'],
        patterns: [/[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]/] // 15-digit GSTIN pattern
      },
      'incorporation': {
        required: ['CERTIFICATE OF INCORPORATION', 'REGISTRAR OF COMPANIES', 'Corporate Identity Number', 'CIN', 'Companies Act'],
        anyOf: ['Private Limited', 'Public Limited', 'Date of Incorporation'],
        patterns: [/[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}/] // 21-char CIN pattern
      },
      'factory': {
        required: ['FACTORY LICENSE', 'Form 4', 'Factories Act', 'Directorate of Industrial Safety', 'Government of Tamil Nadu'],
        anyOf: ['Maximum Workers', 'Installed Power', 'License Number', 'Renewal'],
        patterns: [/TN\/[0-9]{4,6}\/[0-9]{4}/] // License number pattern
      },
      'esic': {
        required: ['EMPLOYEES\' STATE INSURANCE CORPORATION', 'REGISTRATION CERTIFICATE', 'Form C-11', 'ESIC', 'Employer Code'],
        anyOf: ['Coverage', 'Contribution', 'Medical Benefit', 'Cash Benefit'],
        patterns: [/[0-9]{2}[0-9]{6}[0-9]{3}/] // ESIC code pattern
      },
      'epf-registration': {
        required: ['EMPLOYEES\' PROVIDENT FUND', 'REGISTRATION', 'EPFO', 'PF Code', 'Establishment Code'],
        anyOf: ['Provident Fund Act', 'PAN', 'Coverage Date'],
        patterns: [/[A-Z]{2}\/[A-Z]{3}\/[0-9]{7}\/[0-9]{3}/] // EPF code pattern
      },
      'epf-challan': {
        required: ['ECR', 'Electronic Challenge cum Response', 'TRRN', 'Transaction Reference', 'Challan'],
        anyOf: ['Monthly Contribution', 'Employee Share', 'Employer Share', 'Pension Fund']
      },
      'form-22': {
        required: ['FORM 22', 'ANNUAL RETURN', 'Factories Act', 'Abstract of Returns'],
        anyOf: ['Working Days', 'Daily Average', 'Accidents', 'Prosecutions']
      },
      'tnpcb': {
        required: ['TAMIL NADU POLLUTION CONTROL BOARD', 'CONSENT TO OPERATE', 'TNPCB', 'Water Act', 'Air Act'],
        anyOf: ['Effluent', 'Emission', 'Environmental Clearance', 'Consent Order'],
        patterns: [/COR\/TN\/[0-9]{6}/] // Consent order pattern
      },
      'fire-noc': {
        required: ['FIRE NOC', 'NO OBJECTION CERTIFICATE', 'FIRE SAFETY', 'Tamil Nadu Fire', 'TNFRS'],
        anyOf: ['Fire Prevention', 'Fire Fighting', 'Building Classification', 'Fire Officer']
      },
      'hazardous-waste': {
        required: ['HAZARDOUS WASTE', 'AUTHORIZATION', 'Form 1', 'Form 4', 'HWM Rules'],
        anyOf: ['Generation', 'Storage', 'Treatment', 'Disposal']
      },
      'iso-9001': {
        required: ['ISO 9001', 'QUALITY MANAGEMENT', 'CERTIFICATE', 'International Organization for Standardization'],
        anyOf: ['Scope of Certification', 'Certification Body', 'Accreditation', 'Management System']
      },
      'iso-14001': {
        required: ['ISO 14001', 'ENVIRONMENTAL MANAGEMENT', 'CERTIFICATE'],
        anyOf: ['Environmental Policy', 'EMS', 'Continual Improvement']
      },
      'iso-45001': {
        required: ['ISO 45001', 'OCCUPATIONAL HEALTH', 'SAFETY MANAGEMENT', 'CERTIFICATE'],
        anyOf: ['OH&S', 'Worker Participation', 'Hazard Identification']
      },
      'oeko-tex': {
        required: ['OEKO-TEX', 'STANDARD 100', 'CERTIFICATE', 'CONFIDENCE IN TEXTILES'],
        anyOf: ['Product Class', 'Test Institute', 'Ecology', 'Human Health']
      },
      'gots': {
        required: ['GOTS', 'GLOBAL ORGANIC TEXTILE STANDARD', 'CERTIFICATE', 'ORGANIC'],
        anyOf: ['Transaction Certificate', 'Scope Certificate', 'Organic Cotton', 'Processing Categories']
      },
      'aadhaar': {
        required: ['AADHAAR', 'UNIQUE IDENTIFICATION', 'UIDAI', 'Government of India'],
        anyOf: ['Date of Birth', 'Address'],
        patterns: [/[0-9]{4}\s[0-9]{4}\s[0-9]{4}/] // 12-digit Aadhaar pattern
      },
      'birth-certificate': {
        required: ['BIRTH CERTIFICATE', 'CERTIFICATE OF BIRTH', 'REGISTRAR', 'Birth Registration'],
        anyOf: ['Date of Birth', 'Place of Birth', 'Parents', 'Registration Number']
      }
    };
  }

  /**
   * Validates that the document is of the correct type by checking for required keywords and patterns
   * @param {string} ocrText - The extracted text from the document
   * @returns {Object} Validation result with isValid and reason
   */
  validateDocumentType(ocrText) {
    const validator = this.documentTypeValidators[this.documentType.toLowerCase()];
    if (!validator) {
      console.log('BaseStrategy: No validator defined for document type:', this.documentType);
      return { isValid: false, reason: 'No document type validator defined' };
    }

    console.log('BaseStrategy: Validating document type using keywords and patterns');
    console.log('- Required keywords:', validator.required);
    console.log('- Any of keywords:', validator.anyOf);
    if (validator.patterns) {
      console.log('- Patterns to match:', validator.patterns.map(p => p.toString()));
    }

    // Convert text to uppercase for case-insensitive matching of keywords
    const upperText = ocrText.toUpperCase();
    
    // Check required keywords (all must be present)
    const missingRequired = validator.required.filter(keyword => 
      !upperText.includes(keyword.toUpperCase())
    );

    if (missingRequired.length > 0) {
      console.log('BaseStrategy: Missing required keywords:', missingRequired);
      return {
        isValid: false,
        reason: `Document appears to be incorrect. Missing required keywords: ${missingRequired.join(', ')}`
      };
    }

    // Check anyOf keywords (at least one must be present)
    const hasAnyRequired = validator.anyOf.some(keyword => 
      upperText.includes(keyword.toUpperCase())
    );

    if (!hasAnyRequired) {
      console.log('BaseStrategy: Missing any of required keywords:', validator.anyOf);
      return {
        isValid: false,
        reason: `Document appears to be incorrect. Must contain at least one of: ${validator.anyOf.join(', ')}`
      };
    }

    // Check patterns if they exist
    if (validator.patterns && validator.patterns.length > 0) {
      const hasValidPattern = validator.patterns.some(pattern => pattern.test(ocrText));
      if (!hasValidPattern) {
        console.log('BaseStrategy: No matching pattern found in document');
        return {
          isValid: false,
          reason: `Document appears to be incorrect. Required format not found.`
        };
      }
    }

    console.log('BaseStrategy: Document type validation passed');
    return { 
      isValid: true,
      details: {
        matchedKeywords: validator.required.filter(keyword => 
          upperText.includes(keyword.toUpperCase())
        ),
        matchedSecondaryKeywords: validator.anyOf.filter(keyword => 
          upperText.includes(keyword.toUpperCase())
        ),
        patternsChecked: validator.patterns ? validator.patterns.length : 0
      }
    };
  }

  async initialize() {
    try {
      const referenceDir = path.join(__dirname, '../../../public/reference_docs');
      const possibleNames = [
        `${this.documentType.toLowerCase().replace(/\s+/g, '-')}.jpg`,
        `${this.documentType.toLowerCase().replace(/\s+/g, '-')}.png`,
        `${this.documentType.toLowerCase().replace(/\s+/g, '_')}.jpg`,
        `${this.documentType.toLowerCase().replace(/\s+/g, '_')}.png`
      ];

      for (const name of possibleNames) {
        const fullPath = path.join(referenceDir, name);
        try {
          await fs.access(fullPath);
          this.referenceImagePath = fullPath;
          console.log('BaseStrategy: Found reference image at', this.referenceImagePath);
          break;
        } catch (err) {
          // Continue to next possible name
        }
      }

      if (!this.referenceImagePath) {
        console.log('BaseStrategy: No reference image found for', this.documentType);
      }
    } catch (error) {
      console.error('BaseStrategy: Error initializing reference image:', error);
    }
  }

  async resolveFilePath(filePath) {
    try {
      // If path is already absolute and file exists, use it.
      if (path.isAbsolute(filePath)) {
        try {
          await fs.access(filePath);
          console.log('BaseStrategy: Provided path is absolute and file exists.', filePath);
          return filePath;
        } catch (err) {
          // It's an absolute path but doesn't exist, this might be an error or
          // it could be a web-style path like '/uploads/...'
          console.log('BaseStrategy: Absolute path provided but file not found, will attempt to resolve relative to project.', filePath);
        }
      }

      // Handle web-style root-relative paths (e.g., '/uploads/...')
      const relativePath = filePath.startsWith('/') ? filePath.substring(1) : filePath;

      const possiblePaths = [
        path.join(process.cwd(), 'public', relativePath),
        path.join(process.cwd(), relativePath)
      ];

      console.log('BaseStrategy: Attempting to resolve file from possible paths:', possiblePaths);

      for (const p of possiblePaths) {
        try {
          await fs.access(p);
          console.log('BaseStrategy: Found file at:', p);
          return p;
        } catch (err) {
          // Suppress error and try next path
        }
      }

      throw new Error(`File not found. Attempted paths: ${possiblePaths.join(', ')}`);
    } catch (err) {
      console.error('BaseStrategy: Error resolving file path:', err);
      throw new Error(`Failed to resolve file path for "${filePath}": ${err.message}`);
    }
  }

  async compareWithReference(uploadedImagePath) {
    try {
      if (!this.referenceImagePath) {
        await this.initialize();
      }

      if (!this.referenceImagePath) {
        throw new Error(`No reference image found for ${this.documentType} document type`);
      }

      // Resolve the uploaded image path
      const absoluteUploadedPath = await this.resolveFilePath(uploadedImagePath);

      console.log('BaseStrategy: Comparing documents');
      console.log('- Uploaded image (relative):', uploadedImagePath);
      console.log('- Uploaded image (absolute):', absoluteUploadedPath);
      console.log('- Reference image:', this.referenceImagePath);

      // Get document text detection for both images
      const [uploadedResult] = await this.client.documentTextDetection(absoluteUploadedPath);
      const [referenceResult] = await this.client.documentTextDetection(this.referenceImagePath);

      const uploadedDoc = uploadedResult.fullTextAnnotation;
      const referenceDoc = referenceResult.fullTextAnnotation;

      if (!uploadedDoc || !referenceDoc) {
        throw new Error('Failed to detect text in one or both documents');
      }

      // Compare document structure
      const structureSimilarity = this.compareDocumentStructure(
        uploadedDoc,
        referenceDoc
      );

      // Compare text layout
      const layoutSimilarity = this.compareTextLayout(
        uploadedDoc.pages[0],
        referenceDoc.pages[0]
      );

      // Calculate overall similarity score (weighted average)
      const similarity = (structureSimilarity * 0.4) + (layoutSimilarity * 0.6);

      console.log('BaseStrategy: Comparison results', {
        structureSimilarity: Math.round(structureSimilarity * 100) + '%',
        layoutSimilarity: Math.round(layoutSimilarity * 100) + '%',
        overallSimilarity: Math.round(similarity * 100) + '%'
      });

      return {
        similarity,
        details: `Document similarity: ${Math.round(similarity * 100)}% (Structure: ${Math.round(structureSimilarity * 100)}%, Layout: ${Math.round(layoutSimilarity * 100)}%)`
      };
    } catch (error) {
      console.error('BaseStrategy: Error comparing documents:', error);
      return {
        similarity: 0,
        details: `Error comparing documents: ${error.message}`
      };
    }
  }

  compareDocumentStructure(doc1, doc2) {
    try {
      // Simple comparison based on text blocks and their relative positions
      const blocks1 = this.extractTextBlocks(doc1);
      const blocks2 = this.extractTextBlocks(doc2);

      // Calculate similarity based on number of blocks and their content
      const totalBlocks = Math.max(blocks1.length, blocks2.length);
      if (totalBlocks === 0) return 0;

      let matchingBlocks = 0;
      for (const block1 of blocks1) {
        for (const block2 of blocks2) {
          if (this.blocksAreSimilar(block1, block2)) {
            matchingBlocks++;
            break;
          }
        }
      }

      return matchingBlocks / totalBlocks;
    } catch (error) {
      console.error('BaseStrategy: Error in document structure comparison:', error);
      return 0;
    }
  }

  compareTextLayout(page1, page2) {
    try {
      // Compare text blocks and their positions
      const blocks1 = page1.blocks || [];
      const blocks2 = page2.blocks || [];

      const totalBlocks = Math.max(blocks1.length, blocks2.length);
      if (totalBlocks === 0) return 0;

      let matchingPositions = 0;
      for (const block1 of blocks1) {
        for (const block2 of blocks2) {
          if (this.blocksAreSimilar(block1, block2)) {
            // Check if positions are similar
            const pos1 = block1.boundingBox?.vertices || [];
            const pos2 = block2.boundingBox?.vertices || [];
            
            if (pos1.length === 4 && pos2.length === 4) {
              const similarity = this.calculatePositionSimilarity(pos1, pos2);
              if (similarity > 0.7) {
                matchingPositions++;
              }
            }
            break;
          }
        }
      }

      return matchingPositions / totalBlocks;
    } catch (error) {
      console.error('BaseStrategy: Error in text layout comparison:', error);
      return 0;
    }
  }

  extractTextBlocks(doc) {
    const blocks = [];
    if (doc.pages && doc.pages.length > 0) {
      for (const page of doc.pages) {
        if (page.blocks) {
          for (const block of page.blocks) {
            if (block.paragraphs) {
              for (const paragraph of block.paragraphs) {
                if (paragraph.words) {
                  const text = paragraph.words.map(word => word.symbols.map(s => s.text).join('')).join(' ');
                  if (text.trim()) {
                    blocks.push({
                      text: text.trim(),
                      boundingBox: block.boundingBox
                    });
                  }
                }
              }
            }
          }
        }
      }
    }
    return blocks;
  }

  blocksAreSimilar(block1, block2) {
    const text1 = block1.text.toLowerCase();
    const text2 = block2.text.toLowerCase();
    
    // Simple text similarity (can be improved with more sophisticated algorithms)
    const words1 = text1.split(/\s+/);
    const words2 = text2.split(/\s+/);
    
    const commonWords = words1.filter(word => words2.includes(word));
    const totalWords = Math.max(words1.length, words2.length);
    
    return totalWords > 0 && (commonWords.length / totalWords) > 0.5;
  }

  calculatePositionSimilarity(pos1, pos2) {
    try {
      // Calculate center points
      const center1 = {
        x: (pos1[0].x + pos1[1].x + pos1[2].x + pos1[3].x) / 4,
        y: (pos1[0].y + pos1[1].y + pos1[2].y + pos1[3].y) / 4
      };
      
      const center2 = {
        x: (pos2[0].x + pos2[1].x + pos2[2].x + pos2[3].x) / 4,
        y: (pos2[0].y + pos2[1].y + pos2[2].y + pos2[3].y) / 4
      };
      
      // Calculate distance between centers
      const distance = Math.sqrt(
        Math.pow(center1.x - center2.x, 2) + Math.pow(center1.y - center2.y, 2)
      );
      
      // Normalize by page size (assuming similar page sizes)
      const maxDistance = Math.sqrt(Math.pow(1000, 2) + Math.pow(1000, 2)); // Approximate max distance
      
      return Math.max(0, 1 - (distance / maxDistance));
    } catch (error) {
      console.error('BaseStrategy: Error calculating position similarity:', error);
      return 0;
    }
  }

  /**
   * Base verification method to be overridden by specific strategies
   * @param {string} ocrText - The OCR text from the document
   * @param {Object} document - The uploaded document record
   * @returns {Promise<Object>} - Verification result
   */
  async verify(ocrText, document) {
    throw new Error('verify() method must be implemented by subclass');
  }
} 