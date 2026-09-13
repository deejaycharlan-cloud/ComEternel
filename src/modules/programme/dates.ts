import { Temporal } from '@js-temporal/polyfill';
import { z } from 'zod';
export const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => { try { Temporal.PlainDate.from(value); return value >= '2000-01-01' && value <= '2100-12-31'; } catch { return false; } }, 'Date invalide (2000–2100).');
export const clockTime = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
export const timezoneInput = z.string().trim().refine(value => { try { new Intl.DateTimeFormat('fr', { timeZone: value }); return true; } catch { return false; } }, 'Fuseau invalide.');
export type Schedule = { startDate: string; endDate: string; startTime: string | null; endTime: string | null; allDay: boolean; timezone: string; cadence: string; occurrenceCount: number };
export function shiftDate(value: string, days: number) { return Temporal.PlainDate.from(value).add({ days }).toString(); }
export function dayDifference(from: string, to: string) { return Temporal.PlainDate.from(from).until(Temporal.PlainDate.from(to)).days; }
export function instant(date: string, time: string, timezone: string) {
  // Une heure absente ou présente deux fois nécessite une autre saisie explicite.
  try { return new Date(Temporal.PlainDateTime.from(`${date}T${time}`).toZonedDateTime(timezone, { disambiguation: 'reject' }).epochMilliseconds); }
  catch { throw new Error('Heure ambiguë ou inexistante dans ce fuseau. Choisissez un autre horaire.'); }
}
export function scheduleOccurrences(schedule: Schedule) {
  const base = Temporal.PlainDate.from(isoDate.parse(schedule.startDate)); isoDate.parse(schedule.endDate); const timezone = timezoneInput.parse(schedule.timezone);
  const span = dayDifference(schedule.startDate, schedule.endDate);
  if (span < 0 || span > 366) throw new Error('La fin doit suivre le début (366 jours maximum).');
  const count = schedule.cadence === 'none' ? 1 : schedule.occurrenceCount;
  if (!Number.isInteger(count) || count < 1 || count > 104) throw new Error('Choisissez entre 1 et 104 occurrences.');
  if (!schedule.allDay) { clockTime.parse(schedule.startTime); clockTime.parse(schedule.endTime); }
  return Array.from({ length: count }, (_, sequence) => {
    const startDate = base.add(schedule.cadence === 'weekly' ? { weeks: sequence } : schedule.cadence === 'monthly' ? { months: sequence } : { days: 0 }).toString();
    const endDate = shiftDate(startDate, span); isoDate.parse(startDate); isoDate.parse(endDate);
    const startAt = schedule.allDay ? null : instant(startDate, schedule.startTime!, timezone);
    const endAt = schedule.allDay ? null : instant(endDate, schedule.endTime!, timezone);
    if (startAt && endAt && endAt <= startAt) throw new Error('L’heure de fin doit suivre celle du début.');
    return { sequence, originalStartDate: startDate, startDate, endDate, startAt, endAt };
  });
}
export function todayIn(timezone: string) { return Temporal.Now.zonedDateTimeISO(timezone).toPlainDate().toString(); }
export function calendarRange(anchor: string, view: string) {
  const date = Temporal.PlainDate.from(isoDate.parse(anchor));
  if (view === 'year') return { start: `${date.year}-01-01`, end: `${date.year}-12-31` };
  if (view === 'week') { const start = date.subtract({ days: date.dayOfWeek - 1 }); return { start: start.toString(), end: start.add({ days: 6 }).toString() }; }
  if (view === 'month') { const start = date.with({ day: 1 }); return { start: start.toString(), end: start.add({ months: 1 }).subtract({ days: 1 }).toString() }; }
  return { start: anchor, end: date.add({ years: 1 }).subtract({ days: 1 }).toString() };
}
export function calendarEventDates(event: { startDate: string; endDate: string; startAt: Date | null; endAt: Date | null }, timezone: string) {
  if (!event.startAt || !event.endAt) return { start: event.startDate, end: event.endDate };
  return { start: Temporal.Instant.from(event.startAt.toISOString()).toZonedDateTimeISO(timezone).toPlainDate().toString(), end: Temporal.Instant.from(event.endAt.toISOString()).subtract({ milliseconds: 1 }).toZonedDateTimeISO(timezone).toPlainDate().toString() };
}
