# T035 — Harness E2E con API y PostgreSQL reales

**PASS LOCAL.** Base: `11737fd84562ee5a65e9ef124442b82f9aa16785`.
Dependencias T022/T027/T032/T033/T034 PASS registradas en `predecessors.json`.
Se preservaron los cambios previos de T034, T024 y M01. No se inició T036.

## Resultado y alcance autorizado

Configuración dedicada a v2, API Fastify real y proveedores PostgreSQL reales.
Cada ejecución crea una base aleatoria de prueba, aplica las migraciones con el
perfil vacío autorizado en M01 y la elimina al finalizar. Los usuarios y recursos
son sintéticos; solo la identidad de sesión se proporciona mediante una fixture.
Las respuestas, evaluación, publicaciones, estado, mapa y repaso recorren el código
real de API/BFF/UI. E05 introduce fallos de transporte deliberados, sin simular
respuestas satisfactorias.

La fixture pequeña contiene un objetivo y 16 actividades con los ocho tipos; la
grande contiene 200 objetivos y 1814 actividades. El catálogo vincula una revisión
y un PNG sintéticos con hashes calculados de sus bytes. El certificado y su clave
son fixtures públicas exclusivas del servidor de prueba local.

Se aprobaron explícitamente dos ampliaciones:

- Entrada de creación v2 y borrador vacío en cuatro archivos, descritos en
  `AMPLIACION-PROPUESTA.md`. La creación predeterminada v1 se conserva.
- Una regla en `apps/web/src/app/learning.css`, descrita en
  `AMPLIACION-MOVIL-PROPUESTA.md`: reserva inferior de 112px más área segura en
  sesiones v2 de hasta 700px. Corrige la intercepción del botón por la barra fija.

Los archivos de implementación y sus SHA-256 están en `source-hashes.json`.

## Verificación

| Comprobación | Resultado | Evidencia |
|---|---|---|
| Matriz E01–E06, API y persistencia reales | 7 PASS, 0 fallos, 0 flaky; 5 duplicaciones móviles omitidas deliberadamente | `playwright-final.txt`, `playwright-matrix.json` |
| E02 ampliado a preview completo y publicación | 1 PASS en repetición focalizada | `playwright-preview-complete.txt`, `playwright.json` |
| Fixtures, guardia de conexión e I04 PostgreSQL | 5 PASS | `i04-final.txt` |
| Regresión web serial | 482 PASS en 62 archivos | `web-regression-final.txt` |
| Regresión web serial con threads | 482 PASS en 62 archivos | `web-regression-threads.txt` |
| Build contracts y web | exit 0 | `contracts-build.txt`, `build-web.txt` |
| Tipos API y web | exit 0 | `typecheck-api.txt`, `typecheck-web-final.txt` |
| ESLint de archivos afectados | exit 0 | `lint-api-final.txt`, `lint-web-final.txt`, `lint-journeys-final.txt` |
| Bases de ambas ejecuciones de navegador eliminadas | 0 filas al consultar sus nombres exactos | `cleanup-verification.txt`, `cleanup-preview-verification.txt` |
| Detención del clúster temporal | exit 0 | `postgres-stop.txt` |

E01 crea desde cero por UI/teclado, guarda y recarga el borrador persistido.
E02 recorre los ocho tipos, diagnóstico, refuerzo, gate, final y retención simulada;
compara todas las tablas de aprendizaje/rewards antes/después y confirma ausencia
de llamadas a mutaciones de alumno; después revisa, aprueba y publica.
E03 confirma ayuda asistida y error CORE con remediación en el estado servidor.
E04 registra los ocho tipos, dos respuestas del caso sin puntuar el wrapper,
comprueba ausencia de desbordamiento horizontal y abre la ruta de 200 objetivos.
E05 pierde la conexión antes y después del commit, recarga y conserva exactamente
el cuerpo y la clave del reintento; dos pestañas producen una sola respuesta.
E06 conecta home, mapa real, ruta, sesión y repaso, mantiene la versión fijada y
comprueba el cambio de agenda confirmado por servidor.

E01–E06 se ejecutan en Chromium escritorio 1440×900. E04 también usa el perfil
iPhone 13 de Playwright con Chromium. Las cinco omisiones móviles son E01, E02,
E03, E05 y E06: no se presentan como pruebas aprobadas. `mobile-controls-after.png`
se inspeccionó visualmente: el botón queda completo encima de la barra fija.

I04 usa conexiones PostgreSQL independientes: dos solicitudes iguales devuelven
el mismo recibo y una fila; dos respuestas distintas con igual expectedVersion
producen una aceptación y un 409, con una fila. La guardia rechaza host, puerto,
usuario, base, contraseña, parámetros y marcador fuera de la allowlist.

## Repetición local

Requisitos: dependencias ya instaladas, Node 24.19.0, Chromium de Playwright y
PostgreSQL local desechable con usuario `koraz_test`, puerto 55435 y base de
control `koraz_guided_v2_control_test`. No usar la conexión habitual del proyecto.
`../M01/cluster.json` identifica el clúster temporal usado, que se dejó detenido.
Puede iniciarse con su `pg_ctl -D <data> -o "-p 55435 -h 127.0.0.1" -w start`.

Desde la raíz, con Node/pnpm disponibles:

```powershell
$env:NODE_ENV='test'
$env:KORAZ_GUIDED_V2_TEST_SERVER='true'
$env:KORAZ_TEST_DATABASE='true'
$env:KORAZ_GUIDED_V2_TEST_DATABASE_URL='postgresql://koraz_test@127.0.0.1:55435/koraz_guided_v2_control_test'
pnpm --filter @cediah/contracts build
pnpm --filter @cediah/web test:e2e:guided-v2
pnpm --filter @cediah/api exec vitest run test/guided-v2-harness.test.ts --maxWorkers=1
```

El script E2E construye la aplicación antes de probarla; después de un build
vigente puede usarse directamente `pnpm --filter @cediah/web exec playwright test
--config playwright.guided-v2.config.ts`. Los servidores usan 31035, 41035 y 41036,
todos en loopback. Teardown solicita cierre cooperativo; `cleanup.json` registra
la base exacta. La eliminación se verificó aparte mediante PostgreSQL.

## Incidencias y límites

Se conservaron logs de intentos fallidos anteriores. Se corrigieron el arranque
lento de desarrollo mediante build local, la autorización CSP del medio de prueba,
la selección de rama, las esperas de hidratación/reintento, la assertion del título
de la segunda etapa y el solapamiento móvil. Las assertions de persistencia,
idempotencia y errores se conservaron; no se usaron clics forzados ni se ocultó
la barra. E02 se amplió después de la matriz y se repitió solo ese caso.

La primera regresión web serial pasó tras 648s, principalmente en importación,
sin ampliar el presupuesto de las pruebas. Los logs previos con terminación
abrupta o fallos no representan el resultado final.

El build conserva un aviso de CSS heredado sobre `::highlight`. El arranque local
con `next start` emite el aviso de `output: standalone`; sirvió correctamente los
recorridos y assets. No se cambió la configuración productiva.

Este cierre no acredita T036, auditoría completa de permisos/grants, T037/WCAG,
rendimiento T038, restauración T041, piloto clínico, Hito S ni producción. La
retención de E02/E06 usa reloj simulado, no seguimiento real de alumnos. No hubo
commit, despliegue ni cambios en SQL de migraciones existentes.
