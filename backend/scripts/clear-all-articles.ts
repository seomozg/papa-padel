import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️ Clearing all articles...');

  const deletedArticles = await prisma.article.deleteMany();

  console.log(`✅ Deleted ${deletedArticles.count} articles`);
}

main()
  .catch((e) => {
    console.error('❌ Error clearing articles:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });