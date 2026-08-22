import { useEffect, useState } from 'react';
import { homeContent } from '../../data/home';
import ArrowIcon from '../ui/ArrowIcon';
import SectionTitle from '../ui/SectionTitle';

export default function Portfolio() {
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
      <a className="button button--accent portfolio__more" href="/portfolio/">+ Показать еще</a>
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
