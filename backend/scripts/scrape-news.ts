import 'dotenv/config';
import { scrapeAllNews } from '../src/modules/scraper/news-scraper';

async function main() {
  try {
    await scrapeAllNews();
    console.log('\n✅ Парсинг новостей успешно завершен!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Ошибка:', error);
    process.exit(1);
  }
}

main();