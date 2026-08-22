import { useState } from 'react';
import { siteContent } from '../../data/site';
import SocialMark from './SocialMark';

export default function MessengerWidget() {
  const [open, setOpen] = useState(false);

  return (
    <div className={`messenger${open ? ' messenger--open' : ''}`}>
      <div className="messenger__items">
        {siteContent.socials.map((social) => <a key={social.kind} href={social.href} target="_blank" rel="noreferrer" aria-label={social.label}><SocialMark kind={social.kind} /></a>)}
        <button type="button" data-lead-form="callback" aria-label="Заказать звонок">☎</button>
      </div>
      <button className="messenger__toggle" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label={open ? 'Закрыть способы связи' : 'Открыть способы связи'}>{open ? '×' : '≡'}</button>
    </div>
  );
}
