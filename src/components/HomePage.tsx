import { useEffect, useRef, useState, type ReactNode, type SubmitEvent } from 'react';
import { homeContent, type FeedItem, type FormDefinition } from '../data/home';
import { DEMO_MESSAGE, formatPhone, isPhoneComplete } from '../lib/form';

type ModalId = FormDefinition['id'] | null;

function ArrowIcon({ direction = 'right' }: { direction?: 'left' | 'right' }) {
  return <span aria-hidden="true">{direction === 'right' ? '→' : '←'}</span>;
}

function SocialMark({ kind }: { kind: 'vk' | 'telegram' | 'whatsapp' }) {
  const label = kind === 'vk' ? 'VK' : kind === 'telegram' ? 'T' : 'W';
  return <span className={`social-mark social-mark--${kind}`} aria-hidden="true">{label}</span>;
}

function SectionTitle({ eyebrow, children }: { eyebrow?: string; children: ReactNode }) {
  return (
    <div className="section-heading container">
      {eyebrow && <p className="section-heading__eyebrow">{eyebrow}</p>}
      <h2>{children}</h2>
    </div>
  );
}

function LeadForm({ definition, compact = false }: { definition: FormDefinition; compact?: boolean }) {
  const [phone, setPhone] = useState('+7');
  const [message, setMessage] = useState('');
  const phoneRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');
    const form = event.currentTarget;
    if (!isPhoneComplete(phone)) {
      phoneRef.current?.setCustomValidity('Введите номер телефона полностью');
    } else {
      phoneRef.current?.setCustomValidity('');
    }
    if (!form.reportValidity()) return;
    setMessage(DEMO_MESSAGE);
  };

  return (
    <form className={`lead-form${compact ? ' lead-form--compact' : ''}`} onSubmit={handleSubmit} noValidate data-testid={`form-${definition.id}`}>
      <label>
        <span>Ваше имя</span>
        <input name="name" type="text" autoComplete="name" placeholder="Имя" required />
      </label>
      <label>
        <span>Телефон</span>
        <input
          ref={phoneRef}
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          placeholder="+7 (___) ___-__-__"
          onChange={(event) => {
            event.currentTarget.setCustomValidity('');
            setPhone(formatPhone(event.currentTarget.value));
          }}
          required
        />
      </label>
      {definition.showEmail && (
        <label>
          <span>Электронная почта</span>
          <input name="email" type="email" autoComplete="email" placeholder="Ваш e-mail" required />
        </label>
      )}
      <label className="lead-form__consent">
        <input name="consent" type="checkbox" defaultChecked required />
        <span>Отправляя заявку, вы соглашаетесь на обработку персональных данных</span>
      </label>
      <button className="button button--dark" type="submit">{definition.button}</button>
      {message && <p className="lead-form__message" role="status">{message}</p>}
    </form>
  );
}

function FormModal({ definition, onClose }: { definition: FormDefinition; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="modal" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal__panel" role="dialog" aria-modal="true" aria-labelledby="lead-modal-title">
        <button ref={closeRef} className="modal__close" type="button" onClick={onClose} aria-label="Закрыть окно">×</button>
        <p className="modal__eyebrow">ДРЕВМАСТЕР</p>
        <h2 id="lead-modal-title">{definition.title}</h2>
        <p>{definition.description}</p>
        <LeadForm definition={definition} compact />
      </section>
    </div>
  );
}

function Header({ onOpenForm }: { onOpenForm: (id: ModalId) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const close = (event: KeyboardEvent) => event.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, []);

  return (
    <header className="site-header">
      <div className="site-header__top container">
        <a className="brand" href="#top" aria-label="ДревМастер — на главную">
          <img src="/media/logo.webp" alt="ДревМастер" width="220" height="55" />
        </a>
        <div className="site-header__contacts">
          <a href={homeContent.contact.phoneHref}>{homeContent.contact.phoneLabel}</a>
          <a href={`mailto:${homeContent.contact.email}`}>{homeContent.contact.email}</a>
        </div>
        <div className="socials" aria-label="Социальные сети">
          {homeContent.socials.map((social) => (
            <a key={social.kind} href={social.href} target="_blank" rel="noreferrer" aria-label={social.label}>
              <SocialMark kind={social.kind} />
            </a>
          ))}
        </div>
        <button className="button button--accent site-header__callback" type="button" onClick={() => onOpenForm('callback')}>Заказать звонок</button>
        <button className="menu-toggle" type="button" aria-expanded={menuOpen} aria-controls="mobile-menu" onClick={() => setMenuOpen((value) => !value)}>
          <span />
          <span />
          <span />
          <span className="sr-only">Открыть меню</span>
        </button>
      </div>
      <nav className="site-header__nav container" aria-label="Основная навигация">
        {homeContent.navigation.map((item) => <a key={item.label} href={item.href}>{item.label}</a>)}
      </nav>
      <div id="mobile-menu" className={`mobile-menu${menuOpen ? ' mobile-menu--open' : ''}`} aria-hidden={!menuOpen}>
        <button className="mobile-menu__close" type="button" onClick={() => setMenuOpen(false)} aria-label="Закрыть меню">×</button>
        <nav aria-label="Мобильная навигация">
          {homeContent.navigation.map((item) => <a key={item.label} href={item.href} onClick={() => setMenuOpen(false)}>{item.label}</a>)}
        </nav>
        <a className="mobile-menu__phone" href={homeContent.contact.phoneHref}>{homeContent.contact.phoneLabel}</a>
        <button className="button button--accent" type="button" onClick={() => { setMenuOpen(false); onOpenForm('callback'); }}>Заказать звонок</button>
      </div>
      {menuOpen && <button className="menu-overlay" aria-label="Закрыть меню" onClick={() => setMenuOpen(false)} />}
    </header>
  );
}

function Hero({ onOpenForm }: { onOpenForm: (id: ModalId) => void }) {
  return (
    <section id="top" className="hero" style={{ backgroundImage: `linear-gradient(0deg, rgba(0,0,0,.88), rgba(0,0,0,0) 68%), url(${homeContent.hero.background})` }}>
      <div className="hero__inner container">
        <div className="hero__title-block">
          <p>{homeContent.hero.eyebrow}</p>
          <h1>{homeContent.hero.title}</h1>
        </div>
        <div className="hero__actions">
          <button className="button button--accent button--large" type="button" onClick={() => onOpenForm('catalog')}>Скачать каталог</button>
          <a className="button button--outline button--large" href="/coming-soon/?target=calculator">Рассчитать стоимость</a>
        </div>
        <div className="hero__materials">
          {homeContent.hero.materials.map((material) => (
            <a key={material.title} href="/coming-soon/?target=material" className="material-link">
              <img src={material.image} width="54" height="54" alt="" />
              <span>{material.title}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function Catalog() {
  const [expanded, setExpanded] = useState(false);
  const projects = expanded ? homeContent.projects : homeContent.projects.slice(0, 3);
  return (
    <section id="catalog" className="catalog section-space">
      <SectionTitle>КАТАЛОГ</SectionTitle>
      <div className="project-grid container">
        {projects.map((project) => (
          <article className="project-card" key={project.title}>
            <a href={`/coming-soon/?target=${encodeURIComponent(project.target)}`} className="project-card__image">
              <img src={project.image} alt={project.title} loading="lazy" width="560" height="390" />
            </a>
            <div className="project-card__body">
              <h3>{project.title}</h3>
              <dl>
                <div><dt>Площадь:</dt><dd>{project.area}</dd></div>
                <div><dt>Размер:</dt><dd>{project.size}</dd></div>
                <div><dt>Этажей:</dt><dd>{project.floors}</dd></div>
                <div><dt>Комнат:</dt><dd>{project.rooms}</dd></div>
              </dl>
              <a className="text-link" href={`/coming-soon/?target=${encodeURIComponent(project.target)}`}>Подробнее <ArrowIcon /></a>
            </div>
          </article>
        ))}
      </div>
      <button className="button button--accent catalog__more" type="button" onClick={() => setExpanded((value) => !value)}>
        {expanded ? 'Свернуть' : 'Загрузить ещё'}
      </button>
    </section>
  );
}

function About() {
  const services = ['Проектирование', 'Изготовление фундамента', 'Рубка и сборка срубов', 'Кровельные работы', 'Установка окосячки и окон', 'Дизайн интерьера', 'Покраска и шлифовка', 'Герметизация', 'Канализация', 'Электрика и отопление'];
  return (
    <section id="about" className="about section-space">
      <div className="about__intro container">
        <div>
          <p className="section-heading__eyebrow">ДРЕВМАСТЕР</p>
          <h2>О КОМПАНИИ</h2>
          <p className="about__lead">С 2008 года мы специализируемся исключительно на деревянных домах. Нами выполнено более 200 объектов домов и бань по Удмуртии и России.</p>
          <h3>Наши услуги:</h3>
          <ul className="service-list">{services.map((service) => <li key={service}>{service}</li>)}</ul>
          <a className="text-link" href="/coming-soon/?target=history">Подробнее <ArrowIcon /></a>
        </div>
        <div className="about__collage" aria-label="Наши работы">
          <img className="about__image about__image--main" src="/media/about-carpentry.webp" alt="Строительство деревянного дома" loading="lazy" />
          <img className="about__image about__image--small" src="/media/about-interior.webp" alt="Интерьер деревянного дома" loading="lazy" />
          <div className="about__badge"><strong>5 лет</strong><span>гарантия на все работы</span></div>
        </div>
      </div>
      <div className="feature-strip container">
        <article><strong>РУБИМ</strong><span>Сосну, кедр, лиственницу</span></article>
        <article><strong>РАБОТАЕМ</strong><span>С материнским капиталом и госсертификатами</span></article>
        <article><strong>ТЕХНОЛОГИЯ</strong><span>Русская, канадская и норвежская рубка</span></article>
      </div>
    </section>
  );
}

function Promo() {
  return (
    <section className="promo" style={{ backgroundImage: 'linear-gradient(90deg, rgba(24,15,8,.84), rgba(24,15,8,.22)), url(/media/promo-bg.webp)' }}>
      <div className="promo__grid container">
        <article><p>Каталог</p><h2>Типовые проекты домов и бань</h2><a className="button button--outline" href="/coming-soon/?target=catalog-house">Перейти</a></article>
        <article><p>Портфолио</p><h2>Примеры готовых объектов</h2><a className="button button--outline" href="#portfolio">Перейти</a></article>
      </div>
    </section>
  );
}

function VideoSection() {
  return (
    <section className="video-section section-space container" aria-label="Видео о компании">
      <div className="video-frame">
        <iframe src="https://kinescope.io/embed/bGpNMQ1t4GR1vRdSoJkAoK" title="Видео о строительной компании ДревМастер" loading="lazy" allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowFullScreen />
      </div>
    </section>
  );
}

function Technology() {
  const technologies = [
    ['01', 'Обрабатываем каждый дюйм сруба антисептиком Lignofix'],
    ['02', '«Скользящая» кровля специально для деревянного дома'],
    ['03', 'Прокладка коммуникаций и отделка с учетом усадки дома'],
    ['04', 'Первый венец — лиственница. Увеличивает срок службы дома на 30–50 лет'],
  ];
  return (
    <section id="technology" className="technology section-space">
      <div className="technology__inner container">
        <div className="technology__photo"><img src="/media/about-roofers.webp" alt="Строители ДревМастер за работой" loading="lazy" /></div>
        <div>
          <p className="section-heading__eyebrow">РАБОТАЕМ НА РЕЗУЛЬТАТ</p>
          <h2>НАШИ УНИКАЛЬНЫЕ ТЕХНОЛОГИИ</h2>
          <ol>{technologies.map(([number, text]) => <li key={number}><span>{number}</span><p>{text}</p></li>)}</ol>
        </div>
      </div>
    </section>
  );
}

function Director() {
  return (
    <section className="director section-space">
      <div className="director__inner container">
        <img src="/media/director.webp" alt="Александр Метелев, директор СК ДревМастер" loading="lazy" />
        <div>
          <blockquote>«Я не буду рассказывать здесь про марки бетона, качество бревен, количество наших проектов и опыт работников. Потому что вас это не интересует. Вы просто хотите жить в красивом, надежном, удобном доме».</blockquote>
          <p>Добавляйтесь в друзья и получайте полезный контент о строительстве деревянного дома.</p>
          <strong>Александр Метелев</strong>
          <span>Директор СК «ДревМастер»</span>
        </div>
      </div>
    </section>
  );
}

function Portfolio() {
  const [active, setActive] = useState<number | null>(null);
  const item = active === null ? null : homeContent.portfolio[active];
  const move = (step: number) => setActive((current) => current === null ? 0 : (current + step + homeContent.portfolio.length) % homeContent.portfolio.length);
  useEffect(() => {
    if (active === null) return;
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActive(null);
      if (event.key === 'ArrowRight') move(1);
      if (event.key === 'ArrowLeft') move(-1);
    };
    document.addEventListener('keydown', keydown);
    return () => document.removeEventListener('keydown', keydown);
  }, [active]);
  return (
    <section id="portfolio" className="portfolio section-space">
      <SectionTitle>ПОРТФОЛИО</SectionTitle>
      <div className="portfolio-grid container">
        {homeContent.portfolio.map((portfolioItem, index) => (
          <button className="portfolio-card" type="button" key={portfolioItem.title} onClick={() => setActive(index)}>
            <img src={portfolioItem.image} alt="" loading="lazy" />
            <span>{portfolioItem.title}</span>
          </button>
        ))}
      </div>
      <a className="button button--accent portfolio__more" href="/coming-soon/?target=portfolio">+ Показать еще</a>
      {item && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label={item.title} onMouseDown={(event) => event.target === event.currentTarget && setActive(null)}>
          <button className="lightbox__close" type="button" onClick={() => setActive(null)} aria-label="Закрыть галерею">×</button>
          <button className="lightbox__arrow lightbox__arrow--left" type="button" onClick={() => move(-1)} aria-label="Предыдущая фотография"><ArrowIcon direction="left" /></button>
          <figure><img src={item.image} alt={item.title} /><figcaption>{item.title}</figcaption></figure>
          <button className="lightbox__arrow lightbox__arrow--right" type="button" onClick={() => move(1)} aria-label="Следующая фотография"><ArrowIcon /></button>
        </div>
      )}
    </section>
  );
}

function FeedCarousel({ title, items, id }: { title: string; items: FeedItem[]; id: string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const scroll = (direction: number) => trackRef.current?.scrollBy({ left: direction * Math.min(trackRef.current.clientWidth * .86, 420), behavior: 'smooth' });
  return (
    <section id={id} className="feed section-space">
      <SectionTitle>{title}</SectionTitle>
      <div className="feed__wrap container">
        <button className="carousel-arrow carousel-arrow--left" type="button" onClick={() => scroll(-1)} aria-label="Предыдущие карточки"><ArrowIcon direction="left" /></button>
        <div ref={trackRef} className="feed__track" tabIndex={0}>
          {items.map((feedItem) => (
            <a className="feed-card" key={`${feedItem.title}-${feedItem.date}`} href={`/coming-soon/?target=${id}`}>
              <img src={feedItem.image} alt="" loading="lazy" />
              <div><h3>{feedItem.title}</h3>{feedItem.excerpt && <p>{feedItem.excerpt}</p>}<time>{feedItem.date}</time></div>
            </a>
          ))}
        </div>
        <button className="carousel-arrow carousel-arrow--right" type="button" onClick={() => scroll(1)} aria-label="Следующие карточки"><ArrowIcon /></button>
      </div>
      <a className="text-link feed__more" href={`/coming-soon/?target=${id}`}>Подробнее <ArrowIcon /></a>
    </section>
  );
}

function Contacts() {
  const form = homeContent.forms.find((item) => item.id === 'application')!;
  return (
    <section id="contacts" className="contacts">
      <div className="contacts__map">
        <iframe title="ДревМастер на карте" loading="lazy" src="https://yandex.ru/map-widget/v1/?text=%D0%98%D0%B6%D0%B5%D0%B2%D1%81%D0%BA%2C%20%D1%83%D0%BB.%20%D0%9A%D0%BE%D0%BC%D0%BC%D1%83%D0%BD%D0%B0%D1%80%D0%BE%D0%B2%2C%20244&z=16" />
      </div>
      <div className="contacts__form">
        <p className="section-heading__eyebrow">СВЯЖИТЕСЬ С НАМИ</p>
        <h2>{form.title.toUpperCase()}</h2>
        <p>{form.description}</p>
        <LeadForm definition={form} />
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner container">
        <a className="brand brand--footer" href="#top"><img src="/media/logo.webp" alt="ДревМастер" width="220" height="55" /></a>
        <div><p className="footer__label">Контакты</p><p>{homeContent.contact.company}</p><p>{homeContent.contact.address}</p></div>
        <div><p className="footer__label">Связаться</p><a href={homeContent.contact.phoneHref}>{homeContent.contact.phoneLabel}</a><a href={`mailto:${homeContent.contact.email}`}>{homeContent.contact.email}</a></div>
        <div className="socials socials--footer">{homeContent.socials.map((social) => <a key={social.kind} href={social.href} target="_blank" rel="noreferrer" aria-label={social.label}><SocialMark kind={social.kind} /></a>)}</div>
      </div>
      <div className="footer__bottom container"><span>© 2008–2026 ДревМастер</span><a href="/coming-soon/?target=privacy">Политика конфиденциальности</a></div>
    </footer>
  );
}

function MessengerWidget({ onOpenForm }: { onOpenForm: (id: ModalId) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`messenger${open ? ' messenger--open' : ''}`}>
      <div className="messenger__items">
        {homeContent.socials.map((social) => <a key={social.kind} href={social.href} target="_blank" rel="noreferrer" aria-label={social.label}><SocialMark kind={social.kind} /></a>)}
        <button type="button" onClick={() => onOpenForm('callback')} aria-label="Заказать звонок">☎</button>
      </div>
      <button className="messenger__toggle" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label={open ? 'Закрыть способы связи' : 'Открыть способы связи'}>{open ? '×' : '≡'}</button>
    </div>
  );
}

export default function HomePage() {
  const [modalId, setModalId] = useState<ModalId>(null);
  const modal = homeContent.forms.find((form) => form.id === modalId);

  useEffect(() => {
    document.body.classList.toggle('body-locked', Boolean(modal));
    return () => document.body.classList.remove('body-locked');
  }, [modal]);

  return (
    <>
      <a className="skip-link" href="#main">К основному контенту</a>
      <Header onOpenForm={setModalId} />
      <main id="main">
        <Hero onOpenForm={setModalId} />
        <Catalog />
        <About />
        <Promo />
        <VideoSection />
        <Technology />
        <Director />
        <Portfolio />
        <FeedCarousel id="reviews" title="ОТЗЫВЫ" items={homeContent.reviews} />
        <FeedCarousel id="news" title="НОВОСТИ" items={homeContent.news} />
        <Contacts />
      </main>
      <Footer />
      <MessengerWidget onOpenForm={setModalId} />
      {modal && <FormModal definition={modal} onClose={() => setModalId(null)} />}
    </>
  );
}
