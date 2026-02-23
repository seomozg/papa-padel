import 'dotenv/config';
import axios from 'axios';
import { prisma } from '../src/config/database';

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

interface PerplexityResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

async function enrichCourt(court: any): Promise<{ phone: string | null; image: string | null; description: string | null }> {
  if (!PERPLEXITY_API_KEY) {
    console.log('  ⚠️ PERPLEXITY_API_KEY не найден');
    return { phone: null, image: null, description: null };
  }

  try {
    const prompt = `Найди информацию о падел-корт "${court.name}" в городе ${court.city}, Россия.
Верни JSON с полями:
- phone: телефон для связи (формат: +7 XXX XXX-XX-XX)
- image: URL фото корта (если есть)
- description: краткое описание (2-3 предложения)

Если информации нет, верни null для этого поля.
Верни ТОЛЬКО JSON без markdown.`;

    const response = await axios.post<PerplexityResponse>(
      'https://api.perplexity.ai/chat/completions',
      {
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: 'Ты помощник, который ищет информацию о спортивных объектах. Возвращай только JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
      },
      {
        headers: {
          'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const content = response.data.choices[0]?.message?.content || '';
    
    // Парсим JSON из ответа
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);
      return {
        phone: data.phone || null,
        image: data.image || null,
        description: data.description || null,
      };
    }
    
    return { phone: null, image: null, description: null };
  } catch (error: any) {
    console.error(`  ❌ Ошибка Perplexity: ${error.message}`);
    return { phone: null, image: null, description: null };
  }
}

async function main() {
  console.log('🔄 Обогащение данных кортов через Perplexity...\n');
  
  // Получаем корты без телефона
  const courts = await prisma.court.findMany({
    where: {
      OR: [
        { phone: null },
        { image: '/images/courts/placeholder.jpg' },
      ]
    },
    take: 60, // Все корты
  });
  
  console.log(`Найдено ${courts.length} кортов для обогащения\n`);
  
  let updated = 0;
  
  for (const court of courts) {
    console.log(`📍 ${court.name} (${court.city})`);
    
    const data = await enrichCourt(court);
    
    if (data.phone || data.image || data.description) {
      await prisma.court.update({
        where: { id: court.id },
        data: {
          phone: data.phone,
          image: data.image || court.image,
          description: data.description || court.description,
        },
      });
      console.log(`  ✅ Обновлено: тел=${data.phone || 'нет'}, фото=${data.image ? 'да' : 'нет'}`);
      updated++;
    } else {
      console.log(`  ⏭️ Данные не найдены`);
    }
    
    // Пауза чтобы не превысить лимит API
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`📊 ИТОГИ:`);
  console.log(`  Обновлено: ${updated}`);
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