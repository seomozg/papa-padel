import { prisma } from '../src/config/database';

async function clearCourts() {
  console.log('🗑️ Clearing all courts...');

  try {
    const result = await prisma.court.deleteMany({});
    console.log(`✅ Deleted ${result.count} courts`);
  } catch (error) {
    console.error('❌ Error clearing courts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearCourts();