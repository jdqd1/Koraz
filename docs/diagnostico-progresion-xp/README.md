# Avance, diagnósticos y XP

Validación retomada el 18 de octubre de 2026. Implementación inicial: `9ba7adf`.

## Problema y comportamiento

La selección de actividades aplicaba a la práctica la espera de 24 horas que protege la evidencia de dominio. Un banco ya consumido podía quedarse sin trabajo nuevo; además, exigir la evaluación de toda una unidad para abrir un objetivo dependiente dentro de esa misma unidad generaba una dependencia circular.

La práctica puede volver a ofrecerse tras diez minutos. La evidencia independiente y espaciada sigue sus reglas de dominio y retención. Una evaluación de unidad fallida puede repetirse cuando sus familias vuelven a ser elegibles. El mapa ofrece el trabajo pendiente o el diagnóstico disponible de la unidad elegida antes de un repaso rutinario; conserva la prioridad de una sesión abierta y del refuerzo o evaluación de esa unidad.

## Acceso por diagnóstico

- Los XP acumulados habilitan el diagnóstico: 20 XP por cada objetivo previo pendiente, sin gastar puntos.
- El diagnóstico de acceso utiliza dos recuperaciones y una aplicación de familias distintas por conocimiento previo, tomadas del banco existente de práctica. Excluye las reservas finales y de retención y los hijos de casos.
- Hay que responder correctamente sin ayuda a todas las preguntas. La corrección se muestra al terminar el examen completo.
- Aprobar abre solo el objetivo elegido. No otorga dominio, no completa sus actividades previas y no elimina los repasos. Fallar identifica los conocimientos que necesitan refuerzo.
- Un error crítico abierto o un banco insuficiente impiden el acceso; el servidor conserva la decisión y el historial. El diagnóstico inicial sigue siendo opcional y puede encontrarse aunque se haya omitido.

## Puntos visibles

El mapa, la ruta y la sesión muestran los puntos confirmados por el servidor. Se mantienen los premios existentes de 5 XP por primera recuperación correcta, 10 por primer dominio y 15 por primera consolidación. Una repetición correcta y sin ayuda da hasta 5 XP al corregir un error anterior o hasta 2 XP al mantener un acierto, con diez minutos de separación, una recompensa por familia y día y un máximo de 20 XP extra diarios. El saldo, el premio recibido y los puntos que faltan para el diagnóstico se muestran en la interfaz.

Se conservaron los principios de recuperación activa, práctica espaciada, prerrequisitos, aplicación y retroalimentación descritos en las páginas 9–11 del PDF de investigación aportado. El documento se utilizó como referencia de producto.

## Evidencia

| Nivel | Resultado |
| --- | --- |
| API: rutas, selección, intentos, evidencia y métricas | 144 pruebas pasaron; 12 omitidas por requerir otros entornos de concurrencia |
| Integración con PostgreSQL desechable real | 5 pruebas pasaron |
| Componentes y clientes web relacionados | 77 pruebas pasaron entre la ejecución de cuatro suites y la ejecución final de currículo |
| Navegador, móvil y escritorio | 4 pruebas pasaron: aprobar/fallar, acceso posterior, recarga, saldo conservado, ausencia de dominio y actividades ficticias, sin desbordamiento horizontal |
| Compilación web y tipos API | Correctos; aviso CSS previo de `::highlight` ajeno a este cambio |
| Cuenta real antes del ajuste final del botón | Se observaron el saldo, una actividad pendiente disponible y el diagnóstico de acceso a Sistema porta hepático. No se enviaron respuestas con la cuenta del usuario |

El primer intento de navegador falló por una espera incorrecta de la prueba antes de inscribirse; se corrigió para esperar el botón y la respuesta de inscripción. La ejecución final completa pasó. Los artefactos de navegador generados quedan locales y separados de las evidencias anteriores de aceptación. Estas comprobaciones no equivalen a una validación de un dispositivo físico ni a una nueva aceptación formal del contenido.
