import 'dotenv/config';
import axios from 'axios';
import { prisma } from '../src/config/database';

const YANDEX_API_KEY = process.env.YANDEX_MAPS_API_KEY;
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
const SEARCH_QUERIES = ['падел', 'padel', 'падел теннис'];

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

// Поиск через Яндекс
async function searchYandex(query: string, city: string): Promise<any[]> {
  if (!YANDEX_API_KEY) {
    console.log('  ⚠️ YANDEX_MAPS_API_KEY не найден');
    return [];
  }
  
  try {
    const response = await axios.get('https://search-maps.yandex.ru/v1/', {
      params: {
        apikey: YANDEX_API_KEY,
        text: `${query} ${city}`,
        lang: 'ru_RU',
        results: 50,
      },
      timeout: 15000,
    });
    
    console.log(`  Яндекс: ${response.data.features?.length || 0} результатов`);
    return response.data.features || [];
  } catch (error: any) {
    console.error(`  ❌ Яндекс ошибка: ${error.message}`);
    return [];
  }
}

// Поиск через 2ГИС
async function search2GIS(query: string, lat: number, lng: number): Promise<any[]> {
  if (!GIS_API_KEY) {
    console.log('  ⚠️ GIS_MAPS_API_KEY не найден');
    return [];
  }
  
  try {
    // page_size должен быть от 1 до 10
    const url = `https://catalog.api.2gis.com/3.0/items?q=${encodeURIComponent(query)}&location=${lng},${lat}&key=${GIS_API_KEY}&page_size=10`;
    console.log(`  2ГИС URL: ${url}`);
    
    // Используем нативный https
    const https = require('https');
    const response = await new Promise<any>((resolve, reject) => {
      https.get(url, (res: any) => {
        let data = '';
        res.on('data', (chunk: string) => data += chunk);
        res.on('end', () => {
          console.log(`  2ГИС response: ${data.substring(0, 200)}...`);
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      }).on('error', reject);
    });
    
    const items = response.result?.items || [];
    console.log(`  2ГИС: ${items.length} результатов (total: ${response.result?.total || 0})`);
    if (items.length > 0) {
      console.log(`    Пример: ${items[0].name}`);
    }
    return items;
  } catch (error: any) {
    console.error(`  ❌ 2ГИС ошибка: ${error.message}`);
    return [];
  }
}

// Основная функция
async function scrapeCourts() {
  console.log('🔍 Парсинг падел-кортов через Яндекс и 2ГИС...\n');
  
  const seenIds = new Set<string>();
  let added = 0;

  for (const city of CITIES) {
    console.log(`📍 ${city.name}`);
    
    for (const query of SEARCH_QUERIES) {
      // Яндекс
      const yandexResults = await searchYandex(query, city.name);
      for (const item of yandexResults) {
        const id = `yandex-${item.properties?.id || Date.now()}`;
        const name = item.properties?.name || '';
        
        if (seenIds.has(id)) continue;
        if (!isPadelCourt(name)) continue;
        
        seenIds.add(id);
        
        const coords = item.geometry?.coordinates || [0, 0];
        const address = item.properties?.description || `${city.name}, адрес не указан`;
        
        try {
          await prisma.court.create({
            data: {
              slug: generateSlug(name, id),
              name,
              city: city.name,
              address,
              coordinates: { lat: coords[1], lng: coords[0] },
              type: 'mixed',
              amenities: ['Парковка', 'Душевые'],
              phone: null,
              workingHours: null,
              description: `Падел-корт в городе ${city.name}`,
              prices: [
                { time: '09:00 – 18:00', weekday: 1500, weekend: 2000 },
                { time: '18:00 – 23:00', weekday: 2500, weekend: 3000 },
              ],
              image: '/images/courts/placeholder.jpg',
              source: 'yandex',
              sourceUrl: `https://yandex.ru/maps/-/${item.properties?.id || ''}`,
            },
          });
          console.log(`    ✅ ${name} (Яндекс)`);
          added++;
        } catch (e) {}
      }
      
      // 2ГИС
      const gisResults = await search2GIS(query, city.lat, city.lng);
      for (const item of gisResults) {
        const id = `gis-${item.id}`;
        const name = item.name || '';
        
        if (seenIds.has(id)) continue;
        if (!isPadelCourt(name)) continue;
        
        seenIds.add(id);
        
        const address = item.address_name || `${city.name}, адрес не указан`;
        const lat = item.point?.lat || 0;
        const lng = item.point?.lon || 0;
        
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
              workingHours: null,
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
          console.log(`    ✅ ${name} (2ГИС)`);
          added++;
        } catch (e) {}
      }
      
      await new Promise(resolve => setTimeout(resolve, 300));
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