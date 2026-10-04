# T030 — Player de imágenes y relaciones

**Aceptación: PASS local de T030, incluida la ampliación autorizada.**
Fecha local: 03/10/2026, America/Caracas. Base: e1bbc8f9154b5cfe9fb6d5de3562fc11ff4fb30a.
Solicitud: «haz t030»; ampliación autorizada por «hazlo», seguida de «continua».
T014 y T029 mantienen sus alcances documentados. T031 no iniciado.

## Resultado

Hotspot y labeling usan la imagen privada autorizada de la actividad activa del intento propio. La resolución comprueba cuenta, acceso vigente, actividad, rowVersion, versión fijada, binding, estado/bucket/MIME del asset y emite una URL HTTPS firmada por 60 segundos. El DTO incluye solo assetKey, URL, alt y caducidad; los endpoints y BFF conservan private, no-store. No deriva URLs desde claves ni entrega storage_path, polígonos, mappings, reservas o respuestas futuras.

Hotspot recibe claves de objetivo públicas y la consigna pública de la actividad; las consignas privadas de targets permanecen ocultas. Los clics se normalizan respecto al rectángulo real object-fit: contain, rechazan letterboxing y conservan exactamente su selección al ampliar/redimensionar. Hay flechas, coordenadas decimales, selector de consigna si existen varias, zoom propio y carga/error/reintento. Labeling usa marcadores numerados públicos y selectores nativos. El área ampliada admite foco y desplazamiento por teclado; no requiere arrastrar.

Matching implementa pairs, comparison_table y causal_map con selectores accesibles. Conserva elecciones al recorrer opciones con flechas, bloquea incompletos/duplicados si no se permite reutilizar y envía exclusivamente las relaciones elegidas. La evaluación sigue en servidor. P07 muestra el partialScore01 ya calculado/persistido: 3/4 produce feedback 75 % con score01 binario 0, sin evidencia completa ni dominio. No se cambió el evaluador geométrico. La corrección de evaluaciones mantiene su entrega diferida por segmento.

La variante accesible pertenece al mismo objetivo y snapshot, usa texto/tabla y use=learning, no es caso/imagen/study ni una actividad original pendiente, y no está disponible en evaluaciones. Su transición usa autorización, CAS e idempotencia; reanuda tras recarga. La respuesta persiste la representación real con assisted=true, sin completar otra actividad ni acreditar evidencia espacial, XP o dominio. Al responder vuelve a la imagen original pendiente; la variante ya respondida deja de ofrecerse. La imagen posterior también se marca con ayuda. El cierre requiere responder las actividades originales, sin contar la variante como sustitución.

La migración nueva 0035_guided_v2_media_access.sql concede únicamente lectura de storage_bucket, storage_path y mime_type al rol backend existente. No modifica migraciones previas ni concede escritura o acceso browser. La prueba anterior que prohibía storage_path al backend se ajusta explícitamente para este resolver; otras columnas privadas y escritura siguen denegadas.

## Configuración de medios

La API reutiliza contentAssetStorage y su bucket privado existentes. En web, configurar **NEXT_PUBLIC_CONTENT_STORAGE_ORIGIN** con el origen HTTPS exacto que emite el signer, por ejemplo https://your-project-ref.storage.supabase.co. Se usa solo en img-src CSP, con validación y sin wildcard; no es una URL pública del asset ni determina autorización. .env.example documenta el valor. Sin esa configuración el navegador bloquea medios externos y el player conserva el estado mostrando error/reintento. No se modificaron credenciales ni archivos .env activos.

## Verificación final

| Comprobación | Resultado | Evidencia |
|---|---|---|
| Contracts build, Node 24.19.0 | PASS | ampliacion/contracts-build.txt |
| API: imágenes, contratos, grading, casos, intentos, HTTP y seguridad | 69 PASS, 19 SKIP, 7 archivos | ampliacion/api-focused-final.txt |
| Suite web final | 437 PASS, 56 archivos | ampliacion/web-suite-final.txt |
| Typecheck API/web y ESLint de archivos afectados | PASS | ampliacion/*-typecheck-final.txt, ampliacion/*-lint-final.txt |
| Chromium → Next BFF → Fastify → PGlite aislado | PASS local | ampliacion/browser-real-checks.json, ampliacion/browser-real.cjs |
| Geometría, errores, teclado y tres presentaciones de matching en harness de renderers | PASS local | browser-checks.json, browser-check.cjs |
| Preservación desde inicio de T030 | 734/752 intactos; 18 cambios previstos; ningún archivo eliminado | preservation-final.json |
| Preservación desde autorización | 643/664 intactos; 21 cambios previstos; ningún archivo eliminado | ampliacion/preservation.json |
| git diff --check | PASS | ampliacion/diff-check.txt |

El navegador real solo sustituye la identidad de cookie de prueba, firma/descarga del almacenamiento privado y PNG sintético. Los manifiestos, estado, respuestas, transición accesible, permisos, grading y persistencia pasan por el BFF/API reales. Comprueba 360×800, 390×844, 768×1024 y 1440×900, imagen a 200 %, selección estable, sin overflow de página; respuesta en borde guardada una vez; feedback, cierre y recargas; variante texto reanudada, sin actividad completada/evidencia espacial; labeling incorrecto con modalidad image; matching por teclado, 75 % parcial/score0/modality table; origen de mutación ajeno 403 y cuenta ajena 404. Axe tiene cero serious/critical en labeling móvil ampliado y en los estados de renderers inspeccionados.

Los eventos de clic redondean a píxeles CSS; la comparación con el punto solicitado permite 1.1 px sobre el rectángulo real. Zoom/resize conservan exactamente el punto elegido y las pruebas puras usan coordenadas exactas. No cambia el umbral del servidor. Las capturas reales están en ampliacion/hotspot-real-desktop.png, labeling-real-mobile.png y alternative-return-real.png; se inspeccionaron desktop y móvil. La captura fullPage incluye el chrome fijo de AppShell en su posición de scroll; no acredita una auditoría visual global del shell.

Se conservan diagnósticos: CSP inicial bloqueaba la imagen y axe detectó el área ampliada sin foco, ambos corregidos; browser-real-before-scroll-fix.json registra el segundo. La ejecución simultánea con Next frío produjo un timeout de 5 s en la regresión heredada de segmentos (api-focused-concurrent.txt); la misma prueba pasó aislada 12/12 y la suite final pasó 69/69 ejecutada después de cerrar los servidores, sin cambiar timeouts ni assertions. El cierre FAIL anterior se conserva en ampliacion/README-before.md y result-before.json.

## Reproducción

Usar Node 24.19.0 y pnpm.cmd del workspace; no instalar/actualizar dependencias.

    pnpm.cmd --filter @cediah/contracts build
    pnpm.cmd --filter @cediah/api exec vitest run test/guided-v2-images.test.ts test/guided-v2-contract.test.ts test/guided-v2-case.test.ts test/guided-v2-grading.test.ts test/guided-v2-attempts.test.ts test/guided-v2-routes.test.ts test/guided-v2-security.test.ts
    pnpm.cmd --filter @cediah/web test
    pnpm.cmd --filter @cediah/api typecheck
    pnpm.cmd --filter @cediah/web typecheck

Para navegador real, en una terminal definir T030_BROWSER_HOLD=true y ejecutar node apps/api/node_modules/vitest/vitest.mjs run --config docs/aprendizaje-guiado/v2/evidencias/T030/ampliacion/vitest.http.config.mts; usa PGlite fresco y escucha solo 127.0.0.1:41030. En otra, desde apps/web, definir API_BASE_URL=http://127.0.0.1:41030 y NEXT_PUBLIC_CONTENT_STORAGE_ORIGIN=https://t030-media.example.test y ejecutar Next dev con puerto 31030/webpack. Desde la raíz ejecutar node docs/aprendizaje-guiado/v2/evidencias/T030/ampliacion/browser-real.cjs. Finalizar con POST JSON {} a /__test/stop del servidor aislado y detener Next. Esos controles existen únicamente en el harness, no en la API del producto. Los procesos creados se cerraron al terminar.

## Límites

PASS **local**, sin credenciales S3 ni descarga real del bucket; no verifica emisión de sesión Better Auth, PostgreSQL independiente (19 SKIP), concurrencia entre conexiones, lector de pantalla/zoom nativo, recorrido integral T035/T037, Hito S, eficacia clínica/editorial ni producción. El timeout T024 y upgrade pendiente T021 siguen abiertos con su evidencia anterior; este trabajo no los acredita resueltos. No hubo commit, despliegue ni cambios de datos productivos. Se detiene antes de T031.
