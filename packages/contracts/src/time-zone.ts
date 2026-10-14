import { z } from "zod";

/** Administrative display and fallback only; persisted instants remain UTC. */
export const PLATFORM_TIME_ZONE = "America/Caracas";

export const TimeZoneSchema = z.string().trim().min(1).max(80).refine(value => {
  try { new Intl.DateTimeFormat("es", { timeZone: value }); return true; }
  catch { return false; }
}, "Zona horaria inválida");

export function localDateInTimeZone(value: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(value);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(entry => entry.type === type)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}
