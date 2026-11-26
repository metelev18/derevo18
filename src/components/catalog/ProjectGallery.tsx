import { useCallback, useState } from 'react';
import ArrowIcon from '../ui/ArrowIcon';
import GalleryLightbox from '../ui/GalleryLightbox';

interface Props {
  title: string;
  images: string[];
  floorPlans?: string[];
  fit?: 'cover' | 'contain';
}

export default function ProjectGallery({ title, images, floorPlans = [], fit = 'cover' }: Props) {
  const [active, setActive] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const canMove = images.length > 1;
  const activeImage = images[active];

  const move = useCallback((step: number) => {
    if (!canMove) return;
    setActive((current) => (current + step + images.length) % images.length);
  }, [canMove, images.length]);

  if (!activeImage) return null;

  const imageAlt = `${title}, изображение ${active + 1} из ${images.length}`;

  return (
    <div className="project-gallery">
      <div className="project-gallery__stage">
        <button className="project-gallery__expand" type="button" onClick={() => setExpanded(true)} aria-label="Открыть фотографию на весь экран">
          <img src={activeImage} alt={imageAlt} width="1400" height="1000" style={{ objectFit: floorPlans.includes(activeImage) ? 'contain' : fit }} />
          <span aria-hidden="true">↗</span>
        </button>
        {canMove && (
          <>
            <button className="project-gallery__arrow project-gallery__arrow--left" type="button" onClick={() => move(-1)} aria-label="Предыдущее изображение">
              <ArrowIcon direction="left" />
            </button>
            <button className="project-gallery__arrow project-gallery__arrow--right" type="button" onClick={() => move(1)} aria-label="Следующее изображение">
              <ArrowIcon />
            </button>
          </>
        )}
        <span className="project-gallery__counter" aria-live="polite">{active + 1} / {images.length}</span>
      </div>

      {canMove && (
        <div className="project-gallery__thumbs" aria-label="Изображения проекта">
          {images.map((image, index) => (
            <button
              className={index === active ? 'is-active' : ''}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`Показать изображение ${index + 1}`}
              aria-pressed={index === active}
              key={image}
            >
              <img src={image} alt="" width="180" height="120" loading={index < 5 ? 'eager' : 'lazy'} />
            </button>
          ))}
        </div>
      )}

      {expanded && <GalleryLightbox title={title} images={images} active={active} onChange={setActive} onClose={() => setExpanded(false)} />}
    </div>
  );
}
