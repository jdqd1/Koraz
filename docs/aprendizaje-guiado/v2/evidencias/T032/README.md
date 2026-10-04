# T032 — diagnóstico, refuerzo y mantenimiento

**Estado: PASS local.** Petición «haz la t032»; ampliación mínima autorizada con
«si» después de presentar AMPLIACION-PROPUESTA.md. Fecha: 04/10/2026,
America/Caracas. Base: e41c0c1b20adbb9248108c50d7bb0d4bac0ae1e3; árbol inicial limpio.
Dependencias T017/T018/T019/T028/T031: PASS en sus alcances documentados.
No se inició T033, no se hizo commit ni despliegue.

## Resultado

La pantalla de repaso v2, la ruta, Hoy y el cierre del player consultan el mismo
estado de la matrícula/version fijada. El diagnóstico es optativo: completarlo
u omitirlo orienta el apoyo sin acreditar dominio, error crítico o deuda de
repaso. La omisión abre una actividad realmente autorizada por el servidor.
El gate muestra puntuación/umbral, objetivos esenciales y dependencias; el
refuerzo identifica la confusión y abre su explicación específica. Si no hay
variante elegible, muestra su fecha, pausa y otra rama disponible.

La cola ofrece hasta diez objetivos y conserva el orden del servidor. Cada
objetivo abre su propio intento; se puede parar tras cualquiera. En la prueba,
doce pendientes produjeron diez botones; completar uno dejó once pendientes.
Consultar/recargar no añadió respuestas, lapses ni fechas nuevas.

La agenda y la retención de 7/30 días proceden del servidor. Las fechas usan
la zona del perfil (Caracas, con navegador UTC en la prueba); el estado atrasado
usa generatedAt del servidor. Las mediciones realizadas muestran fecha y días
reales desde el primer dominio, incluida una medición a aproximadamente 10 días
y otra a 35, con fecha de primera consolidación del objetivo. No se presenta
la consolidación de un objetivo como consolidación de toda la ruta.

El DTO maintenance es opcional para conservar recibos históricos idempotentes.
Su allowlist pública excluye soluciones, payloads, reservas, equivalenceKeys,
rubrics y campos editoriales. Las claves de refuerzo solo se ofrecen cuando el
proveedor existente permite abrirlas. Las reglas de selección, evidencia,
agenda, umbrales, migraciones, autenticación, economía y v1 no se modificaron.
El launcher v1 se conserva; una lectura v2 fallida no cae silenciosamente a v1.

## Comprobaciones

| Comprobación | Resultado | Evidencia |
|---|---|---|
| Contratos build, Node 24.19.0 existente | PASS | contracts-expanded.txt |
| Suite web | 473 PASS, 59 archivos | web-suite-expanded.txt |
| Web final focalizado | 56 PASS | web-focused-final.txt |
| API HTTP/proyección final | 14 PASS | api-routes-projection-final.txt |
| Contrato/selección/agenda/evaluaciones | 85 PASS / 10 SKIP | api-focused-expanded-final.txt |
| Typecheck web/API y lint de archivos afectados | PASS, cero warnings | *-typecheck-final.txt, *-lint-final.txt |
| Harness HTTP real | 1 PASS | http-maintenance-verified.txt |
| Navegador hidratado -> BFF -> Fastify/provider -> PGlite | 7 comprobaciones PASS | browser-maintenance.json |
| 360/390/768/1440 px en estado de agotamiento | Sin overflow de página | browser-maintenance.json |
| Axe del área guided-v2 en tres estados | 0 serious/critical | browser-maintenance.json |
| Preservación, diff y hashes | PASS, sin eliminaciones | preservation.json, source-hashes.json |

La suite web completa precede al ajuste final de redacción del resumen/agenda;
las 56 pruebas focalizadas finales, typecheck y lint verifican ese ajuste.
La última modificación de proyección API se verificó con las 14 pruebas HTTP,
typecheck, lint y el harness/navegador. No se atribuye a las diez pruebas SKIP
ninguna evidencia PostgreSQL independiente.

Se inspeccionaron las capturas exhausted-real-mobile.png (390 px),
review-real-desktop.png y retention-real-desktop.png (1440 px). Se probaron
diagnóstico/omisión/elección de rama/respuestas mediante teclado. Axe solo
inspecciona el área v2; no acredita lector de pantalla, zoom nativo o AppShell.
El motor confirmó los cierres y la persistencia; no se simularon recibos BFF.

## Alcance y límites

Contenido e identidad son sintéticos; DB PGlite nueva y conexiones serializadas,
red HTTP real, reloj Date controlado con eventos sucesivos. No se usaron datos
productivos. El harness no emite sesiones BetterAuth: su GET /api/auth/get-session
devuelve 404 en AppShell, mientras la identidad SSR/BFF usa el helper /v1/auth/me.
Los logs también conservan avisos de desarrollo ajenos al área v2. Esto no
verifica autenticación productiva ni el recorrido completo de T035.

P11 se comprueba localmente; P12/P13 usan la agenda existente y pruebas de
reloj/ausencia; P14/P15 conservan pruebas de selección, reservas y segmentos.
E03/E06 se acreditan únicamente para los subflujos locales descritos, con
matrícula fijada y estado compartido entre ruta/Hoy/sesión/repaso. El recorrido
completo con mapa, ayuda, ocho tipos, dataset grande y fallos de conexión queda
en T035; la auditoría completa de accesibilidad queda en T037. No se declara
PASS del hito S, aceptación editorial/clínica, staging o producción. T024 y
T021 conservan sus límites heredados. No hubo notificaciones ni instalaciones.

Los procesos propios terminaron y los puertos 31032/41032 quedaron cerrados.
README-before-expansion.md/result-before-expansion.json y las vistas estáticas
conservan el borrador anterior; no son la evidencia final integrada. Los logs
iniciales fallidos se conservan: compilación desde cwd incorrecto, fixture con
rationale corto, envío de teclado durante hidratación y eventos con hora igual.
El harness final separa los eventos cronológicamente sin cambiar reglas del motor.

## Reproducción

Desde raíz con Node 24.19.0/pnpm existentes: build de contratos, tests y
typecheck/lint indicados en result.json. Para la comprobación web local:

1. Establecer T032_BROWSER_HOLD=true y ejecutar Node sobre
   apps/api/node_modules/vitest/vitest.mjs run --config
   docs/aprendizaje-guiado/v2/evidencias/T032/vitest.http-maintenance.config.mts.
2. Desde apps/web, API_BASE_URL=http://127.0.0.1:41032 y
   NEXT_PUBLIC_AUTH_URL=http://127.0.0.1:31032; ejecutar Next dev --webpack
   --hostname 127.0.0.1 --port 31032. Esperar ambas instancias listas.
3. Desde raíz: node docs/aprendizaje-guiado/v2/evidencias/T032/browser-maintenance.cjs.
4. POST http://127.0.0.1:41032/__test/stop con JSON vacío; terminar Next.

Los endpoints __test solo existen en este archivo de evidencia y una DB nueva;
no se incorporan a la aplicación. close-evidence.cjs valida reportes, anchos de
captura y preservación antes de escribir el cierre.
