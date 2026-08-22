import type { ReactNode } from 'react';

export default function SectionTitle({ eyebrow, children }: { eyebrow?: string; children: ReactNode }) {
  return (
    <div className="section-heading container">
      {eyebrow && <p className="section-heading__eyebrow">{eyebrow}</p>}
      <h2>{children}</h2>
    </div>
  );
}
