import { prisma } from '../src/config/database';

async function cleanNonPadelNews() {
  console.log('🧹 Starting cleanup of non-padel news...');

  // Получаем все статьи
  const allArticles = await prisma.article.findMany({
    select: {
      id: true,
      title: true,
      content: true,
      author: true,
      category: true
    }
  });

  console.log(`📊 Found ${allArticles.length} total articles`);

  // Находим нерелевантные новости (тестовый источник BBC)
  const nonPadelArticles = allArticles.filter(article =>
    article.author === 'Padel News Test' // Это был тестовый источник BBC
  );

  console.log(`🗑️ Found ${nonPadelArticles.length} non-padel articles to delete`);

  // Удаляем нерелевантные новости
  if (nonPadelArticles.length > 0) {
    const idsToDelete = nonPadelArticles.map(a => a.id);

    await prisma.article.deleteMany({
      where: {
        id: {
          in: idsToDelete
        }
      }
    });

    console.log(`✅ Deleted ${nonPadelArticles.length} non-padel articles`);

    // Показываем примеры удаленных статей
    console.log('\n📋 Examples of deleted articles:');
    nonPadelArticles.slice(0, 3).forEach(article => {
      console.log(`- "${article.title}" (author: ${article.author})`);
    });
  }

  // Проверяем оставшиеся статьи
  const remainingArticles = await prisma.article.count();
  console.log(`📈 Remaining articles: ${remainingArticles}`);

  console.log('🎉 Cleanup completed!');
}

// Запуск скрипта
if (require.main === module) {
  cleanNonPadelNews()
    .catch(console.error)
    .finally(() => process.exit(0));
}

export { cleanNonPadelNews };