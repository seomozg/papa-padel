import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️ Clearing demo data...');

  // Delete courts with demo-data source
  const deletedCourts = await prisma.court.deleteMany({
    where: {
      source: 'demo-data'
    }
  });

  console.log(`✅ Deleted ${deletedCourts.count} demo courts`);

  // Update configuration to exclude demo-data
  console.log('🔧 Updating data collector configuration...');

  // This will be done via API call
  console.log('📝 Please update the data collector config via API to remove "demo-data" from sources');
}

main()
  .catch((e) => {
    console.error('❌ Error clearing demo data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });