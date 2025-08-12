import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

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

async function main() {
  console.log('Starting database seeding...');

  // Hash password for system user
  const saltRounds = parseInt(process.env.SALT_ROUNDS) || 10;
  const systemPassword = await bcrypt.hash('SYSTEM', saltRounds);
  const adminPassword = await bcrypt.hash('password', saltRounds);

  // Create system vendor if it doesn't exist
  const systemVendor = await prisma.vendor.upsert({
    where: { id: 'SYSTEM' },
    update: {},
    create: {
      id: 'SYSTEM',
      companyName: 'System',
      factoryLocation: 'System',
      complianceStatus: 'GREEN'
    }
  });

  // Create admin user with password "password"
  const adminUser = await prisma.user.upsert({
    where: { email: 'system@setuai.com' },
    update: {
      password: adminPassword // Update password to "password"
    },
    create: {
      email: 'system@setuai.com',
      name: 'System Administrator',
      password: adminPassword,
      role: 'SYSTEM_ADMIN',
      vendorId: systemVendor.id
    }
  });

  // Create a sample vendor for testing
  const sampleVendor = await prisma.vendor.upsert({
    where: { id: 'SAMPLE_VENDOR' },
    update: {},
    create: {
      id: 'SAMPLE_VENDOR',
      companyName: 'Textile Solutions Ltd',
      factoryLocation: 'Tamil Nadu',
      complianceStatus: 'AMBER',
      isPublished: true
    }
  });

  // Create sample vendor user
  const sampleVendorUser = await prisma.user.upsert({
    where: { email: 'vendor@example.com' },
    update: {},
    create: {
      email: 'vendor@example.com',
      name: 'Vendor Admin',
      password: await bcrypt.hash('password', saltRounds),
      role: 'VENDOR_ADMIN',
      vendorId: sampleVendor.id
    }
  });

  // Create additional vendors for Tamil Nadu textile hubs
  const additionalVendors = [
    {
      id: 'VENDOR_COIMBATORE',
      companyName: 'Coimbatore Textiles Pvt Ltd',
      factoryLocation: 'Coimbatore',
      complianceStatus: 'GREEN',
      isPublished: true,
      logoUrl: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=300&fit=crop'
    },
    {
      id: 'VENDOR_SALEM',
      companyName: 'Salem Weaving Mills',
      factoryLocation: 'Salem',
      complianceStatus: 'GREEN',
      isPublished: true,
      logoUrl: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=300&fit=crop'
    },
    {
      id: 'VENDOR_ERODE',
      companyName: 'Erode Garment Industries',
      factoryLocation: 'Erode',
      complianceStatus: 'GREEN',
      isPublished: true,
      logoUrl: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=300&fit=crop'
    },
    {
      id: 'VENDOR_TIRUPUR',
      companyName: 'Tirupur Knitwear Solutions',
      factoryLocation: 'Tirupur',
      complianceStatus: 'GREEN',
      isPublished: true,
      logoUrl: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=300&fit=crop'
    },
    {
      id: 'VENDOR_KARUR',
      companyName: 'Karur Textile Mills',
      factoryLocation: 'Karur',
      complianceStatus: 'AMBER',
      isPublished: true,
      logoUrl: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=300&fit=crop'
    },
    {
      id: 'VENDOR_MADURAI',
      companyName: 'Madurai Silk Industries',
      factoryLocation: 'Madurai',
      complianceStatus: 'RED',
      isPublished: true,
      logoUrl: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=300&fit=crop'
    },
    {
      id: 'VENDOR_THOOTHUKUDI',
      companyName: 'Thoothukudi Cotton Mills',
      factoryLocation: 'Thoothukudi',
      complianceStatus: 'GREEN',
      isPublished: true,
      logoUrl: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=300&fit=crop'
    },
    {
      id: 'VENDOR_NAMAKKAL',
      companyName: 'Namakkal Textile Hub',
      factoryLocation: 'Namakkal',
      complianceStatus: 'AMBER',
      isPublished: true,
      logoUrl: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=300&fit=crop'
    }
  ];

  for (const vendorData of additionalVendors) {
    const { logoUrl, ...vendorCreateData } = vendorData;
    const vendor = await prisma.vendor.upsert({
      where: { id: vendorData.id },
      update: {},
      create: vendorCreateData
    });

    // Create marketplace profile for each vendor
    await prisma.marketplaceProfile.upsert({
      where: { vendorId: vendor.id },
      update: {},
      create: {
        vendorId: vendor.id,
        companyDescription: `Leading textile manufacturer in ${vendorData.factoryLocation} specializing in high-quality fabrics and garments.`,
        contactEmail: `contact@${vendorData.companyName.toLowerCase().replace(/\s+/g, '')}.com`,
        websiteUrl: `https://www.${vendorData.companyName.toLowerCase().replace(/\s+/g, '')}.com`,
        logoUrl: logoUrl
      }
    });
  }

  // Create a buyer user for testing
  const buyerUser = await prisma.user.upsert({
    where: { email: 'buyer@example.com' },
    update: {},
    create: {
      email: 'buyer@example.com',
      name: 'Buyer Admin',
      password: await bcrypt.hash('password', saltRounds),
      role: 'BUYER_ADMIN',
      vendorId: systemVendor.id // Using system vendor for buyer
    }
  });

  // Seed compliance documents
  console.log('Seeding compliance documents...');
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

  // Create some sample uploaded documents for the sample vendor
  console.log('Creating sample uploaded documents...');
  
  // Get some compliance documents to create uploaded documents
  const epfDoc = await prisma.complianceDocument.findUnique({
    where: { name: 'EPF Registration' }
  });
  
  const esicDoc = await prisma.complianceDocument.findUnique({
    where: { name: 'ESIC Registration' }
  });

  const factoryDoc = await prisma.complianceDocument.findUnique({
    where: { name: 'Factory License' }
  });

  if (epfDoc) {
    // Check if document already exists
    const existingEpfDoc = await prisma.uploadedDocument.findFirst({
      where: {
        vendorId: sampleVendor.id,
        complianceDocumentId: epfDoc.id
      }
    });

    if (!existingEpfDoc) {
      await prisma.uploadedDocument.create({
        data: {
          vendorId: sampleVendor.id,
          complianceDocumentId: epfDoc.id,
          filePath: '/uploads/sample-epf.pdf',
          originalFilename: 'EPF_Registration_Certificate.pdf',
          verificationStatus: 'VERIFIED',
          verificationSummary: 'EPF registration verified successfully',
          extractedData: {
            code: 'TNTNP0304683000',
            establishmentName: 'Textile Solutions Ltd',
            establishmentAddress: '123 Industrial Area, Coimbatore, Tamil Nadu',
            dateOfIssue: '2023-01-15',
            issuingAuthority: 'EPFO Regional Office, Coimbatore'
          },
          verificationDetails: {
            isValid: true,
            confidence: 0.95,
            verificationMethod: 'API'
          },
          lastVerifiedAt: new Date(),
          riskScore: 0.1
        }
      });
      console.log('Created EPF uploaded document');
    }
  }

  if (esicDoc) {
    // Check if document already exists
    const existingEsicDoc = await prisma.uploadedDocument.findFirst({
      where: {
        vendorId: sampleVendor.id,
        complianceDocumentId: esicDoc.id
      }
    });

    if (!existingEsicDoc) {
      await prisma.uploadedDocument.create({
        data: {
          vendorId: sampleVendor.id,
          complianceDocumentId: esicDoc.id,
          filePath: '/uploads/sample-esic.pdf',
          originalFilename: 'ESIC_Registration_Certificate.pdf',
          verificationStatus: 'PENDING',
          verificationSummary: 'ESIC registration pending verification',
          extractedData: {
            esicCode: '33-01-123456-0001',
            establishmentName: 'Textile Solutions Ltd',
            establishmentAddress: '123 Industrial Area, Coimbatore, Tamil Nadu',
            dateOfRegistration: '2023-02-20',
            issuingAuthority: 'ESIC Regional Office, Coimbatore'
          },
          verificationDetails: {
            isValid: null,
            confidence: 0.0,
            verificationMethod: 'PENDING'
          },
          riskScore: 0.5
        }
      });
      console.log('Created ESIC uploaded document');
    }
  }

  if (factoryDoc) {
    // Check if document already exists
    const existingFactoryDoc = await prisma.uploadedDocument.findFirst({
      where: {
        vendorId: sampleVendor.id,
        complianceDocumentId: factoryDoc.id
      }
    });

    if (!existingFactoryDoc) {
      await prisma.uploadedDocument.create({
        data: {
          vendorId: sampleVendor.id,
          complianceDocumentId: factoryDoc.id,
          filePath: '/uploads/sample-factory.pdf',
          originalFilename: 'Factory_License.pdf',
          verificationStatus: 'REJECTED',
          verificationSummary: 'Factory license verification failed - expired document',
          extractedData: {
            licenseNumber: 'TN/FL/2023/12345',
            factoryName: 'Textile Solutions Ltd',
            licenseHolderName: 'John Doe',
            factoryAddress: '123 Industrial Area, Coimbatore, Tamil Nadu',
            validUntil: '2022-12-31',
            maxWorkers: '500',
            maxHorsePower: '1000',
            issueDate: '2020-01-15',
            issuingAuthority: 'Directorate of Industrial Safety and Health, Tamil Nadu'
          },
          verificationDetails: {
            isValid: false,
            confidence: 0.9,
            verificationMethod: 'API',
            reason: 'Document expired on 2022-12-31'
          },
          lastVerifiedAt: new Date(),
          riskScore: 0.8
        }
      });
      console.log('Created Factory License uploaded document');
    }
  }

  // Create marketplace profile for sample vendor
  await prisma.marketplaceProfile.upsert({
    where: { vendorId: sampleVendor.id },
    update: {},
    create: {
      vendorId: sampleVendor.id,
      companyDescription: 'Leading textile manufacturer specializing in organic cotton and sustainable fabrics. We provide high-quality textile solutions with a focus on environmental responsibility and social compliance.',
      contactEmail: 'contact@textilesolutions.com',
      websiteUrl: 'https://textilesolutions.com',
      logoUrl: '/images/vendors/textile-7.jpg'
    }
  });

  // Add diverse compliance data for additional vendors
  console.log('Adding diverse compliance data for additional vendors...');
  
  const additionalVendorIds = additionalVendors.map(v => v.id);
  const allComplianceDocs = await prisma.complianceDocument.findMany();
  
  for (const vendorId of additionalVendorIds) {
    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) continue;

    // Add 6-10 documents per vendor for better coverage (out of 11 total)
    const numDocs = Math.min(Math.floor(Math.random() * 5) + 6, 11); // 6-10 documents, max 11
    const selectedDocs = allComplianceDocs.sort(() => 0.5 - Math.random()).slice(0, numDocs);
    
    for (const doc of selectedDocs) {
      // Higher chance of VERIFIED status for better scores
      const statuses = ['VERIFIED', 'VERIFIED', 'VERIFIED', 'PENDING', 'PENDING', 'REJECTED'];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const riskScore = status === 'VERIFIED' ? Math.random() * 20 + 80 : Math.random() * 60 + 20; // 80-100 for verified, 20-80 for others
      
      await prisma.uploadedDocument.create({
        data: {
          vendorId: vendor.id,
          complianceDocumentId: doc.id,
          filePath: `/uploads/${vendor.companyName.toLowerCase().replace(/\s+/g, '-')}-${doc.name.toLowerCase().replace(/\s+/g, '-')}.pdf`,
          originalFilename: `${doc.name}_${vendor.companyName}.pdf`,
          verificationStatus: status,
          verificationSummary: `${doc.name} ${status.toLowerCase()}`,
          extractedData: {
            code: `${vendor.factoryLocation.substring(0, 2).toUpperCase()}${Math.floor(Math.random() * 1000000)}`,
            establishmentName: vendor.companyName,
            establishmentAddress: `${Math.floor(Math.random() * 999) + 1} Industrial Area, ${vendor.factoryLocation}, Tamil Nadu`,
            dateOfIssue: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            issuingAuthority: `${doc.name} Authority, ${vendor.factoryLocation}`
          },
          verificationDetails: {
            isValid: status === 'VERIFIED',
            confidence: Math.random(),
            verificationMethod: status === 'VERIFIED' ? 'API' : 'PENDING'
          },
          lastVerifiedAt: status === 'VERIFIED' ? new Date() : null,
          riskScore: riskScore
        }
      });
    }
    
    // Update vendor's overall compliance score based on document coverage
    const vendorDocs = await prisma.uploadedDocument.findMany({
      where: { vendorId: vendor.id }
    });
    
    const allRequiredDocs = await prisma.complianceDocument.findMany();
    
    if (allRequiredDocs.length > 0) {
      // Calculate score based on document coverage and verification status
      const uploadedDocsCount = vendorDocs.length;
      const requiredDocsCount = allRequiredDocs.length;
      const coveragePercentage = (uploadedDocsCount / requiredDocsCount) * 100;
      
      // Calculate verification success rate
      const verifiedDocs = vendorDocs.filter(doc => doc.verificationStatus === 'VERIFIED').length;
      const verificationRate = uploadedDocsCount > 0 ? (verifiedDocs / uploadedDocsCount) * 100 : 0;
      
      // Final score: 70% based on coverage, 30% based on verification success
      const finalScore = Math.min(
        (coveragePercentage * 0.7) + (verificationRate * 0.3),
        100
      );
      
      let status;
      if (finalScore >= 90) status = 'GREEN';
      else if (finalScore >= 70) status = 'AMBER';
      else status = 'RED';
      
      await prisma.vendor.update({
        where: { id: vendor.id },
        data: {
          overallComplianceScore: Math.round(finalScore),
          complianceStatus: status
        }
      });
    }
  }

  // Create sample buyer engagements
  console.log('Creating sample buyer engagements...');
  
  // Get the buyer user
  const existingBuyerUser = await prisma.user.findUnique({
    where: { email: 'buyer@example.com' }
  });

  if (existingBuyerUser) {
    // Get some vendors to create engagements with
    const vendors = await prisma.vendor.findMany({
      where: { isPublished: true },
      take: 5
    });

    for (let i = 0; i < vendors.length; i++) {
      const vendor = vendors[i];
      const engagementStatuses = ['ACTIVE', 'PENDING', 'COMPLETED', 'ON_HOLD'];
      const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
      const dealTypes = ['PURCHASE', 'SERVICE', 'CONSULTATION', 'PARTNERSHIP'];
      
      const engagement = await prisma.buyerEngagement.create({
        data: {
          buyerId: existingBuyerUser.id,
          vendorId: vendor.id,
          engagementStatus: engagementStatuses[i % engagementStatuses.length],
          priority: priorities[i % priorities.length],
          notes: `Sample engagement with ${vendor.companyName}. ${i === 0 ? 'Initial contact made, waiting for proposal.' : i === 1 ? 'Sample products received, under evaluation.' : i === 2 ? 'Price negotiation in progress.' : i === 3 ? 'Contract terms being discussed.' : 'Quality assessment completed.'}`,
          dealValue: Math.random() > 0.5 ? Math.floor(Math.random() * 1000000) + 50000 : null,
          dealCurrency: 'INR',
          dealType: dealTypes[i % dealTypes.length],
          lastContact: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
          nextFollowUp: new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000) // Random date within next 14 days
        }
      });

      // Create some history entries
      await prisma.engagementHistory.create({
        data: {
          engagementId: engagement.id,
          action: 'ENGAGEMENT_CREATED',
          details: `Initial engagement created with ${vendor.companyName}`,
          newStatus: engagement.engagementStatus,
          newPriority: engagement.priority
        }
      });

      // Add a status change history entry
      if (i > 0) {
        await prisma.engagementHistory.create({
          data: {
            engagementId: engagement.id,
            action: 'STATUS_CHANGE',
            details: `Status updated to ${engagement.engagementStatus}`,
            previousStatus: 'PENDING',
            newStatus: engagement.engagementStatus
          }
        });
      }
    }
  }

  console.log('Seed data created successfully!');
  console.log('Users created:');
  console.log('- system@setuai.com (password: password) - SYSTEM_ADMIN');
  console.log('- vendor@example.com (password: password) - VENDOR_ADMIN');
  console.log('- buyer@example.com (password: password) - BUYER_ADMIN');
  console.log('Compliance documents seeded:', complianceDocuments.length);
  console.log('Sample uploaded documents created for vendor');
  console.log('Marketplace profile created for sample vendor');
  console.log('Diverse compliance data added for additional vendors');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 