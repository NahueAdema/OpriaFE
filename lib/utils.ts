import { TZDate } from '@date-fns/tz';

export const WEEKDAYS = [
  { value: 1, label: 'Lunes', short: 'Lun' },
  { value: 2, label: 'Martes', short: 'Mar' },
  { value: 3, label: 'Miércoles', short: 'Mié' },
  { value: 4, label: 'Jueves', short: 'Jue' },
  { value: 5, label: 'Viernes', short: 'Vie' },
  { value: 6, label: 'Sábado', short: 'Sáb' },
  { value: 7, label: 'Domingo', short: 'Dom' },
] as const;

export const TIMEZONES = [
  'America/Argentina/Buenos_Aires',
  'America/Argentina/Cordoba',
  'America/Argentina/Mendoza',
  'America/Argentina/Salta',
  'America/Argentina/Tucuman',
  'America/Argentina/Ushuaia',
  'America/Montevideo',
  'America/Santiago',
  'America/Sao_Paulo',
  'America/Bogota',
  'America/Lima',
  'America/Mexico_City',
  'America/New_York',
  'Europe/Madrid',
  'UTC',
];

export function formatMoney(cents: number): string {
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function moneyToCents(value: string): number {
  const normalized = value.replace(',', '.').trim();

  if (!normalized) {
    return 0;
  }

  return Math.round(Number(normalized) * 100);
}

export function centsToMoneyInput(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function weekdayLabel(value: number): string {
  return WEEKDAYS.find((day) => day.value === value)?.label ?? '—';
}

export function formatTimeInZone(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat('es-AR', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso));
}

export function formatDateInZone(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat('es-AR', {
    timeZone,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(iso));
}

export function formatDateTimeInZone(iso: string, timeZone: string): string {
  return `${formatDateInZone(iso, timeZone)} · ${formatTimeInZone(iso, timeZone)}`;
}

export function hourInZone(iso: string, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    hour12: false,
  }).formatToParts(new Date(iso));

  return Number(parts.find((part) => part.type === 'hour')?.value ?? '0') % 24;
}

/** Calendar day key (`YYYY-MM-DD`) of an instant in the given timezone. */
export function dateKeyInZone(iso: string, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(iso));
  const year = parts.find((part) => part.type === 'year')?.value ?? '';
  const month = parts.find((part) => part.type === 'month')?.value ?? '';
  const day = parts.find((part) => part.type === 'day')?.value ?? '';

  return `${year}-${month}-${day}`;
}

export function formatDateKeyLong(dateKey: string): string {
  const value = new Date(`${dateKey}T12:00:00Z`);

  return new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(value);
}

export function todayKeyInZone(timeZone: string): string {
  const now = new TZDate(new Date(), timeZone);

  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function addDaysToKey(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const value = new Date(Date.UTC(year, month - 1, day + days));

  return `${value.getUTCFullYear()}-${pad(value.getUTCMonth() + 1)}-${pad(value.getUTCDate())}`;
}

/** `2026-11-09` -> `2026-11`. */
export function monthKeyOf(dateKey: string): string {
  return dateKey.slice(0, 7);
}

export function addMonthsToMonthKey(monthKey: string, months: number): string {
  const [year, month] = monthKey.split('-').map(Number);
  const value = new Date(Date.UTC(year, month - 1 + months, 1));

  return `${value.getUTCFullYear()}-${pad(value.getUTCMonth() + 1)}`;
}

/**
 * Days of a month laid out Monday-first. `null` marks the empty cells before
 * the first day so the grid always starts on a Monday.
 */
export function monthGridDays(monthKey: string): Array<string | null> {
  const [year, month] = monthKey.split('-').map(Number);
  const first = new Date(Date.UTC(year, month - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const leading = (first.getUTCDay() + 6) % 7;
  const cells: Array<string | null> = Array.from(
    { length: leading },
    () => null,
  );

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(`${monthKey}-${pad(day)}`);
  }

  return cells;
}

export function formatMonthLabel(monthKey: string): string {
  const label = new Intl.DateTimeFormat('es-AR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${monthKey}-01T12:00:00Z`));

  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function formatDateKeyShort(dateKey: string): string {
  return new Intl.DateTimeFormat('es-AR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(new Date(`${dateKey}T12:00:00Z`));
}

/** First instant of a calendar month in the given timezone, as UTC ISO. */
export function startOfMonthIso(monthKey: string, timeZone: string): string {
  const [year, month] = monthKey.split('-').map(Number);

  return new TZDate(year, month - 1, 1, 0, 0, timeZone).toISOString();
}

/** First instant of the following calendar month in the timezone, as UTC ISO. */
export function startOfNextMonthIso(
  monthKey: string,
  timeZone: string,
): string {
  const [year, month] = monthKey.split('-').map(Number);

  return new TZDate(year, month, 1, 0, 0, timeZone).toISOString();
}

/** Converts a `datetime-local` value (wall clock) to a UTC ISO instant. */
export function localDateTimeToIso(value: string, timeZone: string): string {
  const [datePart, timePart = '00:00'] = value.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);

  return new TZDate(year, month - 1, day, hour, minute, timeZone).toISOString();
}

/** Converts a UTC ISO instant to a `datetime-local` value in the timezone. */
export function isoToLocalDateTime(iso: string, timeZone: string): string {
  const value = new TZDate(new Date(iso).getTime(), timeZone);

  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function pad(value: number): string {
  return `${value}`.padStart(2, '0');
}
