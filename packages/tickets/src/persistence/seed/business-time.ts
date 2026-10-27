import { TZDate } from '@date-fns/tz';
import { addDays, getHours, isWeekend, set } from 'date-fns';
import {
  BUSINESS_DAY_END_HOUR,
  BUSINESS_DAY_START_HOUR,
  SERVICE_DESK_TIME_ZONE,
} from '../../core/service-desk-calendar.js';

const LAST_BUSINESS_HOUR = BUSINESS_DAY_END_HOUR - 1;
const MILLISECONDS_PER_DAY = 86_400_000;

function isBusinessMoment(moment: TZDate): boolean {
  const hour = getHours(moment);
  return !isWeekend(moment) && hour >= BUSINESS_DAY_START_HOUR && hour < BUSINESS_DAY_END_HOUR;
}

function atLastBusinessHour(day: TZDate): TZDate {
  return set(day, { hours: LAST_BUSINESS_HOUR, minutes: 0, seconds: 0, milliseconds: 0 });
}

function stepBack(moment: TZDate): TZDate {
  const startsTheDay = isWeekend(moment) || getHours(moment) < BUSINESS_DAY_START_HOUR;
  return atLastBusinessHour(startsTheDay ? addDays(moment, -1) : moment);
}

export function businessMomentOnOrBefore(instant: Date): Date {
  let cursor = new TZDate(instant, SERVICE_DESK_TIME_ZONE);
  while (!isBusinessMoment(cursor)) {
    cursor = stepBack(cursor);
  }
  return new Date(cursor.getTime());
}

export function businessMomentDaysAgo(now: Date, days: number): Date {
  return businessMomentOnOrBefore(new Date(now.getTime() - days * MILLISECONDS_PER_DAY));
}
