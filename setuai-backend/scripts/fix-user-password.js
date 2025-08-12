import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function fixUserPassword() {
  try {
    // Hash password for system user
    const saltRounds = parseInt(process.env.SALT_ROUNDS) || 10;
    const hashedPassword = await bcrypt.hash('SYSTEM', saltRounds);

    // Update the system user's password
    const updatedUser = await prisma.user.update({
      where: { id: 'SYSTEM' },
      data: {
        password: hashedPassword
      }
    });

    console.log('User password updated successfully:', {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name
    });
  } catch (error) {
    console.error('Error updating user password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixUserPassword(); 