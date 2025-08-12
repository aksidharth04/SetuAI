import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const complianceDocuments = [
  // ESI & PF Coverage Pillar
  {
    name: 'EPF Registration',
    pillar: 'ESI_PF_COVERAGE',
    description: 'Employee Provident Fund Registration Certificate',
    issuingAuthority: 'EPFO',
    verificationRules: {
      minSimilarity: 0.7,
      requiredFields: ['code', 'establishment_name']
    },
    requiredKeywords: ['EMPLOYEES\' PROVIDENT FUND', 'CODE', 'ESTABLISHMENT'],
    optionalKeywords: ['REGIONAL OFFICE', 'SUB REGIONAL OFFICE', 'MINISTRY OF LABOUR'],
    validationRegex: '^[A-Z]{2}[A-Z]{3}\\d{10}$'
  },
  {
    name: 'EPF ECR Challan',
    pillar: 'ESI_PF_COVERAGE',
    description: 'Employee Provident Fund Electronic Challan Receipt',
    issuingAuthority: 'EPFO',
    verificationRules: {
      minSimilarity: 0.7,
      requiredFields: ['ecr_number', 'trrn', 'establishment_id']
    },
    requiredKeywords: ['ECR', 'CHALLAN', 'TRRN', 'ESTABLISHMENT ID'],
    optionalKeywords: ['WAGE MONTH', 'CONTRIBUTION RATE', 'TOTAL AMOUNT'],
    validationRegex: '^[A-Z]{2}[A-Z]{3}\\d{10}$'
  },
  {
    name: 'ESIC Registration',
    pillar: 'ESI_PF_COVERAGE',
    description: 'Employee State Insurance Corporation Registration Certificate',
    issuingAuthority: 'ESIC',
    verificationRules: {
      minSimilarity: 0.7,
      requiredFields: ['esic_code', 'employer_name']
    },
    requiredKeywords: ['EMPLOYEES\' STATE INSURANCE CORPORATION', 'REGISTRATION CERTIFICATE', 'CODE'],
    optionalKeywords: ['REGIONAL OFFICE', 'SUB REGIONAL OFFICE', 'DATE OF REGISTRATION'],
    validationRegex: '^\\d{2}-\\d{2}-\\d{6}-\\d{3}$'
  },

  // Factory Registration & Safety Pillar
  {
    name: 'Factory License',
    pillar: 'FACTORY_REGISTRATION_SAFETY',
    description: 'Factory License under Factories Act',
    issuingAuthority: 'State Factory Department',
    verificationRules: {
      minSimilarity: 0.7,
      requiredFields: ['license_number', 'factory_name']
    },
    requiredKeywords: ['FACTORY', 'LICENSE', 'FACTORIES ACT'],
    optionalKeywords: ['REGISTRATION NUMBER', 'VALID UNTIL', 'OCCUPIER'],
    validationRegex: '^[A-Z]{2}/[A-Z]{2,3}/\\d{4,8}$'
  },
  {
    name: 'Fire NOC',
    pillar: 'FACTORY_REGISTRATION_SAFETY',
    description: 'Fire Safety Certificate/NOC',
    issuingAuthority: 'State Fire Department',
    verificationRules: {
      minSimilarity: 0.7,
      requiredFields: ['noc_number', 'premises_address']
    },
    requiredKeywords: ['FIRE', 'NOC', 'SAFETY'],
    optionalKeywords: ['CERTIFICATE', 'VALID UNTIL', 'INSPECTION'],
    validationRegex: '^[A-Z]{2}/FIRE/\\d{4}/\\d{4,6}$'
  },

  // Environmental Compliance Pillar
  {
    name: 'TNPCB Consent',
    pillar: 'ENVIRONMENTAL',
    description: 'Tamil Nadu Pollution Control Board Consent to Operate',
    issuingAuthority: 'TNPCB',
    verificationRules: {
      minSimilarity: 0.7,
      requiredFields: ['consent_number', 'unit_name']
    },
    requiredKeywords: ['TAMIL NADU POLLUTION CONTROL BOARD', 'CONSENT', 'OPERATE'],
    optionalKeywords: ['AIR ACT', 'WATER ACT', 'VALIDITY'],
    validationRegex: '^\\d{2}/\\d{2}/[A-Z]{1,3}/\\d{4,6}$'
  },

  // Certifications Pillar
  {
    name: 'ISO 9001',
    pillar: 'FACTORY_REGISTRATION_SAFETY',
    description: 'ISO 9001 Quality Management System Certificate',
    issuingAuthority: 'ISO Certification Bodies',
    verificationRules: {
      minSimilarity: 0.7,
      requiredFields: ['certificate_number', 'scope']
    },
    requiredKeywords: ['ISO 9001', 'QUALITY MANAGEMENT SYSTEM', 'CERTIFICATE'],
    optionalKeywords: ['SCOPE', 'VALID UNTIL', 'ACCREDITED'],
    validationRegex: '^[A-Z]{2,4}9K/\\d{2}/[A-Z0-9]{4,8}$'
  },
  {
    name: 'GOTS Certificate',
    pillar: 'ENVIRONMENTAL',
    description: 'Global Organic Textile Standard Certificate',
    issuingAuthority: 'GOTS Approved Certification Bodies',
    verificationRules: {
      minSimilarity: 0.7,
      requiredFields: ['license_number', 'scope']
    },
    requiredKeywords: ['GOTS', 'ORGANIC', 'TEXTILE STANDARD'],
    optionalKeywords: ['PROCESSING', 'TRADING', 'SCOPE'],
    validationRegex: '^GOTS-[A-Z]{2,4}-\\d{6}$'
  },
  {
    name: 'OEKO-TEX Certificate',
    pillar: 'ENVIRONMENTAL',
    description: 'OEKO-TEX Standard 100 Certificate',
    issuingAuthority: 'OEKO-TEX Institutes',
    verificationRules: {
      minSimilarity: 0.7,
      requiredFields: ['certificate_number', 'product_class']
    },
    requiredKeywords: ['OEKO-TEX', 'STANDARD 100', 'CONFIDENCE IN TEXTILES'],
    optionalKeywords: ['PRODUCT CLASS', 'VALID UNTIL', 'TESTED FOR HARMFUL SUBSTANCES'],
    validationRegex: '^\\d{2}\\.\\w{2}\\.\\d{5}$'
  },
  {
    name: 'Incorporation Certificate',
    pillar: 'FACTORY_REGISTRATION_SAFETY',
    description: 'Certificate of Incorporation',
    issuingAuthority: 'Ministry of Corporate Affairs',
    verificationRules: {
      minSimilarity: 0.7,
      requiredFields: ['cin', 'company_name']
    },
    requiredKeywords: ['CERTIFICATE OF INCORPORATION', 'CIN', 'COMPANIES ACT'],
    optionalKeywords: ['REGISTERED OFFICE', 'DATE OF INCORPORATION', 'ROC'],
    validationRegex: '^[UL]\\d{5}[A-Z]{2}\\d{4}[A-Z]{3}\\d{6}$'
  },
  {
    name: 'GSTIN Certificate',
    pillar: 'FACTORY_REGISTRATION_SAFETY',
    description: 'Goods and Services Tax Registration Certificate',
    issuingAuthority: 'GST Council',
    verificationRules: {
      minSimilarity: 0.7,
      requiredFields: ['gstin', 'legal_name']
    },
    requiredKeywords: ['GSTIN', 'GOODS AND SERVICES TAX', 'REGISTRATION CERTIFICATE'],
    optionalKeywords: ['PRINCIPAL PLACE OF BUSINESS', 'DATE OF REGISTRATION', 'PAN'],
    validationRegex: '^\\d{2}[A-Z]{5}\\d{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$'
  }
];

async function seedComplianceDocuments() {
  try {
    console.log('Starting compliance documents seeding...');

    for (const doc of complianceDocuments) {
      const existingDoc = await prisma.complianceDocument.findUnique({
        where: { name: doc.name }
      });

      if (!existingDoc) {
        await prisma.complianceDocument.create({
          data: doc
        });
        console.log(`Created compliance document: ${doc.name}`);
      } else {
        await prisma.complianceDocument.update({
          where: { name: doc.name },
          data: doc
        });
        console.log(`Updated compliance document: ${doc.name}`);
      }
    }

    console.log('Compliance documents seeding completed successfully!');
  } catch (error) {
    console.error('Error during seeding:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run seeding
seedComplianceDocuments(); 