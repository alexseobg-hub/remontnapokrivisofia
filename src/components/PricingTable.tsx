import { Link } from 'react-router-dom';
import { pricing, pricesByKeys, priceCategories, pricesInCategory, formatPrice, type PriceRow } from '@/lib/content';

function Rows({ rows, showNote }: { rows: PriceRow[]; showNote: boolean }) {
  return (
    <tbody>
      {rows.map((row) => (
        <tr key={row.key || row.service}>
          <td>
            <span className="font-medium text-graphite-900">{row.service}</span>
            {showNote && row.note ? <span className="mt-1 block text-[0.8125rem] text-graphite-500">{row.note}</span> : null}
          </td>
          <td className="num">{formatPrice(row)}</td>
        </tr>
      ))}
    </tbody>
  );
}

/**
 * Ценоразписът. Празна цена излиза „По договаряне“ — числа не се измислят.
 * Под таблицата винаги стои явното уточнение, че цените са ориентировъчни.
 */
export function PricingTable({
  keys,
  category,
  grouped = false,
  showNote = true,
  caption,
}: {
  keys?: string[];
  category?: string;
  grouped?: boolean;
  showNote?: boolean;
  caption?: string;
}) {
  let rows: PriceRow[] = pricing;
  if (keys) rows = pricesByKeys(keys);
  else if (category) rows = pricesInCategory(category);

  if (rows.length === 0) {
    return (
      <p className="border border-dashed border-graphite-300 bg-sand-50 px-5 py-6 text-graphite-600">
        Ценоразписът се уточнява. Обадете се или заявете оглед и ще получите оферта за конкретния покрив.
      </p>
    );
  }

  if (grouped) {
    const categories = priceCategories();
    return (
      <div className="space-y-10">
        {categories.map((name) => {
          const group = pricesInCategory(name);
          if (group.length === 0) return null;
          return (
            <div key={name}>
              <h3 className="mb-3 font-display text-lg font-extrabold text-graphite-900">{name}</h3>
              <div className="table-wrap">
                <table className="table-roof">
                  <thead>
                    <tr>
                      <th scope="col">Дейност</th>
                      <th scope="col">Ориентировъчна цена</th>
                    </tr>
                  </thead>
                  <Rows rows={group} showNote={showNote} />
                </table>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="table-roof">
        {caption ? <caption className="mb-3 text-left text-sm text-graphite-500">{caption}</caption> : null}
        <thead>
          <tr>
            <th scope="col">Дейност</th>
            <th scope="col">Ориентировъчна цена</th>
          </tr>
        </thead>
        <Rows rows={rows} showNote={showNote} />
      </table>
    </div>
  );
}

/** Задължителното уточнение под всяка ценова таблица. Явен текст, не дребен шрифт. */
export function PriceDisclaimer({ withLinks = true }: { withLinks?: boolean }) {
  return (
    <div className="mt-6 border-l-[3px] border-brick-500 bg-sand-100 px-5 py-4 text-[0.9375rem] leading-relaxed text-graphite-700">
      <p>
        Цените са ориентировъчни и служат за груба сметка. Точната оферта се дава след оглед на място, защото зависи от
        наклона, състоянието на конструкцията, достъпа и вида на покритието.
      </p>
      {withLinks ? (
        <p className="mt-2">
          <Link to="/kalkulator" className="font-medium text-brick-700 underline underline-offset-4">
            Пресметнете ориентировъчна стойност
          </Link>{' '}
          или{' '}
          <Link to="/besplaten-ogled" className="font-medium text-brick-700 underline underline-offset-4">
            заявете безплатен оглед
          </Link>
          .
        </p>
      ) : null}
    </div>
  );
}
