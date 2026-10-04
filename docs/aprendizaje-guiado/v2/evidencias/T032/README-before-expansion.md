# T032 — diagnóstico, refuerzo y mantenimiento

**Estado: NO VERIFICADO. Implementación parcial dentro de la ficha.**
Petición: «haz la t032». Fecha: 04/10/2026, America/Caracas.
Base: e41c0c1b20adbb9248108c50d7bb0d4bac0ae1e3; árbol inicial limpio.
Dependencias T017, T018, T019, T028 y T031: PASS en sus alcances documentados.
No se inició T033.

## Resultado revisable

La página `/aprendizaje/repaso` conserva el launcher v1 y ofrece un enlace
explícito a la ruta activa v2. `?motor=guided-v2&ruta=<slug>` consulta la ruta y
su matrícula/version fijada, muestra una pantalla de práctica y mantenimiento
y reutiliza RouteAction y su transporte existente. Una lectura v2 fallida no
cae silenciosamente al launcher v1. Estado ausente/ajeno/revocado no muestra
fechas, conteos cero ficticios ni acciones de avance.

Los paneles nuevos muestran el error esencial por objetivo, motivos confirmados
de nextAction, refuerzo sin borrar dominio anterior, enlaces a su unidad y otras
rutas, y fechas históricas de primer dominio/consolidación. No interpretan
la ausencia como fallo ni acreditan dominio por lectura. No modifican estado,
agenda, umbrales ni backend. La acción disponible es solamente nextAction;
consultar otras rutas no se presenta como autorización para otra rama específica.

Las fechas históricas conservan su timestamp y se formatean en la zona del
navegador tras hidratación, con UTC etiquetado durante SSR. La zona del perfil
no llega en este DTO. Se verifica el límite de medianoche Caracas/UTC con fecha
fija; no se atribuye a esa prueba la integración del calendario del servidor.

## Bloqueo concreto

La ficha autoriza únicamente componentes diagnostic/gate/remediation/review/
maintenance, página de repaso y tests/CSS v2. El contrato público no entrega
clave/estado de diagnóstico, agenda, fechas de retención, motivos completos de
gate, bankExhausted/availableAfter ni ofertas de otras ramas/lote. Esos datos
existen en el contexto privado de `apps/api/src/guided-learning/v2/routes.ts`.
No se adivinaron claves ni se calculó una agenda alternativa.

Se preparó `AMPLIACION-PROPUESTA.md` con los campos y archivos adicionales
necesarios. No se aplicó esa ampliación ni se pidió autorización antes de
completar y verificar el trabajo permitido. El panel de diagnóstico informa
que no está disponible en esta pantalla; no contiene un botón ficticio.
Fechas futuras y lotes de diez tampoco se presentan como implementados.

Para cerrar T032 se necesita autorizar esa proyección de contrato/API y montaje
mínimo en ruta/hoy/player. Después deben ejecutarse pruebas de los datos
autorizados y del diagnóstico/omisión, variantes agotadas, ramas, fechas y
retención. E03/E06/P11–P15 completos siguen NO VERIFICADO en esta tarea.

## Comprobaciones

| Comprobación | Resultado | Evidencia |
|---|---|---|
| Build contratos, Node 24.19.0 existente | PASS | contracts-build.txt |
| Pruebas nuevas | 18 PASS | focused-initial.txt |
| Suite web | 468 PASS, 59 archivos | web-suite.txt |
| Focalizadas finales tras ajustar presentación de zona | 51 PASS, 4 archivos | focused-final.txt |
| Typecheck y ESLint finales | PASS | typecheck-final.txt, lint-final.txt |
| Exportación de vistas estáticas | 1 PASS | preview-test-with-fonts.txt |
| Geometría estática: seis estados, cuatro tamaños | PASS, 24 vistas sin overflow | browser-preview.json |
| Axe sobre seis vistas SSR estáticas | 0 serious/critical | browser-preview.json |
| Diff y preservación | Solo página repaso cambia entre archivos previos; sin eliminaciones | diff-check.txt, preservation.json, source-hashes.json |

La suite web completa pasó antes de sustituir useEffect por useSyncExternalStore
para presentar la zona local. Las 51 pruebas focalizadas finales, typecheck y
lint verifican ese ajuste; no se repitió la suite global sin necesidad.
La vista estática usa CSS y fuentes locales existentes, sin AppShell ni
hidratación. No verifica navegación interactiva, efectos de red, persistencia,
zona de perfil, zoom nativo ni flujo de alumno. Las capturas son una revisión de
layout del borrador, no E03/E06/T035/T037. Se inspeccionaron las capturas y la
referencia T028. Los logs de los primeros fallos de lint y del harness se conservan.

No se instalaron dependencias, modificaron migraciones/contratos/API/editor/v1,
emitieron notificaciones, hicieron commits ni desplegó. Se conservan los límites
heredados de T024, T021 y del hito S; no se declara resuelta ninguna incidencia
previa. Los procesos de verificación finalizaron; no se abrió un servidor.

## Reproducción

Usar Node 24.19.0 del runtime del workspace y pnpm.cmd existentes. Desde raíz:

```powershell
pnpm.cmd --filter @cediah/contracts build
pnpm.cmd --filter @cediah/web exec vitest run src/components/learning/v2/maintenance.test.tsx src/components/learning/v2/review-page.test.tsx src/components/learning/v2/model.test.tsx src/components/learning/v2/player.test.tsx
pnpm.cmd --filter @cediah/web typecheck
node apps/web/node_modules/vitest/vitest.mjs run --config docs/aprendizaje-guiado/v2/evidencias/T032/vitest.preview.config.mts
node docs/aprendizaje-guiado/v2/evidencias/T032/browser-preview.cjs
```
