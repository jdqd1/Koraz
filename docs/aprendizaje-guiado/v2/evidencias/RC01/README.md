# RC01 — cierre autorizado de pendientes

Fecha: 11/10/2026, America/Caracas. Petición: «termina los pendientes entonces» y «continua». Alcance: correcciones, evidencia local y staging nuevo; aprobación del piloto exclusivamente para prueba. No autoriza lanzamiento productivo. Base original `d5b6f051f1a9a47d216bb0f834e39df2b2273725`; `baseline.json` conserva también la revisión del último fixture regenerado.

## Resultado técnico

Se corrigió una respuesta `match` correctamente aceptada por PostgreSQL que el cliente dejaba pendiente al cambiar el orden de las claves JSONB. La comparación es estructural para objetos y conserva el orden significativo de arrays. No cambia claves de idempotencia ni respuestas enviadas. Se permite configurar `AUTH_DATABASE_URL` para separar permisos de autenticación y aplicación; el comportamiento con una sola conexión permanece como valor predeterminado.

| Comprobación final | Resultado | Evidencia |
|---|---|---|
| Cliente y player, regresión de objetos/arrays | 37 PASS / 2 archivos | `web-focused.txt` |
| Contratos de paquete, importación y almacenamiento editorial | 32 PASS / 3 archivos | `api-focused.txt` |
| Configuración auth, bridge y cookie real PostgreSQL | 5 PASS / 3 archivos | `auth-connection-real-tests.txt` |
| Typecheck, lint y build web | PASS | `*-final.txt`, `web-build.txt`, archivos exit |
| Next construido/BFF/API/PostgreSQL: sintético y piloto, escritorio y móvil | 4 PASS / 0 FAIL / 0 skipped | `browser.json`, cuatro `browser-*-journey.json` |
| Dominio, checkpoint/final, retención 7/30 días, recarga e idempotencia | PASS local, reloj controlado | cuatro journeys; no equivale a tiempo cloud transcurrido |
| Limpieza de DB locales y preservación | PASS | `cluster-cleanup.json`, `interrupted-database-cleanup.json`, `preservation.json` |
| Render: ledger/checksums, roles reales y autenticación | PASS | `staging-inventory.json`, `staging-roles.json`, `cloud-signups.json` |
| Importación/publicación y recorrido elegible por BFF cloud | PASS dentro de ese alcance | `cloud-flow-result.json`, `cloud-flow-transcript.json` |
| Backup/restauración aislada, datos/esquema/grants/secuencias | PASS con excepción explícita de DEFAULT ACL del proveedor | `staging-restore.json`, `staging-restore-cleanup.json` |
| Mantenimiento/reinicio/admisión y conservación del progreso | PASS | `cloud-rollback-*.json` |

Los transcripts nativos .txt conservan sus bytes; .gitattributes excluye únicamente su whitespace generado por las herramientas del control de estilo. Los conteos son resultados finales efectivos, sin sumar reruns. No se rebajaron assertions, timeouts ni políticas del producto. Las comprobaciones de replay cloud comparan todas las respuestas y hechos, exceptuando únicamente `state.maintenance.generatedAt`: `routes.ts` recalcula ese timestamp para cada petición, incluso al repetir el receipt. Se conserva el fallo inicial de ese harness.

## Piloto y trazabilidad

El propietario aprobó «Revisado y aprobado para prueba», registrado con el hash exacto en `pilot-human-review.json`. El candidato aclaró el antecedente del tronco celíaco y diferenció varices rectales de hemorroides con fuentes primarias; conserva 52 actividades, cuatro objetivos y nueve assessments. Las correcciones y referencias están en `pilot-review/correcciones.md` y `guia-corregida.md`. El hash portable del archivo y el hash canónico del contenido permanecen separados.

Los 12 archivos instalados de `crear-rutas-koraz` y 14 hashes de contratos aceptados conservan sus bytes; la skill aparece en el catálogo de esta sesión. Los dossiers T042–T046 no se reescriben para convertir evidencia local o aceptación con excepción en aprobación integral.

## Fallos y recuperación de las pruebas

Los ocho runs anteriores conservan reportes/recibos y su causa: sincronización/harness, interrupción, fallo real del cliente y conexión local perdida. Los traces completos y fixtures duplicados permanecen en esta máquina y están excluidos de Git; `retained-local-artifacts.json` registra su ruta relativa, tamaño y SHA-256. Los errores de CLI bajo Node 22, marker faltante en auth, conexión externa Render y restauración inicial están preservados. La ejecución final usa Node 24 y PostgreSQL independiente; no se presentan fixtures como Better Auth real.

La limpieza se limitó a DB aleatorias creadas por recibos de propiedad RC01; nombres/OID preexistentes permanecieron idénticos. Se detuvo únicamente el cluster arrancado por esta ejecución y se conservó su directorio de datos.

## Reproducción y operación

Scripts locales en `work/test/rc01/`: `prepare.mjs`, `approve-pilot.mts`, `run-browser.ps1`, `verify-preservation.mjs`. Consultar sus guards antes de correrlos; no cargan la DB productiva. El servidor de fixture es exclusivamente local y nunca se despliega. Se conserva la configuración de puertos 55435/31035/41035 y marcadores de DB desechable.

Scripts cloud `cloud-accounts.mjs`, `cloud-flow.mjs`, `cloud-rollback.mjs` usan cuentas de prueba y acceso temporal de preview guardados en `.env.rc01-staging-private/`, ignorado por Git. Importan y publican mediante la API editorial real; no publican rutas directamente por SQL. `work/staging/rc01/` exige los IDs exactos del servicio/DB nuevos y rechaza migraciones activadas. Consultar [STAGING.md](STAGING.md) y el runbook general antes de operar.

## Pendientes de aceptación y producción

`result.json` mantiene `systemAcceptance=false`, `projectAcceptance=false` y `productionReady=false`: falta la observación nativa con lector de pantalla aplazada por el usuario. La aprobación editorial actual es para prueba. No existe autorización de rollout productivo ni aceptación de retención/RPO/RTO/storage; la DB gratuita caduca el 09/11/2026 a las 23:57 (Caracas; 10/11 UTC). Antes de producción hay que evaluar su catálogo/ledger y migraciones sin trasladar el modo de instalación vacía, seleccionar persistencia duradera y aceptar la ventana de lanzamiento. Ninguna espera real de 30 días se inventa: las pruebas locales usan el reloj controlado permitido por el handoff.

Revisión desplegada final: `530fab44686b4be06b213fd33c2e0d2c560f97a5`; API LIVE y preview READY, comprobación posterior por BFF en `release.json`. Los commits posteriores guardan recibos y el harness de espera de Retry-After, sin cambiar la aplicación desplegada. El refresco de cuatro cuentas respetó un 429/Retry-After de 60 segundos; la protección no se modificó. PR borrador: https://github.com/jdqd1/Koraz/pull/61.
