import { Link } from 'react-router-dom';
import { site, has, value, telHref } from '@/config/site';
import { trackPhoneClick } from '@/lib/analytics';

/**
 * Тънката лента най-горе. Пясъчен фон и тухлен текст — същият тон като бутона
 * за оглед. Лепи се заедно с хедъра, затова промоцията остава на екрана.
 *
 * Съдържанието идва от базата „Настройки“, за да се сменя промоцията без билд
 * от разработчик. Докато полетата са празни, лентата показва какво се очаква,
 * вместо да изчезне — така мястото ѝ се вижда в превюто.
 */
export function TopBar() {
  const message = value('topBarText');
  const linkLabel = value('topBarLinkLabel');
  const linkUrl = value('topBarLinkUrl');
  const empty = !message;
  const linkClass = 'font-bold text-brick-700 underline underline-offset-4 hover:text-brick-800';

  return (
    <div className="border-b border-sand-300 bg-sand-100 text-brick-700">
      <div className="shell flex min-h-[2.5rem] flex-wrap items-center justify-center gap-x-6 gap-y-1 py-2 text-center text-[0.8125rem] sm:justify-between sm:text-left">
        <p className={empty ? 'text-brick-700/60' : ''}>
          {empty ? (
            <span title="Попълнете „Текст в горната лента“ в базата Настройки в Notion">
              Горна лента — попълнете текста в Notion (промоция, съобщение, работно време)
            </span>
          ) : (
            <>
              <span className="font-medium">{message}</span>
              {linkLabel && linkUrl ? (
                <>
                  {' '}
                  {linkUrl.startsWith('/') ? (
                    <Link to={linkUrl} className={linkClass}>
                      {linkLabel}
                    </Link>
                  ) : (
                    <a href={linkUrl} rel="noopener noreferrer" target="_blank" className={linkClass}>
                      {linkLabel}
                    </a>
                  )}
                </>
              ) : null}
            </>
          )}
        </p>

        <div className="flex shrink-0 items-center gap-5">
          {has('workingHours') ? <span className="hidden text-brick-700/70 lg:inline">{site.workingHours}</span> : null}
          {has('phonePrimary') ? (
            <a
              href={telHref()}
              onClick={() => trackPhoneClick('topbar')}
              className="font-display font-bold tracking-tight text-brick-700 hover:text-brick-800"
            >
              {site.phonePrimary}
            </a>
          ) : (
            <span className="text-brick-700/60" title="Попълнете „Телефон“ в базата Настройки в Notion">
              Телефон — попълнете в Notion
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
