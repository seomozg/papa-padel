import 'dotenv/config';
import axios from 'axios';
import { prisma } from '../src/config/database';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

// Очистка контента через DeepSeek
async function cleanContentWithAI(content: string): Promise<string> {
  if (!DEEPSEEK_API_KEY) {
    return content;
  }

  try {
    const response = await axios.post(
      DEEPSEEK_API_URL,
      {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `Ты редактор. Твоя задача - очистить текст статьи от мусора:
- Удали навигацию, меню, подписки
- Удали "FOLLOW", "Share", "next article", "Latest news", "Related articles"
- Удали GTM коды, iframe, соцсети
- Оставь только основной содержательный контент

Верни только чистый текст статьи.`,
          },
          {
            role: 'user',
            content: content,
          },
        ],
        max_tokens: 3000,
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

    return response.data.choices[0]?.message?.content || content;
  } catch (error: any) {
    console.error(`  ❌ Ошибка: ${error.message}`);
    return content;
  }
}

async function main() {
  console.log('🧹 Очистка статей от мусора...\n');

  // Получаем все статьи
  const articles = await prisma.article.findMany({
    select: { id: true, title: true, content: true, excerpt: true },
  });

  console.log(`Найдено статей: ${articles.length}\n`);

  let cleaned = 0;

  for (const article of articles) {
    // Проверяем, есть ли мусор в контенте
    const hasGarbage = 
      article.content.includes('iframe') ||
      article.content.includes('GTM-') ||
      article.content.includes('FOLLOW') ||
      article.content.includes('googletagmanager') ||
      article.content.includes('next article') ||
      article.content.includes('Latest news') ||
      article.content.includes('```html');

    if (!hasGarbage) {
      continue;
    }

    console.log(`🧹 Очистка: ${article.title.substring(0, 50)}...`);

    // Очищаем контент
    const cleanedContent = await cleanContentWithAI(article.content);
    const cleanedExcerpt = await cleanContentWithAI(article.excerpt);

    // Обновляем статью
    await prisma.article.update({
      where: { id: article.id },
      data: {
        content: cleanedContent,
        excerpt: cleanedExcerpt.substring(0, 300),
      },
    });

    cleaned++;
    console.log(`  ✅ Очищена`);

    // Задержка между запросами
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`\n📊 Итого очищено: ${cleaned} статей`);
  console.log('✅ Готово!');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  });