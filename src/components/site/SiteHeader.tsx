import { useEffect, useState } from 'react';
import { siteContent } from '../../data/site';
import SocialMark from './SocialMark';

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const close = (event: KeyboardEvent) => event.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, []);

  return (
    <header className="site-header">
      <div className="site-header__top container">
        <a className="brand" href="/#top" aria-label="ДревМастер — на главную">
          <img src="/media/logo.webp" alt="ДревМастер" width="220" height="55" />
        </a>
        <div className="site-header__contacts">
          <a href={siteContent.contact.phoneHref}>{siteContent.contact.phoneLabel}</a>
          <a href={`mailto:${siteContent.contact.email}`}>{siteContent.contact.email}</a>
        </div>
        <div className="socials" aria-label="Социальные сети">
          {siteContent.socials.map((social) => (
            <a key={social.kind} href={social.href} target="_blank" rel="noreferrer" aria-label={social.label}>
              <SocialMark kind={social.kind} />
            </a>
          ))}
        </div>
        <button className="button button--accent site-header__callback" type="button" data-lead-form="callback">Заказать звонок</button>
        <button className="menu-toggle" type="button" aria-expanded={menuOpen} aria-controls="mobile-menu" onClick={() => setMenuOpen((value) => !value)}>
          <span />
          <span />
          <span />
          <span className="sr-only">Открыть меню</span>
        </button>
      </div>
      <nav className="site-header__nav container" aria-label="Основная навигация">
        {siteContent.navigation.map((item) => <a key={item.label} href={item.href}>{item.label}</a>)}
      </nav>
      <div id="mobile-menu" className={`mobile-menu${menuOpen ? ' mobile-menu--open' : ''}`} aria-hidden={!menuOpen}>
        <button className="mobile-menu__close" type="button" onClick={() => setMenuOpen(false)} aria-label="Закрыть меню">×</button>
        <nav aria-label="Мобильная навигация">
          {siteContent.navigation.map((item) => <a key={item.label} href={item.href} onClick={() => setMenuOpen(false)}>{item.label}</a>)}
        </nav>
        <a className="mobile-menu__phone" href={siteContent.contact.phoneHref}>{siteContent.contact.phoneLabel}</a>
        <button className="button button--accent" type="button" data-lead-form="callback" onClick={() => setMenuOpen(false)}>Заказать звонок</button>
      </div>
      {menuOpen && <button className="menu-overlay" type="button" aria-label="Закрыть меню" onClick={() => setMenuOpen(false)} />}
    </header>
  );
}
