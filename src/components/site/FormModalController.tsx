import { useCallback, useEffect, useRef, useState } from 'react';
import { isFormId, siteContent, type FormId } from '../../data/site';
import FormModal from './FormModal';

export const LEAD_FORM_EVENT = 'derevo:lead-form';

export function requestLeadForm(formId: FormId) {
  window.dispatchEvent(new CustomEvent<FormId>(LEAD_FORM_EVENT, { detail: formId }));
}

export default function FormModalController() {
  const [formId, setFormId] = useState<FormId | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const close = useCallback(() => {
    setFormId(null);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const trigger = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-lead-form]');
      const requestedForm = trigger?.dataset.leadForm;
      if (!trigger || !isFormId(requestedForm)) return;
      triggerRef.current = trigger;
      setFormId(requestedForm);
    };
    const onRequest = (event: Event) => {
      const requestedForm = (event as CustomEvent<string>).detail;
      if (isFormId(requestedForm)) setFormId(requestedForm);
    };

    document.documentElement.dataset.leadFormsReady = 'true';
    document.addEventListener('click', onClick);
    window.addEventListener(LEAD_FORM_EVENT, onRequest);
    return () => {
      delete document.documentElement.dataset.leadFormsReady;
      document.removeEventListener('click', onClick);
      window.removeEventListener(LEAD_FORM_EVENT, onRequest);
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle('body-locked', Boolean(formId));
    return () => document.body.classList.remove('body-locked');
  }, [formId]);

  return formId ? <FormModal definition={siteContent.forms[formId]} onClose={close} /> : null;
}
