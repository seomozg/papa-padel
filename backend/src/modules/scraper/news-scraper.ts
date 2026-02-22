import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';
import { prisma } from '../../config/database';

// RSS ленты для парсинга
const RSS_FEEDS = [
  {
    url: 'https://www.worldpadeltour.com/rss/news',
    name: 'World Padel Tour',
    category: 'Турниры',
  },
  {
    url: 'https://padelalto.com/feed/',
    name: 'Padel Alto',
    category: 'Новости',
  },
  {
    url: 'https://www.padelintelligent.com/feed/',
    name: 'Padel Intelligent',
    category: 'Советы',
  },
];

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

// Генерация slug
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-zа-яё0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .substring(0, 100);
}

// Перевод через DeepSeek
async function translateWithDeepSeek(text: string, targetLang: string = 'ru'): Promise<string> {
  if (!DEEPSEEK_API_KEY) {
    console.log('  ⚠️ DeepSeek API ключ не найден, возвращаю оригинал');
    return text;
  }

  try {
    const response = await axios.post(
      DEEPSEEK_API_URL,
      {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `Ты профессиональный переводчик. Переведи текст на русский язык. Сохрани стиль и смысл оригинала. Если текст уже на русском - верни его без изменений.`,
          },
          {
            role: 'user',
            content: text,
          },
        ],
        max_tokens: 2000,
        temperature: 0.3,
      },
      {
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    return response.data.choices[0]?.message?.content || text;
  } catch (error: any) {
    console.error(`  ❌ Ошибка перевода: ${error.message}`);
    return text;
  }
}

// Скачивание изображения
async function downloadImage(url: string, filename: string): Promise<string | null> {
  try {
    const imagesDir = path.join(process.cwd(), '..', 'frontend', 'public', 'images', 'news');
    
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }

    const filePath = path.join(imagesDir, filename);
    
    if (fs.existsSync(filePath)) {
      return `/images/news/${filename}`;
    }

    const response = await axios({
      method: 'GET',
      url,
      responseType: 'arraybuffer',
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    fs.writeFileSync(filePath, response.data);
    console.log(`  📷 Скачано изображение: ${filename}`);
    
    return `/images/news/${filename}`;
  } catch (error) {
    return null;
  }
}

// Парсинг RSS ленты
async function parseRSSFeed(feedUrl: string): Promise<any[]> {
  try {
    const response = await axios.get(feedUrl, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const $ = cheerio.load(response.data, { xmlMode: true });
    const items: any[] = [];

    $('item').each((_, item) => {
      const title = $(item).find('title').text();
      const link = $(item).find('link').text();
      const description = $(item).find('description').text();
      const pubDate = $(item).find('pubDate').text();
      
      // Поиск изображения в различных форматах
      let image = '';
      
      // Media namespace
      const mediaContent = $(item).find('media\\:content, content');
      if (mediaContent.attr('url')) {
        image = mediaContent.attr('url') || '';
      }
      
      // Enclosure
      const enclosure = $(item).find('enclosure');
      if (enclosure.attr('url') && enclosure.attr('type')?.startsWith('image/')) {
        image = enclosure.attr('url') || '';
      }
      
      // Content:encoded
      const contentEncoded = $(item).find('content\\:encoded, encoded').text();
      if (!image && contentEncoded) {
        const imgMatch = contentEncoded.match(/<img[^>]+src=["']([^"']+)["']/i);
        if (imgMatch) {
          image = imgMatch[1];
        }
      }
      
      // Description image
      if (!image && description) {
        const imgMatch = description.match(/<img[^>]+src=["']([^"']+)["']/i);
        if (imgMatch) {
          image = imgMatch[1];
        }
      }

      items.push({
        title: title.trim(),
        link: link.trim(),
        description: description.replace(/<[^>]*>/g, '').trim().substring(0, 300),
        pubDate: new Date(pubDate),
        image,
      });
    });

    return items;
  } catch (error: any) {
    console.error(`  ❌ Ошибка парсинга RSS ${feedUrl}: ${error.message}`);
    return [];
  }
}

// Получение полного контента статьи
async function getArticleContent(url: string): Promise<string> {
  try {
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const $ = cheerio.load(response.data);
    
    // Удаляем ненужные элементы
    $('script, style, nav, header, footer, aside, .ads, .comments').remove();
    
    // Ищем основной контент
    const contentSelectors = [
      'article',
      '.post-content',
      '.article-content',
      '.entry-content',
      '.content',
      'main',
    ];
    
    for (const selector of contentSelectors) {
      const content = $(selector).text();
      if (content && content.length > 200) {
        return content.trim().substring(0, 5000);
      }
    }
    
    return $('body').text().trim().substring(0, 5000);
  } catch (error) {
    return '';
  }
}

// Подсчет времени чтения
function calculateReadTime(text: string): number {
  const wordsPerMinute = 200;
  const words = text.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

// Основная функция парсинга новостей
export async function scrapeAllNews() {
  console.log('📰 Начинаем парсинг новостей...\n');
  
  if (!DEEPSEEK_API_KEY) {
    console.log('⚠️ DEEPSEEK_API_KEY не найден. Перевод будет пропущен.\n');
  }

  let totalFound = 0;
  let totalAdded = 0;
  let totalSkipped = 0;

  for (const feed of RSS_FEEDS) {
    console.log(`\n📡 Парсинг: ${feed.name}`);
    console.log(`   URL: ${feed.url}`);
    
    const items = await parseRSSFeed(feed.url);
    console.log(`   Найдено статей: ${items.length}`);
    totalFound += items.length;

    for (const item of items) {
      // Проверяем, существует ли уже
      const existing = await prisma.article.findFirst({
        where: { sourceUrl: item.link },
      });

      if (existing) {
        totalSkipped++;
        continue;
      }

      try {
        // Переводим заголовок
        const translatedTitle = await translateWithDeepSeek(item.title);
        
        // Переводим описание
        const translatedExcerpt = await translateWithDeepSeek(item.description);
        
        // Получаем полный контент
        const fullContent = await getArticleContent(item.link);
        const translatedContent = fullContent 
          ? await translateWithDeepSeek(fullContent)
          : translatedExcerpt;

        // Скачиваем изображение
        let image = '/images/news/placeholder.jpg';
        if (item.image) {
          const filename = `${generateSlug(translatedTitle)}_${Date.now()}.jpg`;
          const downloaded = await downloadImage(item.image, filename);
          if (downloaded) {
            image = downloaded;
          }
        }

        // Время чтения
        const readTime = calculateReadTime(translatedContent);

        const articleData = {
          slug: generateSlug(translatedTitle),
          title: translatedTitle,
          excerpt: translatedExcerpt.substring(0, 300),
          content: translatedContent,
          image,
          category: feed.category,
          readTime,
          author: feed.name,
          sourceUrl: item.link,
        };

        await prisma.article.create({
          data: articleData,
        });
        
        totalAdded++;
        console.log(`  ✅ Добавлена: ${translatedTitle.substring(0, 50)}...`);

        // Задержка между запросами
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error: any) {
        console.error(`  ❌ Ошибка обработки статьи: ${error.message}`);
      }
    }

    // Задержка между лентами
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Итоги
  console.log('\n' + '='.repeat(50));
  console.log('📊 ИТОГИ ПАРСИНГА НОВОСТЕЙ:');
  console.log(`  Найдено статей: ${totalFound}`);
  console.log(`  Добавлено: ${totalAdded}`);
  console.log(`  Пропущено (дубликаты): ${totalSkipped}`);
  
  const total = await prisma.article.count();
  console.log(`  Всего статей в БД: ${total}`);
  console.log('='.repeat(50));
}

// Запуск если вызван напрямую
if (require.main === module) {
  scrapeAllNews()
    .then(() => {
      console.log('\n✅ Парсинг новостей завершен!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Ошибка парсинга:', error);
      process.exit(1);
    });
}