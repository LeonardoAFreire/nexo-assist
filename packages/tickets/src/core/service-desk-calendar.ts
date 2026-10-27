import { TZDate } from '@date-fns/tz';
import { addDays, addMinutes, differenceInMinutes, getHours, isWeekend, set } from 'date-fns';
import { MINUTES_PER_HOUR } from './time-units.js';

export const SERVICE_DESK_TIME_ZONE = 'America/Sao_Paulo';
export const BUSINESS_DAY_START_HOUR = 8;
export const BUSINESS_DAY_END_HOUR = 18;
export const BUSINESS_HOURS_PER_BUSINESS_DAY = BUSINESS_DAY_END_HOUR - BUSINESS_DAY_START_HOUR;

const START_OF_HOUR = { minutes: 0, seconds: 0, milliseconds: 0 };

function atHour(day: TZDate, hours: number): TZDate {
  return set(day, { hours, ...START_OF_HOUR });
}

function nextBusinessOpening(day: TZDate): TZDate {
  let candidate = addDays(day, 1);
  while (isWeekend(candidate)) {
    candidate = addDays(candidate, 1);
  }
  return atHour(candidate, BUSINESS_DAY_START_HOUR);
}

function alignToBusinessTime(instant: TZDate): TZDate {
  if (isWeekend(instant) || getHours(instant) >= BUSINESS_DAY_END_HOUR) {
    return nextBusinessOpening(instant);
  }
  if (getHours(instant) < BUSINESS_DAY_START_HOUR) {
    return atHour(instant, BUSINESS_DAY_START_HOUR);
  }
  return instant;
}

function minutesUntilClosing(cursor: TZDate): number {
  return differenceInMinutes(atHour(cursor, BUSINESS_DAY_END_HOUR), cursor);
}

export class ServiceDeskCalendar {
  addBusinessHours(from: Date, hours: number): Date {
    let cursor = alignToBusinessTime(new TZDate(from, SERVICE_DESK_TIME_ZONE));
    let remaining = hours * MINUTES_PER_HOUR;
    while (remaining > minutesUntilClosing(cursor)) {
      remaining -= minutesUntilClosing(cursor);
      cursor = nextBusinessOpening(cursor);
    }
    return new Date(addMinutes(cursor, remaining).getTime());
  }
}
