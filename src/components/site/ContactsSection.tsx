import { siteContent } from '../../data/site';
import LeadForm from './LeadForm';
import LocationMap from './LocationMap';

export default function ContactsSection() {
  const form = siteContent.forms.application;

  return (
    <section id="contacts" className="contacts">
      <div className="contacts__map">
        <LocationMap />
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
