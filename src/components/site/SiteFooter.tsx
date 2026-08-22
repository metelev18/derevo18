import { siteContent } from '../../data/site';
import SocialMark from './SocialMark';

export default function SiteFooter() {
  return (
    <footer className="footer">
      <div className="footer__inner container">
        <a className="brand brand--footer" href="/#top"><img src="/media/logo.webp" alt="ДревМастер" width="220" height="55" /></a>
        <div><p className="footer__label">Контакты</p><p>{siteContent.contact.company}</p><p>{siteContent.contact.address}</p></div>
        <div><p className="footer__label">Связаться</p><a href={siteContent.contact.phoneHref}>{siteContent.contact.phoneLabel}</a><a href={`mailto:${siteContent.contact.email}`}>{siteContent.contact.email}</a></div>
        <div className="socials socials--footer">{siteContent.socials.map((social) => <a key={social.kind} href={social.href} target="_blank" rel="noreferrer" aria-label={social.label}><SocialMark kind={social.kind} /></a>)}</div>
      </div>
      <div className="footer__bottom container"><span>{siteContent.copyright}</span><a href="/coming-soon/?target=privacy">Политика конфиденциальности</a></div>
    </footer>
  );
}
