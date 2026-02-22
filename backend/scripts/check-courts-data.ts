import 'dotenv/config';
import { prisma } from '../src/config/database';

async function main() {
  const courts = await prisma.court.findMany({
    select: {
      name: true,
      city: true,
      prices: true,
      amenities: true,
      description: true,
      courtsCount: true,
    },
  });

  console.log(`Всего кортов: ${courts.length}\n`);
  
  for (const court of courts) {
    console.log(`📍 ${court.name} (${court.city})`);
    console.log(`   Цены: ${court.prices ? JSON.stringify(court.prices).substring(0, 100) + '...' : 'нет'}`);
    console.log(`   Удобства: ${court.amenities ? JSON.stringify(court.amenities) : 'нет'}`);
    console.log(`   Описание: ${court.description ? court.description.substring(0, 80) + '...' : 'нет'}`);
    console.log(`   Кол-во кортов: ${court.courtsCount || 'не указано'}`);
    console.log('');
  }
}

main()
  .then(() => process.exit(0))
  .catch(e => { console.error(e); process.exit(1); });