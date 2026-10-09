# T034 — conversión, adopción y compatibilidad

Actualización posterior 04/10/2026: T024 timeout está cerrado en
`../T024/cierre-timeout/`; instalación nueva sin catálogo histórico y runner
comprobados en `../M01/`. Los límites de la ejecución original de abajo siguen
conservados como registro histórico; backup T041 no está verificado.

**PASS local**, 04/10/2026, America/Caracas. Base
`11737fd84562ee5a65e9ef124442b82f9aa16785`; árbol inicial limpio.
Petición: «continua con t034». Se autorizó expresamente la ampliación de siete
archivos de `AMPLIACION-PROPUESTA.md`: «Sí, autorizar la ampliación T034».
No se inició T035, no hubo commit ni despliegue ni cambios de flags productivos.

## Resultado

- Convert-v1 crea otra versión **draft**, con títulos, objetivos y texto de guías
  resolubles, bindings y mapa de identidades en auditoría. Propone importance
  3→core, 2→high_yield, 1→supporting; señala como errores editoriales el verbo,
  criticidad, dependencias, fases/ayuda, reservas y referencias pendientes.
  `recommendedAfter` no se transforma en prerrequisitos. No publica ni cambia
  la versión v1, su estructura, sus matrículas o su progreso.
  Las guías que exceden el máximo de 10 000 caracteres quedan pendientes con
  incidencia explícita para dividirlas; no se recortan ni alteran sus snapshots.
- Preview de adopción devuelve revisión de matrícula, impacto por objetivo,
  intentos abiertos y consumos previos. POST exige `acknowledgedReset:true`,
  CAS, ownership y recibo idempotente. Bloquea intentos v1 abiertos y v2 abiertos
  o pausados. Una publicación no cambia matrículas existentes.
- Cambiar de v1 a v2 conserva lecturas/finalización v1 en historial y empieza
  sin dominio v2. El dispatch de upgrade v1 rechaza un origen o destino v2.
- v2→v2 exige igual clave, contenido, evaluación, política, modalidad,
  fuentes/assets referenciados y prerrequisitos equivalentes, incluidos cambios
  transitivos. La historia de adopción permite reconstruir respuestas originales
  elegibles; no clona respuestas/intentos ni concede recompensas por traslado.
  Un reinicio corta la cadena: restaurar luego el contenido no resucita evidencia.
  La evaluación final de ruta se vuelve a comprobar en la nueva versión.
- Los flags ya existían en config con defaults false; se conservaron. Apagar v2
  mantiene consultas privadas de versiones e historial, sin escrituras de
  agenda/cachés/eventos/rewards, y bloquea mutaciones con 503 de mantenimiento.
  El flag de admisión bloquea nuevas matrículas. Allowlist y ownership siguen
  impuestos por servidor; no se exponen IDs de la allowlist.
- El aviso de adopción y el historial usan la pantalla y los estilos vigentes.
  Mantenimiento elimina las acciones. El transporte guarda solo petición/clave
  pendiente, reintenta exactamente esa solicitud después de recargar y muestra
  el estado confirmado por servidor.

## Verificación

Runtime Node 24.19.0 y pnpm 11.19.0 del bundle existente, sin instalar dependencias.
Desde raíz se prefijó PATH con el Node del bundle y se usó su pnpm. PGlite usa
la configuración API vigente, maxWorkers=1.

| Comprobación | Resultado | Evidencia |
|---|---|---|
| contracts build | PASS | `contracts-build.txt` |
| T034 final: equivalencia, conversión y HTTP real | 10 PASS | `upgrade-final-tests.txt` |
| Regresión API v1/v2, evidencia, intentos, workflow, catálogo y rutas | 99 PASS, 12 omitidas | `api-regression-final.txt` |
| T034 + agenda y evaluaciones | 59 PASS, 10 omitidas | `upgrade-scheduler-final.txt` |
| Cierre dispatch/conversión + catálogo v1 | 30 PASS | `dispatch-conversion-closure.txt` |
| Suite web serial | 480 PASS, 61 archivos | `web-regression-final.txt` |
| API y web typecheck | PASS | `api-typecheck-final.txt`, `web-typecheck-final.txt` |
| ESLint archivos modificados | PASS, cero warnings | `api-lint-final.txt`, `api-lint-closure.txt`, `web-lint-final.txt` |
| Harness HTTP publicado/fijado | 1 PASS | `http-upgrade.txt`, `http-upgrade.test.ts` |
| Navegador SSR → BFF → Fastify → PGlite | PASS en alcance descrito | `browser-upgrade.json`, `browser-upgrade.cjs` |
| diff/check y migraciones sin cambio | PASS | `final-state.txt` |

Las cifras de suites se solapan y no se suman. Dos comandos incluyeron nombres
inexistentes (`guided-v2-review.test.ts`, `learning-path-catalog.test.ts`):
ejecutaron siete y un archivo respectivamente. Agenda, evaluaciones y catálogo
v1 se comprobaron después con sus nombres reales. Las
omisiones son pruebas que exigen PostgreSQL independiente; no son PASS.

El navegador usó Next/webpack en 127.0.0.1:31034 y Fastify real en 41034, con
identidad sintética y DB aislada. Verificó Enter para preview/adopción,
checkbox obligatorio, anchos 1440/768/390/360 sin overflow horizontal, axe sin
violaciones en el aviso, y mantenimiento con historial visible. Capturas finales:
`upgrade-1440.png`, `upgrade-768.png`, `upgrade-390.png`, `upgrade-360.png`,
`maintenance.png`; inspección visual de móvil y mantenimiento efectuada.

La pérdida de recibo se simuló **después de esperar la respuesta de route.fetch**.
La recarga recuperó el mismo body/key; DB confirmó una adopción, rowVersion=2,
cero respuestas y cero recompensas creadas por la operación. Los servidores de
prueba quedaron detenidos.

## Límites y cierre de dependencias

T012 y T016: PASS previo. T028 y T033: PASS local previo. T021 estaba PARTIAL por
upgrade; esta ficha cierra ese endpoint y sus DTO de éxito con nueva evidencia
HTTP/browser, sin ampliar a aceptación global.

M02 y M03: PASS local de inmutabilidad/workflow y conversión/adopción. M01: la
preservación de snapshots v1 y de archivos de migración está comprobada; **la
cadena vacía completa sigue NO VERIFICADO** por la migración histórica 0005 y su
administrador legacy. M04: flags off/historia PASS local; **restauración de backup
NO VERIFICADO**, corresponde al simulacro T041. Se conserva el timeout API
heredado de T024 como bloqueo de aceptación del sistema.

NO VERIFICADO: PostgreSQL independiente y grants/concurrencia específicos de
esta ficha, emisión BetterAuth, storage externo, zoom nativo/lector de pantalla y
auditoría T037, harness integral T035, restauración T041, Hito S, revisión clínica,
staging y producción. No se afirma regresión API global ni aceptación M01/M04
completa a partir de estas pruebas.

Incidencias reparadas: el FK de agenda exige una respuesta de la misma versión;
para evidencia trasladada se conserva la respuesta original en historia y el
puntero local queda null hasta una respuesta de la nueva versión. Se corrigieron
fixtures de feedback/modalidad y contexto completo de intento v1; el reporte de
huecos de conversión ya pertenece al contrato de errores v2. No se relajaron
assertions de dominio ni restricciones de DB.

**T035 no iniciada.** Archivos, comandos, resultados y hashes finales en
`result.json` y `source-hashes.json`.
