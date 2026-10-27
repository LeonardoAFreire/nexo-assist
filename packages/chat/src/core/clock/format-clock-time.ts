const SERVICE_DESK_LOCALE = 'pt-BR';
const SERVICE_DESK_TIME_ZONE = 'America/Sao_Paulo';

const clockFormatter = new Intl.DateTimeFormat(SERVICE_DESK_LOCALE, {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: SERVICE_DESK_TIME_ZONE,
});

export function formatClockTime(isoDate: string): string {
  return clockFormatter.format(new Date(isoDate));
}
