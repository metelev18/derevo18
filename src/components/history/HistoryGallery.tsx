import { useState } from 'react';
import type { HistoryImage } from '../../data/history';
import ArrowIcon from '../ui/ArrowIcon';

export default function HistoryGallery({ images }: { images: HistoryImage[] }) {
  const [active, setActive] = useState(0);
  const move = (step: number) => setActive((current) => (current + step + images.length) % images.length);
  const image = images[active];

  if (!image) return null;

  return (
    <section className="history-gallery container" aria-label="Фотографии объектов компании">
      <div className="history-gallery__viewport">
        <img src={image.src} alt={image.alt} width="1800" height="1100" loading="lazy" />
        <button className="history-gallery__arrow history-gallery__arrow--left" type="button" onClick={() => move(-1)} aria-label="Предыдущая фотография">
          <ArrowIcon direction="left" />
        </button>
        <button className="history-gallery__arrow history-gallery__arrow--right" type="button" onClick={() => move(1)} aria-label="Следующая фотография">
          <ArrowIcon />
        </button>
      </div>
      <div className="history-gallery__dots" aria-label="Выбор фотографии">
        {images.map((galleryImage, index) => (
          <button
            key={galleryImage.src}
            className={index === active ? 'history-gallery__dot history-gallery__dot--active' : 'history-gallery__dot'}
            type="button"
            aria-label={`Перейти к фотографии ${index + 1}`}
            aria-current={index === active ? 'true' : undefined}
            onClick={() => setActive(index)}
          />
        ))}
      </div>
    </section>
  );
}
