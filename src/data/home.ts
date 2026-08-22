import type { SeoSettings } from './site';

export interface ProjectCard {
  title: string;
  image: string;
  area: string;
  size: string;
  floors: string;
  rooms: string;
  target: string;
}

export interface PortfolioItem {
  title: string;
  image: string;
}

export interface FeedItem {
  title: string;
  excerpt?: string;
  date: string;
  image: string;
}

export interface HomeContent {
  hero: {
    eyebrow: string;
    title: string;
    background: string;
    materials: Array<{ title: string; image: string }>;
  };
  projects: ProjectCard[];
  portfolio: PortfolioItem[];
  reviews: FeedItem[];
  news: FeedItem[];
  seo: SeoSettings;
}

export const homeContent = {
  hero: {
    eyebrow: 'РАБОТАЕМ С 2008 ГОДА',
    title: 'ДЕРЕВЯННЫЕ ДОМА И БАНИ ПОД КЛЮЧ',
    background: '/media/hero.webp',
    materials: [
      { title: 'ДОМА ИЗ ОЦИЛИНДРОВАННОГО БРЕВНА', image: '/media/material-log.webp' },
      { title: 'ДОМА ИЗ КЛЕЕНЫЙ БРУС', image: '/media/material-glued.webp' },
      { title: 'ДОМА ИЗ СУХОГО ПРОФИЛИРОВАННОГО БРУСА', image: '/media/material-profiled.webp' },
      { title: 'ДОМА ИЗ КЕДРА', image: '/media/material-cedar.webp' },
    ],
  },
  projects: [
    { title: 'Проект дома «Подшивалово»', image: '/media/project-podshivalovo.webp', area: '91 кв.м.', size: '9×12 м', floors: '1', rooms: '3', target: '/catalog-house/dom-podshivalovo/' },
    { title: 'Проект дома «Барс»', image: '/media/project-bars.webp', area: '76 кв.м.', size: '7×12 м', floors: '1', rooms: '3', target: '/proekt-doma-bars/' },
    { title: 'Проект дома «Солнечный»', image: '/media/project-solnechniy.webp', area: '70 кв.м.', size: '8×10 м', floors: '1', rooms: '3', target: '/catalog-house/solnechniy/' },
    { title: 'Проект дома «Светлый терем»', image: '/media/project-svetliy-terem.webp', area: '75 кв.м.', size: '9×9 м', floors: '1', rooms: '3', target: '/catalog-house/svetlyi-terem/' },
    { title: 'Проект дома «Дубрава»', image: '/media/project-dubrava.webp', area: '92 кв.м.', size: '9×11 м', floors: '1', rooms: '3', target: '/catalog-house/dubrava/' },
    { title: 'Проект дома «Скандик»', image: '/media/project-scandic.webp', area: '56 кв.м.', size: '6×10 м', floors: '1', rooms: '1', target: '/catalog-house/scandic/' },
  ],
  portfolio: [
    { title: 'Дом из сухого профилированного бруса, 106 кв.м.', image: '/media/portfolio-1.webp' },
    { title: 'Дом из сухого профилированного бруса, 97 кв.м., г. Можга', image: '/media/portfolio-2.webp' },
    { title: 'Дом из сухого профилированного бруса, 54 кв.м., Завьяловские сады', image: '/media/portfolio-3.webp' },
    { title: 'Дом 80 кв.м. из сухого профилированного бруса', image: '/media/portfolio-4.webp' },
    { title: 'Баня в стиле «Дикая рубка», 49 кв.м., Нечкино', image: '/media/portfolio-5.webp' },
    { title: 'Пристрой к дому, 51 кв.м., СНТ «Молодежный»', image: '/media/portfolio-6.webp' },
  ],
  reviews: [
    { title: 'Залогины Кирилл и Иляна', date: '14.02.2024', image: '/media/review-1.webp' },
    { title: 'Людмила, г. Можга. Дом 97 кв. м. из сухого профилированного бруса.', date: '15.09.2024', image: '/media/review-2.webp' },
    { title: 'Олег, д. Шудья. Баня 42,5 кв. м. из оцилиндрованного бревна.', date: '15.09.2024', image: '/media/review-3.webp' },
    { title: 'Ирина, дом в черте Ижевска, оцилиндрованное бревно, 99 кв.м.', date: '17.05.2024', image: '/media/review-4.webp' },
    { title: 'Татьяна, дачный дом 50 кв.м.', date: '08.05.2024', image: '/media/review-5.webp' },
    { title: 'Светлана, г. Агрыз, каменный дом, 92 кв.м.', date: '09.04.2024', image: '/media/review-6.webp' },
  ],
  news: [
    { title: 'Монтаж фундамента', excerpt: 'Фундамент — это основа всего дома.', date: '18.12.2023', image: '/media/news-1.webp' },
    { title: 'Деревянный дом 50 кв.м.', excerpt: 'Видеообзор небольшого дачного дома', date: '28.05.2024', image: '/media/news-2.webp' },
    { title: 'Видеообзор дома 67 кв.м. из бруса', date: '28.05.2024', image: '/media/news-3.webp' },
    { title: 'Виды профиля бруса', excerpt: 'Какой профиль бруса выбрать?', date: '28.05.2024', image: '/media/news-4.webp' },
    { title: '7 ошибок в строительстве деревянного дома', excerpt: 'Главные ошибки при выборе подрядчика', date: '28.05.2024', image: '/media/news-5.webp' },
    { title: 'Проект дома — зачем он нужен?', excerpt: 'В чем важность проекта дома', date: '27.02.2024', image: '/media/news-6.webp' },
  ],
  seo: {
    title: 'Строительство деревянных домов и бань в Ижевске от компании Древмастер',
    description: 'Надежные деревянные дома и бани из бруса и бревна в Ижевске. Комплектация базовая и под крышу. Оставляйте заявку на расчет. Компания «Древмастер» ☎ +7 (3412) 56-80-22.',
    canonicalPath: '/',
    ogImage: '/media/og.jpg',
  },
} satisfies HomeContent;
