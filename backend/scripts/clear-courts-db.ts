import 'dotenv/config';
import { prisma } from '../src/config/database';

async function clearCourts() {
  console.log('🗑️ Очистка базы кортов...\n');
  
  const result = await prisma.court.deleteMany({});
  
  console.log(`Удалено: ${result.count} кортов`);
  
  const finalCount = await prisma.court.count();
  console.log(`Итого в БД: ${finalCount}`);
}

clearCourts()
  .then(() => {
    console.log('\n✅ Готово!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Ошибка:', error);
    process.exit(1);
  });