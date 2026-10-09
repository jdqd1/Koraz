# Ampliación mínima T034

La ficha permite upgrade.ts, rutas v2, dispatch v1, config, UI de upgrade v2 y su test.
Para conectar el resultado hacen falta estos archivos adicionales:

1. `apps/api/src/providers/postgres-guided-learning-v2.ts`: conectar convert-v1 y reconstruir evidencia desde historia explícitamente equivalente, sin duplicar ni modificar respuestas antiguas.
2. `packages/contracts/src/guided-learning-v2.ts`: disponibilidad/mantenimiento, CAS de preview y estado de consumo conservado; campos públicos sin soluciones.
3. `apps/api/src/app.ts`: permitir lecturas de historial/mantenimiento con v2 apagado; mantener bloqueo de mutaciones y cuentas no autorizadas.
4. `apps/web/src/components/learning/v2/path-screen.tsx`: insertar el aviso de upgrade y mantenimiento en la pantalla vigente.
5. `apps/web/src/components/learning/v2/route-action.tsx`: desactivar aperturas durante mantenimiento confirmado por servidor.
6. `apps/web/src/app/aprendizaje/rutas/[slug]/page.tsx`: conectar aviso v1→v2 usando matrícula y revisión confirmadas, conservando el flujo v1.
7. `apps/api/test/guided-v2-routes.test.ts`: actualizar la expectativa histórica de 404 al contrato de lectura en mantenimiento y verificar la composición con app.ts.

Los componentes nuevos `upgrade*.tsx` y sus pruebas, y el test API
`guided-v2-upgrade.test.ts`, pertenecen al alcance original de T034.
Se actualizará evidencia T021 solo después de verificar sus endpoints pendientes.
Sin migraciones nuevas, cambios automáticos de matrículas ni flags de producción.
