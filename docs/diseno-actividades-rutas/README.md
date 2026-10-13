# Actividades por unidad

Rediseño local del 13 de octubre de 2026 para el detalle de las rutas guided-v2 y su panel en el mapa. Al abrir una unidad, el estudiante puede identificar sus objetivos, consultar las actividades correspondientes y continuar con una actividad autorizada de esa unidad. La ruta completa abre inicialmente la unidad de la recomendación del servidor.

## Interfaz

- Pestañas **Actividades** y **Recursos**, compartidas por el panel y la ruta completa, con navegación por teclado.
- Jerarquía unidad → objetivo → actividades. Cada actividad muestra formato, fase y estado. Las ya completadas o cubiertas quedan en un desplegable.
- Actividad recomendada con la etiqueta **Ahora**, un acento azul y una sola acción principal fija en el pie del panel móvil.
- Avance de actividades por unidad, separado del progreso general. Abrir o desplegar contenido no acredita progreso.
- Progreso general separado en **Actividades**, **Lo aprendido** y **Repaso con el tiempo**, con estados breves, iconos y explicación opcional.
- Los objetivos usan **Por aprender**, **En práctica**, **Comprobado** y **Por reforzar**. El mapa usa etiquetas breves en lugar de una frase truncada.
- Recursos asociados a la unidad, con referencias y localizadores. Solo se ofrece un enlace cuando la fuente tiene una URL real.
- Fechas ISO de las recomendaciones formateadas en la zona correspondiente, conservando el instante original en `datetime`.

## Datos y límites del cambio

El DTO público anterior solo tenía unidades y objetivos. Se añadieron campos opcionales de presentación:

- `units[].activities`: clave, objetivo principal, formato, fase, obligatoriedad y tipo de lectura cuando corresponde.
- `units[].resources`: título, cita, localizador y URL de las fuentes asociadas.
- `activityProgress`: consumo confirmado por actividad, proyectado desde los mismos hechos que usa el progreso general.
- `nextActionContext`: unidad y objetivo de la acción recomendada, incluida la sesión pendiente.

La proyección conserva el orden editorial de las actividades y excluye preguntas reservadas para diagnóstico, evaluación final y retención, así como pasos internos de los casos. No expone enunciados, cuerpos, soluciones, rúbricas, retroalimentación anticipada, bindings ni hashes privados. La API y la web deben incorporar estos campos en la misma entrega. La nueva web también puede leer respuestas históricas que los omitan, mostrando la ausencia de datos sin inventar estados.

Las reglas de selección, evaluación, acceso, inscripción, progreso, repaso, versiones y persistencia permanecen vigentes. La apertura usa `RouteAction`, la versión matriculada y la autorización del servidor. Una sesión pendiente se retoma antes de iniciar otra actividad. Cuando el siguiente paso corresponde a otra unidad, el panel lo identifica. No se editó el contenido editorial ni se migraron datos.

El esquema portable de creación de rutas y su validador no se modificaron. Los manifiestos históricos de aceptación T042–T046 no se actualizan mediante este rediseño; esta entrega no acredita una nueva aceptación formal.

## Validación local

| Comprobación | Resultado | Evidencia |
| --- | --- | --- |
| Contratos compilados | PASS | `pnpm.cmd --filter @cediah/contracts build` |
| Pruebas web enfocadas | PASS, 104 pruebas distintas | Modelo, currículo, mantenimiento, jugador, adaptador del mapa, transporte, servidor, composición y página de repaso |
| API, contratos y evidencia | PASS, 61 pruebas distintas | `guided-v2-contract`, `guided-v2-routes` y `guided-v2-evidence`; integración con PGlite |
| Navegador, nueva interfaz | PASS, 7 pruebas | `v2-route-curriculum.spec.ts`: 320/390/768/1440 px, recursos, teclado, apertura de actividad y estado ausente |
| Regresión del mapa y del panel anterior | PASS, 6 pruebas | Tres recorridos existentes en Chromium escritorio y móvil |
| Accesibilidad de ruta y panel nuevos | PASS, 0 incidencias detectadas | `accessibility-route.json`, `accessibility-panel.json` |
| TypeScript web/API | PASS | `typecheck` en ambos paquetes |
| ESLint enfocado | PASS | Archivos de esta entrega, sin advertencias |
| Espacios y conflictos de parche | PASS | `git diff --check` |

Las pruebas de API verifican que una lectura del estado no añade respuestas o eventos, que el consumo de una actividad se refleja en su unidad y que los metadatos públicos no filtran contenido reservado. La prueba de navegador de apertura inspecciona el destino enviado por el botón de continuar, la versión de inscripción y el retorno a la unidad; su respuesta de sesión está interceptada. Esto no equivale a una sesión autenticada de producción ni a PostgreSQL independiente.

### Correcciones durante la verificación

- Primera corrida web: 102 PASS / 1 FAIL. Una expectativa histórica prohibía cualquier etiqueta «Completada», incluso en actividades cuyo consumo ya estaba confirmado. Se ajustó para comprobar que el objetivo con refuerzo mantiene ese estado; el conjunto quedó verde.
- Primera corrida API: 60 PASS / 1 FAIL. El caso sintético nuevo tenía una sola etapa y el contrato exige al menos dos. Se completó el fixture y se comprobó la exclusión de ambas actividades internas.
- Primera corrida de navegador: 2 PASS / 5 FAIL. Se corrigió la preparación de los recorridos para abrir la unidad desde su botón y esperar la hidratación antes de pulsar las teclas.
- Segunda corrida: 6 PASS / 1 FAIL. La expectativa de restauración de foco asumía un modal a 768 px, donde se usa panel lateral. La comprobación se vinculó al modal realmente mostrado. Corrida final: 7 PASS.
- Axe detectó dos incidencias moderadas por un `main` anidado en el shell. El contenido de la ruta usa ahora `article`; el resultado final es cero incidencias en las dos superficies nuevas.
- La vista de prueba devolvió inicialmente 404. Se reinició el servidor con `NODE_ENV=development` explícito, sin editar archivos de entorno. Se conserva la advertencia de CSS preexistente sobre `::highlight(koraz-editor-interactive-terms)`, ajena a este cambio.

## Capturas

- [Unidad en móvil, 390 px](unidad-390.png)
- [Unidad compacta, 320 px](unidad-320.png)
- [Unidad en tableta, 768 px](unidad-768.png)
- [Panel en escritorio, 1440 px](unidad-1440.png)
- [Recursos en móvil](recursos-390.png)
- [Ruta completa en móvil](ruta-390.png)

La demostración utiliza datos sintéticos de desarrollo. No se desplegó esta entrega ni se verificó un cambio en `koraz.app`.
