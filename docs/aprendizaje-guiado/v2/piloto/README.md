# Piloto T039 aprobado

Aprobación humana del propietario registrada: «revisado y aprobado». Resultado de T039: **PASS LOCAL**. Paquete revisión 1, hash `d9f35d39a769027998be0eeb17113e89f0e637af0b353c5bd1378ee77a59cf12`, sin cambios de contenido tras la revisión.

- [Acta y alcance de aprobación](ACTA-REVISION.md).
- [Documento revisado](REVISION-PILOTO.md).
- [Exportación de la versión publicada en test](publicado-test.koraz-route.json).
- [Registro del propietario](aprobacion-propietario.json).
- [Cierre técnico](../evidencias/T039/result.json).

La ruta se importó, aprobó y publicó mediante el workflow real de la API en una base de test aislada. La validación del servidor devolvió ready=true y cero incidencias. El actor del workflow es un delegado local de la aprobación recibida; no se le atribuye una identidad de producción.

Principiante y refuerzo completaron diagnóstico, estudio, respuestas, elaboración, caso, checkpoint y final; errores CORE se corrigieron con remediación y verificación. Respuestas en base de datos, replays idempotentes y reinicio/reanudación de API comprobados. Consolidación con reservas día 7 y 30 y reloj controlado.

La API y PGlite se cerraron al finalizar. La exportación conserva la ruta para reimportar; no es una ruta desplegada en koraz.app. No se inició T040.

- Guía fijada como snapshot local de fragmentos; revisión original de producción no expuesta
- Fuentes y exactitud aprobadas por declaración del propietario; no cotejo independiente de pasajes de libros
- Autenticación técnica de test; Better Auth real no verificado
- PGlite en memoria; PostgreSQL independiente no verificado
- Frontend/browser completo, Hito S, staging y producción fuera de esta evidencia

Reproducir con el paquete aprobado:

```powershell
pnpm.cmd --filter @cediah/api exec tsx ../../docs/aprendizaje-guiado/v2/evidencias/T039/publish-pilot.mts
node docs/aprendizaje-guiado/v2/evidencias/T039/close-approved-dossier.mjs
node docs/aprendizaje-guiado/v2/evidencias/T039/audit-dossier.mjs
```

Los scripts build-pilot/verify-pilot/finalize-dossier corresponden a la preparación previa y no deben usarse para borrar la aprobación actual.

Corrección mínima de selección de casos completados aplicada en apps/api/src/guided-learning/v2/routes.ts, autorizada expresamente por el propietario con «si». Registro y hashes antes/después: scope-authorization.json. El paquete aprobado conserva su hash.
