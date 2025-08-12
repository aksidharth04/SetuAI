import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function cleanup() {
  try {
    console.log('Starting cleanup of test data...');

    // Delete all audit logs first (due to foreign key constraints)
    const deletedLogs = await prisma.auditLog.deleteMany({});
    console.log(`Deleted ${deletedLogs.count} audit logs`);

    // Delete all uploaded documents
    const deletedDocs = await prisma.uploadedDocument.deleteMany({});
    console.log(`Deleted ${deletedDocs.count} uploaded documents`);

    // Clear uploads directory
    const uploadsDir = path.join(__dirname, '../public/uploads');
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      for (const file of files) {
        if (file !== '.gitkeep') { // Keep the .gitkeep file
          fs.unlinkSync(path.join(uploadsDir, file));
        }
      }
      console.log(`Cleared ${files.length - 1} files from uploads directory`);
    }

    // Reset vendor compliance status to RED
    const updatedVendors = await prisma.vendor.updateMany({
      data: {
        complianceStatus: 'RED'
      }
    });
    console.log(`Reset compliance status for ${updatedVendors.count} vendors`);

    console.log('Test data cleanup completed successfully!');
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run cleanup
cleanup(); 