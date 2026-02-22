import 'dotenv/config';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { prisma } from '../src/config/database';

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  city: string;
  query: string;
}

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
    console.log(`      📷 Скачано: ${filename}`);
    
    return `/images/courts/${filename}`;
  } catch (error) {
    return null;
  }
}

// Получение фото URL
async function getPhotoUrl(photoReference: string, maxWidth: number = 800): Promise<string> {
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${GOOGLE_API_KEY}`;
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

// Определение типа корта
function determineCourtType(name: string): 'indoor' | 'outdoor' | 'mixed' {
  const text = name.toLowerCase();
  
  if (text.includes('indoor') || text.includes('крытый') || text.includes('зал')) {
    return 'indoor';
  }
  if (text.includes('outdoor') || text.includes('открытый') || text.includes('уличный')) {
    return 'outdoor';
  }
  return 'mixed';
}

// Основная функция - Шаг 2: Получение деталей
async function fetchAllDetails() {
  console.log('📋 ШАГ 2: Получение деталей для каждого корта...\n');
  
  if (!GOOGLE_API_KEY) {
    throw new Error('GOOGLE_PLACES_API_KEY не найден в .env');
  }

  // Загружаем список place_id из шага 1
  const cachePath = './scripts/places-cache.json';
  if (!fs.existsSync(cachePath)) {
    throw new Error('Файл places-cache.json не найден. Сначала запустите шаг 1.');
  }

  const places: PlaceResult[] = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
  console.log(`Найдено ${places.length} кортов в кэше\n`);

  let added = 0;
  let updated = 0;
  let errors = 0;

  for (let i = 0; i < places.length; i++) {
    const place = places[i];
    console.log(`[${i + 1}/${places.length}] ${place.name} (${place.city})`);

    const sourceUrl = `https://www.google.com/maps/place/?q=place_id:${place.place_id}`;
    
    // Проверяем, существует ли уже
    const existing = await prisma.court.findFirst({
      where: { sourceUrl },
    });

    // Получаем детали
    const details = await getPlaceDetails(place.place_id);
    
    if (!details) {
      console.log('  ⚠️ Не удалось получить детали');
      errors++;
      await new Promise(resolve => setTimeout(resolve, 200));
      continue;
    }

    // Координаты
    const lat = details.geometry?.location?.lat || 0;
    const lng = details.geometry?.location?.lng || 0;

    // Телефон
    const phone = details.formatted_phone_number || null;

    // Часы работы
    let workingHours = null;
    if (details.opening_hours?.weekday_text) {
      workingHours = details.opening_hours.weekday_text.join(', ');
    }

    // Тип корта
    const courtType = determineCourtType(place.name);

    // Изображение
    let image = '/images/courts/placeholder.jpg';
    
    if (details.photos && details.photos.length > 0) {
      const photoRef = details.photos[0].photo_reference;
      const photoUrl = await getPhotoUrl(photoRef);
      const filename = `${generateSlug(place.name)}_${Date.now()}.jpg`;
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
      slug: generateSlug(place.name),
      name: place.name,
      city: place.city,
      address: details.formatted_address || place.formatted_address || `${place.city}, адрес не указан`,
      coordinates: { lat, lng },
      type: courtType,
      amenities: ['Парковка', 'Душевые'],
      phone,
      workingHours,
      description: `Падел-корт в городе ${place.city}`,
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
      console.log('  ✏️ Обновлен');
      updated++;
    } else {
      await prisma.court.create({
        data: courtData,
      });
      console.log('  ✅ Добавлен');
      added++;
    }

    // Задержка между запросами
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  // Итоги
  console.log('\n' + '='.repeat(50));
  console.log('📊 ИТОГИ ШАГА 2:');
  console.log(`  Обработано: ${places.length}`);
  console.log(`  Добавлено: ${added}`);
  console.log(`  Обновлено: ${updated}`);
  console.log(`  Ошибок: ${errors}`);
  
  const total = await prisma.court.count();
  console.log(`  Всего кортов в БД: ${total}`);
  console.log('='.repeat(50));
}

fetchAllDetails()
  .then(() => {
    console.log('\n✅ Шаг 2 завершен! Запустите шаг 3 для обогащения.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Ошибка:', error);
    process.exit(1);
  });