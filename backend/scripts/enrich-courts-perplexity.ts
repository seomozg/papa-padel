import 'dotenv/config';
import axios from 'axios';
import { prisma } from '../src/config/database';

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

// Поиск информации о корте через Perplexity
async function searchCourtInfo(courtName: string, city: string): Promise<any> {
  if (!PERPLEXITY_API_KEY) {
    throw new Error('PERPLEXITY_API_KEY не найден');
  }

  try {
    const response = await axios.post(
      PERPLEXITY_API_URL,
      {
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: `Ты помощник по поиску информации о падел-кортах в России. 
Твоя задача - найти актуальную информацию о клубе и вернуть её в формате JSON.
Если точной информации нет - используй типичные значения для региона.`,
          },
          {
            role: 'user',
            content: `Найди информацию о падел-клубе "${courtName}" в городе ${city}, Россия.

Мне нужны следующие данные:
1. prices - массив с ценами на аренду корта в рублях. Формат: [{ time: "时间段", weekday: цена_будни, weekend: цена_выходные }]
   Типичные временные слоты: "07:00-12:00", "12:00-17:00", "17:00-23:00"
2. amenities - массив удобств клуба. Возможные: "Парковка", "Душевые", "Прокат ракеток", "Кафе", "Инструктор", "Wi-Fi", "Магазин", "Раздевалка", "Сауна", "Бассейн"
3. description - описание клуба (2-3 предложения на русском)
4. courtsCount - количество кортов (число)

Верни ТОЛЬКО валидный JSON без markdown и объяснений:
{
  "prices": [...],
  "amenities": [...],
  "description": "...",
  "courtsCount": число
}`,
          },
        ],
        max_tokens: 1000,
        temperature: 0.2,
      },
      {
        headers: {
          'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const content = response.data.choices[0]?.message?.content || '{}';
    console.log(`  📝 Ответ: ${content.substring(0, 200)}...`);
    
    // Парсим JSON из ответа
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return JSON.parse(content);
  } catch (error: any) {
    console.error(`  ❌ Ошибка Perplexity: ${error.message}`);
    if (error.response?.data) {
      console.error(`  📄 Детали: ${JSON.stringify(error.response.data)}`);
    }
    return null;
  }
}

async function main() {
  console.log('🎾 Обогащение данных о кортах через Perplexity...\n');

  // Получаем все корты
  const courts = await prisma.court.findMany({
    select: { id: true, name: true, city: true },
  });

  console.log(`Найдено кортов: ${courts.length}\n`);

  let enriched = 0;
  let failed = 0;

  for (const court of courts) {
    console.log(`\n📍 Обработка: ${court.name} (${court.city})`);

    // Ищем информацию через Perplexity
    console.log(`  🔍 Поиск информации...`);
    const data = await searchCourtInfo(court.name, court.city);

    if (!data) {
      console.log(`  ❌ Не удалось получить данные`);
      failed++;
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
      failed++;
    }

    // Задержка между запросами (чтобы не превысить лимит)
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 ИТОГИ:');
  console.log(`  Обогащено: ${enriched}`);
  console.log(`  Ошибок: ${failed}`);
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