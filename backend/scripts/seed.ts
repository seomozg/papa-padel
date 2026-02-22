import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.review.deleteMany();
  await prisma.article.deleteMany();
  await prisma.court.deleteMany();
  await prisma.user.deleteMany();

  // Function to generate slug from name
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-zа-яё0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim();
  };

  // Create test courts
  const courts = [
    {
      slug: generateSlug('Padel Pro Moscow'),
      name: 'Padel Pro Moscow',
      city: 'Москва',
      address: 'ул. Олимпийская, 15',
      coordinates: { lat: 55.751244, lng: 37.618423 },
      type: 'indoor' as const,
      amenities: ['Парковка', 'Душевые', 'Прокат ракеток', 'Кафе', 'Инструктор', 'Wi-Fi'],
      phone: '+7 (495) 123-45-67',
      workingHours: '07:00 – 23:00',
      description: 'Один из лучших падел-клубов Москвы с 6 профессиональными кортами. Современное оборудование, опытные инструкторы и уютная атмосфера для всех уровней игры.',
      prices: [
        { time: '07:00 – 12:00', weekday: 1500, weekend: 2000 },
        { time: '12:00 – 17:00', weekday: 1800, weekend: 2200 },
        { time: '17:00 – 21:00', weekday: 2500, weekend: 3000 },
        { time: '21:00 – 23:00', weekday: 2000, weekend: 2500 },
      ],
      image: '/src/assets/court-1.jpg'
    },
    {
      slug: generateSlug('Padel Garden SPb'),
      name: 'Padel Garden SPb',
      city: 'Санкт-Петербург',
      address: 'Московский пр., 88',
      coordinates: { lat: 59.934280, lng: 30.335099 },
      type: 'mixed' as const,
      amenities: ['Парковка', 'Душевые', 'Прокат ракеток', 'Магазин'],
      phone: '+7 (812) 987-65-43',
      workingHours: '08:00 – 22:00',
      description: 'Уютный клуб в центре Санкт-Петербурга с крытыми и открытыми кортами. Идеально для начинающих и профессионалов.',
      prices: [
        { time: '08:00 – 12:00', weekday: 1200, weekend: 1600 },
        { time: '12:00 – 17:00', weekday: 1500, weekend: 1800 },
        { time: '17:00 – 22:00', weekday: 2200, weekend: 2500 },
      ],
      image: '/src/assets/court-2.jpg'
    },
    {
      slug: generateSlug('Kazan Padel Club'),
      name: 'Kazan Padel Club',
      city: 'Казань',
      address: 'ул. Декабристов, 45',
      coordinates: { lat: 55.796391, lng: 49.108891 },
      type: 'indoor' as const,
      amenities: ['Парковка', 'Душевые', 'Прокат ракеток', 'Кафе'],
      phone: '+7 (843) 234-56-78',
      workingHours: '09:00 – 22:00',
      description: 'Первый падел-клуб в Казани! Современные крытые корты с профессиональным покрытием. Проводим турниры и обучение.',
      prices: [
        { time: '09:00 – 13:00', weekday: 900, weekend: 1200 },
        { time: '13:00 – 18:00', weekday: 1200, weekend: 1400 },
        { time: '18:00 – 22:00', weekday: 1800, weekend: 1800 },
      ],
      image: '/src/assets/court-3.jpg'
    },
    {
      slug: generateSlug('Ural Padel'),
      name: 'Ural Padel',
      city: 'Екатеринбург',
      address: 'пр. Ленина, 101',
      coordinates: { lat: 56.838011, lng: 60.597474 },
      type: 'indoor' as const,
      amenities: ['Парковка', 'Душевые', 'Wi-Fi', 'Магазин'],
      phone: '+7 (343) 345-67-89',
      workingHours: '08:00 – 23:00',
      description: 'Современный падел-центр на Урале. Четыре крытых корта с климат-контролем, работаем круглый год.',
      prices: [
        { time: '08:00 – 12:00', weekday: 1000, weekend: 1400 },
        { time: '12:00 – 18:00', weekday: 1400, weekend: 1600 },
        { time: '18:00 – 23:00', weekday: 2000, weekend: 2000 },
      ],
      image: '/src/assets/court-1.jpg'
    },
    {
      slug: generateSlug('Sochi Beach Padel'),
      name: 'Sochi Beach Padel',
      city: 'Сочи',
      address: 'Курортный проспект, 22',
      coordinates: { lat: 43.585472, lng: 39.723098 },
      type: 'outdoor' as const,
      amenities: ['Парковка', 'Душевые', 'Прокат ракеток', 'Ресторан', 'Бассейн', 'Инструктор'],
      phone: '+7 (862) 456-78-90',
      workingHours: '07:00 – 22:00',
      description: 'Элитный падел-клуб у моря в Сочи. Восемь открытых кортов с видом на Черное море. Идеальное место для игры в любое время года.',
      prices: [
        { time: '07:00 – 11:00', weekday: 1800, weekend: 2500 },
        { time: '11:00 – 15:00', weekday: 2500, weekend: 3200 },
        { time: '15:00 – 19:00', weekday: 3000, weekend: 4000 },
        { time: '19:00 – 22:00', weekday: 2500, weekend: 3500 },
      ],
      image: '/src/assets/court-2.jpg'
    },
    {
      slug: generateSlug('Krasnodar Padel Arena'),
      name: 'Krasnodar Padel Arena',
      city: 'Краснодар',
      address: 'ул. Красная, 78',
      coordinates: { lat: 45.035470, lng: 38.975313 },
      type: 'mixed' as const,
      amenities: ['Парковка', 'Душевые', 'Кафе', 'Инструктор', 'Детская секция'],
      phone: '+7 (861) 567-89-01',
      workingHours: '08:00 – 22:00',
      description: 'Крупнейший падел-клуб Краснодара. Проводим турниры, детские и взрослые секции. Тёплый климат позволяет играть на открытых кортах большую часть года.',
      prices: [
        { time: '08:00 – 12:00', weekday: 1100, weekend: 1500 },
        { time: '12:00 – 17:00', weekday: 1500, weekend: 1800 },
        { time: '17:00 – 22:00', weekday: 2200, weekend: 2200 },
      ],
      image: '/src/assets/court-3.jpg'
    },
    {
      slug: generateSlug('Novosibirsk Padel Center'),
      name: 'Novosibirsk Padel Center',
      city: 'Новосибирск',
      address: 'ул. Ленина, 15',
      coordinates: { lat: 55.008353, lng: 82.935733 },
      type: 'indoor' as const,
      amenities: ['Парковка', 'Душевые', 'Прокат ракеток', 'Кафе', 'Wi-Fi'],
      phone: '+7 (383) 123-45-67',
      workingHours: '09:00 – 22:00',
      description: 'Первый профессиональный падел-центр в Новосибирске. Три крытых корта с профессиональным покрытием.',
      prices: [
        { time: '09:00 – 13:00', weekday: 1200, weekend: 1500 },
        { time: '13:00 – 18:00', weekday: 1600, weekend: 1900 },
        { time: '18:00 – 22:00', weekday: 2100, weekend: 2400 },
      ],
      image: '/src/assets/court-1.jpg'
    },
    {
      slug: generateSlug('Rostov Padel Club'),
      name: 'Rostov Padel Club',
      city: 'Ростов-на-Дону',
      address: 'пр. Будённовский, 45',
      coordinates: { lat: 47.235714, lng: 39.701505 },
      type: 'mixed' as const,
      amenities: ['Парковка', 'Душевые', 'Прокат ракеток', 'Магазин'],
      phone: '+7 (863) 234-56-78',
      workingHours: '08:00 – 22:00',
      description: 'Современный падел-клуб в центре Ростова. Крытые и открытые корты для игры в любую погоду.',
      prices: [
        { time: '08:00 – 12:00', weekday: 1000, weekend: 1300 },
        { time: '12:00 – 17:00', weekday: 1300, weekend: 1600 },
        { time: '17:00 – 22:00', weekday: 1900, weekend: 2200 },
      ],
      image: '/src/assets/court-2.jpg'
    }
  ];

  console.log(`Creating ${courts.length} courts...`);

  for (const courtData of courts) {
    try {
      const court = await prisma.court.create({
        data: courtData
      });
      console.log(`✅ Created court: ${court.name}`);
    } catch (error) {
      console.error(`❌ Failed to create court ${courtData.name}:`, error);
    }
  }

  // Create test articles
  const articles = [
    {
      slug: generateSlug('Падел в России: как новый вид спорта завоёвывает страну'),
      title: 'Падел в России: как новый вид спорта завоёвывает страну',
      excerpt: 'За последние три года количество падел-кортов в России выросло в 10 раз. Разбираемся, почему этот испанский спорт так быстро набирает популярность.',
      content: 'Полный контент статьи о развитии падела в России...',
      image: '/src/assets/court-3.jpg',
      category: 'Тренды',
      readTime: 5,
      author: 'Редакция PadelRussia',
    },
    {
      slug: generateSlug('Первый Чемпионат России по падел-теннису — итоги'),
      title: 'Первый Чемпионат России по падел-теннису — итоги',
      excerpt: 'В Москве завершился первый официальный Чемпионат России по падел-теннису. Победители получили путёвки на международный турнир.',
      content: 'Подробные итоги чемпионата...',
      image: '/src/assets/court-2.jpg',
      category: 'Турниры',
      readTime: 4,
      author: 'Спортивный обозреватель',
    },
    {
      slug: generateSlug('Как выбрать ракетку для падела: полное руководство'),
      title: 'Как выбрать ракетку для падела: полное руководство',
      excerpt: 'Круглая или капля? Карбон или стекловолокно? Рассказываем всё о выборе первой ракетки для падела с нуля.',
      content: 'Руководство по выбору ракетки...',
      image: '/src/assets/court-1.jpg',
      category: 'Советы',
      readTime: 7,
      author: 'Александр Громов',
    },
    {
      slug: generateSlug('Топ-5 техник подачи в паделе, которые изменят вашу игру'),
      title: 'Топ-5 техник подачи в паделе, которые изменят вашу игру',
      excerpt: 'Подача в паделе — ключевой элемент игры. Разбираем пять техник, которые помогут выиграть больше очков.',
      content: 'Техники подачи в паделе...',
      image: '/src/assets/court-3.jpg',
      category: 'Советы',
      readTime: 6,
      author: 'Мария Соколова',
    },
    {
      slug: generateSlug('Новый падел-центр открылся в Новосибирске'),
      title: 'Новый падел-центр открылся в Новосибирске',
      excerpt: 'В Новосибирске открылся первый крупный падел-центр с четырьмя профессиональными кортами и учебной академией.',
      content: 'Новости открытия центра...',
      image: '/src/assets/court-2.jpg',
      category: 'Новости клубов',
      readTime: 3,
      author: 'Редакция PadelRussia',
    },
    {
      slug: generateSlug('Падел для начинающих: первые шаги на корте'),
      title: 'Падел для начинающих: первые шаги на корте',
      excerpt: 'Никогда не играли в падел? Это руководство поможет вам сделать первые шаги и не выглядеть новичком уже в первую игру.',
      content: 'Руководство для начинающих...',
      image: '/src/assets/court-1.jpg',
      category: 'Начинающим',
      readTime: 8,
      author: 'Дмитрий Лебедев',
    },
  ];

  console.log(`Creating ${articles.length} articles...`);

  for (const articleData of articles) {
    try {
      const article = await prisma.article.create({
        data: articleData
      });
      console.log(`✅ Created article: ${article.title}`);
    } catch (error) {
      console.error(`❌ Failed to create article ${articleData.title}:`, error);
    }
  }

  const courtCount = await prisma.court.count();
  const articleCount = await prisma.article.count();
  console.log(`🎾 Database seeded successfully! Total courts: ${courtCount}, articles: ${articleCount}`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });