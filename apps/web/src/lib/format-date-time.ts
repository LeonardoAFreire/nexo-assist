const LOCALE = 'pt-BR';
const TIME_ZONE = 'America/Sao_Paulo';
const MILLISECONDS_PER_DAY = 86_400_000;

const dateTimeFormat = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TIME_ZONE,
  dateStyle: 'short',
  timeStyle: 'short',
});

const dateFormat = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TIME_ZONE,
  dateStyle: 'short',
});

const shortDateParts = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TIME_ZONE,
  day: '2-digit',
  month: 'short',
});

const timeFormat = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
});

export function formatDateTime(isoDate: string): string {
  return dateTimeFormat.format(new Date(isoDate));
}

export function formatDate(isoDate: string): string {
  return dateFormat.format(new Date(isoDate));
}

export function formatShortDate(isoDate: string): string {
  const parts = shortDateParts.formatToParts(new Date(isoDate));
  const day = parts.find((part) => part.type === 'day')?.value ?? '';
  const month = parts.find((part) => part.type === 'month')?.value ?? '';
  return `${day} ${month.replace('.', '')}`;
}

export function formatTime(isoDate: string): string {
  return timeFormat.format(new Date(isoDate));
}

export function formatShortDateTime(isoDate: string): string {
  return `${formatShortDate(isoDate)}, ${formatTime(isoDate)}`;
}

export function formatElapsedDays(isoDate: string, now: Date = new Date()): string {
  const days = Math.floor((now.getTime() - new Date(isoDate).getTime()) / MILLISECONDS_PER_DAY);
  if (days <= 0) {
    return 'hoje';
  }
  return days === 1 ? 'há 1 dia' : `há ${days} dias`;
}

export function formatDueTime(isoDate: string, now: Date = new Date()): string {
  const sameDay = formatShortDate(isoDate) === formatShortDate(now.toISOString());
  return sameDay ? formatTime(isoDate) : formatShortDateTime(isoDate);
}
