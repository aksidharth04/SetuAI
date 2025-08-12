import { ImageAnnotatorClient } from '@google-cloud/vision';
import { DocumentProcessorServiceClient } from '@google-cloud/documentai';
import fs from 'fs/promises';
import path from 'path';
import { fileTypeFromFile } from 'file-type';

let visionClient = null;
let documentAiClient = null;

async function getVisionClient() {
  if (visionClient) return visionClient;
  try {
    const keyFilename = path.resolve(process.cwd(), 'solid-mountain-432007-m8-b70d36f66643.json');
    console.log('OCR Service: Using Vision API key file:', keyFilename);
    await fs.access(keyFilename);
    visionClient = new ImageAnnotatorClient({
      keyFilename: keyFilename,
      projectId: 'solid-mountain-432007',
      timeout: 30000,
    });
    await visionClient.initialize();
    console.log('OCR Service: Vision API client initialized successfully');
    return visionClient;
  } catch (err) {
    console.error('OCR Service: Failed to initialize Vision API client:', err);
    throw err;
  }
}

async function getDocumentAiClient() {
  if (documentAiClient) return documentAiClient;
  try {
    const keyFilename = path.resolve(process.cwd(), 'solid-mountain-432007-m8-b70d36f66643.json');
    console.log('OCR Service: Using Document AI key file:', keyFilename);
    await fs.access(keyFilename);
    documentAiClient = new DocumentProcessorServiceClient({
      keyFilename: keyFilename,
      projectId: 'solid-mountain-432007',
    });
    console.log('OCR Service: Document AI client initialized successfully');
    return documentAiClient;
  } catch (err) {
    console.error('OCR Service: Failed to initialize Document AI client:', err);
    throw err;
  }
}

async function extractTextFromPdf(filePath) {
  try {
    console.log('OCR Service: Processing PDF:', filePath);
    const client = await getDocumentAiClient();
    
    // Read the file into memory
    const fileContent = await fs.readFile(filePath);
    
    // Convert to base64
    const encodedImage = Buffer.from(fileContent).toString('base64');
    
    // Configure the process request
    const request = {
      name: `projects/solid-mountain-432007/locations/us/processors/3ecb8d0528961f12`, // Replace with your processor ID
      rawDocument: {
        content: encodedImage,
        mimeType: 'application/pdf',
      },
    };
    
    // Process the document
    try {
      const [result] = await client.processDocument(request);
      const { document } = result;
      
      if (!document || !document.text) {
        console.warn('OCR Service: No text detected in PDF');
        throw new Error('No text detected');
      }
      
      console.log('OCR Service: Successfully extracted text from PDF, length:', document.text.length);
      console.log('OCR Service: First 100 chars of extracted text:', document.text.substring(0, 100));
      
      return document.text;
    } catch (err) {
      if (err.code === 7 && err.reason === 'CONSUMER_INVALID') {
        console.error('OCR Service: Permission denied. Please ensure:');
        console.error('1. The Document AI API is enabled in your project');
        console.error('2. The service account has the required IAM roles (roles/documentai.apiUser)');
        console.error('3. The processor ID is correct and accessible');
        throw new Error('Permission denied: Please check Document AI API access and permissions');
      }
      console.error('OCR Service: Failed to process PDF:', err);
      throw new Error(`Failed to process PDF: ${err.message}`);
    }
  } catch (err) {
    console.error('OCR Service: Failed to process PDF:', err);
    throw new Error(`Failed to process PDF: ${err.message}`);
  }
}

async function extractTextFromImage(filePath) {
  try {
    console.log('OCR Service: Processing image:', filePath);
    const client = await getVisionClient();
    
    const [result] = await client.textDetection(filePath);
    const detections = result.textAnnotations;
    
    if (!detections || detections.length === 0) {
      console.warn('OCR Service: No text detected in image');
      throw new Error('No text detected');
    }
    
    console.log('OCR Service: Successfully extracted text from image, length:', detections[0].description.length);
    console.log('OCR Service: Full extracted text from image:', detections[0].description);
    
    return detections[0].description;
  } catch (err) {
    console.error('OCR Service: Failed to process image:', err);
    throw new Error(`Failed to process image: ${err.message}`);
  }
}

async function extractTextFromFile(filePath) {
  try {
    const projectRoot = path.resolve(process.cwd());
    const absPath = path.join(projectRoot, 'public', filePath);
    console.log('OCR Service: Processing file path:', filePath);
    console.log('OCR Service: Project root:', projectRoot);
    console.log('OCR Service: Resolved absolute path:', absPath);

    try {
      await fs.access(absPath);
      console.log('OCR Service: File exists and is accessible');
    } catch (err) {
      console.error('OCR Service: File not accessible:', err);
      throw new Error(`File not accessible: ${err.message}`);
    }

    // Detect file type
    const fileType = await fileTypeFromFile(absPath);
    console.log('OCR Service: Detected file type:', fileType);

    // Process based on file type
    if (fileType?.ext === 'pdf') {
      return await extractTextFromPdf(absPath);
    } else if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'tiff'].includes(fileType?.ext)) {
      return await extractTextFromImage(absPath);
    } else {
      throw new Error(`Unsupported file type: ${fileType?.ext || 'unknown'}`);
    }
  } catch (err) {
    console.error('OCR Service Error:', err);
    throw new Error('OCR processing failed: ' + err.message);
  }
}

export { extractTextFromFile }; 