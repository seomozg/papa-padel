// Mock data for padel courts across Russia
export interface Court {
  id: string;
  name: string;
  city: string;
  address: string;
  rating: number;
  reviewCount: number;
  likes: number;
  courts: number;
  type: "indoor" | "outdoor" | "mixed";
  priceMin: number;
  priceMax: number;
  image: string;
  amenities: string[];
  phone: string;
  workingHours: string;
  description: string;
  prices: { time: string; weekday: number; weekend: number }[];
  reviews: Review[];
  coordinates: { lat: number; lng: number };
  tags: string[];
}

export interface Review {
  id: string;
  author: string;
  avatar: string;
  rating: number;
  date: string;
  text: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  date: string;
  category: string;
  readTime: number;
  author: string;
}

import court1 from "@/assets/court-1.jpg";
import court2 from "@/assets/court-2.jpg";
import court3 from "@/assets/court-3.jpg";

export const CITIES = ["Все города", "Москва", "Санкт-Петербург", "Казань", "Екатеринбург", "Новосибирск", "Краснодар", "Сочи"];

export const COURTS: Court[] = [
  {
    id: "1",
    name: "Padel Pro Moscow",
    city: "Москва",
    address: "ул. Олимпийская, 15",
    rating: 4.9,
    reviewCount: 128,
    likes: 342,
    courts: 6,
    type: "indoor",
    priceMin: 1500,
    priceMax: 3000,
    image: court2,
    amenities: ["Парковка", "Душевые", "Прокат ракеток", "Кафе", "Инструктор", "Wi-Fi"],
    phone: "+7 (495) 123-45-67",
    workingHours: "07:00 – 23:00",
    description: "Один из лучших падел-клубов Москвы с 6 профессиональными кортами. Современное оборудование, опытные инструкторы и уютная атмосфера для всех уровней игры.",
    prices: [
      { time: "07:00 – 12:00", weekday: 1500, weekend: 2000 },
      { time: "12:00 – 17:00", weekday: 1800, weekend: 2200 },
      { time: "17:00 – 21:00", weekday: 2500, weekend: 3000 },
      { time: "21:00 – 23:00", weekday: 2000, weekend: 2500 },
    ],
    reviews: [
      { id: "r1", author: "Алексей К.", avatar: "АК", rating: 5, date: "15 янв 2025", text: "Отличный клуб! Корты в идеальном состоянии, персонал очень приветливый." },
      { id: "r2", author: "Мария С.", avatar: "МС", rating: 5, date: "02 янв 2025", text: "Лучшее место для падела в Москве. Приходим каждую неделю всей командой." },
      { id: "r3", author: "Дмитрий В.", avatar: "ДВ", rating: 4, date: "28 дек 2024", text: "Хорошее место, единственный минус — сложно найти свободное время в прайм-тайм." },
    ],
    coordinates: { lat: 55.751244, lng: 37.618423 },
    tags: ["Топ-рейтинг", "Инструктор"],
  },
  {
    id: "2",
    name: "Padel Garden SPb",
    city: "Санкт-Петербург",
    address: "Московский пр., 88",
    rating: 4.7,
    reviewCount: 94,
    likes: 218,
    courts: 4,
    type: "mixed",
    priceMin: 1200,
    priceMax: 2500,
    image: court3,
    amenities: ["Парковка", "Душевые", "Прокат ракеток", "Магазин"],
    phone: "+7 (812) 987-65-43",
    workingHours: "08:00 – 22:00",
    description: "Уютный клуб в центре Санкт-Петербурга с крытыми и открытыми кортами. Идеально для начинающих и профессионалов.",
    prices: [
      { time: "08:00 – 12:00", weekday: 1200, weekend: 1600 },
      { time: "12:00 – 17:00", weekday: 1500, weekend: 1800 },
      { time: "17:00 – 22:00", weekday: 2200, weekend: 2500 },
    ],
    reviews: [
      { id: "r4", author: "Наталья П.", avatar: "НП", rating: 5, date: "10 янв 2025", text: "Замечательное место! Тренер — профессионал, очень помог с техникой." },
      { id: "r5", author: "Игорь М.", avatar: "ИМ", rating: 4, date: "05 янв 2025", text: "Хорошие корты, удобное расположение. Рекомендую!" },
    ],
    coordinates: { lat: 59.934280, lng: 30.335099 },
    tags: ["Новый", "Рядом с метро"],
  },
  {
    id: "3",
    name: "Kazan Padel Club",
    city: "Казань",
    address: "ул. Декабристов, 45",
    rating: 4.8,
    reviewCount: 67,
    likes: 156,
    courts: 3,
    type: "indoor",
    priceMin: 900,
    priceMax: 1800,
    image: court1,
    amenities: ["Парковка", "Душевые", "Прокат ракеток", "Кафе"],
    phone: "+7 (843) 234-56-78",
    workingHours: "09:00 – 22:00",
    description: "Первый падел-клуб в Казани! Современные крытые корты с профессиональным покрытием. Проводим турниры и обучение.",
    prices: [
      { time: "09:00 – 13:00", weekday: 900, weekend: 1200 },
      { time: "13:00 – 18:00", weekday: 1200, weekend: 1400 },
      { time: "18:00 – 22:00", weekday: 1800, weekend: 1800 },
    ],
    reviews: [
      { id: "r6", author: "Рустам Г.", avatar: "РГ", rating: 5, date: "12 янв 2025", text: "Наконец-то падел появился в Казани! Отличный клуб, буду возвращаться." },
    ],
    coordinates: { lat: 55.796391, lng: 49.108891 },
    tags: ["Первый в городе"],
  },
  {
    id: "4",
    name: "Ural Padel",
    city: "Екатеринбург",
    address: "пр. Ленина, 101",
    rating: 4.6,
    reviewCount: 45,
    likes: 98,
    courts: 4,
    type: "indoor",
    priceMin: 1000,
    priceMax: 2000,
    image: court2,
    amenities: ["Парковка", "Душевые", "Wi-Fi", "Магазин"],
    phone: "+7 (343) 345-67-89",
    workingHours: "08:00 – 23:00",
    description: "Современный падел-центр на Урале. Четыре крытых корта с климат-контролем, работаем круглый год.",
    prices: [
      { time: "08:00 – 12:00", weekday: 1000, weekend: 1400 },
      { time: "12:00 – 18:00", weekday: 1400, weekend: 1600 },
      { time: "18:00 – 23:00", weekday: 2000, weekend: 2000 },
    ],
    reviews: [
      { id: "r7", author: "Сергей Л.", avatar: "СЛ", rating: 5, date: "08 янв 2025", text: "Лучший спортивный клуб города. Корты отличные, команда профессиональная." },
    ],
    coordinates: { lat: 56.838011, lng: 60.597474 },
    tags: ["Климат-контроль"],
  },
  {
    id: "5",
    name: "Sochi Beach Padel",
    city: "Сочи",
    address: "Курортный проспект, 22",
    rating: 4.9,
    reviewCount: 211,
    likes: 487,
    courts: 8,
    type: "outdoor",
    priceMin: 1800,
    priceMax: 4000,
    image: court3,
    amenities: ["Парковка", "Душевые", "Прокат ракеток", "Ресторан", "Бассейн", "Инструктор"],
    phone: "+7 (862) 456-78-90",
    workingHours: "07:00 – 22:00",
    description: "Элитный падел-клуб у моря в Сочи. Восемь открытых кортов с видом на Черное море. Идеальное место для игры в любое время года.",
    prices: [
      { time: "07:00 – 11:00", weekday: 1800, weekend: 2500 },
      { time: "11:00 – 15:00", weekday: 2500, weekend: 3200 },
      { time: "15:00 – 19:00", weekday: 3000, weekend: 4000 },
      { time: "19:00 – 22:00", weekday: 2500, weekend: 3500 },
    ],
    reviews: [
      { id: "r8", author: "Анна Б.", avatar: "АБ", rating: 5, date: "14 янв 2025", text: "Фантастическое место! Играть с видом на море — это что-то особенное." },
      { id: "r9", author: "Олег К.", avatar: "ОК", rating: 5, date: "03 янв 2025", text: "Были в отпуске в Сочи — обязательно сыграйте здесь. Корты и сервис на высшем уровне." },
    ],
    coordinates: { lat: 43.585472, lng: 39.723098 },
    tags: ["Вид на море", "Топ-рейтинг"],
  },
  {
    id: "6",
    name: "Krasnodar Padel Arena",
    city: "Краснодар",
    address: "ул. Красная, 78",
    rating: 4.7,
    reviewCount: 83,
    likes: 174,
    courts: 5,
    type: "mixed",
    priceMin: 1100,
    priceMax: 2200,
    image: court1,
    amenities: ["Парковка", "Душевые", "Кафе", "Инструктор", "Детская секция"],
    phone: "+7 (861) 567-89-01",
    workingHours: "08:00 – 22:00",
    description: "Крупнейший падел-клуб Краснодара. Проводим турниры, детские и взрослые секции. Тёплый климат позволяет играть на открытых кортах большую часть года.",
    prices: [
      { time: "08:00 – 12:00", weekday: 1100, weekend: 1500 },
      { time: "12:00 – 17:00", weekday: 1500, weekend: 1800 },
      { time: "17:00 – 22:00", weekday: 2200, weekend: 2200 },
    ],
    reviews: [
      { id: "r10", author: "Виктория Р.", avatar: "ВР", rating: 5, date: "11 янв 2025", text: "Записала детей в секцию — в восторге! Тренеры очень хорошие." },
    ],
    coordinates: { lat: 45.035470, lng: 38.975313 },
    tags: ["Детская секция", "Турниры"],
  },
];

export const NEWS: NewsArticle[] = [
  {
    id: "n1",
    title: "Падел в России: как новый вид спорта завоёвывает страну",
    excerpt: "За последние три года количество падел-кортов в России выросло в 10 раз. Разбираемся, почему этот испанский спорт так быстро набирает популярность.",
    content: "",
    image: court3,
    date: "18 янв 2025",
    category: "Тренды",
    readTime: 5,
    author: "Редакция PadelRussia",
  },
  {
    id: "n2",
    title: "Первый Чемпионат России по падел-теннису — итоги",
    excerpt: "В Москве завершился первый официальный Чемпионат России по падел-теннису. Победители получили путёвки на международный турнир.",
    content: "",
    image: court2,
    date: "15 янв 2025",
    category: "Турниры",
    readTime: 4,
    author: "Спортивный обозреватель",
  },
  {
    id: "n3",
    title: "Как выбрать ракетку для падела: полное руководство",
    excerpt: "Круглая или капля? Карбон или стекловолокно? Рассказываем всё о выборе первой ракетки для падела с нуля.",
    content: "",
    image: court1,
    date: "12 янв 2025",
    category: "Советы",
    readTime: 7,
    author: "Александр Громов",
  },
  {
    id: "n4",
    title: "Топ-5 техник подачи в паделе, которые изменят вашу игру",
    excerpt: "Подача в паделе — ключевой элемент игры. Разбираем пять техник, которые помогут выиграть больше очков.",
    content: "",
    image: court3,
    date: "09 янв 2025",
    category: "Советы",
    readTime: 6,
    author: "Мария Соколова",
  },
  {
    id: "n5",
    title: "Новый падел-центр открылся в Новосибирске",
    excerpt: "В Новосибирске открылся первый крупный падел-центр с четырьмя профессиональными кортами и учебной академией.",
    content: "",
    image: court2,
    date: "07 янв 2025",
    category: "Новости клубов",
    readTime: 3,
    author: "Редакция PadelRussia",
  },
  {
    id: "n6",
    title: "Падел для начинающих: первые шаги на корте",
    excerpt: "Никогда не играли в падел? Это руководство поможет вам сделать первые шаги и не выглядеть новичком уже в первую игру.",
    content: "",
    image: court1,
    date: "04 янв 2025",
    category: "Начинающим",
    readTime: 8,
    author: "Дмитрий Лебедев",
  },
];
