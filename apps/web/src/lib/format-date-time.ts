const LOCALE = 'pt-BR';
const TIME_ZONE = 'America/Sao_Paulo';

const dateTimeFormat = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TIME_ZONE,
  dateStyle: 'short',
  timeStyle: 'short',
});

const dateFormat = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TIME_ZONE,
  dateStyle: 'short',
});

export function formatDateTime(isoDate: string): string {
  return dateTimeFormat.format(new Date(isoDate));
}

export function formatDate(isoDate: string): string {
  return dateFormat.format(new Date(isoDate));
}
