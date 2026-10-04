# T029 — Player base, recuperación y feedback

**Estado de aceptación: FAIL, cierre bloqueado por dos límites del contrato/API.**
Fecha local: 03/10/2026. Base: `e1bbc8f9154b5cfe9fb6d5de3562fc11ff4fb30a`.
Solicitud: «continua con t029». Dependencias T013, T015 y T028: PASS en los
ámbitos documentados de sus cierres; no se amplía su aceptación a producción.

## Implementación revisable

- Player conectado al dispatcher v2 existente mediante `session-entry.tsx`.
  Conserva AppShell, clases visuales de actividades y motor v1.
- Study con señalización opcional, elección única, respuesta corta y respuesta
  construida. La explicación y el feedback anteriores no permanecen en el DOM
  de recuperación; no se ocultan con CSS.
- Ayuda y consulta de fuente por endpoint, con versión esperada y recibo del
  servidor. Texto construido → guardar → reveal → autorreporte, con puntuación
  nula y sin atribuir dominio a confianza, lectura o autorreporte.
- Pendiente/confirmado separados. sessionStorage conserva únicamente solicitudes
  salientes y su clave, nunca scores, progreso ni soluciones. Reintento exacto
  después de recargar; si storage no está disponible, reintento en memoria sin
  promesa de persistencia. GET servidor sigue siendo la autoridad.
- Feedback semántico, foco al cambiar de paso/feedback/modelo, cierre explícito,
  historial confirmado en sesión completada y mensajes de conflicto/acceso.
  Los formatos de T030/T031 muestran un estado conservador, sin implementarlos.

## Criterios y límites

| Criterio | Resultado y evidencia |
|---|---|
| Recuperación sin explicación previa en DOM | PASS en SSR y navegador con mocks tipados |
| Respuesta/reveal/autorreporte ordenados, sin calificación cliente | PASS en navegador tipado; PGlite conserva grading_source=self y score null |
| Ayuda marca asistida | PASS servicio PGlite y flujo UI tipado; no se afirma persistencia BFF autenticada |
| Key estable, pérdida de recibo, recarga y un efecto | PASS transporte/UI con mock HTTP stateful; CAS backend regresión PGlite |
| Feedback/error crítico/acción accesibles | PASS flujo E03 sintético parcial, regiones status y foco; no sustituye T035 |
| Refresh de respuestas aceptadas y sesión completada | PASS navegador tipado y regresión del servicio |
| Refresh de etapa intermedia constructed | FAIL: texto persiste privado pero GET no lo proyecta; requiere reenviarlo |
| Modelo y rúbrica tras reveal | Modelo PASS; rúbrica FAIL: endpoint solo entrega texto de modelo |
| Fuente visible después de respuesta sin ayuda | FAIL: feedback carece de fuentes; help de actividad ya respondida da conflicto |
| Móvil/escritorio | PASS geometría 360×800, 390×844, 768×1024, 1440×900; controles nativos y sin overflow horizontal |
| Axe | PASS sin serious/critical en los estados short_answer inspeccionados; auditoría completa T037 NO VERIFICADA |
| Zoom 200 % | CSS zoom exploratorio; zoom nativo NO VERIFICADO |

`AMPLIACION-PROPUESTA.md` identifica la ampliación mínima de DTO/proyección,
servidor y pruebas necesaria para cerrar. No se ejecutaron cambios de contratos
ni backend de implementación fuera de la ficha. La prueba nueva de API
**caracteriza los límites actuales**: que pase no convierte los requisitos
faltantes en PASS ni debilita el criterio de aceptación.

## Evidencia técnica

- `contracts-build.txt`: build de contratos PASS. Primera ejecución con Node22
  del shell; verificaciones posteriores usaron el runtime existente Node24.19.0.
  No se instalaron ni actualizaron dependencias.
- `web-final.txt`: 53 tests PASS/5 archivos tras validar recibos; posteriormente
  `player-final.txt` verifica los 22 tests del player, incluida una comprobación
  adicional de respuesta aceptada/nextStep contra manifiesto. No es pasada global.
- `typecheck-final.txt`, `lint-final.txt`: comprobación final del web.
- `api-regression.txt`: 19 PASS/12 SKIP (T013/T015); `api-boundary-check.txt`:
  8 PASS/12 SKIP, incluida nueva caracterización T029. No se ejecutó PostgreSQL
  independiente en este chat, ni se atribuye ese PASS a PGlite.
- `api-typecheck.txt`, `api-lint.txt`: comprobación de la prueba API modificada.
- `browser-checks.json`, `browser-final.txt`, capturas y `browser-check.cjs`:
  Chromium headless real, Next local y HTTP mocks validados por contratos.
  No equivale a BFF/API autenticados con persistencia T035.
- `baseline-hashes.json`, `changed-baseline-files.json`: 445 de 449 archivos
  preexistentes conservan sus bytes; los cuatro cambios son client, conexión
  de sesión, wrapper QA y prueba API T029. Nuevos archivos del player separados.
- `diff-check-final.txt`: diff check final.

## Diagnóstico del navegador y scope

Los primeros intentos contra `127.0.0.1` no hidrataron el fixture: Next bloqueó
el origen del canal HMR. Webpack excedió el timeout de compilación. Se conservan
todos esos logs/resultados. El origen canónico local `localhost` resolvió la
hidratación sin cambiar configuración ni reglas. Se corrigieron un selector
ambiguo del harness y el uso de contexto explícito requerido por axe. La pasada
final inspecciona una región de sesión, evitando un segundo landmark main.
Los 503 de servicios generales/prefetch del fixture no son errores del player;
no hubo excepciones de página en la pasada final.

Dos conexiones mínimas fuera de los glob literales de la ficha se limitan a
montar el player en `session-entry.tsx` y añadir la rama de desarrollo
`surface=player` en `/visual-fixtures/aprendizaje-v2`, que conserva su guardia
NODE_ENV. No se cambió la página de sesión, rutas productivas, API/BFF,
algoritmos, contratos, migraciones, flags ni el motor v1.

T030 no iniciado. T035/T037, aceptación global/Hito S, revisión clínica y
producción NO VERIFICADOS. T021 sigue PARTIAL en upgrade y el timeout API
heredado de T024 no se investigó ni se declara corregido. Sin commit/despliegue.
