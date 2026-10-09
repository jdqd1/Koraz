# T024 — Formularios de datos, fuentes, objetivos y prerrequisitos

Actualización 04/10/2026: el timeout descrito como pendiente en este registro
histórico está **RESUELTO**. Ver [cierre-timeout](cierre-timeout/README.md):
55 pruebas de regresión relevantes y dos repeticiones de 18/18, sin aumentar
el timeout ni retirar assertions. Los resultados originales de abajo se conservan.

**Resultado: PASS local de T024. Fecha: 30/09/2026.** Base: `e1bbc8f9154b5cfe9fb6d5de3562fc11ff4fb30a`. La regresión API ampliada conserva un timeout, explicado abajo; no se presenta como PASS. E01 sigue siendo parcial hasta completar las fichas del constructor.

La solicitud ejecutada fue «continua con t024». El handoff se utilizó como especificación de esa ficha, sin ejecutar sus tareas posteriores. Dependencias: T005 y T023, ambas con evidencia PASS. T025 no se inició. No se hizo commit ni despliegue.

## Alcance y autorizaciones

- Formularios de datos de ruta, tema por nombre, fuentes y localización de fragmentos; selección de guía/revisión con hash real y huella local de documentos de referencia.
- Objetivos con verbo, criticidad, requerido, unidad y fuentes. CORE conserva la regla requerida del contrato vigente. Se permite crear una unidad mínima para empezar desde un borrador vacío; el constructor de actividades sigue pendiente de sus fichas.
- Prerrequisitos por nombre, orden topológico del analizador compartido y rechazo de ciclos antes de cambiar el borrador. Las ramas independientes se explican como tales.
- Eliminación con confirmación y protección de referencias: objetivos con actividades/evaluaciones y fuentes usadas se bloquean; una eliminación permitida limpia referencias de unidad, repaso y prerrequisitos. Mover un objetivo mueve sus actividades principales con él.
- Labels, mensajes asociados y navegación de incidencias al campo, apertura de detalles cuando corresponde y foco al crear/eliminar/enlazar. Se reutilizan el shell y CSS existentes, con ajustes locales adaptables.

El usuario autorizó expresamente dos ampliaciones: «Sí, incluir la conexión mínima en el shell» y «Sí, añadir el catálogo mínimo de fuentes v2». La segunda añade contrato de lectura, provider, ruta Fastify y BFF, con sus tests. El catálogo entrega metadatos editoriales, tema y revisión/hash vigentes ya almacenados; verifica versión, hash y recurso no retirado. No genera revisiones. Las guías sin snapshot válido muestran «sin revisión vigente almacenada» y no pueden seleccionarse. Se conservan bindings guardados cuando falla la consulta o cambia la búsqueda.

No se cambió el modelo portable, política pedagógica, autenticación ni mapa personal. `source-hashes.json` identifica las **15 fuentes afectadas**. `t023-preservation.json` compara las 21 fuentes registradas al cerrar T023: ninguna cambió fuera del alcance de T024 y las dos autorizaciones. El árbol ya contenía trabajo de T020–T023; `state-before.txt` conserva ese estado.

## Comprobaciones

Runtime usado: Node 24.19.0 instalado y pnpm 11.19.0; no se instalaron ni actualizaron dependencias.

| Comprobación | Resultado | Evidencia |
|---|---|---|
| Build de contratos | PASS, exit 0 | `contracts-build.txt` |
| Suite web completa | PASS: 46 archivos, **297 tests** | `web-suite-final.txt` |
| Web focalizado en la fuente de cierre | PASS: 4 archivos, **36 tests** | `web-tests-closure.txt` |
| Catálogo API aislado | PASS: **3 tests** | `api-catalog-tests.txt` |
| Integración HTTP real con Fastify/provider/PGlite | PASS: **1 test**, create/read/save/CAS/replay y catálogo | `http-integration.txt`, `http-integration.test.ts` |
| Typecheck web/API | PASS, exit 0 | `web-typecheck-closure.txt`, `api-typecheck-closure.txt` |
| ESLint de fuentes afectadas web/API | PASS, exit 0, cero warnings | `web-lint-closure.txt`, `api-lint-closure.txt` |
| Navegador en página editorial real con BFF y almacenamiento aislado | PASS para los flujos descritos abajo | JSON y capturas |
| Regresión API ampliada | **PARTIAL: 45 PASS, 1 FAIL por timeout**, 6 archivos | `api-regression.txt` |
| `git diff --check` y hashes finales | PASS | `diff-check.txt`, `source-hashes.json`, `closure-verification.json` |

La suite web completa precede a dos correcciones pequeñas de fuente/binding y al retorno del foco al quitar un enlace. Las 36 pruebas focalizadas, lint y typecheck se ejecutaron después sobre la fuente final. No se suman pruebas repetidas para inflar los resultados.

### Timeout de importación en la regresión ampliada

`guided-v2-import.test.ts`, «I01/I02 commits once, replays the receipt and exports exact portable content», excedió su límite original de 5000 ms. La ejecución aislada conserva **17 PASS, 1 FAIL** (`api-import-isolated.txt`, 5141 ms). El test abre una segunda PGlite y aplica la cadena de migraciones dentro del caso.

Se repitió sin el método de catálogo añadido a este provider: **17 PASS, el mismo FAIL** (5027 ms), conservando test, migraciones, assertions y límite de 5000 ms. `provider-before-catalog.ts`, `vitest.import-baseline.config.mts` e `import-baseline-comparison.json` hacen reproducible esa comparación. Esa copia es diagnóstica; no es código de producto. La reproducción apoya que el fallo no depende del método de catálogo, pero no acredita que toda la suite API esté verde ni es una medición de rendimiento de producción. No se modificó el test de importación ni su timeout. Debe resolverse o reevaluarse durante la validación global antes de declarar Hito S.

### Tipos generados de Next

El typecheck simultáneo con Next dev detectó contenido duplicado en `.next/dev/types/routes.d.ts`. Se conservan el error y el archivo (`web-typecheck-generated-race.txt`, `generated-routes-corrupt.txt`). Con el servidor detenido, `next typegen` terminó correctamente; sus tipos de rutas y root params sustituyeron los archivos generados defectuosos. `next-env.d.ts` conserva sus referencias originales y el typecheck final pasó. No se excluyeron archivos de la comprobación ni se cambió `tsconfig`.

## Navegador, teclado y persistencia

Se utilizó Next en `127.0.0.1:3100`, BFF del producto y Fastify/provider en `127.0.0.1:4103`, con identidad sintética y PGlite en memoria. Las rutas `/__test/state/:id` y `/__test/stop` pertenecen exclusivamente al harness de evidencia.

- ArrowRight/Enter entre pestañas; crear y editar objetivo; rechazo de ciclo sin aceptar el enlace; añadir/quitar prerrequisito y confirmar eliminación de un objetivo sin referencias bloqueantes.
- Crear, vincular por nombre, editar y eliminar una fuente. La revisión y el hash proceden de filas reales del catálogo aislado. Desvincular limpia el fragmento/hash y el guardado enfoca el selector; al restaurar un binding válido se vuelve a guardar.
- Una incidencia de título cambia a Objetivos y enfoca exactamente `package.objectives.0.title`, con `aria-invalid=true` y contorno visible (`issue-focus.json`). Una fuente sin binding enfoca `package.sources.1.binding` (`source-binding-focus.json`).
- En la primera base se creó y persistió un tercer objetivo y una tercera fuente (`storage-after-ui-save.json`). En la segunda base: eliminación de objetivo en revisión 4, creación de fuente en revisión 5, eliminación en revisión 6 y restauración del vínculo en revisión 7. `storage-final.json` confirma 2 fuentes, 2 objetivos y bindings coherentes. Los snapshots fueron consultados al provider, además de los estados de pantalla.
- Objetivos: 360×800, 390×844, 768×1024, 1440×900 y 720×450. Fuentes: 360×800, 390×844 y 1440×900. Sin overflow horizontal del documento ni campos fuera de su ancho (`browser-geometry.json`, `sources-geometry.json`). El último control móvil queda visible por encima de la barra de guardado.

Capturas de referencia: `editor-before.png`, `cycle-rejected.png`, `objectives-desktop-final.png`, `objectives-mobile-controls-final.png` y `sources-fragment-desktop.png`. Los dos últimos nombres corrigen la descripción de capturas inicialmente guardadas como `sources-desktop-final.png` y `objective-form-final.png`; se conservan también los originales. `browser-checks.json` detalla la cobertura y las incidencias de herramientas. Las capturas preceden al último ajuste de retorno del foco, que no cambia el diseño.

El harness inicial agotó su retención opcional y se reinició para continuar QA; no existían datos de usuario. La duración del test HTTP final incluye la espera manual para el navegador y no sirve para evaluar rendimiento. Al cerrar se retiró la cookie sintética, se cerró la pestaña creada y se detuvieron ambos servidores.

## Límites de este cierre

PASS corresponde a los criterios de T024 en entorno local. **NO VERIFICADO:** identidad de producción, despliegue, concurrencia en PostgreSQL real, zoom nativo del navegador, auditoría completa axe/lector de pantalla y flujo manual de huella de referencia por archivo. El reflow a 720×450 se probó como emulación de 200 %, sin atribuirlo a zoom nativo. T037 conserva su auditoría de accesibilidad completa.

Las guías sin revisión almacenada permanecen explícitamente indisponibles; este catálogo no subsana ese dato faltante. Este cierre no acredita publicación, validación clínica, todas las capacidades de E01 ni Hito S. La regresión API ampliada conserva el timeout documentado.

## Reproducción

Anteponer al PATH el Node 24 instalado si el shell usa Node 22. Desde la raíz:

```powershell
pnpm.cmd --filter @cediah/contracts build
pnpm.cmd --filter @cediah/web exec vitest run src/components/learning/editor/v2/editor-model.test.ts src/components/learning/editor/v2/editor-controller.test.ts src/components/learning/editor/v2/editor-web.test.ts src/components/learning/editor/v2/sources-objectives.test.tsx --maxWorkers=1
pnpm.cmd --filter @cediah/api exec vitest run test/guided-v2-source-catalog.test.ts
pnpm.cmd --filter @cediah/api exec vitest run --root ../.. --config docs/aprendizaje-guiado/v2/evidencias/T024/vitest.http.config.mts
pnpm.cmd --filter @cediah/web typecheck
pnpm.cmd --filter @cediah/api typecheck
```

El harness HTTP finaliza automáticamente sin `T024_BROWSER_HOLD`. Para QA manual, establecer esa variable a `true` conserva el servidor hasta 30 minutos; detenerlo con POST JSON `{}` a `/__test/stop`. Next debe usar `API_BASE_URL=http://127.0.0.1:4103`. La reproducción de la comparación de importación usa `vitest.import-baseline.config.mts`; sus rutas absolutas corresponden a este workspace.

Se conservan los logs iniciales de errores y correcciones de fixtures/types/lint. La ficha siguiente es **T025**, pendiente de una instrucción del usuario.
