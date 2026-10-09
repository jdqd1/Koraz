# T038 — Rendimiento

**FAIL LOCAL.** L01 y L03 pasan en los ámbitos medidos. L02 falla sus límites
de latencia. No se acepta T038 ni Hito S. No se inició T039.

Solicitud: «continua con t038». Fecha: 07/10/2026, America/Caracas.
Base: `11737fd84562ee5a65e9ef124442b82f9aa16785`.
Dependencia obligatoria T035: PASS local; también se inspeccionó T037 PASS local.

## Resultado

| Criterio | Resultado | Evidencia |
|---|---|---|
| L01: 30 unidades, 200 objetivos, 1600 ítems, 20 corridas | PASS. Máximo 110 ms CPU; mediana 16.03 ms de pared. Crecimiento mediano 1.53× de 100 a 200 objetivos y 3.18× de 50 a 200, sin crecimiento cuadrático evidente en estas escalas. | `closure-validator.json` |
| L02: 20 alumnos concurrentes, 300 segundos | FAIL. p95 lectura 12540.79 ms frente a <500; respuesta 30522.26 ms frente a <1000. | `optimized-load.json`, `optimized-load.txt` |
| Consistencia de L02 | PASS. 496 solicitudes, 119 respuestas nuevas, 20 replays, cero errores técnicos, cero inconsistencias; los 20 alumnos completaron ciclos. | `optimized-load.json` |
| L03: manifiestos HTTP | PASS. Ruta pública 17712 bytes, creación de intento 664 bytes, máximo de respuesta 69787 bytes; límite 102400. El intento entrega la actividad activa, sin banco completo. | `payload-summary.json`, `optimized-load.json` |
| L03: formularios bajo demanda | PASS del componente real aislado. 1600 tarjetas, cero formularios iniciales, máximo uno abierto. | `component-results.json` |
| UI completa Next/BFF/shell | NO VERIFICADO. Arranque local rechazado automáticamente. | `browser-server-rejected.json` |

Los 300 segundos son la ventana de admisión de operaciones. Se completan las
ya iniciadas; duración total 357237.57 ms, incluidos 57.24 segundos de drenaje.
Se incluyen todas las observaciones, sin eliminar outliers. La carga usa un ciclo
cerrado por alumno con pausa máxima de cinco segundos entre actividades. No
representa una tasa fija de peticiones ni un seguimiento de alumnos reales.

## Entorno y fixture

Windows 10.0.26300, Intel Core i3-1305U, seis procesadores lógicos, 8267882496 bytes
de memoria física y Node 24.19.0. Se usó el runtime existente; no se instalaron ni
actualizaron dependencias. `optimized-runtime.json` registra el entorno de carga.
`resources.json` es una captura **posterior**, no una serie de memoria de la carga.

La fixture exacta tiene 140 objetivos requeridos CORE y 60 opcionales SUPPORTING,
con diagnóstico, gates, checkpoints y reservas separadas. Pasa el mismo validador
de publicación. La mezcla permite exactamente 1600 actividades, respetando el
banco mínimo de los requeridos y la cobertura de los opcionales. El hash está en
los reportes. Las escalas de comparación tienen 50/100 objetivos y 400/800 ítems,
siempre 30 unidades. Hay prerrequisitos acíclicos reales.

Fastify y los proveedores son los reales de Koraz, con PostgreSQL independiente,
ocho conexiones del pool y HTTP sobre loopback. Identidad, contenidos, PNG y reloj
son fixtures sintéticas del harness T035. El servidor conserva el reloj controlado
de 04/10/2026; las mediciones de duración usan el reloj monotónico del proceso.
No se leyó `.env` ni se utilizó una conexión productiva.

## Cambios autorizados

- `apps/api/test/performance/guided-v2-load.mjs`: medición reproducible, guardia de
  conexión heredada de T035, percentiles, tamaños, SQL observado, validación,
  verificación de respuestas y replays, y cierre de la base aleatoria.
- Proveedor PostgreSQL: una escritura ordenada para los objetivos modificados,
  manteniendo locks, claves de conflicto, fechas, versiones y omisión de filas
  idénticas. `closure-sql-initialization.json` registra una sola operación para
  200 objetivos y `closure-initialization.json` verifica sus 200 versiones iniciales.
- Editor v2: campos montados solo para la tarjeta abierta, índice por clave para
  localizar actividades y restauración diferida del campo exacto al abrir una
  actividad cerrada. La edición permanece en el borrador del padre.
- Pruebas estáticas adaptadas al montaje bajo demanda, conservando los controles
  de geometría y solución con renderizado directo de sus componentes.

No se cambiaron score, reglas de selección, agenda, contratos, umbrales ni
migraciones antiguas. No hizo falta una migración de índice. La lectura estable
observada tiene 28 consultas antes y después de responder, sin consultas por
cada ítem del banco. El perfil también muestra coste de conversión de filas JSON
y cálculo de evidencia/selección; no se atribuye todo el fallo al hardware.

La escritura por lote elimina el N+1 de inicialización; **no se presenta como
solución del p95 de L02**. La prueba corta inicial y la completa tienen duraciones
y estados distintos y no constituyen una comparación causal de velocidad.

## Verificación

| Comprobación | Resultado | Evidencia |
|---|---|---|
| Build contracts | exit 0 | `contracts-build.txt` |
| API: intentos, rutas, métricas, evidencia, selección, permisos y upgrades | 144 PASS, 29 omisiones heredadas; siete archivos, ejecución serial | `api-regression.txt` |
| Editor v2 | 98 casos distintos PASS: 79 de la primera pasada más 19 del archivo corregido | `editor-regression.txt`, `visual-regression-final.txt` |
| Build web de producción | exit 0 | `web-build.txt` |
| Tipos API y web | exit 0 | `api-typecheck.txt`, `web-typecheck-closure.txt` |
| ESLint de los archivos afectados | exit 0 | `api-lint-closure.txt`, `web-lint-closure.txt` |
| React real en Edge, 1440×900 y 390×844 | PASS: teclado, ocho tipos, conservación del borrador, foco exacto, alta de actividad y persistencia HTTP real; axe sin serious/critical en el componente | `component-check-eight-kinds.txt`, `component-results.json` |
| Preservación | 751 archivos base; 746 intactos, cinco cambios autorizados y un archivo de producto nuevo | `preservation.json`, `source-hashes.json` |
| Limpieza | Cinco bases eliminadas, sin conexiones ajenas; PostgreSQL detenido y puertos 31035/41035/55435 libres | `database-cleanup-verification.json`, `services-cleanup.json` |
| Diff | exit 0 | `diff-check-final.txt` |

La prueba aislada usa el componente y CSS reales empaquetados con esbuild ya
instalado, sin servidor Next. El DTO editado se guarda mediante PATCH contra la
API real y se vuelve a leer de PostgreSQL. No acredita navegación Next, BFF,
hidratación SSR, shell completo, recarga de página autenticada, 200% de zoom ni
certificación de accesibilidad. Las capturas aisladas se inspeccionaron; el CSS
global/shell no está incluido y no se afirma continuidad visual de toda la app.
T037 mantiene sus propios límites de lector de pantalla y dispositivos físicos.

La revisión React verifica claves estables, estado de edición en el padre,
actualización funcional al cerrar tarjetas, foco posterior al montaje, consultas
por índice y ausencia de efectos que deriven estado o de nuevas dependencias.

Los logs de la primera fixture incompleta, el test estático que esperaba campos
cerrados, el empaquetado y la llamada inicial de axe se conservan. Se corrigieron
fixtures y pruebas sin cambiar reglas de validación ni eliminar el fallo de carga.
El build regeneró `next-env.d.ts`; se restauraron exactamente sus bytes iniciales
con comprobación SHA-256 antes del cierre, sin ampliar la allowlist.

## Reproducción

Iniciar únicamente el clúster desechable identificado en `../M01/cluster.json`.
No usar la conexión habitual del proyecto. Desde `apps/api`, con Node 24 existente:

```powershell
$env:NODE_ENV='test'
$env:KORAZ_GUIDED_V2_TEST_SERVER='true'
$env:KORAZ_TEST_DATABASE='true'
$env:KORAZ_GUIDED_V2_TEST_DATABASE_URL='postgresql://koraz_test@127.0.0.1:55435/koraz_guided_v2_control_test'
$env:T038_RUN_TAG='recheck'
node --import tsx test/performance/guided-v2-load.mjs
```

El comando sale con 1 cuando L02 falla. `--validation-only` evita toda conexión;
`--smoke` hace una prueba corta que nunca acredita L02; `--profile-only` comprueba
inicialización y lecturas seriales. `--serve` prepara fixtures para el componente
aislado, escucha solo en 127.0.0.1:41035 y se cierra por el endpoint de prueba
`/__test/t038-stop` con POST JSON. No expone un servidor de aplicación productivo.

Para repetir la prueba aislada se necesitan sus JSON de fixture vigentes y ese
servidor de prueba; ejecutar `component-check.mjs` desde esta carpeta o la raíz.
La guardia de DB y el marcador explícito siguen siendo obligatorios.

## Pendiente

L02 impide aceptar T038. `AMPLIACION-PROPUESTA.md` describe tres módulos de runtime
y sus tests para optimizar búsquedas y reutilización de datos, sin variar
comportamiento ni reducir los límites. Esa ampliación no está autorizada ni se
ha implementado. La ficha T039 no se comenzó. No hubo commit ni despliegue.

La revisión automática rechazó dos intentos de arrancar Next localmente, con
el motivo genérico `blocked by policy`. No se afirma que la prueba completa UI/BFF
haya pasado. El fallback aislado no ejecuta ese arranque rechazado.
