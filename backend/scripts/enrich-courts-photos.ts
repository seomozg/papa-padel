import 'dotenv/config';
import axios from 'axios';
import { prisma } from '../src/config/database';
import * as fs from 'fs';
import * as path from 'path';

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

async function searchPlace(court: any): Promise<string | null> {
  if (!GOOGLE_PLACES_API_KEY) {
    console.log('  ⚠️ GOOGLE_PLACES_API_KEY не найден');
    return null;
  }

  try {
    // Text Search API
    const query = `${court.name} ${court.city} padel`;
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_PLACES_API_KEY}`;
    
    const response = await axios.get(url, { timeout: 10000 });
    
    if (response.data.results && response.data.results.length > 0) {
      const place = response.data.results[0];
      return place.place_id;
    }
    
    return null;
  } catch (error: any) {
    console.error(`  ❌ Ошибка поиска: ${error.message}`);
    return null;
  }
}

async function getPlacePhoto(placeId: string): Promise<string | null> {
  if (!GOOGLE_PLACES_API_KEY) return null;

  try {
    // Place Details API с photos
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photos&key=${GOOGLE_PLACES_API_KEY}`;
    
    const response = await axios.get(url, { timeout: 10000 });
    
    if (response.data.result?.photos && response.data.result.photos.length > 0) {
      const photo = response.data.result.photos[0];
      const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photo.photo_reference}&key=${GOOGLE_PLACES_API_KEY}`;
      return photoUrl;
    }
    
    return null;
  } catch (error: any) {
    console.error(`  ❌ Ошибка фото: ${error.message}`);
    return null;
  }
}

async function downloadImage(url: string, filename: string): Promise<string> {
  const imagesDir = path.join(__dirname, '../../frontend/public/images/courts');
  
  // Создаём директорию если нет
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }
  
  const filepath = path.join(imagesDir, filename);
  
  const response = await axios.get(url, { 
    responseType: 'arraybuffer',
    timeout: 15000
  });
  
  fs.writeFileSync(filepath, response.data);
  
  return `/images/courts/${filename}`;
}

async function main() {
  console.log('📸 Обогащение фото кортов через Google Places...\n');
  
  const courts = await prisma.court.findMany({
    where: {
      image: '/images/courts/placeholder.jpg',
    },
    take: 30,
  });
  
  console.log(`Найдено ${courts.length} кортов без фото\n`);
  
  let updated = 0;
  
  for (const court of courts) {
    console.log(`📍 ${court.name} (${court.city})`);
    
    // Ищем place_id
    const placeId = await searchCourt(court);
    
    if (!placeId) {
      console.log(`  ⏭️ Place не найден`);
      await new Promise(resolve => setTimeout(resolve, 500));
      continue;
    }
    
    // Получаем фото
    const photoUrl = await getPlacePhoto(placeId);
    
    if (photoUrl) {
      try {
        const filename = `${court.slug}.jpg`;
        const localPath = await downloadImage(photoUrl, filename);
        
        await prisma.court.update({
          where: { id: court.id },
          data: { image: localPath },
        });
        
        console.log(`  ✅ Фото сохранено: ${localPath}`);
        updated++;
      } catch (error: any) {
        console.log(`  ❌ Ошибка загрузки: ${error.message}`);
      }
    } else {
      console.log(`  ⏭️ Фото нет`);
    }
    
    // Пауза для API
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`📊 ИТОГИ:`);
  console.log(`  Обновлено: ${updated}`);
  console.log('='.repeat(50));
}

// Временная функция для поиска
async function searchCourt(court: any): Promise<string | null> {
  if (!GOOGLE_PLACES_API_KEY) return null;

  try {
    const query = `${court.name} ${court.city} padel`;
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_PLACES_API_KEY}`;
    
    const response = await axios.get(url, { timeout: 10000 });
    
    if (response.data.results && response.data.results.length > 0) {
      return response.data.results[0].place_id;
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

main()
  .then(() => {
    console.log('\n✅ Готово!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Ошибка:', error);
    process.exit(1);
  });