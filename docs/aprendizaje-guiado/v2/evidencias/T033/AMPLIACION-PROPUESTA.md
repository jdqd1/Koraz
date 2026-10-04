# T033 — integración mínima propuesta

El núcleo autorizado ya dispone de un simulador efímero en `editor-routes.ts`,
con las funciones puras de corrección, manifiestos, selección, evidencia y agenda.
Las primeras 8 pruebas pasan, incluida Fastify/provider/PGlite con conteos de
todas las tablas learning_* y recompensas idénticos antes/después (exceptuando
el recibo editorial de apertura, que ya existía). No se ha montado en el editor.

Para conectar el mismo player y las ocho familias sin duplicarlo, hace falta
ampliar la allowlist de la ficha exactamente a estos archivos:

1. `packages/contracts/src/guided-learning-v2.ts`: contratos estrictos del
   simulador editorial (inicio, acción y lectura de imagen), separados de alumno.
2. `apps/web/src/app/api/v2/editor/learning-paths/[...path]/route.ts`: permitir
   únicamente esos contratos en el BFF editorial existente.
3. `apps/web/src/components/learning/editor/v2/review-workflow.tsx`: montar el
   control de preview en Revisión para una ruta guardada, sin publicar ni guardar.
4. `apps/web/src/components/learning/v2/player.tsx`: inyectar transporte,
   resolución de imagen y salida local para la sesión editorial; conservar
   valores predeterminados del alumno y mostrar claramente el modo preview.
5. `apps/web/src/components/learning/v2/composition.tsx`: pasar el resolver de
   imagen al renderer compartido.
6. `apps/web/src/components/learning/v2/renderers/image-target.tsx`: admitir
   resolver editorial autorizado; evitar toda lectura del endpoint de alumno.
7. `apps/api/src/providers/postgres-guided-learning-v2.ts`: resolver por lectura
   una imagen del binding editorial validado con storage privado ya existente,
   sin crear matrícula, intento, progreso, evento, agenda ni recompensa.

Los archivos preview*.tsx, editor-routes.ts (preview) y tests v2 siguen dentro
del alcance original. Se reutilizan estilos existentes. No cambia la política,
los umbrales, autenticación, migraciones, rutas v1 ni publicación.

Después de la autorización: conectar, recorrer el preview por navegador con
API/DB aisladas, bloquear todas las URLs de alumno en la prueba, verificar
móvil/teclado y comprobar de nuevo los conteos. Detenerse antes de T034.
