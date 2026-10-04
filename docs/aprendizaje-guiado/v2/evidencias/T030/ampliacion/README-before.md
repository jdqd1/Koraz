# T030 — Player de imágenes y relaciones

Fecha de cliente: 03/10/2026, America/Caracas. Base: `e1bbc8f9154b5cfe9fb6d5de3562fc11ff4fb30a`.

**Cierre de tarea: FAIL, bloqueado por integración fuera de la ficha.** Los renderers y su verificación local pasan. El flujo real de imagen/alternativa no está completo; no se acredita T030 ni se inicia T031. La ampliación está concretada en [AMPLIACION-PROPUESTA.md](AMPLIACION-PROPUESTA.md), pendiente de autorización.

## Entregado dentro del alcance

- `match.tsx`: pares, tabla de comparación y relaciones de micro-mapa con selectores nativos, nombres accesibles, completitud, opciones repetidas bloqueadas cuando no se permite reutilizar, y soporte de teclado/touch sin drag obligatorio. Las flechas del selector no borran selecciones de otros elementos. La solución y la puntuación siguen en servidor.
- `image-target.tsx`: cálculo sobre rectángulo real de `object-fit:contain`, rechazo de letterboxing, selección normalizada [0,1], controles de teclado/coordenadas, puntos numerados públicos para labeling, zoom propio con scroll interno, carga/error/reintento y preservación de selección. El recurso autorizado y la consigna hotspot se reciben explícitamente; no se derivan de nombres de archivo ni polígonos. Un recurso ausente o de otro asset bloquea el envío. No hay evaluación geométrica cliente.
- Estilos locales y 17 pruebas de geometría/render. Montaje mínimo en `player.tsx`: matching usa el transporte T029 con CAS/idempotencia y feedback confirmado; imágenes muestran un bloqueo explícito porque aún no hay resolver autorizado. No se sustituyó el shell ni se modificó T031.

## Verificación

| Comprobación | Resultado | Evidencia |
|---|---|---|
| contracts build, Node 24.19.0 | PASS | contracts-build.txt |
| suite web antes de las dos últimas correcciones locales | 427 PASS, 55 archivos | web-suite.txt |
| repetición final de renderers + player tras correcciones | 41 PASS, 2 archivos | focused-final.txt |
| evaluador API T014/P07 sin modificar | 15 PASS, 2 archivos | api-p07.txt |
| typecheck y ESLint final de archivos afectados | PASS | typecheck-final.txt, lint-final.txt |
| navegador Chromium con renderers reales y V2Player | PASS local con mocks | browser-checks.json, browser-check.cjs |
| SHA256 de archivos previos | 751/752 sin cambios; solo player.tsx tiene montaje previsto | preservation.json, baseline-hashes.json |
| git diff --check | PASS | diff-check.txt |

Navegador: 360×800, 390×844, 768×1024 y 1440×900; bandas horizontales/verticales; clics relativos; bordes por coordenadas; zoom de imagen 200 %, resize y selección inmutable; etiquetado/posición de marcadores; teclado en los tres match; bloqueo de duplicados y reutilización explícita; error/reintento de imagen; recursos ausentes; callback de alternativa sin acreditar modalidad; envío HTTP tipado por V2Player y feedback parcial confirmado. Axe: cero serious/critical en pairs, comparison_table, causal_map y hotspot inspeccionados. Capturas: hotspot-desktop.png, labeling-mobile.png, match-mobile.png.

Los eventos del navegador redondean clientX/clientY a píxeles: la comparación con el punto pedido admite 1.1 CSS px sobre el rectángulo real. La selección se conserva exactamente entre zoom/resize; las pruebas puras exigen coordenadas exactas. Esta tolerancia no modifica evaluación servidor ni umbrales de acierto.

El navegador detectó dos problemas corregidos: validación nativa `step=1` bloqueaba coordenadas decimales, ahora `step=any`; reasignación automática al recorrer opciones borraba relaciones previas, ahora conserva las selecciones y bloquea duplicados con aviso. Se conservan los primeros diagnósticos de harness/step mismatch; el resultado final está en browser-checks.json. Los problemas iniciales de bundling de Next/axe se resolvieron solo en el harness aislado.

## Límite contractual confirmado

El contrato público no tiene media/alt autorizados; hotspot entrega `targets: []` aunque la respuesta servidor exige una clave real; omite la alternativa editorial y no hay transición autorizada para activarla durante un intento. No se modificaron contratos, backend, storage, evaluador geométrico ni permisos. La variante accesible de texto/tabla y su modalidad persistida siguen **NO VERIFICADO**; el callback del fixture es solo prueba del control.

No se verificaron browser/BFF/API/persistencia autenticados para imágenes ni alternativas, zoom nativo del navegador/lector de pantalla, recorrido completo, PostgreSQL independiente, Hito S, eficacia clínica o producción. El timeout T024 y upgrade T021 se conservan como incidencias heredadas; no se investigaron ni se declararon resueltas aquí. No hubo commit, despliegue ni cambios de datos productivos.

## Reproducción

Usar Node 24.19.0 disponible localmente y pnpm.cmd del workspace; sin instalar ni actualizar dependencias.

```powershell
pnpm.cmd --filter @cediah/contracts build
pnpm.cmd --filter @cediah/web exec vitest run src/components/learning/v2/renderers/visual.test.tsx src/components/learning/v2/player.test.tsx
pnpm.cmd --filter @cediah/api exec vitest run test/guided-v2-grading.test.ts test/guided-v2-case.test.ts
pnpm.cmd --filter @cediah/web typecheck
pnpm.cmd --filter @cediah/web exec eslint src/components/learning/v2/renderers/image-target.tsx src/components/learning/v2/renderers/match.tsx src/components/learning/v2/renderers/visual.test.tsx src/components/learning/v2/player.tsx --max-warnings=0
node docs/aprendizaje-guiado/v2/evidencias/T030/browser-check.cjs
```

El harness crea un servidor HTTP efímero en loopback y lo cierra al terminar. Compila los componentes instalados con esbuild existente y usa figura SVG sintética, medios/alternativa y receipts mock. No requiere una ruta pública nueva, credenciales ni DB. No sustituye pruebas de integración de servidor.
