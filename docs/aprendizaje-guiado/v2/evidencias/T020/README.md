# T020 — Métricas y recompensas

Estado: **PASS**. Dependencias T016, T018 y T019 con evidencia PASS. Se detiene antes de T021.

El cálculo informa matrículas activadas en la cohorte `[inicio, fin)`, primer final y omisiones como cero por objetivo requerido; distingue elegibles, respuestas y ausencias de retención. Los intervalos 7–14 y 30–45 días son inclusivos; los resultados tardíos informan los días reales y quedan fuera de la media de ventana. La eficiencia es descriptiva y solo compara objetivos compartidos entre el diagnóstico previo y el primer final, usando tiempo activo hasta ese final. Sin diagnóstico o sin tiempo devuelve `null`.

La transferencia requiere familia nueva, representación nueva, corrección objetiva y ausencia de ayuda. Se excluyen familias previamente expuestas en diagnóstico, primeras exposiciones asistidas y representaciones presentadas sin respuesta. Se informa el desglose por representación. La exportación contiene agregados, sin usuarios, respuestas, enunciados, soluciones ni texto clínico libre.

La persistencia usa `learning_events`, reloj servidor y claves semánticas únicas. Registra inicio, presentación, respuesta, ayuda, agenda, envío de evaluaciones, finalización, dominio y consolidación; el adaptador de feedback exige respuesta aceptada y evaluación cerrada. Los gates reutilizan el resultado del motor de evidencia. El heartbeat almacena ticks vacíos también para impedir que un reenvío transforme un tick oculto en tiempo activo. Cada intervalo tiene como máximo 30 segundos, corta a los 60 segundos desde la última interacción aceptada y se une con los de otros dispositivos.

El ledger otorga +5 por primera recuperación objetiva correcta, +10 por primer dominio y +15 por primera consolidación, una vez por usuario, versión, objetivo y evento. Respuesta, evidencia, agenda, evento, premio y recibo comparten transacción. Abrir, leer y pedir ayuda otorgan cero XP. La migración nueva `0032_guided_v2_rewards.sql` amplía el CHECK con los tres tipos v2; no modifica filas históricas. El lector v1 ya restringe sus hitos antes del parseo estricto; el DTO nuevo tiene unión explícita v1/v2 y el saldo suma ambos motores.

Validación:

- `final-focused-contract.txt`: 35 pruebas propias de T020 y 5 de contratos, **40 PASS**.
- `acceptance-regression.txt`: **138 PASS**, incluidas recompensas v1, T016, T018 y T019; 22 casos sin PostgreSQL dedicado omitidos en ese comando. Las últimas correcciones se verificaron en la ejecución final específica.
- `postgres-attempts.txt`: **19 PASS**, incluidos 12 casos de PostgreSQL 17.11 con conexiones independientes y contención comprobada del lock del actor.
- `postgres-scheduler.txt`: **31 PASS**, incluidos 8 casos de PostgreSQL; 2 casos de concurrencia no aplicables a PGlite omitidos. Clusters desechables detenidos, conservados en directorios temporales.
- Build de contratos PASS en ambos harnesses; typecheck, lint y diff del alcance PASS.

Excepción mínima de alcance: tres fixtures existentes cambian exclusivamente el límite de migraciones de 0031 a 0032 para poder ejecutar el runtime actualizado (`helpers/guided-v2-db.ts`, `guided-v2-attempts.test.ts`, `guided-v2-scheduler.test.ts`). Se preservan los cambios previos y el trabajo concurrente del mapa. Durante la ejecución otro flujo creó el commit `e1bbc8f`; ese commit incluye una instantánea parcial de este trabajo. Este chat no creó commits ni alteró ese historial. Los hashes finales adjuntos identifican la versión verificada.

Límites: pruebas locales, sin despliegue ni aplicación de migraciones a entornos externos. El endpoint de agregados se registra y verifica con Fastify `inject`, con capacidades existentes de coordinador/administrador; su montaje en el dispatch de la aplicación corresponde a T021, como los otros módulos v2. También corresponde a T021 conectar el heartbeat/feedback con los endpoints del alumno y guardar la selección/exposición congelada de T019. El runtime previo conserva `novel_at_presentation=false`, por lo que no acredita transferencia sin esos hechos confirmados; la prueba del adaptador incluye metadatos sintéticos para verificar la exclusión por exposición previa. El tiempo usa interacciones confirmadas por servidor y puede subestimar interacción local aún no instrumentada. No se declara validación E2E, UI, staging, producción ni suite completa T040.
