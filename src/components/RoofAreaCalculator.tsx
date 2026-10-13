import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPage } from '@/lib/content';
import { trackAreaCalculator } from '@/lib/analytics';

type Shape = 'gable' | 'hip' | 'shed' | 'flat';

const SHAPES: Record<Shape, { label: string; hint: string }> = {
  gable: { label: 'Двускатен', hint: 'Два ската и две калкани (фронтона).' },
  hip: { label: 'Четирискатен', hint: 'Четири ската, без калкани.' },
  shed: { label: 'Едноскатен', hint: 'Един скат, наклонен на едната страна.' },
  flat: { label: 'Плосък', hint: 'Без наклон или с минимален наклон за оттичане.' },
};

/** Най-честите наклони у нас, за бърз избор. */
const SLOPES = [15, 22, 30, 35, 40, 45];

/** Резерв за материали: застъпвания, рязане, бракувани бройки. */
const RESERVE = 0.1;

/** Приема и „8,5“, и „8.5“. Празно или нечисло дава 0. */
function parse(value: string): number {
  const n = Number(value.replace(',', '.').trim());
  return Number.isFinite(n) && n > 0 ? n : 0;
}

const fmt = (n: number, digits = 1) =>
  new Intl.NumberFormat('bg-BG', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);

/**
 * Площта на скатен покрив е площта в план, разделена на косинуса на наклона.
 * Важи за дву-, четири- и едноскатен покрив, стига скатовете да са с еднакъв наклон.
 * Затова формата влияе само на дължините на улуците, билото и ската, не на площта.
 */
export function RoofAreaCalculator() {
  // Нищо не е попълнено предварително: число, което човек не е въвел сам,
  // изглежда като резултат за неговия покрив и обърква.
  const [shape, setShape] = useState<Shape | null>(null);
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [overhang, setOverhang] = useState('');
  const [slope, setSlope] = useState<number | null>(null);

  const result = useMemo(() => {
    const a = parse(length);
    const b = parse(width);
    if (!shape || !a || !b) return null;

    const flat = shape === 'flat';
    if (!flat && slope === null) return null;

    // Празна стреха значи покрив без стреха.
    const o = flat ? 0 : parse(overhang);
    const angle = flat ? 0 : (slope ?? 0);
    const cos = Math.cos((angle * Math.PI) / 180);

    // По-дългата страна е тази, по която върви билото.
    const long = Math.max(a, b) + 2 * o;
    const short = Math.min(a, b) + 2 * o;

    const plan = long * short;
    const area = plan / cos;

    const rafter = shape === 'shed' ? short / cos : short / 2 / cos;
    const ridge = shape === 'gable' ? long : shape === 'hip' ? long - short : 0;
    const gutters =
      shape === 'gable' ? 2 * long : shape === 'hip' ? 2 * (long + short) : shape === 'shed' ? long : 2 * (long + short);

    return { plan, area, withReserve: area * (1 + RESERVE), rafter, ridge, gutters, flat };
  }, [shape, length, width, overhang, slope]);

  const missing = [
    !shape && 'вид покрив',
    !parse(length) && 'дължина на сградата',
    !parse(width) && 'ширина на сградата',
    shape !== 'flat' && slope === null && 'наклон',
  ].filter((item): item is string => Boolean(item));

  const pricePage = getPage('/kalkulator');

  const fieldClass =
    'w-full border border-graphite-300 bg-white px-3.5 py-3 text-[0.9375rem] outline-none focus:border-brick-500';
  const legendClass = 'mb-2 block font-display text-[0.8125rem] font-bold text-graphite-800';

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-6">
        <fieldset>
          <legend className={legendClass}>Вид покрив</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {(Object.keys(SHAPES) as Shape[]).map((key) => (
              <label
                key={key}
                className="flex cursor-pointer items-start gap-3 border border-graphite-200 bg-white px-4 py-3 text-[0.9375rem] hover:border-graphite-400 has-[:checked]:border-brick-500 has-[:checked]:bg-brick-50"
              >
                <input
                  type="radio"
                  name="roof-shape"
                  checked={shape === key}
                  onChange={() => setShape(key)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-brick-600"
                />
                <span>
                  <span className="block font-medium text-graphite-900">{SHAPES[key].label}</span>
                  <span className="block text-[0.8125rem] text-graphite-500">{SHAPES[key].hint}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="area-length" className={legendClass}>
              Дължина на сградата, м
            </label>
            <input
              id="area-length"
              type="text"
              inputMode="decimal"
              value={length}
              placeholder="например 10"
              onChange={(event) => setLength(event.target.value)}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="area-width" className={legendClass}>
              Ширина на сградата, м
            </label>
            <input
              id="area-width"
              type="text"
              inputMode="decimal"
              value={width}
              placeholder="например 8"
              onChange={(event) => setWidth(event.target.value)}
              className={fieldClass}
            />
          </div>
          {shape !== 'flat' ? (
            <div>
              <label htmlFor="area-overhang" className={legendClass}>
                Стреха (подаване извън стената), м
              </label>
              <input
                id="area-overhang"
                type="text"
                inputMode="decimal"
                value={overhang}
                placeholder="например 0,5"
                onChange={(event) => setOverhang(event.target.value)}
                className={fieldClass}
              />
              <p className="mt-1.5 text-[0.8125rem] text-graphite-500">Обикновено между 0,3 и 0,8 м. Без стреха оставете празно.</p>
            </div>
          ) : null}
        </div>
        <p className="-mt-2 text-[0.8125rem] text-graphite-500">
          Мерете външните размери на стените, без стрехите. Те се добавят отделно.
        </p>

        {shape !== 'flat' ? (
          <div>
            <label htmlFor="area-slope" className={legendClass}>
              Наклон на покрива: {slope === null ? 'изберете' : `${slope}°`}
            </label>
            <input
              id="area-slope"
              type="range"
              min={5}
              max={60}
              step={1}
              value={slope ?? 30}
              aria-valuetext={slope === null ? 'не е избран' : `${slope} градуса`}
              onChange={(event) => setSlope(Number(event.target.value))}
              className={`w-full ${slope === null ? 'accent-graphite-300 opacity-60' : 'accent-brick-600'}`}
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {SLOPES.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSlope(value)}
                  className={`border px-3 py-1.5 text-[0.8125rem] font-medium ${
                    slope === value
                      ? 'border-brick-500 bg-brick-50 text-brick-700'
                      : 'border-graphite-200 bg-white text-graphite-700 hover:border-graphite-400'
                  }`}
                >
                  {value}°
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[0.8125rem] text-graphite-500">
              Керемидените покриви у нас най-често са между 30° и 40°. Ако не знаете наклона, изберете 30°.
            </p>
          </div>
        ) : null}
      </div>

      <aside className="h-fit border-l-[3px] border-brick-500 bg-sand-100 px-6 py-6">
        {result ? (
          <>
            <p className="font-display text-xs font-bold uppercase tracking-[0.16em] text-graphite-500">
              Площ на покрива
            </p>
            <p className="mt-1 font-display text-4xl font-extrabold text-graphite-900">
              {fmt(result.area)} м²
            </p>
            <p className="mt-1 text-[0.9375rem] text-graphite-700">
              С {RESERVE * 100}% резерв за материали: <strong>{fmt(result.withReserve)} м²</strong>
            </p>

            <dl className="mt-5 space-y-2 border-t border-graphite-200 pt-4 text-[0.9375rem]">
              <div className="flex justify-between gap-4">
                <dt className="text-graphite-600">Площ в план</dt>
                <dd className="font-medium text-graphite-900">{fmt(result.plan)} м²</dd>
              </div>
              {!result.flat ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-graphite-600">Дължина на ската</dt>
                  <dd className="font-medium text-graphite-900">{fmt(result.rafter, 2)} м</dd>
                </div>
              ) : null}
              {result.ridge > 0 ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-graphite-600">Дължина на билото</dt>
                  <dd className="font-medium text-graphite-900">{fmt(result.ridge)} м</dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-4">
                <dt className="text-graphite-600">{result.flat ? 'Периметър' : 'Дължина на улуците'}</dt>
                <dd className="font-medium text-graphite-900">{fmt(result.gutters)} м</dd>
              </div>
            </dl>

            <p className="mt-4 text-[0.8125rem] leading-relaxed text-graphite-600">
              {result.flat
                ? 'Сметката е за плосък покрив без бордове. Бордовете, обръщанията по стените и отворите се мерят при оглед.'
                : 'Сметката е за скатове с еднакъв наклон. Капандури, комини, чупки и улами променят площта, затова точното число се взема при оглед.'}
            </p>

            {pricePage ? (
              <Link
                to={`${pricePage.slug}?plosht=${Math.round(result.area)}`}
                onClick={() => trackAreaCalculator({ shape, slope, area: Math.round(result.area) })}
                className="btn-primary mt-5 w-full justify-center"
              >
                Пресметни цена за {Math.round(result.area)} м²
              </Link>
            ) : null}
          </>
        ) : (
          <>
            <p className="font-display text-xs font-bold uppercase tracking-[0.16em] text-graphite-500">
              Площ на покрива
            </p>
            <p className="mt-1 font-display text-4xl font-extrabold text-graphite-300">— м²</p>
            <p className="mt-4 text-[0.9375rem] font-medium text-graphite-800">За да пресметнем, попълнете:</p>
            <ul className="mt-2 space-y-1.5 text-[0.9375rem] text-graphite-700">
              {missing.map((item) => (
                <li key={item} className="flex gap-2">
                  <span aria-hidden="true" className="text-brick-600">→</span>
                  {item}
                </li>
              ))}
            </ul>
          </>
        )}
      </aside>
    </div>
  );
}
