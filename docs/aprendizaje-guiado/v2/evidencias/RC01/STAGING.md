# Staging aislado RC01 — 11/10/2026

Espacio Render confirmado: My Workspace (`tea-d59dnr4hg0os73cacco0`). Solo se operaron los recursos nuevos de prueba.

## Recursos

- PostgreSQL 17 `koraz-guided-v2-staging`, Oregon: [panel](https://dashboard.render.com/d/dpg-db5gi7id0e5s73fcvc20-a). La DB gratuita caduca el **09/11/2026 a las 23:57 (Caracas; 10/11 UTC)**; no acredita persistencia productiva.
- API `cediah-api-staging-v2`: [panel](https://dashboard.render.com/web/srv-db5gma942hec738t9gu0), [health](https://cediah-api-staging-v2.onrender.com/health). Dockerfile exclusivo `work/staging/rc01/Dockerfile`; rama `codex/cierre-pendientes-guided-v2`, despliegue automático apagado.
- [Preview de la rama](https://cediah-git-codex-cierre-pendientes-guided-v2-jdqd1s-projects.vercel.app), proyecto Vercel `cediah`. API_BASE_URL se sobrescribe solo para esta rama/preview. Conserva la protección de Vercel; sus enlaces de acceso no se publican.
- El primer deploy con recuperación PASS es `dep-db5r5gjbc2fs739r8en0`, SHA `7813ecbf438e02075e9bb2ef01669cabd7868f26`. `release.json` identifica las revisiones finales, diferentes de los SHA de los tests anteriores.

## Evidencia

1. **Migraciones:** 67 tablas, 35 archivos aplicados y exclusión de 0005 para la instalación nueva sin catálogo heredado. Checksums completos, ambos 0017 conservados, migraciones apagadas en runtime.
2. **Permisos:** conexiones reales como cediah_runtime y rc01_auth_runtime, sin superusuario, CREATEDB, CREATEROLE ni BYPASSRLS. El primero no modifica auth ni actualiza/elimina respuestas. El segundo no lee respuestas v2 ni modifica catálogo; posee únicamente las columnas de perfil necesarias para el trigger de alta y puede insertar rol student, con política RLS que impide administrator. Se preserva el primer fallo de registro por falta de esos permisos. Bootstrap usa admin antes de arrancar y entrega al servidor dos pools limitados; este contenedor es exclusivo de prueba.
3. **Better Auth/BFF:** cuentas ficticias y cookies reales; preview protegida → Next/BFF → Render API → PostgreSQL. Importación/commit/exportación, revisión/publicación para prueba, matrícula, replay, lectura persistida, cierre de sesiones y denegaciones 401/403.
4. **Piloto:** hash publicado `b7bb7647b2e7eedef1b2e78f8d298d946910e2f350f855b4e8e60c1af017fdfa`, aprobado por el propietario para prueba, 52 actividades. Sintético: dominio. Piloto: 32 sesiones, próxima comprobación desde el 12/10/2026 por separación de 24 horas. No se alteró el reloj cloud. Dominio y retenciones 7/30 días completos se prueban localmente con reloj controlado, móvil/escritorio.
5. **Restauración:** snapshot consistente, pg_dump custom/pg_restore 17 en otra DB temporal. Coinciden hashes/conteos de 67 tablas, secuencias y SQL de esquema/grants de aplicación. Se excluyen cuatro DEFAULT ACL propiedad de postgres gestionadas por Render; ninguna ACL de aplicación se omitió. Fallos iniciales y excepción registrados. DB restaurada/dumps temporales retirados, origen preservado.
6. **Flags/reinicio:** mantenimiento conserva datos/manifiestos y bloquea mutaciones con 503. Tras reactivar se comparan los mismos hechos y receipts, y se exige 403 para nuevas matrículas y actores fuera de allowlist. Ver cloud-rollback-*.json.

## Estado final y límites

Allowlist no vacía solo editor/alumno RC01; aprendizaje general/v2 activos, nuevas matrículas cerradas, migraciones y repetición de restauración apagadas. Secretos y cuentas quedan en Render/archivos privados ignorados por Git.

Se retiró la IP temporal al terminar: lista PostgreSQL vacía y confirmación visual de bloqueo de todo tráfico público en staging-network-closed.png. La regla general del workspace no se modificó; las reglas de cada nivel se combinan por intersección ([Render](https://render.com/docs/inbound-ip-rules)). Durante el ensayo, acceso externo limitado a `134.82.68.160/32`; intentos externos fallaron por resets TLS y sus recibos se preservaron. No se abrió 0.0.0.0/0 ni se redujo verificación TLS externa. Las pruebas exitosas usan red privada de la misma región.

No acredita producción ni aprobación clínica. Lector de pantalla aplazado por el usuario. Repasos cloud todavía no elegibles se registran como pendientes; el handoff permite reloj controlado para aceptar el software. El backup temporal no demuestra retención continua, RPO/RTO ni restauración de objetos de storage. Producción requiere evaluar catálogo/ledger/migraciones existentes y autorización de lanzamiento.
