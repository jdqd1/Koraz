# T030 — Ampliación necesaria para cerrar el flujo de imágenes

Estado: ampliación autorizada por el usuario mediante «hazlo» e implementada en T030. Este documento conserva la propuesta que motivó la autorización; los bloqueos de la sección siguiente describen el estado anterior. El cierre vigente está en README.md/result.json.

La ficha T030 autoriza `apps/web/src/components/learning/v2/renderers/{image-target,match}.tsx` y sus estilos/tests. Los renderers están implementados; el montaje mínimo en `player.tsx` conecta matching al transporte existente y muestra el bloqueo de imágenes sin fabricar recursos.

## Bloqueos confirmados en el código actual

1. `PublicImage` contiene `assetKey` pero no un recurso autorizado ni alt. El manifiesto del intento no incluye bindings de assets. Una clave portable no puede convertirse en una URL de medios por suposición.
2. `toV2PublicActivity` devuelve `targets: []` para hotspot. `V2AnswerSchema` y `gradeImageTarget` exigen `targetKey`; el cliente no tiene ninguna clave pública que pueda enviar. No se deben usar polígonos ni índices inventados para obtenerla.
3. El payload público omite `accessibleAlternativeKey`. El inicio de intentos en `routes.ts` rechaza otro intento mientras existe uno en curso y valida su disponibilidad en el selector. Un enlace cliente a una variante no resolvería la transición ni probaría persistencia de modalidad.

## Cambio propuesto

- Proyectar únicamente las claves/consignas públicas necesarias para el hotspot activo, sin polígonos, etiquetas solución, correspondencias ni reservas futuras.
- Añadir resolución autenticada de medios de la actividad activa del intento propio, usando su versión fijada, binding y acceso vigente. Devolver solo recurso privado temporal y alt seguro; `private, no-store`; comprobar revocación antes de emitirlo. Reutilizar storage privado existente, sin medios públicos ni URLs derivadas por nombre.
- Exponer y activar exclusivamente la alternativa editorial de texto/tabla del mismo objetivo y versión. Confirmar en servidor la transición con CAS/idempotencia, conservar el intento y respuesta espacial históricos y registrar la representación real de la variante. La variante no se contará como medición espacial ni resolverá por sí sola un gate espacial sin equivalencia editorial validada. El diseño exacto de la transición deberá conservar las restricciones de selección y reservas existentes; no basta iniciar otra actividad desde cliente.
- Conectar esos datos/transiciones a `ImageTargetRenderer` en el player y añadir proxy BFF del mismo origen donde corresponda. Mantener carga/error/reintento y la confirmación de respuesta existente.

Archivos adicionales necesarios: `packages/contracts/src/guided-learning-v2.ts`; `apps/api/src/guided-learning/v2/{manifests,routes,service}.ts`; `apps/api/src/providers/postgres-guided-learning-v2.ts`; cableado del resolver privado en `apps/api/src/app.ts` si resulta necesario; client/player y proxy `apps/web/src/app/api/v2/guided-learning/attempts/`; pruebas de contrato, HTTP, persistencia y seguridad correspondientes. No cambiar el algoritmo geométrico, el editor global, migraciones aplicadas, políticas pedagógicas, v1 ni CDN público.

El proxy BFF existente es `apps/web/src/app/api/v2/guided-learning/[...path]/route.ts`. La implementación añade la migración **nueva** `0035_guided_v2_media_access.sql`, que permite leer tres columnas privadas al rol backend existente, y actualiza el cargador/las pruebas de grants; no modifica migraciones anteriores. El navegador real detectó además que `img-src 'self'` bloqueaba el recurso privado: la conexión mínima incluye `proxy.ts`, el validador/pruebas de `NEXT_PUBLIC_CONTENT_STORAGE_ORIGIN` y `.env.example`. Solo admite un origen HTTPS configurado, no un wildcard ni medios públicos. La identidad de sesión y el recurso privado continúan comprobándose en servidor.

P07 exige feedback parcial en la UI. Se transporta `partialScore01` opcional desde el grading ya persistido y se muestra tras la confirmación/reanudación; score01 y evaluación geométrica no cambian. La corrección de evaluaciones sigue diferida hasta la entrega del segmento. Se conserva el cierre FAIL anterior en `ampliacion/README-before.md` y `ampliacion/result-before.json`.

## Evidencia exigida tras autorizar

Imagen propia/activa autorizada; imagen ajena/revocada/inactiva denegada; hotspot con clave pública válida y ningún polígono en JSON/HTML; labeling sin mappings; clics/zoom/reanudación; alternativa confirmada que persiste su modalidad real sin acreditar evidencia espacial; doble envío/CAS; pruebas de API y browser/BFF con persistencia aislada. Las pruebas actuales de renderers con mocks no sustituyen esa evidencia.
