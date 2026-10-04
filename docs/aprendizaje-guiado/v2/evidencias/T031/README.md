# T031 — Secuencias, casos y composiciones avanzadas

**Resultado: PASS local de T031.** Solicitud: «haz la t031».
Inicio de sesión: 03/10/2026; cierre: 04/10/2026, America/Caracas.
Base: `e1bbc8f9154b5cfe9fb6d5de3562fc11ff4fb30a`.
Dependencias revisadas: T014, T029 y T030 PASS en sus alcances documentados.

## Implementación

Sequence usa una lista ordenada con botones Subir/Bajar, sin depender de drag.
Los movimientos conservan cada elemento exactamente una vez, se anuncian con
su posición y mantienen el foco en el mismo elemento, incluso en los extremos.
El formulario bloquea órdenes incompletos, duplicados, ajenos o con tamaño
inválido. Envía únicamente `orderedKeys`; el servidor determina el acierto.
El resumen inmediato muestra el orden confirmado con los textos públicos de
los elementos, sin inventar una solución correcta.

Case reutiliza el manifiesto existente: el servidor entrega el hijo activo con
la narrativa de su etapa dentro de `prompt`. No se descargan etapas futuras,
no se añade una respuesta del wrapper y no existe un botón para saltar hijos.
La transición usa el transporte de T029, con CAS, recibo confirmado y reintento
idempotente. Durante feedback se mantiene oculto el siguiente paso hasta pulsar
Continuar. Un wrapper público sin hijo muestra un estado de recarga y no fabrica
una pregunta ni puntuación.

`ActivityComposition` conecta las ocho familias existentes. Causa/mecanismo
usan secuencia y respuesta construida; predicción usa respuesta corta u opción;
detección/corrección usa opción y respuesta construida; comparación y micro-mapa
usan match. Los ejemplos resueltos y parciales usan study y se identifican como
lectura de apoyo, separada de la respuesta independiente. El apoyo anterior y
su feedback se desmontan al recuperar. Autovaloración, lectura y wrapper no
obtienen una nota objetiva en cliente.

Se conservan la estructura, estilos globales, navegación y jerarquía existentes.
Los estilos añadidos son locales. Se inspeccionaron las capturas previas de T030
y las nuevas de móvil/desktop. Las capturas fullPage contienen el chrome fijo
de AppShell en su posición de scroll; no son una auditoría global del shell.

## Alcance y preservación

Cinco archivos nuevos: composition.tsx, composition.test.tsx,
composition.module.css, renderers/sequence.tsx y renderers/case.tsx.
Excepción mínima a la lista de archivos de la ficha: player.tsx conecta el
dispatcher y el resumen confirmado. No cambia transporte, algoritmo, contrato,
backend, editor, migraciones, contenido médico ni motor v1.

`preservation.json` acredita 1394/1395 archivos previos intactos. El único archivo
previo modificado es player.tsx; los cinco archivos nuevos y esta carpeta de
evidencia no estaban en la base. No se eliminó ningún archivo previo.
`source-hashes-final.json` registra los seis archivos de implementación/pruebas.

## Verificación

| Comprobación | Resultado | Evidencia |
|---|---|---|
| Contracts build con Node 24.19.0 existente | PASS | contracts-build.txt |
| Suite web | 450 PASS, 57 archivos | web-suite.txt |
| Suite final focalizada: composición, player y visual | 55 PASS, 3 archivos | focused-final.txt |
| API: case, grading, attempts y contract | 29 PASS, 12 SKIP, 4 archivos | api-focused.txt |
| HTTP del harness aislado | 1 PASS | http-server.txt |
| Typecheck y ESLint finales web | PASS | typecheck-final.txt, lint-final.txt |
| Chromium → Next BFF → Fastify → PGlite | PASS local | browser-real-checks.json, browser-real.cjs |
| Preservación SHA-256 y diff check | PASS | preservation.json, diff-check.txt |

La suite web completa pasó antes del último ajuste del resumen: al reanudar
sin textos, ahora muestra el número de pasos guardados en vez de claves internas.
Las 55 pruebas focalizadas finales, typecheck, lint y navegador verifican ese
ajuste. No se repitió una aceptación global de API ni del sistema.

El navegador verifica un caso sintético de seis etapas: ejemplo parcial,
secuencia, predicción incorrecta, tabla, detección y corrección construida.
Intentar responder un hijo futuro devuelve 409 y no escribe una respuesta.
Una respuesta HTTP retenida mantiene oculta la siguiente narrativa y bloquea
controles hasta confirmación. Secuencia por teclado conserva foco y orden;
su recap inmediato coincide con el orden aceptado. La predicción errónea guarda
score 0 con feedback. Submit/reveal/rating de constructed conserva su etapa
durante recargas y termina con score null. El cierre guarda seis respuestas de
hijos, ninguna del wrapper. El backend existente marca el wrapper completado una
vez como agrupación, sin puntuarlo. No se cambió esa regla.

Una respuesta de secuencia cuyo recibo HTTP se pierde después del commit se
reanuda tras recarga: se reintenta exactamente el mismo cuerpo y clave y queda
una sola fila, con score 0 del servidor. Un ejemplo resuelto independiente guarda
acknowledged con score null. La identidad de cookie y el contenido son sintéticos;
las respuestas, manifiestos, autorización y persistencia usan servicios reales.

Viewports 360×800, 390×844, 768×1024 y 1440×900 sin overflow de página. Axe:
0 serious/critical en secuencia móvil, feedback de secuencia y respuesta
construida revelada del caso móvil. Capturas inspeccionadas:
sequence-mobile.png, sequence-recap-desktop.png y case-revealed-mobile.png.

## Diagnósticos conservados

El primer import del harness no resolvía el alias de contracts desde docs;
se corrigió apuntando al dist construido (http-server-initial.txt).
Después, el harness intentó actualizar la versión publicada heredada del helper;
la guardia la rechazó (http-isolated.txt). Se corrigió instalando el contenido
sintético en el borrador disponible y publicándolo una sola vez. Un asset
heredado sin binding provocó access_revoked; se retiró del paquete sintético,
que no usa imágenes (http-before-fixture-bindings.txt).

Una assertion nueva suponía que el wrapper no tenía estado de completitud.
La inspección del backend confirmó que sí guarda esa agrupación, sin respuesta
ni puntuación. La prueba final exige seis respuestas propias y una completitud
del wrapper, sin score adicional (browser-before-wrapper-assertion.json).
La simulación de pérdida de recibo necesitaba esperar a que route.fetch terminara
antes de inspeccionar DB o recargar; se sincronizó ese punto, sin cambiar código
del producto (browser-before-lost-receipt-sync.txt).

## Reproducción

Usar Node 24.19.0 disponible en el runtime del workspace y pnpm.cmd existentes;
no instalar ni actualizar dependencias.

    pnpm.cmd --filter @cediah/contracts build
    pnpm.cmd --filter @cediah/web exec vitest run src/components/learning/v2/composition.test.tsx src/components/learning/v2/player.test.tsx src/components/learning/v2/renderers/visual.test.tsx
    pnpm.cmd --filter @cediah/web typecheck
    pnpm.cmd --filter @cediah/api exec vitest run test/guided-v2-case.test.ts test/guided-v2-grading.test.ts test/guided-v2-attempts.test.ts test/guided-v2-contract.test.ts

En una terminal, definir T031_BROWSER_HOLD=true y ejecutar desde raíz:

    node apps/api/node_modules/vitest/vitest.mjs run --config docs/aprendizaje-guiado/v2/evidencias/T031/vitest.http.config.mts

Tras http-ready.json, desde apps/web definir API_BASE_URL=http://127.0.0.1:41031:

    node node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 31031 --webpack

Desde raíz ejecutar node docs/aprendizaje-guiado/v2/evidencias/T031/browser-real.cjs.
Para cerrar, POST JSON {} a http://127.0.0.1:41031/__test/stop y detener ese Next.
Los controles solo existen en este harness y usan una PGlite nueva en memoria,
sin conexión a bases externas. Ambos procesos fueron cerrados al terminar.

## Límites

El DTO de respuestas históricas conserva orderedKeys pero no los textos de los
elementos. El recap inmediato usa los textos públicos del paso recién respondido;
tras perderlos por recarga, muestra cuántos pasos están guardados. No muestra
claves internas ni fabrica textos. Un historial etiquetado completo requeriría
otra ampliación del DTO/backend, fuera de T031.

NO VERIFICADO: zoom nativo, lector de pantalla, auditoría completa T037,
recorrido integral T035, PostgreSQL independiente (12 SKIP), emisión de sesión
Better Auth, carga, revisión editorial/médica, Hito S, staging y producción.
El fixture es de ejecución sintética; no acredita publicación editorial ni
el resumen completo de una ruta curricular validada. El timeout heredado T024
y upgrade pendiente T021 conservan su estado anterior.

No hubo commit, despliegue ni cambios productivos. T032 no iniciada.
