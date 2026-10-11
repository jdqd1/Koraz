# V04 — inspección humana de Narrator, 2026-10-10

**NO VERIFICADO en conjunto.** El usuario operó Narrator y Edge en la ruta local sintética. Se confirmó nombre/rol de Comenzar y lectura de estados. Las confirmaciones posteriores no coinciden con el estado persistido: una única sesión study-1 in_progress y cero respuestas. La discrepancia impide acreditar lectura de modelo, pista, feedback y refuerzo en este recorrido.

| Paso | Declaración del usuario | Evaluación |
|---|---|---|
| Comenzar con Tab y Enter | Declaró literalmente que Narrator dijo «comenzar, botón»; adjuntó pantalla de la ruta matriculada | PASS |
| Estados separados de la ruta | «si, todo» al pedir lectura de recorrido, dominio y consolidación | PASS por confirmación humana |
| Lectura y cierre | «si puede» | NO VERIFICADO: sesión sin cerrar |
| Campo y modelo | «si» | NO VERIFICADO: ninguna respuesta construida persistida |
| Pista, error, feedback, refuerzo/recarga y teclado | «funciona» | NO VERIFICADO: ninguna respuesta de elección persistida |

Las frases cortas son confirmaciones del usuario, no transcripciones literales de Narrator. El agente no escuchó ni grabó el audio. No se reconstruye voz a partir del DOM. Las capturas fueron aportadas en el chat; no se inventan archivos locales de imagen.

Al preguntar por la discrepancia, el usuario aclaró expresamente: «Activé ambos y vi sus resultados», en referencia a Guardar mi respuesta y Comprobar respuesta. Se conserva esa declaración; no se concluye que solo leyera los controles ni se atribuye un error al usuario. La causa de la diferencia con los datos no está verificada.

[Observaciones estructuradas](observations.json), [estado persistido antes de limpiar](persisted-manual-journey.json), [primera comparación de bases](cleanup-first-comparison.json), [limpieza final](cluster-cleanup.json).

Ctrl+C detuvo PostgreSQL y dejó la base temporal sin eliminar; el posterior stop devolvió ECONNREFUSED. Se conservó el baseline original, se reinició únicamente el cluster marcado, se atribuyó la única base nueva al alumno sintético student-30 y cuatro rutas T035 creadas durante el arranque, y se eliminó esa base sin conexiones activas. Las bases preexistentes mantienen nombres/OIDs; cluster detenido y directorio preservado. La limpieza PASS no convierte V04 en PASS.

Siguiente comprobación: abrir la actividad, localizar y activar realmente Continuar a la práctica, comprobar el cierre en pantalla y su lectura. Recorrer después campo/modelo y elección/feedback con evidencia de la pantalla alcanzada y voz escuchada.
