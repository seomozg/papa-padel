import 'dotenv/config';
import { scrapeAllCourts } from '../src/modules/scraper/courts-scraper';

async function main() {
  try {
    await scrapeAllCourts();
    console.log('\n✅ Парсинг успешно завершен!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Ошибка:', error);
    process.exit(1);
  }
}

main();