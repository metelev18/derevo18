import { useRef, useState, type SubmitEvent } from 'react';
import type { FormDefinition } from '../../data/site';
import { DEMO_MESSAGE, formatPhone, isPhoneComplete } from '../../lib/form';

export default function LeadForm({ definition, compact = false }: { definition: FormDefinition; compact?: boolean }) {
  const [phone, setPhone] = useState('+7');
  const [message, setMessage] = useState('');
  const phoneRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');
    const form = event.currentTarget;
    if (!isPhoneComplete(phone)) {
      phoneRef.current?.setCustomValidity('Введите номер телефона полностью');
    } else {
      phoneRef.current?.setCustomValidity('');
    }
    if (!form.reportValidity()) return;
    setMessage(DEMO_MESSAGE);
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
      <label className="lead-form__consent">
        <input name="consent" type="checkbox" defaultChecked required />
        <span>Отправляя заявку, вы соглашаетесь на обработку персональных данных</span>
      </label>
      <button className="button button--dark" type="submit">{definition.button}</button>
      {message && <p className="lead-form__message" role="status">{message}</p>}
    </form>
  );
}
