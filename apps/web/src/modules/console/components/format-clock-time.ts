const LOCALE = 'pt-BR';
const TIME_ZONE = 'America/Sao_Paulo';

const clockFormat = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
});

const dayFormat = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TIME_ZONE,
  day: '2-digit',
  month: '2-digit',
});

export function formatClockTime(isoDate: string): string {
  return clockFormat.format(new Date(isoDate));
}

export function formatListTime(isoDate: string, now: Date = new Date()): string {
  const date = new Date(isoDate);
  const isToday = dayFormat.format(date) === dayFormat.format(now);
  return isToday ? clockFormat.format(date) : dayFormat.format(date);
}
