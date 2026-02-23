import 'dotenv/config';
import axios from 'axios';
import { prisma } from '../src/config/database';
import * as fs from 'fs';
import * as path from 'path';

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

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

// Транслитерация
function transliterate(text: string): string {
  const map: Record<string, string> = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
    'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
    'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
    ' ': '-', ',': '', '.': '', '(': '', ')': '', '"': '', "'": '',
  };
  return text.toLowerCase().split('').map(c => map[c] || c).join('')
    .replace(/-+/g, '-').replace(/[^a-z0-9-]/g, '').substring(0, 50);
}

// Поиск мест через Google Places
async function searchPlaces(city: { name: string; lat: number; lng: number }): Promise<any[]> {
  if (!GOOGLE_PLACES_API_KEY) {
    console.log('  ⚠️ GOOGLE_PLACES_API_KEY не найден');
    return [];
  }

  const results: any[] = [];
  const queries = ['padel court', 'падел корт', 'padel tennis'];
  
  for (const query of queries) {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query + ' ' + city.name + ' Russia')}&location=${city.lat},${city.lng}&radius=50000&key=${GOOGLE_PLACES_API_KEY}`;
      
      const response = await axios.get(url, { timeout: 15000 });
      
      if (response.data.results) {
        for (const place of response.data.results) {
          // Фильтруем только падел-корты
          const name = place.name.toLowerCase();
          if (name.includes('padel') || name.includes('падел')) {
            results.push(place);
          }
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error: any) {
      console.error(`  ❌ Ошибка поиска: ${error.message}`);
    }
  }
  
  // Убираем дубликаты по place_id
  const unique = results.filter((place, index, self) =>
    index === self.findIndex(p => p.place_id === place.place_id)
  );
  
  return unique;
}

// Получение деталей места
async function getPlaceDetails(placeId: string): Promise<any> {
  if (!GOOGLE_PLACES_API_KEY) return null;

  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photos,formatted_phone_number,opening_hours,website&key=${GOOGLE_PLACES_API_KEY}`;
    const response = await axios.get(url, { timeout: 10000 });
    return response.data.result;
  } catch (error) {
    return null;
  }
}

// Обогащение через Perplexity
async function enrichWithPerplexity(court: any): Promise<{ phone: string | null; description: string | null }> {
  if (!PERPLEXITY_API_KEY) return { phone: null, description: null };

  try {
    const prompt = `Найди информацию о падел-корт "${court.name}" в городе ${court.city}, Россия.
Верни JSON: {"phone": "телефон или null", "description": "описание 2-3 предложения или null"}
Только JSON без markdown.`;

    const response = await axios.post(
      'https://api.perplexity.ai/chat/completions',
      {
        model: 'sonar',
        messages: [
          { role: 'system', content: 'Ты помощник. Возвращай только JSON.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 300,
      },
      {
        headers: { 'Authorization': `Bearer ${PERPLEXITY_API_KEY}`, 'Content-Type': 'application/json' },
        timeout: 20000,
      }
    );

    const content = response.data.choices[0]?.message?.content || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);
      return { phone: data.phone || null, description: data.description || null };
    }
  } catch (error) {
    // Silent fail
  }
  return { phone: null, description: null };
}

// Скачивание фото
async function downloadPhoto(photoRef: string, filename: string): Promise<string> {
  const imagesDir = path.join(__dirname, '../../frontend/public/images/courts');
  if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });
  
  const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photoRef}&key=${GOOGLE_PLACES_API_KEY}`;
  const filepath = path.join(imagesDir, filename);
  
  const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
  fs.writeFileSync(filepath, response.data);
  
  return `/images/courts/${filename}`;
}

// Генерация slug
function generateSlug(name: string, id: string): string {
  const base = transliterate(name);
  return `${base}-${id.substring(0, 8)}`;
}

// Основная функция
async function main() {
  console.log('🎾 Парсинг падел-кортов через Google Places...\n');
  
  const seenIds = new Set<string>();
  let added = 0;

  for (const city of CITIES) {
    console.log(`📍 ${city.name}`);
    
    const places = await searchPlaces(city);
    console.log(`  Найдено: ${places.length} падел-кортов`);
    
    for (const place of places) {
      if (seenIds.has(place.place_id)) continue;
      seenIds.add(place.place_id);
      
      const name = place.name;
      const address = place.formatted_address || `${city.name}, адрес не указан`;
      const lat = place.geometry?.location?.lat || 0;
      const lng = place.geometry?.location?.lng || 0;
      const rating = place.rating || 0;
      const reviewCount = place.user_ratings_total || 0;
      
      // Получаем детали
      const details = await getPlaceDetails(place.place_id);
      
      let phone = details?.formatted_phone_number || null;
      let workingHours = null;
      let imagePath = '/images/courts/placeholder.jpg';
      
      if (details?.opening_hours?.weekday_text) {
        workingHours = details.opening_hours.weekday_text.join('; ');
      }
      
      // Фото
      if (details?.photos && details.photos.length > 0) {
        try {
          const filename = `${transliterate(name)}-${place.place_id.substring(0, 8)}.jpg`;
          imagePath = await downloadPhoto(details.photos[0].photo_reference, filename);
        } catch (e) {}
      }
      
      // Обогащение через Perplexity если нет телефона
      if (!phone) {
        const enriched = await enrichWithPerplexity({ name, city: city.name });
        phone = enriched.phone;
      }
      
      const courtId = `gp-${place.place_id}`;
      
      try {
        await prisma.court.create({
          data: {
            slug: generateSlug(name, courtId),
            name,
            city: city.name,
            address,
            coordinates: { lat, lng },
            type: 'mixed',
            amenities: ['Парковка', 'Душевые'],
            phone,
            workingHours,
            description: `Падел-корт в городе ${city.name}`,
            prices: [
              { time: '09:00 – 18:00', weekday: 1500, weekend: 2000 },
              { time: '18:00 – 23:00', weekday: 2500, weekend: 3000 },
            ],
            image: imagePath,
            rating,
            reviewCount,
            source: 'google_places',
            sourceUrl: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
          },
        });
        console.log(`    ✅ ${name}`);
        added++;
      } catch (e) {}
      
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n' + '='.repeat(50));
  console.log(`📊 ИТОГИ:`);
  console.log(`  Добавлено: ${added}`);
  console.log(`  Всего в БД: ${await prisma.court.count()}`);
  console.log('='.repeat(50));
}

main()
  .then(() => { console.log('\n✅ Готово!'); process.exit(0); })
  .catch((error) => { console.error('\n❌ Ошибка:', error); process.exit(1); });