import { Link } from 'react-router-dom';
import { site, has, telHref, meta } from '@/config/site';
import { serviceHubs, districts, navPages, getPage } from '@/lib/content';
import { trackPhoneClick } from '@/lib/analytics';

const LEGAL_SLUGS = ['/politika-za-poveritelnost', '/politika-za-biskvitki', '/obshti-usloviya'];

/** Показват се само правните страници, които наистина съществуват. */
const legalPages = () =>
  LEGAL_SLUGS.map((slug) => getPage(slug)).filter((page): page is NonNullable<typeof page> => Boolean(page));

function ColumnTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 font-display text-xs font-bold uppercase tracking-[0.16em] text-graphite-400">{children}</h2>
  );
}

export function Footer() {
  const hubs = serviceHubs();
  // Само осемте най-важни квартала. Блок с петдесет линка във футъра не помага на никого.
  const areas = districts().slice(0, 8);
  const year = new Date().getFullYear();
  const company = has('companyName') ? site.companyName : 'Ремонт на покриви София';

  return (
    <footer className="bg-graphite-950 pt-16 text-graphite-300">
      <div className="shell">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-display text-lg font-extrabold leading-tight text-white">{company}</p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-graphite-400">
              Ремонт и изграждане на покриви в София и София област. Оглед на място, писмена оферта, договор и фактура.
            </p>
            <dl className="mt-5 space-y-1 text-sm text-graphite-400">
              {has('eik') ? (
                <div className="flex gap-2">
                  <dt>ЕИК</dt>
                  <dd className="text-graphite-300">{site.eik}</dd>
                </div>
              ) : null}
              {has('vatNumber') ? (
                <div className="flex gap-2">
                  <dt>ДДС №</dt>
                  <dd className="text-graphite-300">{site.vatNumber}</dd>
                </div>
              ) : null}
              {has('streetAddress') ? <p className="text-graphite-300">{site.streetAddress}, София</p> : null}
            </dl>
            {(has('facebook') || has('googleBusinessProfile') || has('instagram') || has('youtube')) && (
              <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm">
                {has('googleBusinessProfile') && (
                  <li>
                    <a href={site.googleBusinessProfile} className="underline underline-offset-4 hover:text-white" rel="noopener noreferrer" target="_blank">
                      Google профил
                    </a>
                  </li>
                )}
                {has('facebook') && (
                  <li>
                    <a href={site.facebook} className="underline underline-offset-4 hover:text-white" rel="noopener noreferrer" target="_blank">
                      Facebook
                    </a>
                  </li>
                )}
                {has('instagram') && (
                  <li>
                    <a href={site.instagram} className="underline underline-offset-4 hover:text-white" rel="noopener noreferrer" target="_blank">
                      Instagram
                    </a>
                  </li>
                )}
                {has('youtube') && (
                  <li>
                    <a href={site.youtube} className="underline underline-offset-4 hover:text-white" rel="noopener noreferrer" target="_blank">
                      YouTube
                    </a>
                  </li>
                )}
              </ul>
            )}
          </div>

          <nav aria-labelledby="footer-services">
            <ColumnTitle>
              <span id="footer-services">Услуги</span>
            </ColumnTitle>
            <ul className="space-y-2 text-sm">
              {hubs.map((hub) => (
                <li key={hub.slug}>
                  <Link to={hub.slug} className="hover:text-white">
                    {hub.name}
                  </Link>
                </li>
              ))}
              {getPage('/kalkulator') ? (
                <li className="pt-1">
                  <Link to="/kalkulator" className="font-bold text-brick-300 hover:text-brick-200">
                    Калкулатор за цена →
                  </Link>
                </li>
              ) : null}
            </ul>
          </nav>

          {areas.length > 0 ? (
          <nav aria-labelledby="footer-areas">
            <ColumnTitle>
              <span id="footer-areas">Райони</span>
            </ColumnTitle>
            <ul className="space-y-2 text-sm">
              {/* Столицата води списъка и сочи към началната страница. */}
              <li>
                <Link to="/" className="hover:text-white">
                  Ремонт на покриви в София
                </Link>
              </li>
              {areas.map((area) => (
                <li key={area.slug}>
                  <Link to={area.slug} className="hover:text-white">
                    Ремонт на покриви в {area.district || area.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link to="/rayoni" className="font-bold text-brick-300 hover:text-brick-200">
                  Цялото покритие →
                </Link>
              </li>
            </ul>
          </nav>
          ) : (
            <nav aria-labelledby="footer-nav">
              <ColumnTitle>
                <span id="footer-nav">Сайтът</span>
              </ColumnTitle>
              <ul className="space-y-2 text-sm">
                {navPages().map((item) => (
                  <li key={item.slug}>
                    <Link to={item.slug} className="hover:text-white">
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          <div>
            <ColumnTitle>Контакти</ColumnTitle>
            <ul className="space-y-3 text-sm">
              {has('phonePrimary') && (
                <li>
                  <a
                    href={telHref()}
                    onClick={() => trackPhoneClick('footer')}
                    className="font-display text-xl font-extrabold tracking-tight text-white hover:text-brick-300"
                  >
                    {site.phonePrimary}
                  </a>
                </li>
              )}
              {has('phoneSecondary') && (
                <li>
                  <a href={`tel:${site.phoneSecondary.replace(/[^\d+]/g, '')}`} className="hover:text-white">
                    {site.phoneSecondary}
                  </a>
                </li>
              )}
              {has('email') && (
                <li>
                  <a href={`mailto:${site.email}`} className="hover:text-white">
                    {site.email}
                  </a>
                </li>
              )}
              {has('workingHours') && <li className="text-graphite-400">{site.workingHours}</li>}
              <li className="text-graphite-400">{meta.areaServed}</li>
            </ul>
            <Link to="/bezplaten-ogled" className="btn-primary mt-6 w-full">
              Получи оферта
            </Link>
          </div>
        </div>

        {/* Правните страници стояха с дребен сив шрифт и не се забелязваха. */}
        <div className="mt-12 flex flex-col gap-4 border-t border-graphite-800 py-6 text-sm text-graphite-400 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-graphite-500">
            © {year} {company}. Всички права запазени.
          </p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {legalPages().map((item) => (
              <li key={item.slug}>
                <Link to={item.slug} className="underline underline-offset-4 hover:text-white">
                  {item.name}
                </Link>
              </li>
            ))}
            {getPage('/karta-na-sayta') ? (
              <li>
                <Link to="/karta-na-sayta" className="underline underline-offset-4 hover:text-white">
                  Карта на сайта
                </Link>
              </li>
            ) : null}
          </ul>
        </div>
      </div>
    </footer>
  );
}
