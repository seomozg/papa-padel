import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Permanent cleanup of demo-data...');

  // Delete all demo-data courts
  const deletedCourts = await prisma.court.deleteMany({
    where: {
      source: 'demo-data'
    }
  });

  console.log(`✅ Deleted ${deletedCourts.count} demo-data courts`);

  // Check remaining courts
  const remainingCourts = await prisma.court.findMany({
    select: {
      name: true,
      city: true,
      source: true
    }
  });

  console.log(`📊 Remaining courts: ${remainingCourts.length}`);
  remainingCourts.forEach((court, index) => {
    console.log(`   ${index + 1}. ${court.name} (${court.city}) - ${court.source}`);
  });

  // Also clean up any potential demo-data articles
  const deletedArticles = await prisma.article.deleteMany({
    where: {
      OR: [
        { sourceUrl: null },
        { sourceUrl: '' }
      ]
    }
  });

  console.log(`✅ Deleted ${deletedArticles.count} articles without source URLs`);
}

main()
  .catch((e) => {
    console.error('❌ Error during cleanup:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });