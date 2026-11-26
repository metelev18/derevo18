import { useState } from 'react';
import { siteContent } from '../../data/site';

// Load the third-party widget only after a visitor asks for the map. Some mobile
// browsers scroll a newly loaded iframe into view when its contents take focus.
export default function LocationMap() {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="location-map">
      {loaded ? (
        <iframe title="ДревМастер на карте" src={siteContent.mapEmbedUrl} />
      ) : (
        <div className="location-map__preview">
          <img src="/media/contact-building.webp" alt="Офис компании ДревМастер" loading="lazy" width="1000" height="720" />
          <button className="button button--accent" type="button" onClick={() => setLoaded(true)}>Показать карту</button>
        </div>
      )}
    </div>
  );
}
