import { site, has, telHref, value, valueOr } from '@/config/site';
import { trackPhoneClick, trackViberClick } from '@/lib/analytics';
import { LeadForm } from './LeadForm';
import { CtaLink, PhoneButton } from './ui';

/** Тъмната лента с формата, която затваря почти всяка страница. */
export function CtaBlock({
  title = 'Нуждаете се от ремонт на покрив?',
  lede,
  formName = 'cta',
  prefill,
}: {
  title?: string;
  lede?: string;
  formName?: string;
  prefill?: Record<string, string>;
}) {
  const description =
    lede ??
    `Оставете телефон и ще Ви потърсим ${valueOr('responseTime', 'скоро')}, за да уговорим оглед. Огледът е безплатен, офертата е писмена.`;

  return (
    <section className="band-dark band">
      <div className="shell grid gap-10 lg:grid-cols-[1fr_minmax(0,26rem)] lg:gap-16">
        <div>
          <p className="eyebrow">Свържете се</p>
          <h2 className="text-display-lg">{title}</h2>
          <p className="lede mt-4">{description}</p>

          <dl className="mt-8 space-y-5 border-t border-graphite-700 pt-8">
            {has('phonePrimary') ? (
              <div>
                <dt className="font-display text-xs font-bold uppercase tracking-[0.16em] text-graphite-400">Телефон</dt>
                <dd className="mt-1">
                  <a
                    href={telHref()}
                    onClick={() => trackPhoneClick(formName)}
                    className="font-display text-3xl font-extrabold tracking-tight text-white hover:text-brick-300"
                  >
                    {site.phonePrimary}
                  </a>
                </dd>
              </div>
            ) : null}
            {has('email') ? (
              <div>
                <dt className="font-display text-xs font-bold uppercase tracking-[0.16em] text-graphite-400">Имейл</dt>
                <dd className="mt-1">
                  <a href={`mailto:${site.email}`} className="text-graphite-200 hover:text-white">
                    {site.email}
                  </a>
                </dd>
              </div>
            ) : null}
            {has('workingHours') ? (
              <div>
                <dt className="font-display text-xs font-bold uppercase tracking-[0.16em] text-graphite-400">
                  Работно време
                </dt>
                <dd className="mt-1 text-graphite-200">{site.workingHours}</dd>
              </div>
            ) : null}
          </dl>

          {has('viber') ? (
            <CtaLink
              href={`viber://chat?number=${site.viber.replace(/[^\d+]/g, '')}`}
              variant="onDark"
              className="mt-6"
              onClick={() => trackViberClick(formName)}
            >
              Пишете във Viber
            </CtaLink>
          ) : null}
        </div>

        <div className="border border-graphite-700 bg-graphite-800 p-6 sm:p-8">
          <h3 className="mb-5 font-display text-xl font-extrabold text-white">Получи оферта</h3>
          <LeadForm onDark compact formName={formName} prefill={prefill} />
          <div className="mt-5 border-t border-graphite-700 pt-5">
            <p className="mb-3 text-center text-[0.8125rem] text-graphite-400">Или се обадете направо</p>
            <PhoneButton phone={value('phonePrimary')} href={telHref()} onDark onClick={() => trackPhoneClick(formName)} />
          </div>
        </div>
      </div>
    </section>
  );
}
