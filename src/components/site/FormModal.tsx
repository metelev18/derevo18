import { useEffect, useRef } from 'react';
import type { FormDefinition } from '../../data/site';
import LeadForm from './LeadForm';

export default function FormModal({ definition, onClose }: { definition: FormDefinition; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="modal" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal__panel" role="dialog" aria-modal="true" aria-labelledby="lead-modal-title">
        <button ref={closeRef} className="modal__close" type="button" onClick={onClose} aria-label="Закрыть окно">×</button>
        <p className="modal__eyebrow">ДРЕВМАСТЕР</p>
        <h2 id="lead-modal-title">{definition.title}</h2>
        <p>{definition.description}</p>
        <LeadForm definition={definition} compact />
      </section>
    </div>
  );
}
