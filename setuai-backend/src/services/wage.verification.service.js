import prisma from './database.service.js';
import { GoogleGenAI } from '@google/genai';
import pkg from 'xlsx';
const { readFile, utils } = pkg;
import * as fs from 'fs';
import path from 'path';

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export class WageVerificationService {
  constructor() {
    // No need to store model instance, we'll use ai.models directly
  }

  /**
   * Process uploaded wage file and extract data
   */
  async processWageFile(filePath, originalFilename) {
    try {
      console.log('Processing wage file:', originalFilename);
      console.log('File path:', filePath);
      
      const fileExtension = path.extname(originalFilename).toLowerCase();
      console.log('File extension:', fileExtension);
      
      let wageData = [];

      if (fileExtension === '.csv') {
        console.log('Parsing CSV file...');
        wageData = await this.parseCSV(filePath);
      } else if (fileExtension === '.xlsx' || fileExtension === '.xls') {
        console.log('Parsing Excel file...');
        wageData = await this.parseExcel(filePath);
      } else {
        throw new Error('Unsupported file format. Please upload CSV or Excel files only.');
      }

      console.log('Parsed wage data length:', wageData.length);
      console.log('First few records:', wageData.slice(0, 2));

      return wageData;
    } catch (error) {
      console.error('Error processing wage file:', error);
      throw error;
    }
  }

  /**
   * Parse CSV file
   */
  async parseCSV(filePath) {
    try {
      const workbook = readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = utils.sheet_to_json(worksheet, { header: 1 });
      
      // Remove header row and convert to objects
      const headers = data[0];
      const rows = data.slice(1);
      
      return rows.map((row, index) => {
        const obj = {};
        headers.forEach((header, i) => {
          obj[header] = row[i];
        });
        obj.rowNumber = index + 2; // +2 because we removed header and arrays are 0-indexed
        return obj;
      });
    } catch (error) {
      console.error('Error parsing CSV:', error);
      throw error;
    }
  }

  /**
   * Parse Excel file
   */
  async parseExcel(filePath) {
    try {
      const workbook = readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = utils.sheet_to_json(worksheet, { header: 1 });
      
      // Remove header row and convert to objects
      const headers = data[0];
      const rows = data.slice(1);
      
      return rows.map((row, index) => {
        const obj = {};
        headers.forEach((header, i) => {
          obj[header] = row[i];
        });
        obj.rowNumber = index + 2; // +2 because we removed header and arrays are 0-indexed
        return obj;
      });
    } catch (error) {
      console.error('Error parsing Excel:', error);
      throw error;
    }
  }

  /**
   * Analyze wage data using Gemini AI
   */
  async analyzeWageData(wageData) {
    try {
      // Check if API key is available
      if (!process.env.GEMINI_API_KEY) {
        throw new Error('Gemini API key not configured');
      }

      const prompt = `
        CRITICAL: You are a wage compliance auditor. Your job is to detect ANY discrepancies in wage data. Be extremely thorough and strict.

        Analyze the following wage data for compliance issues and discrepancies. You MUST flag ANY discrepancy found, no matter how small.

        CRITICAL RULE: If the wage data is empty or contains no valid worker records, you MUST reject the file immediately.

        Focus on:
        1. Overtime pay calculations (overtime pay should equal overtime hours × overtime rate)
        2. Base wage compliance with minimum wage standards (check if base wage is reasonable)
        3. Missing or inconsistent data
        4. Duplicate entries
        5. Mathematical errors in calculations
        6. Inconsistent overtime rates
        7. Unusual wage patterns
        8. Missing required fields

        IMPORTANT RULES:
        - If the wage data array is empty or has no valid records, flag it as EMPTY_FILE and set totalDiscrepancies to 999
        - If overtime pay ≠ (overtime hours × overtime rate), flag it as OVERTIME_PAY_CALCULATION_ERROR
        - If base wage seems too low, flag it as BASE_WAGE_BELOW_MINIMUM
        - If any field is missing or empty, flag it as MISSING_DATA
        - If overtime hours > 0 but overtime pay = 0, flag it as MISSING_OVERTIME_PAY
        - If overtime pay > 0 but overtime hours = 0, flag it as INCONSISTENT_OVERTIME_DATA
        - If total wage ≠ (base wage + overtime pay), flag it as TOTAL_WAGE_CALCULATION_ERROR
        - rowNumber must always be a number (integer) or null, never a string

        Wage Data:
        ${JSON.stringify(wageData, null, 2)}

        Please provide a detailed analysis in the following JSON format:
        {
          "summary": "Overall assessment of the wage data - be specific about what issues were found",
          "confidenceScore": 0.85,
          "totalWorkers": 50,
          "totalDiscrepancies": 5,
          "discrepancies": [
            {
              "workerId": "EMP001",
              "workerName": "John Doe",
              "discrepancyType": "OVERTIME_PAY_CALCULATION_ERROR",
              "description": "Overtime pay (1200) does not match calculated amount (15 hours × 100 rate = 1500)",
              "severity": "HIGH",
              "expectedValue": 1500.00,
              "actualValue": 1200.00,
              "rowNumber": 3
            }
          ],
          "wageRecords": [
            {
              "workerId": "EMP001",
              "workerName": "John Doe",
              "department": "Production",
              "position": "Worker",
              "baseWage": 8000.00,
              "overtimeWage": 100.00,
              "overtimeHours": 15.0,
              "overtimePay": 1200.00,
              "totalWage": 9200.00,
              "calculatedOvertimePay": 1500.00,
              "discrepancy": true,
              "discrepancyReason": "Overtime pay calculation error: should be 1500 but is 1200"
            }
          ]
        }

        Discrepancy types: EMPTY_FILE, OVERTIME_PAY_CALCULATION_ERROR, BASE_WAGE_BELOW_MINIMUM, MISSING_DATA, MISSING_OVERTIME_PAY, INCONSISTENT_OVERTIME_DATA, TOTAL_WAGE_CALCULATION_ERROR, DUPLICATE_ENTRIES, INVALID_DATA_FORMAT, OTHER
        Severity levels: LOW, MEDIUM, HIGH, CRITICAL

        REMEMBER: 
        - Flag ANY discrepancy you find, no matter how small
        - If the file is empty or has no valid data, set totalDiscrepancies to 999 and totalWorkers to 0
        - It's better to be overly cautious than to miss compliance issues
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });

      const text = response.text;
      
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse AI response');
      }

      const analysis = JSON.parse(jsonMatch[0]);
      return analysis;
    } catch (error) {
      console.error('Error analyzing wage data:', error);
      
      // If Gemini API fails, provide a fallback analysis
      if (error.message.includes('fetch failed') || error.message.includes('network') || error.message.includes('timeout')) {
        console.log('Gemini API unavailable, using fallback analysis');
        return this.fallbackAnalysis(wageData);
      }
      
      throw error;
    }
  }

  /**
   * Helper function to convert values to string for database storage
   */
  convertValueToString(value) {
    if (value === null || value === undefined) {
      return null;
    }
    if (typeof value === 'number') {
      return value.toString();
    }
    if (typeof value === 'string') {
      return value;
    }
    return String(value);
  }

  /**
   * Helper function to convert rowNumber to integer for database storage
   */
  convertRowNumberToInt(rowNumber) {
    if (rowNumber === null || rowNumber === undefined) {
      return null;
    }
    if (typeof rowNumber === 'number') {
      return rowNumber;
    }
    if (typeof rowNumber === 'string') {
      // Try to extract a number from the string
      const match = rowNumber.match(/\d+/);
      if (match) {
        return parseInt(match[0], 10);
      }
      // If it's a descriptive string like "N/A (affects entire file)", return null
      return null;
    }
    return null;
  }

  /**
   * Fallback analysis when Gemini API is unavailable
   */
  fallbackAnalysis(wageData) {
    const discrepancies = [];
    const wageRecords = [];
    
          // Check if file is empty
      if (!wageData || wageData.length === 0) {
        discrepancies.push({
          workerId: 'N/A',
          workerName: 'N/A',
          discrepancyType: 'EMPTY_FILE',
          description: 'No wage data found in the uploaded file. The file appears to be empty or contains no valid worker records.',
          severity: 'CRITICAL',
          expectedValue: 'Valid wage data with worker records',
          actualValue: 'Empty file',
          rowNumber: null
        });
      
      return {
        summary: 'File rejected: No wage data was provided for analysis. The uploaded file is empty or contains no valid worker records.',
        confidenceScore: 0.0,
        totalWorkers: 0,
        totalDiscrepancies: 999, // High number to ensure rejection
        discrepancies,
        wageRecords
      };
    }
    
    wageData.forEach((record, index) => {
      const rowNumber = index + 2;
      let hasDiscrepancy = false;
      let discrepancyReason = '';
      
      // Basic validation checks
      if (!record.baseWage || record.baseWage <= 0) {
        discrepancies.push({
          workerId: record.workerId || `EMP${index + 1}`,
          workerName: record.workerName || `Worker ${index + 1}`,
          discrepancyType: 'BASE_WAGE_BELOW_MINIMUM',
          description: 'Base wage is missing or invalid',
          severity: 'HIGH',
          expectedValue: 'Valid base wage',
          actualValue: record.baseWage || 'Missing',
          rowNumber
        });
        hasDiscrepancy = true;
        discrepancyReason = 'Invalid base wage';
      }
      
      // Check overtime calculations
      if (record.overtimeHours && record.overtimeWage && record.overtimePay) {
        const calculatedOvertime = record.overtimeHours * record.overtimeWage;
        if (Math.abs(calculatedOvertime - record.overtimePay) > 0.01) {
          discrepancies.push({
            workerId: record.workerId || `EMP${index + 1}`,
            workerName: record.workerName || `Worker ${index + 1}`,
            discrepancyType: 'OVERTIME_PAY_CALCULATION_ERROR',
            description: `Overtime pay calculation error: expected ${calculatedOvertime}, got ${record.overtimePay}`,
            severity: 'HIGH',
            expectedValue: this.convertValueToString(calculatedOvertime),
            actualValue: this.convertValueToString(record.overtimePay),
            rowNumber
          });
          hasDiscrepancy = true;
          discrepancyReason = 'Overtime calculation error';
        }
      }
      
      wageRecords.push({
        ...record,
        rowNumber,
        discrepancy: hasDiscrepancy,
        discrepancyReason
      });
    });
    
    return {
      summary: `Fallback analysis completed. Found ${discrepancies.length} discrepancies in ${wageData.length} records.`,
      confidenceScore: 0.7,
      totalWorkers: wageData.length,
      totalDiscrepancies: discrepancies.length,
      discrepancies,
      wageRecords
    };
  }

  /**
   * Create wage verification record
   */
  async createWageVerification(vendorId, filePath, originalFilename, wageData, analysis) {
    try {
      console.log('Creating wage verification record...');
      console.log('Vendor ID:', vendorId);
      console.log('File path:', filePath);
      console.log('Original filename:', originalFilename);
      console.log('Wage data length:', wageData?.length || 0);
      console.log('Analysis summary:', analysis?.summary);
      console.log('Total workers:', analysis?.totalWorkers);
      console.log('Total discrepancies:', analysis?.totalDiscrepancies);

      const verification = await prisma.wageVerification.create({
        data: {
          vendorId,
          fileName: path.basename(filePath),
          filePath,
          originalFilename,
          verificationStatus: 'PENDING',
          extractedData: wageData,
          verificationDetails: analysis,
          confidenceScore: analysis.confidenceScore || 0,
          totalWorkers: analysis.totalWorkers || 0,
          totalDiscrepancies: analysis.totalDiscrepancies || 0,
          verificationSummary: analysis.summary || 'Analysis completed',
        },
      });

      console.log('Wage verification record created with ID:', verification.id);

      // Create wage records
      if (analysis.wageRecords) {
        console.log('Creating wage records...');
        console.log('Number of wage records:', analysis.wageRecords.length);
        
        try {
          await prisma.wageRecord.createMany({
            data: analysis.wageRecords.map(record => ({
              wageVerificationId: verification.id,
              workerId: record.workerId,
              workerName: record.workerName,
              department: record.department,
              position: record.position,
              baseWage: record.baseWage,
              overtimeWage: record.overtimeWage,
              overtimeHours: record.overtimeHours,
              overtimePay: record.overtimePay,
              totalWage: record.totalWage,
              calculatedOvertimePay: record.calculatedOvertimePay,
              discrepancy: record.discrepancy || false,
              discrepancyReason: record.discrepancyReason,
              rowNumber: record.rowNumber,
            })),
          });
          console.log('Wage records created successfully');
        } catch (error) {
          console.error('Error creating wage records:', error);
          throw error;
        }
      }

      // Create discrepancy records
      if (analysis.discrepancies) {
        console.log('Creating discrepancy records...');
        console.log('Number of discrepancies:', analysis.discrepancies.length);
        console.log('Discrepancy types:', analysis.discrepancies.map(d => d.discrepancyType));
        
        try {
          await prisma.wageDiscrepancy.createMany({
            data: analysis.discrepancies.map(discrepancy => ({
              wageVerificationId: verification.id,
              workerId: discrepancy.workerId,
              workerName: discrepancy.workerName,
              discrepancyType: discrepancy.discrepancyType,
              description: discrepancy.description,
              severity: discrepancy.severity,
              expectedValue: this.convertValueToString(discrepancy.expectedValue),
              actualValue: this.convertValueToString(discrepancy.actualValue),
              rowNumber: this.convertRowNumberToInt(discrepancy.rowNumber),
            })),
          });
          console.log('Discrepancy records created successfully');
        } catch (error) {
          console.error('Error creating discrepancy records:', error);
          console.error('Discrepancy data that failed:', JSON.stringify(analysis.discrepancies, null, 2));
          throw error;
        }
      }

      // Calculate risk score based on discrepancies
      const riskScore = this.calculateRiskScore(analysis);
      console.log('Calculated risk score:', riskScore);
      
      // Determine verification status based on data and discrepancies
      let verificationStatus;
      const totalWorkers = analysis.totalWorkers || 0;
      const totalDiscrepancies = analysis.totalDiscrepancies || 0;
      
      console.log('Total workers:', totalWorkers);
      console.log('Total discrepancies:', totalDiscrepancies);
      console.log('Wage data length:', wageData.length);
      
      // Check if file is empty or has no valid data
      if (totalWorkers === 0 || wageData.length === 0) {
        verificationStatus = 'REJECTED';
        console.log('File rejected: Empty or no valid data');
      } else if (totalDiscrepancies === 0) {
        verificationStatus = 'VERIFIED';
        console.log('File verified: No discrepancies found');
      } else if (totalDiscrepancies <= 3) {
        verificationStatus = 'PENDING_MANUAL_REVIEW';
        console.log('File pending review: Minor discrepancies found');
      } else {
        verificationStatus = 'REJECTED';
        console.log('File rejected: Multiple discrepancies found');
      }
      
      console.log('Final verification status:', verificationStatus);
      
      // Update verification with risk score and status
      await prisma.wageVerification.update({
        where: { id: verification.id },
        data: {
          riskScore,
          verificationStatus,
          lastVerifiedAt: new Date(),
        },
      });

      console.log('Wage verification completed successfully');
      return verification;
    } catch (error) {
      console.error('Error creating wage verification:', error);
      throw error;
    }
  }

  /**
   * Calculate risk score based on analysis
   */
  calculateRiskScore(analysis) {
    const totalDiscrepancies = analysis.totalDiscrepancies || 0;
    
    // If there are any discrepancies, score should be low
    if (totalDiscrepancies > 0) {
      let score = 100;
      
      // Heavy penalty for any discrepancies
      score -= totalDiscrepancies * 20;
      
      // Additional penalties based on severity
      const criticalDiscrepancies = analysis.discrepancies?.filter(d => d.severity === 'CRITICAL').length || 0;
      score -= criticalDiscrepancies * 15;
      
      const highDiscrepancies = analysis.discrepancies?.filter(d => d.severity === 'HIGH').length || 0;
      score -= highDiscrepancies * 10;
      
      const mediumDiscrepancies = analysis.discrepancies?.filter(d => d.severity === 'MEDIUM').length || 0;
      score -= mediumDiscrepancies * 5;
      
      const lowDiscrepancies = analysis.discrepancies?.filter(d => d.severity === 'LOW').length || 0;
      score -= lowDiscrepancies * 2;
      
      // Ensure score doesn't go below 0
      return Math.max(0, score);
    } else {
      // No discrepancies = perfect score
      return 100;
    }
  }

  /**
   * Get wage verification by ID
   */
  async getWageVerification(verificationId) {
    try {
      const verification = await prisma.wageVerification.findUnique({
        where: { id: verificationId },
        include: {
          wageRecords: true,
          discrepancies: true,
          history: {
            include: {
              changedByUser: {
                select: { name: true, email: true }
              }
            },
            orderBy: { timestamp: 'desc' }
          }
        }
      });

      return verification;
    } catch (error) {
      console.error('Error getting wage verification:', error);
      throw error;
    }
  }

  /**
   * Get all wage verifications for a vendor
   */
  async getVendorWageVerifications(vendorId) {
    try {
      const verifications = await prisma.wageVerification.findMany({
        where: { vendorId },
        include: {
          wageRecords: true,
          discrepancies: true,
        },
        orderBy: { createdAt: 'desc' }
      });

      return verifications;
    } catch (error) {
      console.error('Error getting vendor wage verifications:', error);
      throw error;
    }
  }

  /**
   * Update wage verification status
   */
  async updateWageVerificationStatus(verificationId, status, userId) {
    try {
      const verification = await prisma.wageVerification.findUnique({
        where: { id: verificationId }
      });

      if (!verification) {
        throw new Error('Wage verification not found');
      }

      const updatedVerification = await prisma.wageVerification.update({
        where: { id: verificationId },
        data: {
          verificationStatus: status,
          lastVerifiedAt: new Date(),
        }
      });

      // Create history record
      await prisma.wageVerificationHistory.create({
        data: {
          wageVerificationId: verificationId,
          action: 'STATUS_CHANGE',
          details: `Status changed from ${verification.verificationStatus} to ${status}`,
          previousStatus: verification.verificationStatus,
          newStatus: status,
          changedByUserId: userId,
        }
      });

      return updatedVerification;
    } catch (error) {
      console.error('Error updating wage verification status:', error);
      throw error;
    }
  }
}

export default new WageVerificationService(); 