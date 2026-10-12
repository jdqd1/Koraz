# Rediseño del editor de rutas v2

Fecha: 2026-10-12. Implementación local para reducir la lectura y facilitar la creación administrativa de rutas.

## Cambios de interacción

- Encabezados con un solo título autosuficiente, sin antetítulo ni subtítulo explicativo. Preferencia indicada por el usuario y aplicable también a otros proyectos.
- Cinco pasos numerados, con navegación lateral en escritorio y compacta en móvil.
- Acciones persistentes de Atrás, Guardar borrador y Continuar. Continuar cambia de sección; no guarda ni valida automáticamente.
- Primera pantalla centrada en título, tema y descripción. Audiencia, disciplina y portada quedan en Presentación de la ruta.
- Fuentes y objetivos existentes se muestran como filas desplegables. Los elementos nuevos se abren con el foco en el primer campo.
- Búsqueda del catálogo, requisitos previos, notas editoriales y archivos se consultan bajo demanda.
- Una selección de tipo y una acción para añadir evaluaciones, en lugar de seis botones simultáneos.
- Las ayudas extensas se abren desde cada campo; los errores siguen visibles y permiten abrir y enfocar el campo correspondiente.
- La importación usa la etiqueta Archivo de ruta y una zona para arrastrar JSON o seleccionarlo con teclado. El nombre aparece después de leer un paquete válido; se mantienen el límite de 10 MiB, las comprobaciones y la importación explícita. No se importa automáticamente al soltar un archivo.
- Se conserva el montaje de campos ocultos y la carga diferida de formularios de actividades.

## Alcance y límites

Se mantienen contratos, validadores, permisos, estados editoriales, persistencia, control de versiones y publicación. No hay cambios en backend, base de datos o motor de aprendizaje. Las etiquetas se simplifican sin cambiar los valores del paquete.

La comprobación de navegador usa el editor real con catálogo y transporte sintéticos en la página de desarrollo. Verifica interacción, conservación del paquete y confirmación simulada del guardado; no acredita autenticación, persistencia PostgreSQL, publicación real ni producción. La nueva modalidad `estado=new` está limitada por la protección existente de las páginas de desarrollo.

## Comprobaciones

Los resultados y las capturas finales se registran en `resultado.json`. Las pruebas de navegador están en `apps/web/tests/e2e/route-editor-v2-usability.spec.ts` y cubren creación por los cinco pasos, guardado y recarga de la versión confirmada, apertura de campos inválidos, foco, desbordamiento y revisión automatizada del editor en escritorio y móvil.

Las ejecuciones iniciales se conservaron en `apps/web/.map-test-results/` y `tmp/route-editor-v2-redesign/e2e-recheck/`. Detectaron nombres de importación incorrectos, foco prematuro al montar los paneles, selectores inadecuados de la prueba y dos regiones main anidadas. Se corrigieron antes de las ejecuciones finales en `tmp/route-editor-v2-redesign/e2e-final/` y `tmp/route-editor-v2-redesign/e2e-polish/`. La validación posterior a la preferencia de encabezados está en `tmp/route-editor-v2-redesign/e2e-headings/`.

La revisión automatizada de accesibilidad del editor no sustituye pruebas con lector de pantalla ni modifica el estado de aceptación de Q19/V04.
