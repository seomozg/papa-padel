import 'dotenv/config';
import axios from 'axios';
import { prisma } from '../src/config/database';

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

// Города РФ
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
];

// Поисковые запросы
const SEARCH_QUERIES = ['padel court', 'падел корт', 'padel'];

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

// Основная функция
async function scrapeCourts() {
  console.log('🔍 Парсинг падел-кортов через Google Places API...\n');
  
  if (!GOOGLE_API_KEY) {
    throw new Error('GOOGLE_PLACES_API_KEY не найден в .env');
  }

  const seenIds = new Set<string>();
  let added = 0;

  for (const city of CITIES) {
    console.log(`📍 ${city.name}`);
    
    for (const query of SEARCH_QUERIES) {
      try {
        const response = await axios.get(
          'https://maps.googleapis.com/maps/api/place/textsearch/json',
          {
            params: {
              query: `${query} ${city.name} Russia`,
              key: GOOGLE_API_KEY,
              language: 'ru',
            },
            timeout: 15000,
          }
        );

        const results = response.data.results || [];
        
        for (const place of results) {
          if (seenIds.has(place.place_id)) continue;
          if (!isPadelCourt(place.name)) continue;
          
          seenIds.add(place.place_id);
          
          const address = place.formatted_address || `${city.name}, адрес не указан`;
          const lat = place.geometry?.location?.lat || 0;
          const lng = place.geometry?.location?.lng || 0;

          await prisma.court.create({
            data: {
              slug: generateSlug(place.name, place.place_id),
              name: place.name,
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
              source: 'google-places',
              sourceUrl: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
            },
          });
          
          console.log(`  ✅ ${place.name}`);
          added++;
        }
      } catch (error: any) {
        console.error(`  ❌ Ошибка: ${error.message}`);
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