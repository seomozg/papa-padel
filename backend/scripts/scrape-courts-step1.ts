import 'dotenv/config';
import axios from 'axios';
import * as fs from 'fs';
import { prisma } from '../src/config/database';

// Города РФ для поиска
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
  { name: 'Рязань', lat: 54.6269, lng: 39.6916 },
  { name: 'Липецк', lat: 52.6088, lng: 39.5994 },
  { name: 'Курск', lat: 51.7304, lng: 36.1926 },
  { name: 'Белгород', lat: 50.5957, lng: 36.5888 },
  { name: 'Владимир', lat: 56.1291, lng: 40.4066 },
  { name: 'Тверь', lat: 56.8587, lng: 35.9176 },
  { name: 'Калуга', lat: 54.5138, lng: 36.2613 },
  { name: 'Брянск', lat: 53.2433, lng: 34.3637 },
  { name: 'Иваново', lat: 56.9972, lng: 40.9714 },
  { name: 'Смоленск', lat: 54.7825, lng: 32.0402 },
  { name: 'Орёл', lat: 52.9685, lng: 36.0695 },
  { name: 'Кострома', lat: 57.7679, lng: 40.9269 },
  { name: 'Пенза', lat: 53.1951, lng: 45.0188 },
  { name: 'Киров', lat: 58.6035, lng: 49.6666 },
  { name: 'Чебоксары', lat: 56.1439, lng: 47.2488 },
  { name: 'Набережные Челны', lat: 55.7431, lng: 52.3958 },
  { name: 'Новороссийск', lat: 44.7238, lng: 37.7687 },
  { name: 'Ставрополь', lat: 45.0428, lng: 41.9734 },
  { name: 'Астрахань', lat: 46.3497, lng: 48.0408 },
  { name: 'Петрозаводск', lat: 61.7878, lng: 34.3620 },
  { name: 'Мурманск', lat: 68.9585, lng: 33.0827 },
  { name: 'Архангельск', lat: 64.5394, lng: 40.5170 },
  { name: 'Сыктывкар', lat: 61.6686, lng: 50.8357 },
  { name: 'Вологда', lat: 59.2182, lng: 39.8897 },
  { name: 'Великий Новгород', lat: 58.5215, lng: 31.2755 },
  { name: 'Псков', lat: 57.8193, lng: 28.3317 },
  { name: 'Южно-Сахалинск', lat: 46.9591, lng: 142.7331 },
  { name: 'Благовещенск', lat: 50.2639, lng: 127.5266 },
  { name: 'Хабаровск', lat: 48.4726, lng: 135.0550 },
  { name: 'Чита', lat: 52.0339, lng: 113.5009 },
  { name: 'Улан-Удэ', lat: 51.8335, lng: 107.5841 },
  { name: 'Красноярск', lat: 56.0153, lng: 92.8932 },
  { name: 'Абакан', lat: 53.7156, lng: 91.4292 },
  { name: 'Кызыл', lat: 51.7143, lng: 94.4534 },
  { name: 'Горно-Алтайск', lat: 51.9608, lng: 85.9610 },
  { name: 'Биробиджан', lat: 48.7937, lng: 132.9230 },
  { name: 'Нальчик', lat: 43.5030, lng: 43.6184 },
  { name: 'Владикавказ', lat: 43.0367, lng: 44.6678 },
  { name: 'Грозный', lat: 43.3178, lng: 45.6950 },
  { name: 'Майкоп', lat: 44.6098, lng: 40.1065 },
  { name: 'Элиста', lat: 46.3080, lng: 44.2610 },
  { name: 'Астрахань', lat: 46.3497, lng: 48.0408 },
  { name: 'Якутск', lat: 62.0355, lng: 129.6755 },
  { name: 'Петропавловск-Камчатский', lat: 53.0444, lng: 158.6480 },
  { name: 'Магадан', lat: 59.5631, lng: 150.8035 },
  { name: 'Нарьян-Мар', lat: 67.6384, lng: 53.0050 },
  { name: 'Анадырь', lat: 64.7333, lng: 177.5167 },
  { name: 'Салехард', lat: 66.5300, lng: 66.6050 },
];

// Поисковые запросы
const SEARCH_QUERIES = [
  'padel court',
  'padel tennis',
  'padel club',
  'падел корт',
  'падел теннис',
  'падел клуб',
  'падел',
  'padel',
];

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  city: string;
  query: string;
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
    
    return { results: [], nextToken: undefined };
  } catch (error: any) {
    console.error(`    ❌ Ошибка: ${error.message}`);
    return { results: [], nextToken: undefined };
  }
}

// Проверка, что это падел-корт
function isPadelPlace(name: string): boolean {
  const nameLower = name.toLowerCase();
  return nameLower.includes('padel') || nameLower.includes('падел');
}

// Извлечение города из адреса
function extractCity(address: string, defaultCity: string): string {
  for (const city of CITIES) {
    if (address.includes(city.name)) {
      return city.name;
    }
  }
  return defaultCity;
}

// Основная функция - Шаг 1: Сбор всех place_id
async function collectAllPlaceIds() {
  console.log('📋 ШАГ 1: Сбор всех place_id падел-кортов...\n');
  
  if (!GOOGLE_API_KEY) {
    throw new Error('GOOGLE_PLACES_API_KEY не найден в .env');
  }

  const allPlaces: PlaceResult[] = [];
  const seenPlaceIds = new Set<string>();
  let totalQueries = 0;

  for (const city of CITIES) {
    console.log(`\n📍 Город: ${city.name}`);
    
    for (const query of SEARCH_QUERIES) {
      let nextPageToken: string | undefined = undefined;
      let pageCount = 0;
      const maxPages = 3;
      let cityQueryCount = 0;
      
      do {
        const { results, nextToken } = await searchCourtsGoogle(query, city.name, nextPageToken);
        totalQueries++;
        
        for (const place of results) {
          // Проверяем дубликаты
          if (seenPlaceIds.has(place.place_id)) continue;
          
          // Проверяем, что это падел
          if (!isPadelPlace(place.name)) continue;
          
          seenPlaceIds.add(place.place_id);
          
          const placeCity = extractCity(place.formatted_address || '', city.name);
          
          allPlaces.push({
            place_id: place.place_id,
            name: place.name,
            formatted_address: place.formatted_address,
            city: placeCity,
            query: query,
          });
          
          cityQueryCount++;
        }
        
        nextPageToken = nextToken;
        pageCount++;
        
        // Задержка перед следующим запросом с пагинацией
        if (nextPageToken) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } while (nextPageToken && pageCount < maxPages);
      
      if (cityQueryCount > 0) {
        console.log(`  "${query}": +${cityQueryCount} кортов`);
      }
      
      // Задержка между запросами
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }

  // Сохраняем результаты в файл
  const outputPath = './scripts/places-cache.json';
  fs.writeFileSync(outputPath, JSON.stringify(allPlaces, null, 2));
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 ИТОГИ ШАГА 1:');
  console.log(`  Всего запросов к API: ${totalQueries}`);
  console.log(`  Найдено уникальных кортов: ${allPlaces.length}`);
  console.log(`  Результаты сохранены в: ${outputPath}`);
  console.log('='.repeat(50));
  
  // Группировка по городам
  const byCity: Record<string, number> = {};
  for (const place of allPlaces) {
    byCity[place.city] = (byCity[place.city] || 0) + 1;
  }
  
  console.log('\n📊 Распределение по городам:');
  for (const [city, count] of Object.entries(byCity).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${city}: ${count}`);
  }
  
  return allPlaces;
}

collectAllPlaceIds()
  .then(() => {
    console.log('\n✅ Шаг 1 завершен! Запустите шаг 2 для получения деталей.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Ошибка:', error);
    process.exit(1);
  });