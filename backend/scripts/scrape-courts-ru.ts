import 'dotenv/config';
import { prisma } from '../src/config/database';

const GIS_API_KEY = process.env.GIS_MAPS_API_KEY;

// Города РФ с координатами
const CITIES = [
  { name: 'Москва', lat: 55.7558, lng: 37.6173 },
  { name: 'Санкт-Петербург', lat: 59.9343, lng: 30.3351 },
  { name: 'Новосибирск', lat: 55.0084, lng: 82.9357 },
  { name: 'Екатеринбург', lat: 56.8389, lng: 60.6057 },
  { name: 'Казань', lat: 55.8304, lng: 49.0661 },
  { name: 'Нижний Новгород', lat: 56.2965, lng: 43.9361 },
  { name: 'Челябинск', lat: 55.1644, lng: 61.4368 },
  { name: 'Самара', lat: 53.1951, lng: 50.1018 },
  { name: 'Краснодар', lat: 45.0355, lng: 38.9753 },
  { name: 'Сочи', lat: 43.5855, lng: 39.7231 },
  { name: 'Калининград', lat: 54.7104, lng: 20.4522 },
  { name: 'Тюмень', lat: 57.1522, lng: 65.5272 },
  { name: 'Воронеж', lat: 51.6720, lng: 39.1843 },
  { name: 'Ростов-на-Дону', lat: 47.2357, lng: 39.7015 },
  { name: 'Уфа', lat: 54.7388, lng: 55.9721 },
];

// Поисковые запросы
const SEARCH_QUERIES = ['падел', 'padel'];

// Проверка, что это падел-корт
function isPadelCourt(name: string): boolean {
  const nameLower = name.toLowerCase();
  return nameLower.includes('padel') || nameLower.includes('падел');
}

// Генерация slug
function generateSlug(name: string, id: string): string {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-zа-яё0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .substring(0, 50);
  return `${baseSlug}-${id.substring(0, 8)}`;
}

// Поиск через 2ГИС
async function search2GIS(query: string, lat: number, lng: number): Promise<any[]> {
  if (!GIS_API_KEY) {
    console.log('  ⚠️ GIS_MAPS_API_KEY не найден');
    return [];
  }
  
  try {
    // Добавляем radius и правильные fields
    const url = `https://catalog.api.2gis.com/3.0/items?q=${encodeURIComponent(query)}&location=${lng},${lat}&radius=20000&key=${GIS_API_KEY}&page_size=10&fields=items.point,items.schedule`;
    
    const https = require('https');
    const response = await new Promise<any>((resolve, reject) => {
      https.get(url, (res: any) => {
        let data = '';
        res.on('data', (chunk: string) => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      }).on('error', reject);
    });
    
    const items = response.result?.items || [];
    console.log(`  2ГИС: ${items.length} результатов`);
    return items;
  } catch (error: any) {
    console.error(`  ❌ 2ГИС ошибка: ${error.message}`);
    return [];
  }
}

// Основная функция
async function scrapeCourts() {
  console.log('🔍 Парсинг падел-кортов через 2ГИС...\n');
  
  const seenIds = new Set<string>();
  let added = 0;

  for (const city of CITIES) {
    console.log(`📍 ${city.name}`);
    
    for (const query of SEARCH_QUERIES) {
      const gisResults = await search2GIS(query, city.lat, city.lng);
      
      for (const item of gisResults) {
        const id = `gis-${item.id}`;
        const name = item.name || '';
        
        if (seenIds.has(id)) continue;
        if (!isPadelCourt(name)) continue;
        
        seenIds.add(id);
        
        // Адрес
        const address = item.address_name || `${city.name}, адрес не указан`;
        const lat = item.point?.lat || 0;
        const lng = item.point?.lon || 0;
        
        // Время работы из schedule (формат 2ГИС)
        let workingHours = null;
        if (item.schedule) {
          const schedule = item.schedule;
          const days = [];
          const dayMap: Record<string, string> = {
            'Mon': 'Пн', 'Tue': 'Вт', 'Wed': 'Ср', 'Thu': 'Чт',
            'Fri': 'Пт', 'Sat': 'Сб', 'Sun': 'Вс'
          };
          
          for (const [day, data] of Object.entries(schedule)) {
            if (dayMap[day] && (data as any).working_hours) {
              const hours = (data as any).working_hours.map((h: any) => `${h.from}-${h.to}`).join(', ');
              days.push(`${dayMap[day]}: ${hours}`);
            }
          }
          
          if (days.length > 0) {
            workingHours = days.join('; ');
          }
        }
        
        try {
          await prisma.court.create({
            data: {
              slug: generateSlug(name, id),
              name,
              city: city.name,
              address,
              coordinates: { lat, lng },
              type: 'mixed',
              amenities: ['Парковка', 'Душевые'],
              phone: null,
              workingHours,
              description: `Падел-корт в городе ${city.name}`,
              prices: [
                { time: '09:00 – 18:00', weekday: 1500, weekend: 2000 },
                { time: '18:00 – 23:00', weekday: 2500, weekend: 3000 },
              ],
              image: '/images/courts/placeholder.jpg',
              source: '2gis',
              sourceUrl: `https://2gis.ru/item/${item.id}`,
            },
          });
          console.log(`    ✅ ${name} (коорд: ${lat.toFixed(4)}, ${lng.toFixed(4)}, часы: ${workingHours || 'нет'})`);
          added++;
        } catch (e) {}
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`📊 ИТОГИ:`);
  console.log(`  Добавлено: ${added}`);
  console.log(`  Всего в БД: ${await prisma.court.count()}`);
  console.log('='.repeat(50));
}

scrapeCourts()
  .then(() => {
    console.log('\n✅ Парсинг завершен!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Ошибка:', error);
    process.exit(1);
  });