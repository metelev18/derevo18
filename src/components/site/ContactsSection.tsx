import { siteContent } from '../../data/site';
import LeadForm from './LeadForm';

export default function ContactsSection() {
  const form = siteContent.forms.application;

  return (
    <section id="contacts" className="contacts">
      <div className="contacts__map">
        <iframe title="ДревМастер на карте" loading="lazy" src={siteContent.mapEmbedUrl} />
      </div>
      <div className="contacts__form">
        <p className="section-heading__eyebrow">{siteContent.contactsEyebrow}</p>
        <h2>{form.title.toUpperCase()}</h2>
        <p>{form.description}</p>
        <LeadForm definition={form} />
      </div>
    </section>
  );
}
