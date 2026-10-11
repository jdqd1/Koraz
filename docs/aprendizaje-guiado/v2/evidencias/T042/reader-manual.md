# V04 — prueba aplazada por el usuario

Estado vigente: aplazado por instrucción del usuario. [Excepción y alcance](reader-deferral.json). Este procedimiento y su discrepancia se conservan como evidencia histórica; no bloquean la implementación ni requieren repetición ahora.

Actualización 2026-10-10: el usuario ejecutó este entorno. [Informe humano](reader-manual/observations.md) y [persistencia](reader-manual/persisted-manual-journey.json): nombre/rol y estados confirmados; cierre, modelo y feedback pendientes por discrepancia. La limpieza está [verificada](reader-manual/cluster-cleanup.json). El texto inicial siguiente conserva el contexto de preparación.

Estado: **NO VERIFICADO**. Narrator se inició, pero no se recogió salida hablada o transcripción del producto. Computer Use bloqueó la inspección al no poder determinar la URL de Edge con suficiente confianza. No se reintentó mediante otro mecanismo de automatización de Windows. La ventana de Narrator también reportó integridad superior; no se elevaron permisos. Su cierre por proceso devolvió acceso denegado. Edge de prueba quedó cerrado.

Si Narrator sigue hablando, se puede cerrar manualmente con **Narrator + Esc** (Insert o Bloq Mayús es la tecla Narrator). [Comandos oficiales de Microsoft](https://support.microsoft.com/en-us/accessibility/windows/narrator/appendix-b-narrator-keyboard-commands-and-touch-gestures).

Para completar V04, una persona debe recorrer la interfaz con Narrator y registrar sus observaciones. No basta aprobar un JSON ni revisar el árbol accesible. El entorno preparado usa un alumno sintético, Next/BFF/Fastify reales y PostgreSQL desechable. El script siguiente está preparado para uso manual; **no fue ejecutado ni declarado PASS**.

Desde la raíz del repositorio, en PowerShell:

```powershell
$env:PATH='C:\Users\josed\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;'+$env:PATH
$env:NODE_ENV='test'
$env:KORAZ_TEST_DATABASE='true'
$env:KORAZ_GUIDED_V2_TEST_SERVER='true'
$env:KORAZ_GUIDED_V2_TEST_DATABASE_URL='postgresql://koraz_test@127.0.0.1:55435/koraz_guided_v2_control_test'
$env:T042_MANUAL_READER='true'
node work/test/t042/cluster.mjs start
& 'C:\Users\josed\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd' --filter @cediah/api exec tsx ../../work/test/t042/reader-session.mts
```

Se abre una ventana aislada de Edge en la ruta sintética. Abrir Narrator manualmente. Usar teclado; registrar la fecha, versión del lector/navegador, texto realmente escuchado o transcrito y resultado de cada paso:

1. Leer el título de la ruta y enfocar **Comenzar**. Confirmar que se anuncia nombre, rol y foco.
2. Matricular, leer los estados del recorrido, dominio y consolidación. Confirmar que no se confunden actividades realizadas con dominio.
3. Abrir **Continuar** y la actividad de lectura. Activar **Continuar a la práctica** y comprobar el anuncio de confirmación y el foco al cierre; finalizar sesión.
4. Continuar a la respuesta construida. Comprobar etiqueta del campo, guardar, comparar con modelo, autoevaluación y cierre. Registrar nombres y cambios de estado.
5. En una elección, abrir **Necesito ayuda**, comprobar lectura de la pista, responder incorrectamente y comprobar feedback, estado confirmado y refuerzo. Recargar y comprobar que ese estado persiste.

Puede usarse **Narrator + Alt + X** para consultar el historial real de voz y registrar sus frases. La transcripción debe provenir de Narrator, no del DOM. No copiar cookies, tokens, contraseñas ni datos de otros chats.

Guardar las observaciones en `docs/aprendizaje-guiado/v2/evidencias/T042/reader-manual/`, indicando PASS/FAIL por paso y cualquier problema. Al terminar, cerrar Narrator manualmente, volver a PowerShell y pulsar Ctrl+C para limpiar el entorno. Después:

```powershell
node work/test/t042/cluster.mjs stop
```

La sesión manual guarda su recibo de cluster aparte para conservar las pruebas automáticas. Después se repite la revisión T042; T043 sigue bloqueada hasta que Q01–Q24 tengan evidencia PASS.
