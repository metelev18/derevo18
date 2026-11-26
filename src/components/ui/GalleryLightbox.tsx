import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import ArrowIcon from './ArrowIcon';

interface Props {
  title: string;
  images: string[];
  active: number;
  onChange: (index: number) => void;
  onClose: () => void;
}

export default function GalleryLightbox({ title, images, active, onChange, onClose }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const touchStart = useRef<number | null>(null);
  const move = (step: number) => onChange((active + step + images.length) % images.length);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const scrollY = window.scrollY;
    const previousStyle = document.body.getAttribute('style');
    Object.assign(document.body.style, { position: 'fixed', top: `-${scrollY}px`, width: '100%', overflow: 'hidden' });
    dialogRef.current?.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
    return () => {
      if (previousStyle === null) document.body.removeAttribute('style');
      else document.body.setAttribute('style', previousStyle);
      window.scrollTo({ top: scrollY, behavior: 'instant' });
      previousFocus?.focus({ preventScroll: true });
    };
  }, []);

  return createPortal(
    <div
      ref={dialogRef}
      className="project-gallery-modal"
      role="dialog"
      aria-modal="true"
      aria-label={`Галерея проекта ${title}`}
      tabIndex={-1}
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
      onTouchStart={(event) => { touchStart.current = event.touches[0]?.clientX ?? null; }}
      onTouchEnd={(event) => {
        const end = event.changedTouches[0]?.clientX;
        if (touchStart.current !== null && end !== undefined && Math.abs(end - touchStart.current) > 60) move(end < touchStart.current ? 1 : -1);
        touchStart.current = null;
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') { event.preventDefault(); onClose(); }
        if (event.key === 'ArrowRight') { event.preventDefault(); move(1); }
        if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); }
        if (event.key === 'Tab') {
          const buttons = [...(dialogRef.current?.querySelectorAll<HTMLButtonElement>('button') ?? [])];
          const first = buttons[0]; const last = buttons.at(-1);
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        }
      }}
    >
      <button className="project-gallery-modal__close" type="button" onClick={onClose} aria-label="Закрыть галерею">×</button>
      {images.length > 1 && <button className="project-gallery-modal__arrow project-gallery-modal__arrow--left" type="button" onClick={() => move(-1)} aria-label="Предыдущее изображение"><ArrowIcon direction="left" /></button>}
      <figure>
        <img src={images[active]} alt={`${title}, изображение ${active + 1} из ${images.length}`} />
        <figcaption aria-live="polite">{active + 1} / {images.length}</figcaption>
      </figure>
      {images.length > 1 && <button className="project-gallery-modal__arrow project-gallery-modal__arrow--right" type="button" onClick={() => move(1)} aria-label="Следующее изображение"><ArrowIcon /></button>}
    </div>, document.body,
  );
}
