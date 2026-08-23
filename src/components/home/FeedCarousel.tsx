import { useRef } from 'react';
import type { FeedItem } from '../../data/home';
import ArrowIcon from '../ui/ArrowIcon';
import SectionTitle from '../ui/SectionTitle';

export default function FeedCarousel({ title, items, id }: { title: string; items: FeedItem[]; id: string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const scroll = (direction: number) => trackRef.current?.scrollBy({ left: direction * Math.min(trackRef.current.clientWidth * .86, 420), behavior: 'smooth' });

  return (
    <section id={id} className="feed section-space">
      <SectionTitle>{title}</SectionTitle>
      <div className="feed__wrap container">
        <button className="carousel-arrow carousel-arrow--left" type="button" onClick={() => scroll(-1)} aria-label="Предыдущие карточки"><ArrowIcon direction="left" /></button>
        <div ref={trackRef} className="feed__track" tabIndex={0}>
          {items.map((feedItem) => (
            <a className="feed-card" key={`${feedItem.title}-${feedItem.date}`} href={feedItem.href ?? `/coming-soon/?target=${id}`}>
              <img src={feedItem.image} alt="" loading="lazy" />
              <div><h3>{feedItem.title}</h3>{feedItem.excerpt && <p>{feedItem.excerpt}</p>}<time>{feedItem.date}</time></div>
            </a>
          ))}
        </div>
        <button className="carousel-arrow carousel-arrow--right" type="button" onClick={() => scroll(1)} aria-label="Следующие карточки"><ArrowIcon /></button>
      </div>
      <a className="text-link feed__more" href={id === 'news' ? '/news/' : `/coming-soon/?target=${id}`}>Подробнее <ArrowIcon /></a>
    </section>
  );
}
