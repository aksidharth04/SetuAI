import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getChecklist = async (req, res) => {
  try {
    const complianceDocuments = await prisma.complianceDocument.findMany({
      orderBy: { pillar: 'asc' }
    });

    res.json({
      success: true,
      data: complianceDocuments,
      count: complianceDocuments.length
    });
  } catch (error) {
    console.error('Error fetching compliance checklist:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch compliance checklist'
    });
  }
};

export const seedChecklist = async (req, res) => {
  try {
    // Check if data already exists
    const existingCount = await prisma.complianceDocument.count();
    if (existingCount > 0) {
      return res.status(400).json({
        success: false,
        error: 'Compliance documents already seeded'
      });
    }

    // Initial compliance documents data
    const complianceDocuments = [
      {
        name: 'Factory License Form 4',
        pillar: 'FACTORY_REGISTRATION_SAFETY',
        description: 'Valid factory license issued by the state government',
        issuingAuthority: 'State Factory Inspectorate'
      },
      {
        name: 'ESIC Registration Certificate',
        pillar: 'ESI_PF_COVERAGE',
        description: 'Employee State Insurance certificate for worker coverage',
        issuingAuthority: 'Employee State Insurance Corporation'
      },
      {
        name: 'EPF Registration',
        pillar: 'ESI_PF_COVERAGE',
        description: 'Provident Fund registration certificate',
        issuingAuthority: 'Employees Provident Fund Organisation'
      },
      {
        name: 'EPF ECR Challan',
        pillar: 'ESI_PF_COVERAGE',
        description: 'EPF Electronic Challan cum Return',
        issuingAuthority: 'Employees Provident Fund Organisation'
      },
      {
        name: 'Minimum Wages Certificate',
        pillar: 'WAGES_OVERTIME',
        description: 'Certificate confirming compliance with minimum wages act',
        issuingAuthority: 'State Labour Department'
      },
      {
        name: 'Overtime Records',
        pillar: 'WAGES_OVERTIME',
        description: 'Records of overtime payments and compliance',
        issuingAuthority: 'Internal Records'
      },
      {
        name: 'Age Verification Records',
        pillar: 'CHILD_LABOR_AGE_VERIFICATION',
        description: 'Records verifying all workers are above minimum age',
        issuingAuthority: 'Internal Records'
      },
      {
        name: 'TNPCB Consent to Operate',
        pillar: 'ENVIRONMENTAL',
        description: 'Environmental clearance certificate for factory operations',
        issuingAuthority: 'Tamil Nadu Pollution Control Board'
      },
      {
        name: 'Fire NOC Certificate',
        pillar: 'FACTORY_REGISTRATION_SAFETY',
        description: 'Fire safety compliance certificate',
        issuingAuthority: 'Fire Department'
      },
      {
        name: 'GSTIN Certificate',
        pillar: 'FACTORY_REGISTRATION_SAFETY',
        description: 'GST registration certificate',
        issuingAuthority: 'Goods and Services Tax Department'
      },
      {
        name: 'Certificate of Incorporation',
        pillar: 'FACTORY_REGISTRATION_SAFETY',
        description: 'Company incorporation certificate',
        issuingAuthority: 'Ministry of Corporate Affairs'
      },
      {
        name: 'ISO 9001 Certificate',
        pillar: 'FACTORY_REGISTRATION_SAFETY',
        description: 'Quality Management System certification',
        issuingAuthority: 'ISO Certification Body'
      },
      {
        name: 'ISO 14001 Certificate',
        pillar: 'ENVIRONMENTAL',
        description: 'Environmental Management System certification',
        issuingAuthority: 'ISO Certification Body'
      },
      {
        name: 'ISO 45001 Certificate',
        pillar: 'FACTORY_REGISTRATION_SAFETY',
        description: 'Occupational Health and Safety Management System certification',
        issuingAuthority: 'ISO Certification Body'
      },
      {
        name: 'OEKO-TEX Standard 100',
        pillar: 'ENVIRONMENTAL',
        description: 'Textile testing certification for harmful substances',
        issuingAuthority: 'OEKO-TEX'
      },
      {
        name: 'GOTS Certificate',
        pillar: 'ENVIRONMENTAL',
        description: 'Global Organic Textile Standard certification',
        issuingAuthority: 'GOTS Approved Certification Body'
      }
    ];

    const createdDocuments = await prisma.complianceDocument.createMany({
      data: complianceDocuments
    });

    res.json({
      success: true,
      message: 'Compliance checklist seeded successfully',
      count: createdDocuments.count
    });
  } catch (error) {
    console.error('Error seeding compliance checklist:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to seed compliance checklist'
    });
  }
}; 