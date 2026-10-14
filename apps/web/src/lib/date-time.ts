import { PLATFORM_TIME_ZONE } from "@cediah/contracts";

export function formatPlatformDateTime(value: string | number) {
  const parts = new Intl.DateTimeFormat("es-VE", { timeZone: PLATFORM_TIME_ZONE, day: "numeric", month: "long", year: "numeric",
    hour: "numeric", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(item => item.type === type)!.value;
  const hour = Number(part("hour"));
  return `${part("day")} de ${part("month")} de ${part("year")}, ${hour % 12 || 12}:${part("minute")} ${hour < 12 ? "a. m." : "p. m."}`;
}
