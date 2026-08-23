import { useMemo, useState } from 'react';
import { pricing, formatPrice, type PriceRow } from '@/lib/content';
import { calculator, type AccessKey, type FloorsKey, type RoofKey } from '@/config/calculator';
import { trackCalculator } from '@/lib/analytics';
import { bg } from '@/lib/utils';
import { LeadForm } from './LeadForm';

/** Взима средата на диапазона, а когато има само една граница — нея. */
function basePrice(row: PriceRow): number | null {
  if (row.from !== null && row.to !== null) return (row.from + row.to) / 2;
  return row.from ?? row.to;
}

const PER_AREA = new Set(['лв./м²']);

export function RoofCalculator() {
  const [area, setArea] = useState(100);
  const [roof, setRoof] = useState<RoofKey>('pitched');
  const [access, setAccess] = useState<AccessKey>('easy');
  const [floors, setFloors] = useState<FloorsKey>('low');
  const [picked, setPicked] = useState<string[]>([]);
  const [shown, setShown] = useState(false);

  // Само дейностите с цена на квадрат влизат в сметката. Останалите се уточняват при огледа.
  const options = useMemo(() => pricing.filter((row) => PER_AREA.has(row.unit)), []);

  const result = useMemo(() => {
    const rows = options.filter((row) => picked.includes(row.key));
    const known = rows.map(basePrice).filter((value): value is number => value !== null);
    if (known.length === 0 || area <= 0) return null;

    const perSquare = known.reduce((sum, value) => sum + value, 0);
    const coefficient =
      calculator.access[access].coefficient *
      calculator.floors[floors].coefficient *
      calculator.roof[roof].coefficient;

    const centre = perSquare * area * coefficient;
    return {
      low: Math.round((centre * (1 - calculator.spread)) / 50) * 50,
      high: Math.round((centre * (1 + calculator.spread)) / 50) * 50,
      unknown: rows.length - known.length,
      rows,
    };
  }, [options, picked, area, access, floors, roof]);

  function toggle(key: string) {
    setPicked((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]));
    setShown(false);
  }

  function show() {
    setShown(true);
    trackCalculator({ area, roof, access, floors, services: picked.join(','), estimate_low: result?.low ?? 0 });
  }

  if (options.length === 0) {
    return (
      <p className="border border-dashed border-graphite-300 bg-sand-50 px-5 py-6 text-graphite-600">
        Калкулаторът тръгва щом ценоразписът бъде попълнен. Дотогава заявете оглед — офертата е безплатна.
      </p>
    );
  }

  const fieldClass = 'w-full border border-graphite-300 bg-white px-3.5 py-3 text-[0.9375rem] outline-none focus:border-brick-500';
  const legendClass = 'mb-2 block font-display text-[0.8125rem] font-bold text-graphite-800';

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="calc-area" className={legendClass}>
              Площ на покрива, м²
            </label>
            <input
              id="calc-area"
              type="number"
              min={10}
              max={2000}
              step={5}
              value={area}
              onChange={(event) => {
                setArea(Number(event.target.value));
                setShown(false);
              }}
              className={fieldClass}
            />
            <p className="mt-1.5 text-[0.8125rem] text-graphite-500">
              Груба сметка: застроената площ, умножена по 1,2 при скатен покрив.
            </p>
          </div>

          <div>
            <label htmlFor="calc-roof" className={legendClass}>
              Вид покрив
            </label>
            <select
              id="calc-roof"
              value={roof}
              onChange={(event) => {
                setRoof(event.target.value as RoofKey);
                setShown(false);
              }}
              className={fieldClass}
            >
              {Object.entries(calculator.roof).map(([key, item]) => (
                <option key={key} value={key}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="calc-access" className={legendClass}>
              Достъп до обекта
            </label>
            <select
              id="calc-access"
              value={access}
              onChange={(event) => {
                setAccess(event.target.value as AccessKey);
                setShown(false);
              }}
              className={fieldClass}
            >
              {Object.entries(calculator.access).map(([key, item]) => (
                <option key={key} value={key}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="calc-floors" className={legendClass}>
              Етажност
            </label>
            <select
              id="calc-floors"
              value={floors}
              onChange={(event) => {
                setFloors(event.target.value as FloorsKey);
                setShown(false);
              }}
              className={fieldClass}
            >
              {Object.entries(calculator.floors).map(([key, item]) => (
                <option key={key} value={key}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <fieldset>
          <legend className={legendClass}>Какви дейности Ви трябват</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {options.map((row) => (
              <label
                key={row.key}
                className="flex cursor-pointer items-start gap-3 border border-graphite-200 bg-white px-4 py-3 text-[0.9375rem] hover:border-graphite-400 has-[:checked]:border-brick-500 has-[:checked]:bg-brick-50"
              >
                <input
                  type="checkbox"
                  checked={picked.includes(row.key)}
                  onChange={() => toggle(row.key)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-brick-600"
                />
                <span>
                  <span className="block font-medium text-graphite-900">{row.service}</span>
                  <span className="block text-[0.8125rem] text-graphite-500">{formatPrice(row)}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <button type="button" onClick={show} disabled={picked.length === 0} className="btn-primary btn-lg disabled:opacity-60">
          Пресметни
        </button>

        {shown && result ? (
          <div className="border-l-[3px] border-brick-500 bg-sand-100 px-6 py-5">
            <p className="font-display text-xs font-bold uppercase tracking-[0.16em] text-graphite-500">
              Ориентировъчна стойност
            </p>
            <p className="mt-1 font-display text-3xl font-extrabold text-graphite-900">
              {bg(result.low)} – {bg(result.high)} лв.
            </p>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-graphite-700">
              Това е груба оценка от ценоразписа, не оферта. Истинската цена зависи от състоянието на конструкцията,
              наклона, нуждата от скеле и от това какво ще се види, след като се вдигнат керемидите. Точното число
              идва след оглед на място.
            </p>
            {result.unknown > 0 ? (
              <p className="mt-2 text-[0.9375rem] text-graphite-600">
                {result.unknown} от избраните дейности още нямат цена в списъка и не влизат в сметката.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <aside className="border border-graphite-200 bg-white p-6">
        <h2 className="mb-4 font-display text-lg font-extrabold text-graphite-900">Изпратете за точна оферта</h2>
        <LeadForm
          compact
          formName="calculator"
          prefill={{
            area: String(area),
            roof: calculator.roof[roof].label,
            access: calculator.access[access].label,
            floors: calculator.floors[floors].label,
            services: options.filter((row) => picked.includes(row.key)).map((row) => row.service).join(', '),
            estimate: result ? `${result.low}-${result.high} лв.` : '',
          }}
        />
      </aside>
    </div>
  );
}
