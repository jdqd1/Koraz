# T038 — Cierre de la ampliación autorizada de caché

**FAIL LOCAL.** L01 y L03 pasan en sus ámbitos medidos; L02 no cumple los límites originales. Persiste además un timeout de S06. T038 no está aceptada. No se inició T039 ni se acepta Hito S.

Solicitud: «continua con t038» y «autorizo», 07/10/2026, America/Caracas. Base: `11737fd84562ee5a65e9ef124442b82f9aa16785`. T035 PASS local es el predecesor requerido; T037 PASS local también fue inspeccionado. Ambas ampliaciones constan en `authorization.json`, `cache-authorization.json` y sus propuestas. El documento adjunto define el alcance técnico; la solicitud y las autorizaciones proceden del usuario.

| Criterio | Resultado medido | Evidencia |
|---|---|---|
| L01: 30 unidades, 200 objetivos, 1600 actividades, 20 corridas | PASS. CPU máxima 235,00 ms; mediana de pared 76,31 ms. | validator-balanced.json |
| L02: 20 usuarios durante 300 s | FAIL. p95 estado 1709,99 ms (<500); respuesta 4925,71 ms (<1000). | cache-verified-load.json |
| Errores y consistencia | 1948 solicitudes, 472 respuestas nuevas, 60 replays idénticos; cero errores técnicos y cero inconsistencias. | cache-verified-load.json |
| L03: manifiestos HTTP | PASS. Creación 664, respuesta máxima 70851, estado máximo 69657 bytes; límite 102400. | payload-summary.json |
| L03: formularios | PASS del componente real aislado: 1600 tarjetas, cero formularios iniciales y máximo uno abierto. | component-results.json |

La ventana de admisión dura 300 s y se drenan las operaciones iniciadas: total 305175,35 ms, drenaje 5175,35 ms. Se incluyen y verifican todas las muestras de `cache-verified-latency-samples.json`. La carga es cerrada, con pausa de hasta cinco segundos por actividad; no acredita una tasa fija ni alumnos reales. La fixture SHA-256 es `2eca6fd7f8d30713253877b10bb311f68d6cec1ca36587cf1e5d6a022f16d372`, igual en todas las cargas completas.

| p95 | Antes de caché entre peticiones | Primera carga con caché | Árbol final |
|---|---:|---:|---:|
| Estado | 1985,32 ms | 2822,21 ms | 1709,99 ms |
| Respuesta | 4889,25 ms | 8595,46 ms | 4925,71 ms |

Se conservan todas las corridas, incluidos los fallos. La primera carga con caché precede a la corrección del contador ante lecturas simultáneas; la final corresponde exactamente a los doce hashes de producto entregados. La variación del equipo impide atribuir las diferencias a una sola causa. No se rebajan umbrales ni se atribuye el fallo exclusivamente al hardware.

## Implementación y límites de caché

Se guardan únicamente definiciones publicadas, validadas y congeladas profundamente, por cliente de base de datos: 8 versiones como máximo, 8388608 bytes de JSON codificado y TTL absoluto de 60000 ms, con expulsión LRU. El presupuesto describe JSON codificado, no el heap total de objetos e índices. Las lecturas simultáneas de la misma versión reemplazan también su peso, evitando contarlo dos veces. Borradores, definiciones inválidas o sobredimensionadas no se retienen.

Cada operación coteja id, policy, estado, edit_version y updated_at con precisión PostgreSQL. Los índices estructurales solo se reutilizan para definiciones profundamente inmutables. Matrícula, catálogo, bindings, permisos, hechos del alumno, agenda, relojes y recibos se leen de nuevo. No se almacena estado del alumno entre peticiones. Los locks de catálogo mantienen su orden; el estado se consulta en una sentencia posterior para observar revocaciones tras esperas.

La traza caliente registra cero descargas completas de definición y una comprobación de metadatos por creación/respuesta/finalización. Estado usa 19 consultas SQL; creación 40, respuesta 57, finalización 49. Esto verifica consultas, no aceptación de latencia.

Se conservan las optimizaciones anteriores: upsert ordenado por lote de objetivos modificados, timestamps históricos, índices de evidencia/selección, reutilización dentro de una operación y editor con una sola tarjeta abierta. No cambian score, reglas, contratos ni migraciones. Los cuatro archivos web mantienen los hashes de la primera fase.

## Verificación

- Siete suites API seriales: **162 PASS / un FAIL por timeout / 19 omitidas**, 182 casos. S06 excede 5000 ms en la corrida amplia, en seguridad aislada (29 PASS / un timeout / 7 omitidas) y en el caso aislado. No se cambió el timeout ni se descarta el fallo. T036 con PostgreSQL y usuario restringido está habilitada. Se omiten seis casos T022 que requieren su clúster dedicado, doce de concurrencia histórica y uno de navegador Next; no se presentan como PASS.
- Auditoría SQL independiente de las mismas comprobaciones S06: PASS, 67 denegaciones esperadas 42501, aislamiento de logins, RLS, ownership, flags del runtime y privilegios de funciones. Duración de las comprobaciones 9162,89 ms. Esta ejecución con Node assert no usa el plazo Vitest y no transforma su timeout en PASS. Evidencia: cache-permission-audit.json.
- Siete regresiones nuevas respecto del cierre anterior: cinco de caché, una de selección con hechos frescos y una de contabilidad concurrente. Las regresiones previas de revocación y timestamps también pasan.
- Diferencial: 72 historiales exactos contra fuentes anteriores verificadas por SHA-256, incluidas definiciones congeladas. La fixture diferencial grande tiene 1814 actividades y no sustituye las 1600 de L01/L02.
- Validador: cinco calentamientos por escala y veinte medidas rotatorias, sin exclusiones; crecimiento observado 2,38× al duplicar y 4,71× al cuadruplicar. Es evidencia en estas escalas, no prueba de complejidad asintótica. Se conservan mediciones ordenadas anteriores.
- Tipos API, ESLint afectado y `git diff --check`: exit 0. Build de contracts, build/tipos/lint web y 98 pruebas editor PASS conservados; fuentes web intactas durante ambas ampliaciones.
- Navegador del componente React real: 1440×900 y 390×844, ocho tipos, teclado, foco, borrador y persistencia HTTP/PostgreSQL; axe sin serious/critical en ese componente.
- Preservación: 751 archivos baseline, 740 intactos; once modificaciones autorizadas y un archivo nuevo de producto. Los hashes finales coinciden con los capturados antes de la carga.
- Limpieza: 16 bases desechables con recibo ausentes y ninguna base sin recibo creada desde el baseline; cero conexiones ajenas. Se conservaron 11 bases anteriores a T038, identificadas por OID y fecha de creación del directorio (04–05/10 frente al baseline 07/10). La primera detección sin clasificación se conserva en cache-cleanup-discovery.json. Clúster propio detenido y puertos 31035/41035/55435 libres.

## Entorno y alcance pendiente

Windows 10.0.26300, Intel Core i3-1305U, seis CPU lógicas, 8267882496 bytes RAM, Node 24.19.0; detalles en `cache-verified-runtime.json`. Fastify/proveedores/PostgreSQL reales, pool de ocho conexiones y HTTP loopback. Identidad, contenido y reloj de negocio son sintéticos del harness T035. No se instalaron ni actualizaron dependencias, ni se creó commit o despliegue.

La revisión automática rechazó arrancar Next con «blocked by policy» (`browser-server-rejected.json`). Next, SSR, BFF, shell completo y recarga autenticada siguen NO VERIFICADO. La evidencia aislada no los sustituye. Producción, staging, Hito S, piloto clínico/editorial, Better Auth real y certificación de accesibilidad siguen fuera de este cierre.

Pendiente: cumplir L02 y repetir la carga exacta sobre cualquier corrección posterior, conservando el entorno y los límites; además, resolver el timeout S06 sin presentarlo como PASS a partir de la auditoría independiente. La ampliación de caché está implementada y no queda pendiente de autorización. T038 sigue sin aceptación; no se inicia T039.

## Reproducción

Usar solo el clúster desechable verificado en `../M01/cluster.json`, puerto 55435, y Node 24 existente. No leer .env ni usar la base normal. Desde la raíz:

```powershell
$env:NODE_ENV='test'
$env:KORAZ_GUIDED_V2_TEST_SERVER='true'
$env:KORAZ_TEST_DATABASE='true'
$env:KORAZ_GUIDED_V2_TEST_DATABASE_URL='postgresql://koraz_test@127.0.0.1:55435/koraz_guided_v2_control_test'
$env:T038_RUN_TAG='recheck-cache-2' # elegir uno nuevo
node --import ./apps/api/node_modules/tsx/dist/loader.mjs apps/api/test/performance/guided-v2-load.mjs
```

El script devuelve 1 si L02 falla. `--smoke` nunca acredita L02. `--profile-only --operation-profile` audita consultas. `validator-balanced.mjs` coteja la fixture con la carga final. `write-result.mjs` regenera README y result con comprobaciones de muestras, hashes y limpieza.
