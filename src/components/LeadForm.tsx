import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { site, has, valueOr, telHref } from '@/config/site';
import { serviceHubs, districts } from '@/lib/content';
import { trackFormSubmit, trackLead, trackPhoneClick } from '@/lib/analytics';
import { cn } from '@/lib/utils';

type Status = 'idle' | 'sending' | 'done' | 'error' | 'unsent';

interface Errors {
  name?: string;
  phone?: string;
  consent?: string;
}

const PHONE = /^[+\d][\d\s()-]{6,}$/;

export function LeadForm({
  compact = false,
  onDark = false,
  formName = 'lead',
  prefill,
}: {
  compact?: boolean;
  onDark?: boolean;
  formName?: string;
  prefill?: Record<string, string>;
}) {
  const id = useId();
  const [status, setStatus] = useState<Status>('idle');
  const [errors, setErrors] = useState<Errors>({});
  const endpoint = __FORM_ENDPOINT__ || (has('formEndpoint') ? site.formEndpoint : '');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    const next: Errors = {};
    const name = String(data.get('name') ?? '').trim();
    const phone = String(data.get('phone') ?? '').trim();
    if (name.length < 2) next.name = 'Напишете име, за да знаем как да Ви търсим.';
    if (!PHONE.test(phone)) next.phone = 'Телефонът изглежда непълен. Проверете го.';
    if (!data.get('consent')) next.consent = 'Трябва съгласие, за да Ви потърсим.';

    setErrors(next);
    if (Object.keys(next).length > 0) {
      form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      return;
    }

    trackFormSubmit(formName);

    if (!endpoint) {
      // Няма къде да се прати. Казваме го честно, вместо да рисуваме „изпратено“
      // и да изгубим запитването мълчаливо.
      setStatus('unsent');
      return;
    }

    setStatus('sending');
    try {
      // Собственият приемник иска JSON; чуждите услуги очакват полетата на формата.
      const own = endpoint.startsWith('/');
      const request: RequestInit = own
        ? {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({
              ...Object.fromEntries(data.entries()),
              consent: Boolean(data.get('consent')),
              page: typeof window === 'undefined' ? '' : window.location.pathname,
            }),
          }
        : { method: 'POST', body: data, headers: { Accept: 'application/json' } };

      const response = await fetch(endpoint, request);
      if (!response.ok) throw new Error(String(response.status));
      setStatus('done');
      trackLead(formName);
      form.reset();
    } catch {
      setStatus('error');
    }
  }

  if (status === 'done') {
    return (
      <div className={cn('border p-6', onDark ? 'border-graphite-700 bg-graphite-800' : 'border-graphite-200 bg-sand-50')}>
        <p className="font-display text-xl font-extrabold text-brick-600">Запитването тръгна.</p>
        <p className={cn('mt-3 leading-relaxed', onDark ? 'text-graphite-300' : 'text-graphite-700')}>
          Ще Ви потърсим {valueOr('responseTime', 'възможно най-скоро')} по телефона, за да уточним кога да дойдем на
          оглед.
          {has('phonePrimary') ? ' Ако бързате, обадете се направо.' : ''}
        </p>
        {has('phonePrimary') ? (
          <a href={telHref()} onClick={() => trackPhoneClick('thank-you')} className="btn-primary mt-5">
            {site.phonePrimary}
          </a>
        ) : null}
      </div>
    );
  }

  if (status === 'unsent') {
    return (
      <div className={cn('border p-6', onDark ? 'border-graphite-700 bg-graphite-800' : 'border-graphite-200 bg-sand-50')}>
        <p className="font-display text-xl font-extrabold text-brick-600">Формата още не е свързана.</p>
        <p className={cn('mt-3 leading-relaxed', onDark ? 'text-graphite-300' : 'text-graphite-700')}>
          Запитването не е изпратено. {has('phonePrimary') ? 'Обадете се и ще уговорим оглед.' : 'Адресът за приемане се попълва в настройките на проекта.'}
        </p>
        {has('phonePrimary') ? (
          <a href={telHref()} onClick={() => trackPhoneClick('form-unsent')} className="btn-primary mt-5">
            {site.phonePrimary}
          </a>
        ) : null}
      </div>
    );
  }

  const labelClass = cn('mb-1.5 block font-display text-[0.8125rem] font-bold', onDark ? 'text-graphite-200' : 'text-graphite-800');
  const fieldClass = cn(
    'w-full border px-3.5 py-3 text-[0.9375rem] outline-none transition-colors',
    onDark
      ? 'border-graphite-600 bg-graphite-900 text-white placeholder:text-graphite-500 focus:border-brick-400'
      : 'border-graphite-300 bg-white text-graphite-900 placeholder:text-graphite-400 focus:border-brick-500',
  );
  const errorClass = 'mt-1.5 text-[0.8125rem] font-medium text-brick-600';

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <input type="hidden" name="_form" value={formName} />
      {prefill
        ? Object.entries(prefill).map(([key, value]) => <input key={key} type="hidden" name={key} value={value} />)
        : null}
      {/* Капан за ботове. Хората не виждат това поле и не го попълват. */}
      <p className="hidden" aria-hidden="true">
        <label htmlFor={`${id}-company`}>Не попълвайте</label>
        <input id={`${id}-company`} type="text" name="_gotcha" tabIndex={-1} autoComplete="off" />
      </p>

      <div className={cn('grid gap-4', !compact && 'sm:grid-cols-2')}>
        <div>
          <label htmlFor={`${id}-name`} className={labelClass}>
            Име <span className="text-brick-500">*</span>
          </label>
          <input
            id={`${id}-name`}
            name="name"
            type="text"
            autoComplete="name"
            required
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? `${id}-name-error` : undefined}
            className={fieldClass}
          />
          {errors.name ? (
            <p id={`${id}-name-error`} className={errorClass}>
              {errors.name}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor={`${id}-phone`} className={labelClass}>
            Телефон <span className="text-brick-500">*</span>
          </label>
          <input
            id={`${id}-phone`}
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? `${id}-phone-error` : undefined}
            className={fieldClass}
          />
          {errors.phone ? (
            <p id={`${id}-phone-error`} className={errorClass}>
              {errors.phone}
            </p>
          ) : null}
        </div>
      </div>

      {!compact ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={`${id}-email`} className={labelClass}>
              Имейл
            </label>
            <input id={`${id}-email`} name="email" type="email" autoComplete="email" className={fieldClass} />
          </div>
          <div>
            <label htmlFor={`${id}-district`} className={labelClass}>
              Квартал или населено място
            </label>
            <input
              id={`${id}-district`}
              name="district"
              type="text"
              list={`${id}-districts`}
              className={fieldClass}
            />
            <datalist id={`${id}-districts`}>
              {districts().map((district) => (
                <option key={district.slug} value={district.district || district.name} />
              ))}
            </datalist>
          </div>
        </div>
      ) : null}

      <div>
        <label htmlFor={`${id}-service`} className={labelClass}>
          Какво Ви трябва
        </label>
        <select id={`${id}-service`} name="service" className={fieldClass} defaultValue="">
          <option value="">Ще уточним при огледа</option>
          {serviceHubs().map((hub) => (
            <option key={hub.slug} value={hub.name}>
              {hub.name}
            </option>
          ))}
          <option value="Отстраняване на теч">Отстраняване на теч</option>
          <option value="Друго">Друго</option>
        </select>
      </div>

      <div>
        <label htmlFor={`${id}-message`} className={labelClass}>
          Опишете проблема
        </label>
        <textarea
          id={`${id}-message`}
          name="message"
          rows={compact ? 3 : 4}
          placeholder="Например: тече при комина след дъжд, къщата е на два етажа, керемидите са стари."
          className={fieldClass}
        />
      </div>

      {endpoint && !compact ? (
        <div>
          <label htmlFor={`${id}-photo`} className={labelClass}>
            Снимка на проблема (по желание)
          </label>
          <input
            id={`${id}-photo`}
            name="photo"
            type="file"
            accept="image/*"
            className={cn(fieldClass, 'file:mr-3 file:border-0 file:bg-graphite-900 file:px-3 file:py-1.5 file:font-display file:text-xs file:font-bold file:text-white')}
          />
          <p className={cn('mt-1.5 text-[0.8125rem]', onDark ? 'text-graphite-400' : 'text-graphite-500')}>
            Една снимка спестява едно ходене и прави офертата по-точна.
          </p>
        </div>
      ) : null}

      <div>
        <label htmlFor={`${id}-consent`} className={cn('flex items-start gap-3 text-[0.875rem] leading-relaxed', onDark ? 'text-graphite-300' : 'text-graphite-600')}>
          <input
            id={`${id}-consent`}
            name="consent"
            type="checkbox"
            required
            aria-invalid={Boolean(errors.consent)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-brick-600"
          />
          <span>
            Съгласен съм данните ми да се използват само за отговор на това запитване, съгласно{' '}
            <Link to="/politika-za-poveritelnost" className="underline underline-offset-4">
              политиката за поверителност
            </Link>
            . <span className="text-brick-500">*</span>
          </span>
        </label>
        {errors.consent ? <p className={errorClass}>{errors.consent}</p> : null}
      </div>

      <button type="submit" disabled={status === 'sending'} className="btn-primary btn-lg w-full disabled:opacity-70">
        {status === 'sending' ? 'Изпращане…' : 'Заявете безплатен оглед'}
      </button>

      {status === 'error' ? (
        <p role="alert" className={errorClass}>
          Запитването не тръгна. Обадете се{has('phonePrimary') ? ` на ${site.phonePrimary}` : ''} или пробвайте пак след
          минута.
        </p>
      ) : null}

      <p className={cn('text-[0.8125rem] leading-relaxed', onDark ? 'text-graphite-400' : 'text-graphite-500')}>
        Огледът е безплатен и не Ви задължава с нищо.
        {has('responseTime') ? ` Отговаряме ${site.responseTime}.` : ''}
      </p>
    </form>
  );
}
