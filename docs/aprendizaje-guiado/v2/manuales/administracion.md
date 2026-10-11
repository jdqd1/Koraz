# Administración de rutas guided-v2

Entrega T046, 10/10/2026, America/Caracas. Procedimiento de uso basado en los componentes actuales y la evidencia local; disponibilidad en producción NO VERIFICADA. Consulta el [estado de entrega](../entrega/README.md) y el [acta final](../acta-HITO-K.md).

## Crear o corregir una ruta

1. Abre `/panel/rutas` con una cuenta autorizada. Para crear, entra en `/panel/rutas/nueva` y selecciona el editor v2 disponible. Para modificar un borrador, abre su ruta existente. Una matrícula v1 no se transforma en v2 por abrir el editor.
2. En **Datos y fuentes**, completa título, resumen, tema, disciplina y audiencia. Selecciona las guías y sus revisiones; comprueba fragmentos, encabezados, huellas, bibliografía y archivos. Cambiar una guía exige localizar y verificar nuevamente su fragmento.
3. En **Objetivos**, redacta capacidades observables, asigna criticidad y prerrequisitos necesarios. CORE es requerido; el orden visual no crea dependencias. Corrige ciclos y referencias faltantes señalados por el editor.
4. En **Recorrido**, agrupa unidades e incorpora explicación, recuperación, elaboración y aplicación. Escoge el formato que evalúe la capacidad. Feedback y distractores deben estar sustentados por fuentes. Pistas y respuestas libres formativas no acreditan dominio.
5. En **Evaluación y repaso**, comprueba diagnóstico optativo, gates, checkpoints, final y reservas diferidas. Incluye todos los objetivos requeridos en el repaso. Conserva familias exclusivas para las reservas; no reutilices soluciones expuestas en aprendizaje.
6. Guarda y verifica que el editor confirme **Sin cambios pendientes**. En **Revisión**, pulsa **Validar contenido** y atiende las incidencias mediante el campo indicado. La revisión del servidor incluye vínculos y permisos; la cobertura local es preliminar.

Para una ruta generada por la skill, utiliza el [manual de importación](importacion.md). El JSON editorial contiene soluciones privadas: destínalo al importador y a revisores autorizados.

## Previsualizar, revisar y publicar

Utiliza la vista previa editorial disponible para comprobar enunciados, pistas, respuestas, feedback, remediación y secuencias. La vista previa es un recorrido de autoría: no crea matrícula ni concede progreso de alumno. Verifica también teclado, móvil, zoom y estados de error; la inspección hablada pendiente del proyecto se registra en el acta.

Con el borrador guardado y las incidencias atendidas, el creador usa **Enviar a revisión**. Un revisor autorizado coteja todas las afirmaciones CORE y casos, la muestra exigida de los demás ítems, fuentes/localizadores, reservas, derechos y alternativas de imágenes. Ante errores usa **Solicitar cambios**; registra correcciones y el hash revisado. La aprobación de una guía anterior o de otro paquete no aprueba este contenido.

Solo cuando esa revisión corresponde al contenido confirmado, el rol autorizado usa **Aprobar revisión** y, separadamente, **Publicar ruta** → **Confirmar publicación**. La API decide permisos y vigencia; el botón disponible no reemplaza la revisión científica. `publishable:true` del validador portable tampoco constituye autorización.

La versión publicada queda inmutable. Usa **Crear nueva versión** para modificarla; revisar y publicar de nuevo conserva las matrículas fijadas a su versión. Editar un borrador aprobado invalida su aprobación. No fuerces adopción de v2 ni transfieras porcentajes v1 a dominio v2.

## Exportación y conflictos

Guarda primero; **Exportar paquete** descarga el contenido confirmado y **Descargar cobertura** entrega su reporte. La aprobación interna no se exporta como autoridad para otro sistema. Conserva archivo, revisión y hash en la entrega editorial.

Si aparece un conflicto por otra pestaña, conserva una exportación o copia local y vuelve a leer la revisión del servidor. Decide explícitamente qué contenido mantener antes de guardar; no sobreescribas soluciones, fuentes o progreso con un merge automático. Ante error de red después de importar, reintenta la confirmación de la operación registrada según el aviso, evitando crear una ruta distinta.

## Límites de esta entrega

El piloto T039 tiene revisión sobre su hash original. El nuevo piloto de T045 conserva dos incidencias y permanece como borrador; no recibió esa aprobación. T045 acredita un recorrido sintético por HTTP/PostgreSQL, con navegador pendiente. Q19/V04 sigue NO VERIFICADO y aplazado por el usuario. La operación cloud se prepara en el [runbook](../runbook.md); este manual no registra un despliegue.
