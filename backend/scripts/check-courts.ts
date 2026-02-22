import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking courts in database...');

  const courts = await prisma.court.findMany({
    select: {
      name: true,
      city: true,
      source: true
    }
  });

  console.log(`Found ${courts.length} courts:`);
  courts.forEach((court, index) => {
    console.log(`${index + 1}. ${court.name} (${court.city}) - ${court.source}`);
  });
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });