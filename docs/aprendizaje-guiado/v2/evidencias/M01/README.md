# Cierre 0005 / M01 — instalación nueva sin catálogo histórico

PASS local para el perfil `empty`, 04/10/2026. El usuario eligió expresamente
«Base nueva sin catálogo histórico (recomendado)».

El bloqueo era una restauración de datos legacy dentro de la cadena de esquema:
0005 exige identidad concreta. No se altera su SQL ni se fabrica esa identidad.
El runner admite `DATABASE_LEGACY_CONTENT_MODE=empty` solo para DB nueva vacía,
sin usuarios/contenido ni migraciones posteriores. Registra checksum y motivo
en `cediah_schema_migration_exclusions` y devuelve `not_applicable`, separado de
migraciones realmente aplicadas. El default sigue `restore`.

PostgreSQL real y desechable, loopback 55435, roles de prueba y DB por caso.
9 PASS: cadena completa clasificada, checksums, repetición, perfil incorrecto,
datos existentes, prerequisito legacy original y preservación de versión v1,
matrícula e intento al incorporar las migraciones v2. Typecheck y lint PASS.
Los fallos iniciales fueron del filtro de nombres del nuevo fixture y de su
teardown de pool sin inicializar Kysely; corregidos sin relajar assertions.

No se declara ejecutada 0005 en modo empty. La restauración del catálogo real
sigue NO VERIFICADO y no es necesaria para la instalación elegida. Ninguna DB
compartida/producción cambió. Backup T041 y aceptación Hito S permanecen aparte.
La documentación de T034 conserva sus límites históricos y referencia este cierre.
