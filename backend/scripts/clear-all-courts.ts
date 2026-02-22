import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️ Clearing all courts...');

  const deletedCourts = await prisma.court.deleteMany();

  console.log(`✅ Deleted ${deletedCourts.count} courts`);
}

main()
  .catch((e) => {
    console.error('❌ Error clearing courts:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });