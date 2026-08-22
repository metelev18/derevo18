import { useState } from 'react';
import { homeContent } from '../../data/home';
import ArrowIcon from '../ui/ArrowIcon';
import SectionTitle from '../ui/SectionTitle';

export default function Catalog() {
  const [expanded, setExpanded] = useState(false);
  const projects = expanded ? homeContent.projects : homeContent.projects.slice(0, 3);

  return (
    <section id="catalog" className="catalog section-space">
      <SectionTitle>КАТАЛОГ</SectionTitle>
      <div className="project-grid container">
        {projects.map((project) => (
          <article className="project-card" key={project.title}>
            <a href={project.target} className="project-card__image">
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
              <a className="text-link" href={project.target}>Подробнее <ArrowIcon /></a>
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
