# T037 — UX y accesibilidad visual

Estado de cierre: **PASS local**, con inspección de lector de pantalla **NO VERIFICADO**. Fecha: 2026-10-06.

Solicitud: «continua con t037», retomada con «continua» el 2026-10-06. Base: `11737fd84562ee5a65e9ef124442b82f9aa16785`. Alcance exclusivo de T037; T038 no iniciada.

## Entorno y alcance

- T035 y T036 tienen evidencia local PASS en sus respectivas carpetas. La dependencia formal de T037 es T035.
- Node 24.19.0 y pnpm 11.19.0 existentes; no se instalaron ni actualizaron dependencias.
- Next compilado, BFF y Fastify reales, PostgreSQL independiente y desechable en loopback; fixtures sintéticos. El adaptador de identidad de T035 usa cookies de prueba: esto no verifica emisión ni firma de cookies de Better Auth.
- Chromium: 1440×900, 360×800, 390×844 y 768×1024. Zoom CSS al 200 % adicional. Zoom nativo al 200 % en un perfil temporal de Edge, con extensión local que solo ajusta el zoom de la pestaña del fixture; no se modifica el perfil del usuario. Se comprueba `innerWidth=720`, `innerHeight=450`, DPR=2 y zoom CSS=1.
- Sin despliegue, commit, cambios de API/contratos ni reglas pedagógicas. `baseline-hashes.json` registra 1921 archivos preexistentes; `preservation.json` verifica la allowlist. Se revirtió el cambio automático de `next-env.d.ts` causado por la compilación.

## Correcciones del producto

| Hallazgo observado | Corrección local |
| --- | --- |
| Sidebar compacta con enlaces sin nombre accesible y botón de grupo sin nombre | Nombres explícitos en enlaces de navegación, grupo y acceso. |
| Diálogo de salida con cambios: Escape no devolvía el foco al enlace que lo abrió | Guardar el disparador y restaurar su foco al cerrar el diálogo. |
| Mapa con `main` anidado dentro del `main` de la aplicación | Región `section` con nombre «Mapa de aprendizaje». |
| Reproductor independiente sin landmark principal | Contenedor `main` para alumno; preview conserva contenedor `div` y región existente «Sesión de aprendizaje». |
| Texto de carga del mapa con contraste 4.44:1 sobre su fondo | Ajuste local del texto secundario del mapa. |
| Etiquetas de navegación móvil con contraste aproximado 3.9:1 al activar el layout móvil mediante zoom | Ajuste del color secundario de esos enlaces y su regla final de cascada. |
| Selector de perfil de preview conservaba ancho intrínseco: página de 427 px en viewport 360 px con escala CSS 200 % | Etiqueta en grid y selector limitado al ancho disponible dentro del editor v2, conservando altura operable. |
| La barra sticky de guardar tapaba la parte inferior del campo enfocado con zoom nativo al 200 % | En viewports de altura ≤600 px, la barra queda en el flujo del editor. La repetición comprueba centro y cuatro esquinas del campo. |
| Los seis botones de añadir evaluaciones desbordaban la página de 768 px hasta 829 px | Envolver la fila de acciones del editor v2 con `flex-wrap`, sin modificar sus operaciones. |
| La navegación inferior tapaba «Ajustar vista» en el mapa a 768 px | Reservar el espacio inferior hasta 960 px, coincidiendo con la aparición de esa navegación. La pulsación real pasa en los cuatro viewports. |
| La navegación inferior quedaba por encima de los botones del diálogo v2 | Capas locales de overlay/contenido superiores a la navegación. Se comprueban los tres centros alcanzables, cancelación con puntero, Tab y Escape. |
| Cabecera de preview móvil y título del alumno al 200 % dividían palabras letra por letra | CSS del reproductor v2 con filas flexibles según el espacio real; comprobación de líneas y ausencia de solapamiento al ampliar. |
| Etiquetas de navegación inferior se solapaban al ampliar al 200 % | Permitir ajuste de palabras dentro de cada destino móvil. |

Archivos de producto: diez preexistentes modificados y `player.module.css` nuevo, detallados en `source-hashes.json`. Test nuevo: `apps/web/tests/e2e/guided-v2-accessibility.spec.ts`.

## Validación

La matriz audita la página completa con axe, sin exclusiones; guarda capturas de viewport y página completa, árbol accesible Chromium y geometría. Recorre las cinco secciones del editor, las ocho actividades, ruta del alumno, Hoy, mapa/lista, repaso vacío, carga, error de conexión, reintento y feedback. Prueba selección táctil, letterboxing, conservación de coordenadas al ampliar, flechas, alternativa de texto, tabla, secuencia, navegación Tab y foco del diálogo.

Regresiones ya comprobadas: 482 pruebas web en 62 archivos; después de las correcciones de mapa/diálogo, 135 pruebas de editor/mapa en 12 archivos; después del contenedor del reproductor, 112 pruebas de v2 en 10 archivos. No se suman como pruebas distintas: las suites se solapan.

Compilación final: `build-web-header-final.txt`, PASS. Contratos: `contracts-build.txt`, PASS. Tipos y lint: `typecheck-final-state.txt` y `lint-final-state.txt`, PASS. `checks-exits.json` registra los códigos de salida comprobados. `git diff --check`, PASS.

## Intentos iniciales y ajustes del test

Los artefactos iniciales se conservaron fuera de `browser-artifacts/`. No forman parte del resultado final.

- Se esperaban eventos antes de hidratar; se corrigió la espera de handlers/heading con foco.
- El test de loading esperaba una etiqueta incorrecta y desmontaba el interceptor antes de terminar `route.continue`; ahora espera el texto real y termina los handlers antes de retirar la ruta.
- Intentar otra actividad después de un error CORE obtuvo 409 correctamente. El test ahora verifica desconexión, reintento, carga y feedback en la misma respuesta; no evita el refuerzo exigido por el servidor.
- La medición instantánea tras enfocar en zoom nativo ocurría durante el desplazamiento suave. Se espera a que el centro del campo quede alcanzable; se guarda geometría y elemento alcanzado.
- Playwright conserva un viewport de dispositivo aunque el zoom nativo cambie el viewport CSS. La captura nativa usa los límites reales mediante CDP, sin redimensionar la página ni duplicar el recorte.
- El fixture común enlaza la alternativa de imagen a una actividad con representación `case`; el motor la rechaza correctamente como alternativa de texto/tabla. El test configura `short-1` mediante el editor, guarda el borrador y comprueba el desvío accesible con el motor real.
- La primera comprobación del tamaño del botón de preview midió durante la sustitución asíncrona de la sesión y recibió `null`; ahora espera el título específico de la actividad seleccionada y la visibilidad del botón antes de medir.
- La espera del caso progresivo omitía el prefijo de la etapa en su título accesible. Se corrigió el selector; se conservó el intento interrumpido en `case-heading-initial-artifacts/` y se reinició la matriz completa, cerrando antes su base y sus procesos de prueba identificados.
- La primera medición de líneas ampliadas intentó convertir `line-height: normal` a número y recibió `NaN`. Se sustituyó por los rectángulos de las líneas renderizadas; se repite la galería de los proyectos afectados, conservando el informe completo previo.
- El proceso ya había cargado el test al iniciar, por lo que sus cuatro proyectos conservaron la medición anterior. La repetición arranca un proceso nuevo. Usa dos workers solo para estas galerías y el mapa afectado: las galerías leen el borrador sin modificarlo, el servidor separa previews por `previewId`, y los actores del alumno son distintos por proyecto; no se paralelizan pruebas que editan ese borrador común.
- Una lectura instantánea tras volver en el mapa encontró dos animaciones todavía en ejecución. La repetición conserva sus elementos, propiedades y tiempos, y espera de forma acotada (máximo 2 s) que terminen antes de exigir cero animaciones; no se desactiva ninguna mediante el test.

## Límites explícitos

**Lector de pantalla: NO VERIFICADO.** Se conserva `screen-reader.json`. No se realizó inspección de salida hablada de Narrator/NVDA/JAWS. La automatización disponible permite navegador, no control nativo del lector. Axe y el árbol accesible no sustituyen esa inspección ni certifican WCAG completa.

La imagen es un píxel sintético para probar el área contenida, coordenadas, ampliación y modalidad alternativa; no demuestra legibilidad de una ilustración clínica real. Los viewports móviles y el touch se emulan: no se probaron dispositivos físicos. No se validan contenido clínico, Hito S, staging, producción ni la ficha T038.

## Resultado final y checklist

La matriz consolidada por caso/proyecto terminó con **18 PASS, 3 SKIP intencionales y 0 FAIL pendientes**. El recorrido completo de 21 casos (`closure-playwright.json`) registró 13 PASS, 3 SKIP y 5 FAIL; la repetición de las pantallas afectadas (`reflow-recheck-playwright.json`) terminó con 5 PASS y 0 FAIL. Los informes originales se conservan; `browser-matrix-summary.json` muestra el historial y el último resultado de cada caso. Los tres SKIP corresponden al zoom nativo, ejecutado una vez en desktop Edge.

La [galería](gallery.html) contiene **135 pantallas auditadas y 270 capturas PNG**, con informes axe de página completa, árbol accesible y geometría. Resultado: **0 serious/critical y 0 desbordes de página**. La revisión visual de capturas por Codex se detalla en `visual-review.json`; no constituye aprobación humana.

| Criterio | Resultado |
| --- | --- |
| V01 | PASS: axe completo, sin exclusiones. |
| V02 | PASS: teclado, persistencia E01, diálogo y devolución de foco; botones alcanzables. |
| V03 | PASS: cuatro viewports, zoom CSS/nativo, campos y cabeceras legibles sin solapamiento. |
| V04 | Árbol accesible PASS; lector de pantalla **NO VERIFICADO**. |
| V05 | PASS: touch/puntero, letterboxing, coordenadas, zoom de imagen, flechas y alternativa de texto. |

[Checklist detallado](CHECKLIST.md) · [Resultado estructurado](result.json). Las regresiones finales de editor/mapa (135/12 archivos) y reproductor (112/10 archivos) pasan; se solapan con las 482 pruebas amplias iniciales y no se suman. Los 1911 archivos preexistentes fuera de los diez cambios autorizados conservaron su hash; se añadió un CSS local de v2. Las bases identificadas de esta ficha se eliminaron mediante el cierre cooperativo del servidor de pruebas; se verificó su ausencia, cero conexiones cliente y el apagado del clúster desechable. Los puertos de los tres servicios de prueba quedaron libres. No se borraron bases ajenas.

**T038 no iniciada.**
