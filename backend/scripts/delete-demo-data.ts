import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️ Deleting demo-data courts...');

  const deletedCourts = await prisma.court.deleteMany({
    where: {
      source: 'demo-data'
    }
  });

  console.log(`✅ Deleted ${deletedCourts.count} demo-data courts`);
}

main()
  .catch((e) => {
    console.error('❌ Error deleting demo-data courts:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });