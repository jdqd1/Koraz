import { MaintenanceDate } from "./maintenance";

/** Keep the server's explanation, while rendering UTC timestamps as readable dates. */
export function RouteReason({ reason, timeZone }: { reason: string; timeZone?: string }) {
  return <>{reason.split(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z)/g).map((part, index) => /^\d{4}-\d{2}-\d{2}T/.test(part) && Number.isFinite(Date.parse(part))
    ? <MaintenanceDate key={index} value={part} timeZone={timeZone} compact /> : part)}</>;
}
