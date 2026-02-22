import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { prisma } from '../../config/database';

// Города РФ для поиска с координатами
const CITIES = [
  { name: 'Москва', lat: 55.7558, lng: 37.6173 },
  { name: 'Санкт-Петербург', lat: 59.9343, lng: 30.3351 },
  { name: 'Новосибирск', lat: 55.0084, lng: 82.9357 },
  { name: 'Екатеринбург', lat: 56.8389, lng: 60.6057 },
  { name: 'Казань', lat: 55.8304, lng: 49.0661 },
  { name: 'Нижний Новгород', lat: 56.2965, lng: 43.9361 },
  { name: 'Челябинск', lat: 55.1644, lng: 61.4368 },
  { name: 'Самара', lat: 53.1951, lng: 50.1018 },
  { name: 'Ростов-на-Дону', lat: 47.2357, lng: 39.7015 },
  { name: 'Уфа', lat: 54.7388, lng: 55.9721 },
  { name: 'Красноярск', lat: 56.0153, lng: 92.8932 },
  { name: 'Воронеж', lat: 51.6720, lng: 39.1843 },
  { name: 'Краснодар', lat: 45.0355, lng: 38.9753 },
  { name: 'Сочи', lat: 43.5855, lng: 39.7231 },
  { name: 'Калининград', lat: 54.7104, lng: 20.4522 },
  { name: 'Тюмень', lat: 57.1522, lng: 65.5272 },
  { name: 'Иркутск', lat: 52.2864, lng: 104.2814 },
  { name: 'Владивосток', lat: 43.1332, lng: 131.9113 },
  { name: 'Хабаровск', lat: 48.4726, lng: 135.0550 },
  { name: 'Махачкала', lat: 42.9830, lng: 47.5052 },
  { name: 'Омск', lat: 54.9885, lng: 73.3242 },
  { name: 'Саратов', lat: 51.5336, lng: 46.0343 },
  { name: 'Тольятти', lat: 53.5078, lng: 49.4204 },
  { name: 'Ижевск', lat: 56.8527, lng: 53.2115 },
  { name: 'Барнаул', lat: 53.3481, lng: 83.7798 },
  { name: 'Ульяновск', lat: 54.3142, lng: 48.4031 },
  { name: 'Пермь', lat: 58.0105, lng: 56.2294 },
  { name: 'Волгоград', lat: 48.7043, lng: 44.5030 },
  { name: 'Тула', lat: 54.1931, lng: 37.6173 },
  { name: 'Ярославль', lat: 57.6261, lng: 39.8845 },
];

// Поисковые запросы
const SEARCH_QUERIES = [
  'padel court',
  'padel tennis',
  'падел корт',
  'падел теннис',
  'падел клуб',
];

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

// Генерация slug
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-zа-яё0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// Скачивание изображения
async function downloadImage(url: string, filename: string): Promise<string | null> {
  try {
    const imagesDir = path.join(process.cwd(), '..', 'frontend', 'public', 'images', 'courts');
    
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }

    const filePath = path.join(imagesDir, filename);
    
    if (fs.existsSync(filePath)) {
      return `/images/courts/${filename}`;
    }

    const response = await axios({
      method: 'GET',
      url,
      responseType: 'arraybuffer',
      timeout: 10000,
    });

    fs.writeFileSync(filePath, response.data);
    console.log(`    📷 Скачано изображение: ${filename}`);
    
    return `/images/courts/${filename}`;
  } catch (error) {
    return null;
  }
}

// Поиск через Google Places API (Text Search) с пагинацией
async function searchCourtsGoogle(query: string, city: string, nextPageToken?: string): Promise<{ results: any[], nextToken?: string }> {
  try {
    const params: any = {
      query: `${query} ${city} Russia`,
      key: GOOGLE_API_KEY,
      language: 'ru',
    };
    
    if (nextPageToken) {
      params.pagetoken = nextPageToken;
    }

    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/place/textsearch/json',
      {
        params,
        timeout: 15000,
      }
    );

    if (response.data.status === 'OK' || response.data.status === 'ZERO_RESULTS') {
      return {
        results: response.data.results || [],
        nextToken: response.data.next_page_token,
      };
    }
    
    console.log(`    ⚠️ Google API status: ${response.data.status}`);
    return { results: [], nextToken: undefined };
  } catch (error: any) {
    console.error(`    ❌ Ошибка Google API: ${error.message}`);
    return { results: [], nextToken: undefined };
  }
}

// Получение деталей места
async function getPlaceDetails(placeId: string): Promise<any> {
  try {
    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/place/details/json',
      {
        params: {
          place_id: placeId,
          key: GOOGLE_API_KEY,
          language: 'ru',
          fields: 'name,formatted_address,formatted_phone_number,opening_hours,photos,geometry,website,types',
        },
        timeout: 10000,
      }
    );

    if (response.data.status === 'OK') {
      return response.data.result;
    }
    return null;
  } catch (error) {
    return null;
  }
}

// Получение фото
async function getPhotoUrl(photoReference: string, maxWidth: number = 800): Promise<string> {
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${GOOGLE_API_KEY}`;
}

// Определение типа корта
function determineCourtType(name: string, types?: string[]): 'indoor' | 'outdoor' | 'mixed' {
  const text = name.toLowerCase();
  
  if (text.includes('indoor') || text.includes('крытый') || text.includes('зал')) {
    return 'indoor';
  }
  if (text.includes('outdoor') || text.includes('открытый') || text.includes('уличный')) {
    return 'outdoor';
  }
  return 'mixed';
}

// Извлечение города из адреса
function extractCity(address: string, defaultCity: string): string {
  const parts = address.split(',');
  for (const part of parts) {
    const trimmed = part.trim();
    for (const city of CITIES) {
      if (trimmed.includes(city.name)) {
        return city.name;
      }
    }
  }
  return defaultCity;
}

// Обработка одного места
async function processPlace(place: any, defaultCity: string, seenPlaceIds: Set<string>): Promise<{ added: boolean, updated: boolean }> {
  // Проверяем дубликаты
  if (seenPlaceIds.has(place.place_id)) {
    return { added: false, updated: false };
  }
  seenPlaceIds.add(place.place_id);

  // Проверяем, что это падел-корт
  const name = place.name || '';
  const types = place.types || [];
  const isPadel = 
    name.toLowerCase().includes('padel') ||
    name.toLowerCase().includes('падел');

  if (!isPadel) {
    return { added: false, updated: false };
  }

  // Получаем детали
  const details = await getPlaceDetails(place.place_id);
  
  const sourceUrl = `https://www.google.com/maps/place/?q=place_id:${place.place_id}`;
  
  // Проверяем, существует ли уже
  const existing = await prisma.court.findFirst({
    where: { sourceUrl },
  });

  // Координаты
  const lat = place.geometry?.location?.lat || 0;
  const lng = place.geometry?.location?.lng || 0;

  // Город
  const city = extractCity(place.formatted_address || '', defaultCity);

  // Телефон
  const phone = details?.formatted_phone_number || null;

  // Часы работы
  let workingHours = null;
  if (details?.opening_hours?.weekday_text) {
    workingHours = details.opening_hours.weekday_text.join(', ');
  }

  // Тип корта
  const courtType = determineCourtType(name, types);

  // Изображение
  let image = '/images/courts/placeholder.jpg';
  
  if (details?.photos && details.photos.length > 0) {
    const photoRef = details.photos[0].photo_reference;
    const photoUrl = await getPhotoUrl(photoRef);
    const filename = `${generateSlug(name)}_${Date.now()}.jpg`;
    const downloaded = await downloadImage(photoUrl, filename);
    if (downloaded) {
      image = downloaded;
    }
  }

  // Цены по умолчанию
  const prices = [
    { time: '09:00 – 18:00', weekday: 1500, weekend: 2000 },
    { time: '18:00 – 23:00', weekday: 2500, weekend: 3000 },
  ];

  const courtData = {
    slug: generateSlug(name),
    name,
    city,
    address: place.formatted_address || `${city}, адрес не указан`,
    coordinates: { lat, lng },
    type: courtType,
    amenities: ['Парковка', 'Душевые'],
    phone,
    workingHours,
    description: `Падел-корт в городе ${city}`,
    prices,
    image,
    source: 'google-places',
    sourceUrl,
  };

  if (existing) {
    await prisma.court.update({
      where: { id: existing.id },
      data: courtData,
    });
    console.log(`    ✏️ Обновлен: ${name} (${city})`);
    return { added: false, updated: true };
  } else {
    await prisma.court.create({
      data: courtData,
    });
    console.log(`    ✅ Добавлен: ${name} (${city})`);
    return { added: true, updated: false };
  }
}

// Основная функция парсинга
export async function scrapeAllCourts() {
  console.log('🎾 Начинаем парсинг падел-кортов по городам РФ...\n');
  
  if (!GOOGLE_API_KEY) {
    throw new Error('GOOGLE_PLACES_API_KEY не найден в .env');
  }

  let totalFound = 0;
  let totalAdded = 0;
  let totalUpdated = 0;
  const seenPlaceIds = new Set<string>();

  for (const city of CITIES) {
    console.log(`\n📍 Город: ${city.name}`);
    
    for (const query of SEARCH_QUERIES) {
      console.log(`  🔍 Поиск: "${query}" в ${city.name}`);
      
      let nextPageToken: string | undefined = undefined;
      let pageCount = 0;
      const maxPages = 3; // Максимум 3 страницы на запрос
      const cityQueryAdded = { added: 0, updated: 0, found: 0 };
      
      do {
        const { results, nextToken } = await searchCourtsGoogle(query, city.name, nextPageToken);
        
        if (results.length === 0) break;
        
        cityQueryAdded.found += results.length;
        totalFound += results.length;
        
        for (const place of results) {
          const result = await processPlace(place, city.name, seenPlaceIds);
          if (result.added) {
            cityQueryAdded.added++;
            totalAdded++;
          }
          if (result.updated) {
            cityQueryAdded.updated++;
            totalUpdated++;
          }
          
          // Задержка между запросами
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        nextPageToken = nextToken;
        pageCount++;
        
        // Задержка перед следующим запросом с пагинацией
        if (nextPageToken) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } while (nextPageToken && pageCount < maxPages);
      
      if (cityQueryAdded.found > 0) {
        console.log(`    📊 "${query}": найдено ${cityQueryAdded.found}, добавлено ${cityQueryAdded.added}, обновлено ${cityQueryAdded.updated}`);
      }
      
      // Задержка между запросами
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // Итоги
  console.log('\n' + '='.repeat(50));
  console.log('📊 ИТОГИ ПАРСИНГА:');
  console.log(`  Найдено мест: ${totalFound}`);
  console.log(`  Добавлено кортов: ${totalAdded}`);
  console.log(`  Обновлено кортов: ${totalUpdated}`);
  
  const total = await prisma.court.count();
  console.log(`  Всего кортов в БД: ${total}`);
  console.log('='.repeat(50));
}

// Запуск если вызван напрямую
if (require.main === module) {
  scrapeAllCourts()
    .then(() => {
      console.log('\n✅ Парсинг завершен!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Ошибка парсинга:', error);
      process.exit(1);
    });
}