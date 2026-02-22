import 'dotenv/config';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { prisma } from '../src/config/database';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

// Извлечение данных с сайта через DeepSeek
async function extractCourtData(html: string, courtName: string): Promise<any> {
  if (!DEEPSEEK_API_KEY) {
    throw new Error('DEEPSEEK_API_KEY не найден');
  }

  try {
    const response = await axios.post(
      DEEPSEEK_API_URL,
      {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `Ты анализируешь HTML страницу падел-корта и извлекаешь структурированные данные.

Извлеки следующую информацию:
1. prices - массив с ценами. Формат: [{ time: "время", weekday: цена_будни, weekend: цена_выходные }]
2. amenities - массив удобств. Возможные: "Парковка", "Душевые", "Прокат ракеток", "Кафе", "Инструктор", "Wi-Fi", "Магазин", "Раздевалка", "Сауна"
3. description - описание клуба (2-3 предложения)
4. courtsCount - количество кортов (число)

Если информации нет на странице - используй null для этого поля.

Верни ТОЛЬКО валидный JSON без объяснений.`,
          },
          {
            role: 'user',
            content: `Название корта: ${courtName}\n\nHTML:\n${html.substring(0, 15000)}`,
          },
        ],
        max_tokens: 2000,
        temperature: 0.1,
      },
      {
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      }
    );

    const content = response.data.choices[0]?.message?.content || '{}';
    
    // Парсим JSON из ответа
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return JSON.parse(content);
  } catch (error: any) {
    console.error(`  ❌ Ошибка DeepSeek: ${error.message}`);
    return null;
  }
}

// Загрузка страницы
async function fetchPage(url: string): Promise<string> {
  try {
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });
    return response.data;
  } catch (error: any) {
    console.error(`  ❌ Ошибка загрузки ${url}: ${error.message}`);
    return '';
  }
}

// Извлечение сайта из sourceUrl
function extractWebsite(sourceUrl: string): string | null {
  try {
    const url = new URL(sourceUrl);
    // Для Google Maps ссылок ищем реальный сайт
    if (url.hostname.includes('google.com')) {
      return null; // Нужно искать отдельно
    }
    return `${url.protocol}//${url.hostname}`;
  } catch {
    return null;
  }
}

// Поиск сайта корта
async function findCourtWebsite(courtName: string, city: string): Promise<string | null> {
  // Сначала пробуем известные сайты
  const knownSites: Record<string, string> = {
    'Jet Arena': 'https://jetarena.ru',
    'Padel PRO': 'https://padelpro.ru',
    'Padel Friends': 'https://padelfriends.ru',
    'Padel Park': 'https://padelpark.ru',
    'Padel Space': 'https://padelspace.ru',
    'WIN WIN Padel Club': 'https://winwinpadel.ru',
    'Padel Battle': 'https://padelbattle.ru',
    'Padel del Norte': 'https://padeldelnorte.ru',
  };

  for (const [name, url] of Object.entries(knownSites)) {
    if (courtName.toLowerCase().includes(name.toLowerCase())) {
      return url;
    }
  }

  // Ищем через Google
  try {
    const query = encodeURIComponent(`${courtName} ${city} официальный сайт`);
    const response = await axios.get(
      `https://www.google.com/search?q=${query}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 10000,
      }
    );

    const $ = cheerio.load(response.data);
    const firstResult = $('a[href^="/url?q="]').first();
    if (firstResult) {
      const href = firstResult.attr('href') || '';
      const match = href.match(/url\?q=([^&]+)/);
      if (match) {
        return decodeURIComponent(match[1]).split('&')[0];
      }
    }
  } catch (error) {
    // Игнорируем ошибки поиска
  }

  return null;
}

async function main() {
  console.log('🎾 Обогащение данных о кортах...\n');

  // Получаем все корты
  const courts = await prisma.court.findMany({
    select: { id: true, name: true, city: true, sourceUrl: true },
  });

  console.log(`Найдено кортов: ${courts.length}\n`);

  let enriched = 0;
  let skipped = 0;

  for (const court of courts) {
    console.log(`\n📍 Обработка: ${court.name} (${court.city})`);

    // Ищем сайт корта
    let website = await findCourtWebsite(court.name, court.city);
    
    if (!website) {
      console.log(`  ⚠️ Сайт не найден, пропускаем`);
      skipped++;
      continue;
    }

    console.log(`  🌐 Сайт: ${website}`);

    // Загружаем страницу
    const html = await fetchPage(website);
    
    if (!html) {
      console.log(`  ❌ Не удалось загрузить страницу`);
      skipped++;
      continue;
    }

    // Извлекаем данные через DeepSeek
    console.log(`  🤖 Извлечение данных через DeepSeek...`);
    const data = await extractCourtData(html, court.name);

    if (!data) {
      console.log(`  ❌ Не удалось извлечь данные`);
      skipped++;
      continue;
    }

    // Обновляем корт
    const updateData: any = {};
    
    if (data.prices && Array.isArray(data.prices) && data.prices.length > 0) {
      updateData.prices = data.prices;
    }
    
    if (data.amenities && Array.isArray(data.amenities) && data.amenities.length > 0) {
      updateData.amenities = data.amenities;
    }
    
    if (data.description && typeof data.description === 'string') {
      updateData.description = data.description;
    }
    
    if (data.courtsCount && typeof data.courtsCount === 'number') {
      updateData.courtsCount = data.courtsCount;
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.court.update({
        where: { id: court.id },
        data: updateData,
      });
      
      console.log(`  ✅ Обновлено: ${Object.keys(updateData).join(', ')}`);
      enriched++;
    } else {
      console.log(`  ⚠️ Данные не найдены`);
      skipped++;
    }

    // Задержка между запросами
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 ИТОГИ:');
  console.log(`  Обогащено: ${enriched}`);
  console.log(`  Пропущено: ${skipped}`);
  console.log('='.repeat(50));
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