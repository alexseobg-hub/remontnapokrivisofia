/**
 * Коефициенти за ориентировъчната оценка в калкулатора.
 * Стойностите са множители върху базовата цена от ценоразписа.
 * Собственикът ги калибрира след първите обекти; докато не са пипани, стоят на 1.
 */
export const calculator = {
  access: {
    easy: { label: 'Лесен достъп — двор, място за скеле', coefficient: 1 },
    hard: { label: 'Труден достъп — тясна улица, съседни сгради', coefficient: 1.15 },
  },
  floors: {
    low: { label: 'До 2 етажа', coefficient: 1 },
    multi: { label: '3 етажа и повече', coefficient: 1.12 },
  },
  roof: {
    pitched: { label: 'Скатен покрив', coefficient: 1 },
    flat: { label: 'Плосък покрив', coefficient: 1 },
  },
  /** Диапазонът около изчисленото число. Оценката никога не се показва като точна цена. */
  spread: 0.15,
} as const;

export type AccessKey = keyof typeof calculator.access;
export type FloorsKey = keyof typeof calculator.floors;
export type RoofKey = keyof typeof calculator.roof;
