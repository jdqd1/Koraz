import { MaintenanceDate } from "./maintenance";

/** Keep the server's explanation, while rendering UTC timestamps as readable dates. */
export function RouteReason({ reason, timeZone, relativeTo }: { reason: string; timeZone?: string; relativeTo?: string }) {
  const waiting = reason.match(/^(?:La práctica sigue disponible; la próxima comprobación será después de|Puedes seguir practicando\. Podrás volver a comprobar lo que recuerdas a partir de) (\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z)\.?$/);
  if (waiting) return <>Puedes seguir practicando. Podrás volver a comprobar lo que recuerdas <MaintenanceDate value={waiting[1]!} timeZone={timeZone} relativeTo={relativeTo} friendly /></>;
  return <>{reason.split(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z)/g).map((part, index) => /^\d{4}-\d{2}-\d{2}T/.test(part) && Number.isFinite(Date.parse(part))
    ? <MaintenanceDate key={index} value={part} timeZone={timeZone} compact /> : part)}</>;
}
