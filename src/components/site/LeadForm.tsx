import { useRef, useState, type SubmitEvent } from 'react';
import { siteContent, type FormDefinition } from '../../data/site';
import { formatPhone, isPhoneComplete } from '../../lib/form';
import { FormSubmissionError, submitLead } from '../../lib/formSubmission';

export default function LeadForm({ definition, compact = false }: { definition: FormDefinition; compact?: boolean }) {
  const [phone, setPhone] = useState('+7');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [messageKind, setMessageKind] = useState<'success' | 'error'>('success');
  const phoneRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');
    const form = event.currentTarget;
    if (!isPhoneComplete(phone)) {
      phoneRef.current?.setCustomValidity('Введите номер телефона полностью');
    } else {
      phoneRef.current?.setCustomValidity('');
    }
    if (!form.reportValidity()) return;

    const data = new FormData(form);
    setSubmitting(true);
    try {
      await submitLead({
        formId: definition.id,
        name: String(data.get('name') ?? '').trim(),
        phone,
        email: definition.showEmail ? String(data.get('email') ?? '').trim() : undefined,
        consent: true,
        page: window.location.href,
        website: String(data.get('website') ?? ''),
      });
      form.reset();
      setPhone('+7');
      setMessageKind('success');
      setMessage('Спасибо! Заявка отправлена. Мы свяжемся с вами в ближайшее время.');
    } catch (error) {
      setMessageKind('error');
      setMessage(error instanceof FormSubmissionError && error.code === 'not-configured'
        ? `Отправка заявок еще не настроена. Позвоните нам: ${siteContent.contact.phoneLabel}.`
        : `Не удалось отправить заявку. Попробуйте еще раз или позвоните нам: ${siteContent.contact.phoneLabel}.`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className={`lead-form${compact ? ' lead-form--compact' : ''}`} onSubmit={handleSubmit} noValidate data-testid={`form-${definition.id}`}>
      <label>
        <span>Ваше имя</span>
        <input name="name" type="text" autoComplete="name" placeholder="Имя" required />
      </label>
      <label>
        <span>Телефон</span>
        <input
          ref={phoneRef}
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          placeholder="+7 (___) ___-__-__"
          onChange={(event) => {
            event.currentTarget.setCustomValidity('');
            setPhone(formatPhone(event.currentTarget.value));
          }}
          required
        />
      </label>
      {definition.showEmail && (
        <label>
          <span>Электронная почта</span>
          <input name="email" type="email" autoComplete="email" placeholder="Ваш e-mail" required />
        </label>
      )}
      <label className="lead-form__trap" aria-hidden="true">
        <span>Сайт компании</span>
        <input name="website" type="text" tabIndex={-1} autoComplete="off" />
      </label>
      <label className="lead-form__consent">
        <input name="consent" type="checkbox" defaultChecked required />
        <span>Отправляя заявку, вы соглашаетесь на обработку персональных данных</span>
      </label>
      <button className="button button--dark" type="submit" disabled={submitting}>
        {submitting ? 'Отправляем…' : definition.button}
      </button>
      {message && <p className={`lead-form__message lead-form__message--${messageKind}`} role="status">{message}</p>}
    </form>
  );
}
