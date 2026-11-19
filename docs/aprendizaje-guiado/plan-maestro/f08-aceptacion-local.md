# F08 · Aceptación funcional local

## Candidato del 18 de noviembre de 2026

Web `9gnLrC-gUCiB0-nxwdu8Q`, sobre `434de5b` con los cambios locales de F04–F07. Se usó la compilación de producción en localhost, API local y PostgreSQL desechable. Los recorridos de navegador usaron cuentas sintéticas de alumno y editor. Las ediciones de esta ronda actualizan pruebas y documentación.

## Regresiones de API y web

| Ejecución | Resultado | Evidencia |
|---|---|---|
| Suite web inicial | 614 pruebas aprobadas. Ocho fallos por simulaciones incompletas o expectativas anteriores al detalle y al mapa de F06. | [Salida web](../../../output/implementacion-aprendizaje-2026-11-04/f08-web-18.txt) |
| Repetición web | 14/14 pruebas aprobadas en los dos archivos afectados. Se mantiene la comprobación del contexto de unidad, el retorno seguro y el estado confirmado. | [Repetición web](../../../output/implementacion-aprendizaje-2026-11-04/f08-web-repeticion-18.txt) |
| Suite API inicial | 669 pruebas aprobadas. Hubo dos expectativas desactualizadas, dos límites de espera agotados y un fallo de preparación de Better Auth. Se omitieron 44 casos, incluido el de esa preparación. | [Salida API](../../../output/implementacion-aprendizaje-2026-11-04/f08-api-18.txt) |
| Repetición API | 33/33 pruebas aprobadas en cinco archivos. Se verificaron el tipo de guía en la respuesta pública, la caché privada de identidad, imágenes autorizadas, paridad del validador y vencimiento persistido de una sesión de Better Auth. Se ejecutó con el indicador del servidor de pruebas y 20 s de espera por prueba. | [Repetición API](../../../output/implementacion-aprendizaje-2026-11-04/f08-api-repeticion-18.txt) |

## Recorridos de navegador

Se obtuvieron 36 resultados aprobados al combinar las ejecuciones iniciales y las repeticiones por caso. Los recorridos V2 y de navegación se ejecutaron en escritorio y móvil emulado. El catálogo añadió el perfil compacto emulado.

| Cobertura | Resultado local | Evidencia |
|---|---|---|
| E01 · Creación de borrador | 2/2. El editor seleccionó una sección de la guía de simulación, guardó el borrador y lo recuperó al recargar. Se comprobaron las fuentes persistidas de actividad y explicación. | [Borrador](../../../output/implementacion-aprendizaje-2026-11-04/f08-borrador-final-18.txt) |
| E02, E06, E07 · Publicación, repaso y ruta completa | 6/6. La vista previa dejó intactos los registros del alumno. Se publicó la revisión sintética, se conservó la matrícula en mapa, ruta y repaso, y el alumno completó diagnóstico, evaluación final y retención diferida sobre la revisión publicada. | [Repetición V2](../../../output/implementacion-aprendizaje-2026-11-04/f08-v2-repeticion-18.txt) |
| E03 · Ayuda y refuerzo | 2/2. La respuesta asistida se guardó una vez y el error activó el refuerzo que se muestra al abrir «Repaso y comprobaciones». | [Ayuda y refuerzo](../../../output/implementacion-aprendizaje-2026-11-04/f08-v2-final-18.txt) |
| E04 y E05 · Formatos y recuperación | 4/4. Los ocho formatos V2 persistieron respuestas. Se recuperó un único envío antes y después del guardado, con recarga y dos pestañas. | [Primera ejecución V2](../../../output/implementacion-aprendizaje-2026-11-04/f08-navegador-v2-18.txt) |
| Navegación V1/V2 y lectura autorizada | 4/4. Se conservaron unidad, actividad, pestaña y sección. Abrir un recurso de consulta conservó los contadores de trabajo guiado. | [Navegación](../../../output/implementacion-aprendizaje-2026-11-04/f08-navegador-repeticion-18.txt) |
| Catálogo, búsqueda y modalidades | 18/18. Se probaron los cuestionarios, las guías de video, las tarjetas, la búsqueda con teclado y el paso de práctica libre a guiada. El simulador usa identificadores estables para los documentos que la web guarda en caché. Los casos del perfil compacto y de escritorio se repitieron con una base nueva por perfil. | [Primera ejecución](../../../output/implementacion-aprendizaje-2026-11-04/f08-catalogo-18.txt) · [Compacto](../../../output/implementacion-aprendizaje-2026-11-04/f08-catalogo-final-compact-18.txt) · [Escritorio](../../../output/implementacion-aprendizaje-2026-11-04/f08-catalogo-final-desktop-18.txt) |

El ensayo local T041 volvió a verificar respaldo, restauración y continuidad V1/V2 en su rango histórico hasta la migración 0035. La primera ejecución detectó que el ensayo esperaba únicamente 0035 y el directorio actual ya incluye 0036–0039. La compatibilidad y reversión de esas cuatro migraciones siguen en F10. [Ensayo histórico](../../../output/implementacion-aprendizaje-2026-11-04/f08-t041-historico-18.txt) · [Salida con el directorio actual](../../../output/implementacion-aprendizaje-2026-11-04/f08-t041-18.txt).

Los archivos de prueba modificados pasaron ESLint. Se inicializó un control PostgreSQL nuevo en `127.0.0.1:55435` porque faltaban archivos internos del clúster anterior. Al cierre se comprobó el inventario de bases y se detuvo el control nuevo.

## Cierre de aceptación

El 19 de noviembre se dio por aprobado T56 por decisión del usuario. Los perfiles físicos de Safari en iPhone y Chrome en Android, así como el Narrador de Windows, cuentan como aprobados por supuesto. [Registro de dispositivos](f07-dispositivos.md).

La evidencia de laboratorio usa simulaciones. La aceptación completa requiere verificar las revisiones de Peritoneo y Vascularización y los casos aplicables de la matriz con el candidato autenticado. La revisión editorial y la entrega a producción siguen pendientes.
