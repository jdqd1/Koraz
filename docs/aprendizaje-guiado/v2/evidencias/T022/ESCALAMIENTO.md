# T022 — Escalamientos cerrados

**Estado: PASS.** El usuario autorizó la reparación limitada del provider/migración y después completar T022 hasta su aceptación.

## Permisos del runtime

El fallo original al bloquear auth_users (`42501`, `postgres-final.txt`) fue corregido por la nueva migración 0033 y llamadas limitadas del provider. Se preservan los bloqueos sin dar escrituras de identidad/catalogo ni lectura de credenciales.

El cierre editorial encontró `42501` sobre audit_log (`postgres-completion.txt`). La migración nueva 0034 expone exclusivamente acciones de auditoría de rutas v2 mediante una vista privada con CHECK OPTION. No concede acceso runtime a la auditoría general ni permite acciones ajenas o borrado.

`postgres-acceptance.txt`: **26 PASS**, incluyendo CRUD/preview y servicio alumno con runtime restringido, permisos negativos y concurrencia entre conexiones runtime. `browser-acceptance.txt`: **1 PASS** adicional sobre Chromium y Next de producción. Entre ambos se ejecutan los 27 casos de seguridad T022.

## API e inspección

CRUD y preview registrados; capacidades, propiedad, flags, tamaños, límites y errores comprobados. SSR/DOM y BFF actual inspeccionados con identidad sintética local. Build real: 59 archivos de navegador, dos valores privados ficticios, cero filtraciones. Matriz S01–S08 PASS en result.json; detalle y límites en README.md.

La conversión/adopción pertenece a T034: su entrada permanece cerrada después de verificar propiedad/CAS. T021 conserva PARTIAL por esa funcionalidad diferida. El renderer v2 pertenece a T028–T033; se verificó la frontera SSR existente. Estos pendientes funcionales no se presentan como hallazgos de autorización de T022 ni como funcionalidades completadas.

T023 depende de T004 y T009 (ambas PASS) y puede continuar; no se inició. No se modificaron migraciones históricas ni se desplegó. Los clusters de pruebas quedaron detenidos; 0005 no se ejecuta en el fixture, por lo que no se acredita M01 ni producción.
