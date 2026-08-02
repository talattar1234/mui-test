import { FAVORITE_COLORS, STATUSES, type FavoriteColor, type Status } from './colors';

export interface Person {
  id: number;
  /** Human friendly code used by the "go to" input, e.g. `P-00042`. */
  code: string;
  firstName: string;
  lastName: string;
  favoriteColor: FavoriteColor;
  department: string;
  country: string;
  city: string;
  age: number;
  salary: number;
  status: Status;
  joinedAt: Date;
  active: boolean;
}

const FIRST_NAMES = [
  'Ava', 'Liam', 'Noa', 'Ethan', 'Maya', 'Omer', 'Tal', 'Yael', 'Adam', 'Shira',
  'Daniel', 'Roni', 'Itai', 'Lior', 'Gal', 'Nadav', 'Hila', 'Eitan', 'Dana', 'Amit',
];

const LAST_NAMES = [
  'Cohen', 'Levi', 'Mizrahi', 'Peretz', 'Biton', 'Dahan', 'Avraham', 'Friedman',
  'Katz', 'Shapira', 'Azoulay', 'Gabbay', 'Malka', 'Barak', 'Segal',
];

const DEPARTMENTS = [
  'Engineering', 'Product', 'Design', 'Sales', 'Support', 'Finance', 'Legal', 'Operations',
];

const PLACES: Array<{ country: string; cities: string[] }> = [
  { country: 'Israel', cities: ['Tel Aviv', 'Haifa', 'Jerusalem', 'Beer Sheva'] },
  { country: 'Germany', cities: ['Berlin', 'Munich', 'Hamburg'] },
  { country: 'France', cities: ['Paris', 'Lyon', 'Nice'] },
  { country: 'USA', cities: ['New York', 'Austin', 'Seattle', 'Boston'] },
  { country: 'Japan', cities: ['Tokyo', 'Osaka'] },
];

/** Deterministic PRNG (mulberry32) so every reload shows the same data set. */
function makeRandom(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const ROW_COUNT = 10_000;

export function generatePeople(count: number = ROW_COUNT): Person[] {
  const random = makeRandom(20260802);
  const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(random() * arr.length)];

  const people: Person[] = [];
  for (let i = 1; i <= count; i += 1) {
    const place = pick(PLACES);
    people.push({
      id: i,
      code: `P-${String(i).padStart(5, '0')}`,
      firstName: pick(FIRST_NAMES),
      lastName: pick(LAST_NAMES),
      favoriteColor: pick(FAVORITE_COLORS),
      department: pick(DEPARTMENTS),
      country: place.country,
      city: pick(place.cities),
      age: 21 + Math.floor(random() * 44),
      salary: 8_000 + Math.floor(random() * 40) * 1_000,
      status: pick(STATUSES),
      joinedAt: new Date(2015 + Math.floor(random() * 11), Math.floor(random() * 12), 1 + Math.floor(random() * 28)),
      active: random() > 0.25,
    });
  }
  return people;
}
