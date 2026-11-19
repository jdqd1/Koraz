# F07 · Registro de aceptación de T56

**T56 aprobado por supuesto al 19 de noviembre de 2026.** El usuario indicó dar por aprobados los recorridos en iPhone y Android físicos. El 18 de noviembre pidió asumir el funcionamiento con el Narrador de Windows. La decisión de alcance cubre T56 para F07 y F08.

| Perfil | Aceptación | Ejecución registrada |
|---|---|---|
| Safari en iPhone físico, VoiceOver | Aprobado por supuesto · 19 de noviembre | Sin ejecución |
| Chrome en Android físico, TalkBack | Aprobado por supuesto · 19 de noviembre | Sin ejecución |
| Escritorio con Narrador | Aprobado por supuesto · 18 de noviembre | Se abrió la ruta de simulación en Windows 11 y Edge 157.0.4341.60 con el candidato `9gnLrC-gUCiB0-nxwdu8Q`. El recorrido se interrumpió antes de verificar anuncios o foco. |

La regresión automatizada de respuesta breve, resultado y regreso a la actividad pasó en los diez tamaños previstos con la misma compilación y PostgreSQL desechable. [Mediciones de geometría y foco](../../../work/f07/browser-t56-desktop-regression/guided-learning-availabili-eea8d-rable-across-priority-sizes-desktop/answer-geometry.json).

## Protocolo manual de referencia

Para una ejecución manual, registrar URL y revisión del candidato, fecha y zona horaria, rol, ruta y revisión, modelo del dispositivo, versiones de sistema, navegador y tecnología de asistencia, tipo de conexión, orientación y ajustes de texto y zoom. Excluir contraseñas, cookies y tokens de la evidencia.

1. Acceder como alumno y abrir una unidad desde el mapa. Abrir una actividad y volver. Confirmar la misma unidad, actividad, pestaña y foco de origen.
2. En una respuesta breve V2, abrir el teclado virtual, escribir una respuesta larga, corregirla y comprobar. Verificar que campo, ayuda y acción de comprobar se alcanzan mediante scroll, sin quedar detrás del teclado o de la navegación. Repetir en orientación horizontal y después de cerrar el teclado.
3. Con VoiceOver/TalkBack o lector de escritorio, recorrer título, consigna, campo, ayuda, comprobación y resultado. Comprobar nombre accesible, orden, foco y anuncio de la respuesta confirmada. El lector no debe repetir continuamente el mismo aviso.
4. Abrir y cerrar ayuda y diálogos. Confirmar que el foco vuelve al control que los abrió. Recorrer las pestañas de la ruta; el contenido y la pestaña anunciada deben coincidir.
5. Salir de un intento sin responder y retomarlo. Anotar su ID antes/después y verificar que no se crea otro intento.
6. Cortar la conexión antes de comprobar una respuesta. Restaurarla y recuperar el envío. Repetir en V1 y V2. Confirmar una sola respuesta persistida, un solo cambio del calendario y XP conciliados. Si no se puede forzar el corte posterior al guardado, registrar ese subcaso como NO VERIFICADO.
7. Poner el navegador en segundo plano y volver, después recargar. Confirmar intento, respuesta y retorno. Si vence la sesión, acceder con la misma cuenta y recuperar el enlace y la solicitud pendiente.
8. Cambiar el tamaño de texto/zoom permitido por el navegador. Verificar foco, desplazamiento y controles esenciales; no basta con que aparezcan en una captura.
9. Como editor, enfocar el título, abrir/cerrar un diálogo, cambiar de sección y editar una actividad de simulación. Comprobar que teclado y barras no ocultan el control enfocado ni guardar/publicar. La publicación se ensaya únicamente en el entorno de pruebas.
10. Adjuntar evidencia por subcaso y registrar PASS, FAIL o NO VERIFICADO. Para un fallo de identidad, incluir hora, superficie y referencia de diagnóstico visible para correlacionar web/API.
