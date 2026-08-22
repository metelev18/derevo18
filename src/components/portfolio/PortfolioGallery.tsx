import { useCallback, useEffect, useState } from 'react';
import ArrowIcon from '../ui/ArrowIcon';

interface Props {
  title: string;
  images: string[];
}

export default function PortfolioGallery({ title, images }: Props) {
  const [active, setActive] = useState(0);
  const canMove = images.length > 1;
  const move = useCallback((step: number) => {
    setActive((current) => (current + step + images.length) % images.length);
  }, [images.length]);

  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (!canMove) return;
      if (event.key === 'ArrowRight') move(1);
      if (event.key === 'ArrowLeft') move(-1);
    };
    document.addEventListener('keydown', keydown);
    return () => document.removeEventListener('keydown', keydown);
  }, [canMove, move]);

  return (
    <section className="portfolio-viewer" aria-labelledby="portfolio-work-title">
      <a className="portfolio-viewer__close" href="/portfolio/" aria-label="Вернуться в портфолио">×</a>
      <div className="portfolio-viewer__inner">
        <div className="portfolio-viewer__stage">
          <img src={images[active]} alt={`${title}, фотография ${active + 1}`} width="1800" height="1200" />
          {canMove && (
            <>
              <button className="portfolio-viewer__arrow portfolio-viewer__arrow--left" type="button" onClick={() => move(-1)} aria-label="Предыдущая фотография">
                <ArrowIcon direction="left" />
              </button>
              <button className="portfolio-viewer__arrow portfolio-viewer__arrow--right" type="button" onClick={() => move(1)} aria-label="Следующая фотография">
                <ArrowIcon />
              </button>
            </>
          )}
          <span className="portfolio-viewer__counter" aria-live="polite">{active + 1} / {images.length}</span>
        </div>

        {canMove && (
          <div className="portfolio-viewer__thumbs" aria-label="Фотографии работы">
            {images.map((image, index) => (
              <button type="button" className={index === active ? 'is-active' : ''} onClick={() => setActive(index)} aria-label={`Показать фотографию ${index + 1}`} aria-pressed={index === active} key={image}>
                <img src={image} alt="" loading={index < 5 ? 'eager' : 'lazy'} width="180" height="120" />
              </button>
            ))}
          </div>
        )}

        <h1 id="portfolio-work-title">{title}</h1>
        <a className="portfolio-viewer__back" href="/portfolio/">← Все работы</a>
      </div>
    </section>
  );
}
