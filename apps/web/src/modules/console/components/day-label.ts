const LOCALE = 'pt-BR';
const TIME_ZONE = 'America/Sao_Paulo';
const MILLISECONDS_PER_DAY = 86_400_000;

const dayKeyFormat = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TIME_ZONE,
  dateStyle: 'short',
});

export function dayKeyOf(isoDate: string): string {
  return dayKeyFormat.format(new Date(isoDate));
}

export function formatDayLabel(isoDate: string, now: Date = new Date()): string {
  const key = dayKeyOf(isoDate);
  if (key === dayKeyFormat.format(now)) {
    return 'Hoje';
  }
  const yesterday = new Date(now.getTime() - MILLISECONDS_PER_DAY);
  return key === dayKeyFormat.format(yesterday) ? 'Ontem' : key;
}
