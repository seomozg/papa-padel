import 'dotenv/config';
import { prisma } from '../src/config/database';

// Ключевые слова, которые точно указывают на падел
const PADEL_KEYWORDS = ['padel', 'падел'];

// Ключевые слова, которые указывают что это НЕ падел-корт
const EXCLUDE_KEYWORDS = [
  'burger', 'бургер',
  'pizza', 'пицца',
  'coffee', 'кофе',
  'restaurant', 'ресторан',
  'bar', 'бар',
  'hotel', 'отель',
  'shop', 'магазин',
  'store', 'магазин',
  'fitness', // фитнес-клубы без падела
  'gym', // просто качалки
  'spa', // салоны
  'beauty', // салоны красоты
  'hair', // парикмахерские
  'clinic', 'клиника',
  'medical', 'медицин',
  'dental', 'стоматолог',
  'school', 'школа', // кроме теннисных школ с паделом
  'kindergarten', 'детский сад',
  'office', 'офис',
  'bank', 'банк',
  'atm', 'банкомат',
  'gas station', 'заправка',
  'car wash', 'мойка',
  'auto', 'авто',
  'parking', 'парковка',
  'supermarket', 'супермаркет',
  'grocery', 'продукты',
  'pharmacy', 'аптека',
  'church', 'церковь',
  'mosque', 'мечеть',
  'temple', 'храм',
];

// Проверка, что это падел-корт
function isPadelCourt(name: string): boolean {
  const nameLower = name.toLowerCase();
  
  // Должен быть padel или падел в названии
  const hasPadelKeyword = PADEL_KEYWORDS.some(keyword => nameLower.includes(keyword));
  
  if (!hasPadelKeyword) {
    return false;
  }
  
  // Проверяем, что нет исключающих ключевых слов
  const hasExcludeKeyword = EXCLUDE_KEYWORDS.some(keyword => nameLower.includes(keyword));
  
  return !hasExcludeKeyword;
}

async function cleanupCourts() {
  console.log('🧹 Очистка базы данных от не-падел кортов...\n');
  
  // Получаем все корты
  const allCourts = await prisma.court.findMany({
    select: { id: true, name: true, city: true },
  });
  
  console.log(`Всего кортов в БД: ${allCourts.length}\n`);
  
  const toDelete: string[] = [];
  const toKeep: typeof allCourts = [];
  
  for (const court of allCourts) {
    if (isPadelCourt(court.name)) {
      toKeep.push(court);
    } else {
      toDelete.push(court.id);
      console.log(`❌ Удалить: ${court.name} (${court.city})`);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 ИТОГИ ОЧИСТКИ:');
  console.log(`  Останется: ${toKeep.length}`);
  console.log(`  Будет удалено: ${toDelete.length}`);
  console.log('='.repeat(50));
  
  // Показываем что останется
  console.log('\n✅ Останутся:');
  for (const court of toKeep) {
    console.log(`  ${court.name} (${court.city})`);
  }
  
  // Удаляем
  if (toDelete.length > 0) {
    console.log('\n🗑️ Удаляем не-падел корты...');
    
    const result = await prisma.court.deleteMany({
      where: { id: { in: toDelete } },
    });
    
    console.log(`Удалено: ${result.count}`);
  }
  
  // Итог
  const finalCount = await prisma.court.count();
  console.log(`\n📊 Итого кортов в БД: ${finalCount}`);
}

cleanupCourts()
  .then(() => {
    console.log('\n✅ Очистка завершена!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Ошибка:', error);
    process.exit(1);
  });