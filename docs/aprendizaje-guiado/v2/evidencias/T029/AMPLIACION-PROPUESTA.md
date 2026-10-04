# T029 — Ampliación mínima autorizada y ejecutada

El player implementado puede revisarse en `apps/web/src/components/learning/v2/player.tsx`.
La ficha permite player/renderers, API client y tests v2. Los siguientes cambios
de contratos/backend exceden esa lista. El usuario autorizó su ejecución con
«ok, hazlo». Se implementaron y verificaron; cierre PASS local en README.md
y result.json. La evidencia anterior FAIL se conserva en ampliacion/.

## Bloqueos reproducidos

1. Después de aceptar una respuesta, el servidor avanza `activeActivity` y
   `help(kind=source)` para la actividad respondida devuelve conflicto. El
   feedback HTTP tampoco contiene fuentes. Consultarla antes marca asistencia;
   no equivale a mostrar la fuente después de una recuperación sin ayuda.
2. `submittedTextByActivity` y `revealedKeys` persisten, pero GET attempt no los
   proyecta. Recargar en el paso constructed pierde su etapa visible y requiere
   reenviar el texto para comparar. No se usa almacenamiento cliente para
   decidir esa etapa. Reveal devuelve modelo como texto, sin rúbrica.

La prueba T029 de persistencia PGlite reprodujo ambos límites antes de la
autorización. Ahora verifica su resolución y los controles de acceso/privacidad;
los logs anteriores permanecen como evidencia histórica.

## Cambio ejecutado

- Añadir una proyección explícita de la respuesta construida activa: texto
  enviado del propio usuario, etapa persistida y, solo tras reveal autorizado,
  modelo y rúbrica. Antes de enviar, ningún modelo ni rúbrica. Al avanzar, retirar
  esos campos del paso activo. Derivar siempre de snapshot/resume del servidor.
- Añadir fuentes del feedback a respuestas autorizadas y a su historial:
  identidad, título, cita, localizador y fragmento de la versión fijada. Usar
  allowlist y `feedback.sourceKeys`; no enviar definiciones editoriales completas.
  Conservar el feedback diferido de evaluaciones y reservas. Leer una fuente
  después de confirmar respuesta no cambia retroactivamente su asistencia.
- Consumir esas proyecciones en el player y sustituir los avisos de limitación.

Archivos adicionales autorizados: `packages/contracts/src/guided-learning-v2.ts`,
`apps/api/src/guided-learning/v2/manifests.ts`,
`apps/api/src/providers/postgres-guided-learning-v2.ts`,
`apps/api/src/guided-learning/v2/routes.ts` y sus pruebas de contrato,
persistencia/HTTP/seguridad. No requiere migración, nueva familia de actividad,
evaluador, cambio de política, motor v1 ni despliegue.

## Verificación exigida para cerrar

GET antes de enviar/reveal sin modelo/rúbrica/fuentes de feedback; enviar texto,
recargar y recuperar la misma etapa; revelar, recargar y recuperar comparación;
autorreporte con score null; fuente trazable después de respuesta sin ayuda;
reservas con feedback diferido; rechazo de acceso revocado/ID ajeno;
idempotencia y CAS conservados. Rerun focalizado de contratos/API/web y navegador.

T030 no se inició. T035/T037, Hito S y producción no están acreditados aquí.
