# T032 — ampliación mínima necesaria

Base: e41c0c1b20adbb9248108c50d7bb0d4bac0ae1e3. Fecha: 04/10/2026.

**Autorizada y aplicada.** Tras presentar esta propuesta y el resultado parcial,
el usuario respondió «si». La continuación incorpora exclusivamente esta
proyección pública y los montajes mínimos indicados. `README-before-expansion.md`
y `result-before-expansion.json` conservan el estado anterior a esa autorización.
La agenda usa objetos `retention7`/`retention30` con `dueAt`, `acceptedAt` y
`elapsedDays`; los gates añaden únicamente puntuación, umbral y claves de
objetivos pendientes. Las claves de refuerzo se entregan solo cuando el
proveedor vigente admite abrirlas. No se amplían las reglas de selección.

La ficha permite componentes diagnostic/gate/remediation/review/maintenance,
repaso/page.tsx y tests/CSS v2. El DTO vigente entrega nextAction, conteos y
fechas históricas de dominio/consolidación. No entrega la clave ni estado del
diagnóstico, fechas de agenda/retención, lotes de repaso, ramas disponibles,
motivos por objetivo ni bankExhausted/availableAfter. Estos datos ya existen
en el contexto privado de routes.ts; no se pueden reconstruir en el navegador.

Propuesta concreta: campo opcional `maintenance` en V2RouteStateSchema con
generatedAt UTC y zona IANA de learning_preferences; diagnostic {status, assessmentKey}; reviewBatch (máximo 10,
claves de actividad/objetivo y dueAt); agenda por objetivo con dueAt,
retention7DueAt/AcceptedAt y retention30DueAt/AcceptedAt, días reales de cada
medición aceptada calculados en servidor; offers de actividades
autorizadas y razones; blockers por objetivo; remediation con objetivo,
mensaje autorizado, activityKey, bankExhausted, availableAfter y pauseOffered.
Proyectar por allowlist desde el contexto ya autorizado. Sin respuestas,
reservas, definiciones editoriales, equivalenceKeys ni soluciones.

Archivos adicionales: packages/contracts/src/guided-learning-v2.ts;
apps/api/src/guided-learning/v2/routes.ts; pruebas focalizadas de contrato/rutas.
Montaje mínimo en path-screen.tsx, today-panel.tsx y player.tsx; extensión
opcional de RouteAction para elegir ofertas exclusivamente del estado servidor.
No cambiar selection/evidence/scheduler, umbrales, migraciones, autenticación,
economía, v1, producción ni notificaciones. La omisión del diagnóstico usa una
actividad autorizada: el servidor ya registra omitted al iniciar actividad.
La cola se muestra como grupo de hasta diez ofertas del servidor; el transporte
vigente abre un intento por actividad. No crear un supuesto intento multiítem
de repaso en cliente ni prometer que el launcher existente ya lo soporta.

Dentro del alcance original se preparan componentes, estados y pruebas con
datos públicos sintéticos y se preserva el launcher v1. Hasta autorizar la
proyección adicional, diagnóstico/agenda/ramas no pueden acreditarse integrados.
