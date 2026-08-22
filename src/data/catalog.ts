import type { SeoSettings } from './site';

export type ProjectCategory = 'house' | 'sauna';

export interface CatalogProject {
  slug: string;
  route: string;
  category: ProjectCategory;
  title: string;
  name: string;
  area: string;
  size: string;
  floors: string;
  rooms?: string;
  bathrooms?: string;
  duration: string;
  image: string;
}

export interface PackageSection {
  title: string;
  items: string[];
}

export const houseProjects: CatalogProject[] = [
  { slug: 'dom-podshivalovo', route: '/catalog-house/dom-podshivalovo/', category: 'house', title: 'Проект дома «Подшивалово»', name: 'Подшивалово', area: '91 кв. м', size: '9×12 м', floors: '1 этаж', rooms: '3 комнаты', bathrooms: '1 санузел', duration: 'от 60 дней', image: '/media/project-podshivalovo.webp' },
  { slug: 'proekt-doma-bars', route: '/proekt-doma-bars/', category: 'house', title: 'Проект дома «Барс»', name: 'Барс', area: '76 кв. м', size: '7×12 м', floors: '1 этаж', rooms: '3 комнаты', bathrooms: '1 санузел', duration: 'от 60 дней', image: '/media/project-bars.webp' },
  { slug: 'solnechniy', route: '/catalog-house/solnechniy/', category: 'house', title: 'Проект дома «Солнечный»', name: 'Солнечный', area: '70 кв. м', size: '8×10 м', floors: '1 этаж', rooms: '3 комнаты', bathrooms: '1 санузел', duration: 'от 60 дней', image: '/media/project-solnechniy.webp' },
  { slug: 'svetlyi-terem', route: '/catalog-house/svetlyi-terem/', category: 'house', title: 'Проект дома «Светлый терем»', name: 'Светлый терем', area: '75 кв. м', size: '9×9 м', floors: '1 этаж', rooms: '3 комнаты', bathrooms: '1 санузел', duration: 'от 60 дней', image: '/media/project-svetliy-terem.webp' },
  { slug: 'dubrava', route: '/catalog-house/dubrava/', category: 'house', title: 'Проект дома «Дубрава»', name: 'Дубрава', area: '92 кв. м', size: '9×11 м', floors: '1 этаж', rooms: '3 комнаты', bathrooms: '1 санузел', duration: 'от 60 дней', image: '/media/project-dubrava.webp' },
  { slug: 'scandic', route: '/catalog-house/scandic/', category: 'house', title: 'Проект дома «Скандик»', name: 'Скандик', area: '56 кв. м', size: '6×10 м', floors: '1 этаж', rooms: '1 комната', bathrooms: '1 санузел', duration: 'от 60 дней', image: '/media/project-scandic.webp' },
  { slug: 'tet-a-tet', route: '/catalog-house/tet-a-tet/', category: 'house', title: 'Проект дома «Тет-а-тет»', name: 'Тет-а-тет', area: '60 кв. м', size: '7×9 м', floors: '1 этаж', rooms: '2 комнаты', bathrooms: '1 санузел', duration: 'от 60 дней', image: '/media/catalog-house-tet-a-tet.webp' },
  { slug: 'semejnyj', route: '/catalog-house/semejnyj/', category: 'house', title: 'Проект дома «Семейный»', name: 'Семейный', area: '61 кв. м', size: '8×8 м', floors: '1 этаж', rooms: '3 комнаты', bathrooms: '1 санузел', duration: 'от 60 дней', image: '/media/catalog-house-semejnyj.webp' },
  { slug: 'svetlyj', route: '/catalog-house/svetlyj/', category: 'house', title: 'Проект дома «Светлый»', name: 'Светлый', area: '75 кв. м', size: '9×11 м', floors: '1 этаж', rooms: '3 комнаты', bathrooms: '1 санузел', duration: 'от 60 дней', image: '/media/catalog-house-svetlyj.webp' },
  { slug: 'sakura', route: '/catalog-house/sakura/', category: 'house', title: 'Проект дома «Сакура»', name: 'Сакура', area: '112 кв. м', size: '8,5×13 м', floors: '1 этаж', rooms: '4 комнаты', bathrooms: '1 санузел', duration: 'от 60 дней', image: '/media/catalog-house-sakura.webp' },
  { slug: 'pomeste', route: '/catalog-house/pomeste/', category: 'house', title: 'Проект дома «Поместье»', name: 'Поместье', area: '174 кв. м', size: '11×15 м', floors: '2 этажа', rooms: '6 комнат', bathrooms: '2 санузла', duration: 'от 90 дней', image: '/media/catalog-house-pomeste.webp' },
  { slug: 'mechta', route: '/catalog-house/mechta/', category: 'house', title: 'Проект дома «Мечта»', name: 'Мечта', area: '100 кв. м', size: '8×9 м', floors: '2 этажа', rooms: '4 комнаты', bathrooms: '1 санузел', duration: 'от 75 дней', image: '/media/catalog-house-mechta.webp' },
  { slug: 'krasnaya-shapochka', route: '/catalog-house/krasnaya-shapochka/', category: 'house', title: 'Проект дома «Красная шапочка»', name: 'Красная шапочка', area: '66 кв. м', size: '7×11 м', floors: '1 этаж', rooms: '2 комнаты', bathrooms: '1 санузел', duration: 'от 60 дней', image: '/media/catalog-house-krasnaya-shapochka.webp' },
  { slug: 'komfort', route: '/catalog-house/komfort/', category: 'house', title: 'Проект дома «Комфорт»', name: 'Комфорт', area: '114 кв. м', size: '11×14 м', floors: '1 этаж', rooms: '3 комнаты', bathrooms: '1 санузел', duration: 'от 60 дней', image: '/media/catalog-house-komfort.webp' },
  { slug: 'dom-kompakt', route: '/catalog-house/dom-kompakt/', category: 'house', title: 'Проект дома «Компакт»', name: 'Компакт', area: '50 кв. м', size: '7×9 м', floors: '1 этаж', rooms: '2 комнаты', bathrooms: '1 санузел', duration: 'от 50 дней', image: '/media/catalog-house-dom-kompakt.webp' },
  { slug: 'dom-kompakt-2', route: '/catalog-house/dom-kompakt-2/', category: 'house', title: 'Проект дома «Компакт 2»', name: 'Компакт 2', area: '80 кв. м', size: '9×11 м', floors: '1 этаж', rooms: '3 комнаты', bathrooms: '1 санузел', duration: 'от 60 дней', image: '/media/catalog-house-dom-kompakt-2.webp' },
  { slug: 'dom-idilliya', route: '/catalog-house/dom-idilliya/', category: 'house', title: 'Проект дома «Идиллия»', name: 'Идиллия', area: '171 кв. м', size: '14×15 м', floors: '1 этаж', rooms: '3 комнаты', bathrooms: '3 санузла', duration: 'от 90 дней', image: '/media/catalog-house-dom-idilliya.webp' },
  { slug: 'dom-dymka', route: '/catalog-house/dom-dymka/', category: 'house', title: 'Проект дома «Дымка»', name: 'Дымка', area: '107 кв. м', size: '9×12 м', floors: '1 этаж', rooms: '4 комнаты', bathrooms: '1 санузел', duration: 'от 60 дней', image: '/media/catalog-house-dom-dymka.webp' },
  { slug: 'dom-dushevnyj', route: '/catalog-house/dom-dushevnyj/', category: 'house', title: 'Проект дома «Душевный»', name: 'Душевный', area: '95 кв. м', size: '7×8 м', floors: '2 этажа', rooms: '5 комнат', bathrooms: '1 санузел', duration: 'от 75 дней', image: '/media/catalog-house-dom-dushevnyj.webp' },
  { slug: 'dom-banya-sosnovaya', route: '/catalog-house/dom-banya-sosnovaya/', category: 'house', title: 'Проект дома-бани «Сосновая»', name: 'Сосновая', area: '75 кв. м', size: '5×8 м', floors: '2 этажа', rooms: '2 комнаты', bathrooms: '1 санузел', duration: 'от 60 дней', image: '/media/catalog-house-dom-banya-sosnovaya.webp' },
  { slug: 'dom-banya-kompleks', route: '/catalog-house/dom-banya-kompleks/', category: 'house', title: 'Проект дома-бани «Комплекс»', name: 'Комплекс', area: '106 кв. м', size: '8×10 м', floors: '2 этажа', rooms: '3 комнаты', bathrooms: '1 санузел', duration: 'от 75 дней', image: '/media/catalog-house-dom-banya-kompleks.webp' },
  { slug: 'dom-grafit', route: '/catalog-house/dom-grafit/', category: 'house', title: 'Проект дома «Графит»', name: 'Графит', area: '115 кв. м', size: '8×15 м', floors: '1 этаж', rooms: '3 комнаты', bathrooms: '1 санузел', duration: 'от 60 дней', image: '/media/catalog-house-dom-grafit.webp' },
  { slug: 'dom-vesthill', route: '/catalog-house/dom-vesthill/', category: 'house', title: 'Проект дома «Вестхилл»', name: 'Вестхилл', area: '226 кв. м', size: '15×18 м', floors: '1 этаж', rooms: '6 комнат', bathrooms: '2 санузла', duration: 'от 100 дней', image: '/media/catalog-house-dom-vesthill.webp' },
  { slug: 'dom-bezmyatezhnost', route: '/catalog-house/dom-bezmyatezhnost/', category: 'house', title: 'Проект дома «Безмятежность»', name: 'Безмятежность', area: '85 кв. м', size: '8×11 м', floors: '1 этаж', rooms: '2 комнаты', bathrooms: '1 санузел', duration: 'от 60 дней', image: '/media/catalog-house-dom-bezmyatezhnost.webp' },
  { slug: 'dom-astra', route: '/catalog-house/dom-astra/', category: 'house', title: 'Проект дома «Астра»', name: 'Астра', area: '84 кв. м', size: '8×11 м', floors: '1 этаж', rooms: '4 комнаты', bathrooms: '1 санузел', duration: 'от 60 дней', image: '/media/catalog-house-dom-astra.webp' },
  { slug: 'dom-astra-2', route: '/catalog-house/dom-astra-2/', category: 'house', title: 'Проект дома «Астра 2»', name: 'Астра 2', area: '86 кв. м', size: '8×11 м', floors: '1 этаж', rooms: '4 комнаты', bathrooms: '1 санузел', duration: 'от 60 дней', image: '/media/catalog-house-dom-astra-2.webp' },
  { slug: 'rodnye-penaty', route: '/catalog-house/rodnye-penaty/', category: 'house', title: 'Проект дома «Родные пенаты»', name: 'Родные пенаты', area: '78 кв. м', size: '9×12 м', floors: '1 этаж', rooms: '3 комнаты', bathrooms: '1 санузел', duration: 'от 60 дней', image: '/media/catalog-house-rodnye-penaty.webp' },
];

export const saunaProjects: CatalogProject[] = [
  { slug: 'banya-s-hozblokom', route: '/catalog-sauna/banya-s-hozblokom/', category: 'sauna', title: 'Проект бани «Баня с хозблоком»', name: 'Баня с хозблоком', area: '38 кв. м', size: '7×9 м', floors: '1 этаж', duration: 'от 25 дней', image: '/media/catalog-sauna-banya-s-hozblokom.webp' },
  { slug: 'uslada', route: '/catalog-sauna/uslada/', category: 'sauna', title: 'Проект бани «Услада»', name: 'Услада', area: '48 кв. м', size: '4×6 м', floors: '2 этажа', duration: 'от 35 дней', image: '/media/catalog-sauna-uslada.webp' },
  { slug: 'evropa', route: '/catalog-sauna/evropa/', category: 'sauna', title: 'Проект банного комплекса «Европа»', name: 'Европа', area: '52 кв. м', size: '5×11 м', floors: '1 этаж', duration: 'от 30 дней', image: '/media/catalog-sauna-evropa.webp' },
  { slug: 'zdravnitsa', route: '/catalog-sauna/zdravnitsa/', category: 'sauna', title: 'Проект банного комплекса «Здравница»', name: 'Здравница', area: '52 кв. м', size: '6×11 м', floors: '1 этаж', duration: 'от 30 дней', image: '/media/catalog-sauna-zdravnitsa.webp' },
  { slug: 'udachnaya', route: '/catalog-sauna/udachnaya/', category: 'sauna', title: 'Проект бани «Удачная»', name: 'Удачная', area: '31 кв. м', size: '5×6 м', floors: '1 этаж', duration: 'от 25 дней', image: '/media/catalog-sauna-udachnaya.webp' },
  { slug: 'solnechnaya', route: '/catalog-sauna/solnechnaya/', category: 'sauna', title: 'Проект бани «Солнечная»', name: 'Солнечная', area: '56 кв. м', size: '5×12 м', floors: '1 этаж', duration: 'от 30 дней', image: '/media/catalog-sauna-solnechnaya.webp' },
  { slug: 'lesnaya', route: '/catalog-sauna/lesnaya/', category: 'sauna', title: 'Проект бани «Лесная»', name: 'Лесная', area: '35 кв. м', size: '7×5 м', floors: '1 этаж', duration: 'от 25 дней', image: '/media/catalog-sauna-lesnaya.webp' },
  { slug: 'klassika', route: '/catalog-sauna/klassika/', category: 'sauna', title: 'Проект бани «Классика»', name: 'Классика', area: '43 кв. м', size: '6×7 м', floors: '1 этаж', duration: 'от 25 дней', image: '/media/catalog-sauna-klassika.webp' },
  { slug: 'zagorodnaya', route: '/catalog-sauna/zagorodnaya/', category: 'sauna', title: 'Проект бани «Загородная»', name: 'Загородная', area: '72 кв. м', size: '7×10 м', floors: '2 этажа', duration: 'от 40 дней', image: '/media/catalog-sauna-zagorodnaya.webp' },
  { slug: 'zharkaya', route: '/catalog-sauna/zharkaya/', category: 'sauna', title: 'Проект бани «Жаркая»', name: 'Жаркая', area: '39 кв. м', size: '6×8 м', floors: '1 этаж', duration: 'от 25 дней', image: '/media/catalog-sauna-zharkaya.webp' },
  { slug: 'banya-ohotnika', route: '/catalog-sauna/banya-ohotnika/', category: 'sauna', title: 'Проект бани «Баня Охотника»', name: 'Баня Охотника', area: '42 кв. м', size: '6×7 м', floors: '1 этаж', duration: 'от 25 дней', image: '/media/catalog-sauna-banya-ohotnika.webp' },
  { slug: 'dikaya-rubka', route: '/catalog-sauna/dikaya-rubka/', category: 'sauna', title: 'Проект бани «Дикая рубка»', name: 'Дикая рубка', area: '46 кв. м', size: '7×8 м', floors: '1 этаж', duration: 'от 30 дней', image: '/media/catalog-sauna-dikaya-rubka.webp' },
  { slug: 'boyarynya', route: '/catalog-sauna/boyarynya/', category: 'sauna', title: 'Проект бани «Боярыня»', name: 'Боярыня', area: '31 кв. м', size: '6×9 м', floors: '1 этаж', duration: 'от 25 дней', image: '/media/catalog-sauna-boyarynya.webp' },
  { slug: 'dom-banya-rodnaya', route: '/catalog-house/dom-banya-rodnaya/', category: 'sauna', title: 'Проект дома-бани «Родная»', name: 'Родная', area: '74 кв. м', size: '6×8 м', floors: '2 этажа', rooms: '3 комнаты', bathrooms: '1 санузел', duration: 'от 60 дней', image: '/media/catalog-sauna-rodnaya.webp' },
];

export const allProjects = [...houseProjects, ...saunaProjects];

export const catalogSeo: Record<ProjectCategory, SeoSettings> = {
  house: {
    title: 'Деревянные дома в Ижевске | Компания «ДревМастер»',
    description: 'Каталог проектов деревянных домов из бруса и бревна: площади, размеры, этажность и планировки.',
    canonicalPath: '/catalog-house/',
    ogImage: houseProjects[0]?.image ?? '/media/og.jpg',
  },
  sauna: {
    title: 'Проекты деревянных бань из бревна и бруса от компании «ДревМастер»',
    description: 'Каталог проектов деревянных бань и банных комплексов с характеристиками и вариантами комплектации.',
    canonicalPath: '/catalog-sauna/',
    ogImage: saunaProjects[0]?.image ?? '/media/og.jpg',
  },
};

export const basePackageSections: PackageSection[] = [
  { title: 'Общее', items: ['Транспортные и погрузочно-разгрузочные работы в пределах Удмуртской Республики', 'Монтаж фундамента, стенового комплекта и кровли профильными специалистами', 'Технический надзор компании', 'Гарантия 5 лет и первое техническое обслуживание'] },
  { title: 'Проектная документация', items: ['Эскизный проект', 'Раздел КД — конструкции деревянные', 'Привязка проекта к участку'] },
  { title: 'Обследование участка', items: ['Оценка состояния и особенностей участка', 'Геодезия пятна застройки', 'Консультация по размещению с учётом строительных и противопожарных норм'] },
  { title: 'Фундамент', items: ['Разметка фундамента на участке', 'Монтаж опалубки и армокаркаса', 'Бетонирование с вибрированием', 'Другие варианты фундамента по запросу'] },
  { title: 'Стеновой комплект', items: ['Гидроизоляция и обработанная подкладочная доска', 'Деревянный стеновой комплект выбранного типа', 'Межвенцовое утепление и крепёжные элементы', 'Балки перекрытия и монтаж с учётом усадки'] },
  { title: 'Кровля', items: ['Стропильная система с учётом подвижек деревянного дома', 'Контробрешётка, обрешётка и защитная мембрана', 'Металлочерепица и цвет покрытия на выбор', 'Другие кровельные материалы по запросу'] },
];

export function getProjectSeo(project: CatalogProject): SeoSettings {
  return {
    title: `${project.title} от компании «ДревМастер»`,
    description: `${project.title}: ${project.area}, ${project.size}, ${project.floors}. Проект можно адаптировать под ваш участок и пожелания.`,
    canonicalPath: project.route,
    ogImage: project.image,
  };
}

export function getProjectDescription(project: CatalogProject): string {
  const building = project.category === 'house' ? 'деревянного дома' : 'деревянной бани';
  return `${project.title} площадью ${project.area} — продуманное решение для загородной жизни и отдыха. Размер ${project.size} позволяет удобно разместить проект на участке, а планировку и материалы можно адаптировать под ваши пожелания. При строительстве ${building} учитываются особенности древесины, сезонная усадка и прокладка инженерных коммуникаций.`;
}

export function getRelatedProjects(project: CatalogProject, limit = 3): CatalogProject[] {
  const source = project.category === 'house' ? houseProjects : saunaProjects;
  return source.filter((candidate) => candidate.route !== project.route).slice(0, limit);
}
