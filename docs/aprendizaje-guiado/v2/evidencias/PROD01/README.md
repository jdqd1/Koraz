# PROD01 — integración de v2 en Supabase

Autorización humana del 11/10/2026: lector de pantalla dispensado; respaldos permanentes aplazados; contenido exacto del piloto, integración del PR y lanzamiento aprobados. La evidencia RC01 conserva sus resultados históricos de prueba. Ver authorization.json.

V2 se incorporó a Koraz database (uniajsrdhhyjxyadgvdo), el proyecto productivo existente. No se copian usuarios ni respuestas de staging. Las 37 migraciones coinciden por nombre y SHA-256. Se verificaron las once migraciones antiguas registradas originalmente en Supabase; se alinearon los permisos de 0026 con su SQL portable. Las migraciones históricas no se modificaron. Se añadieron 0017_delete, 0023 y 0030–0036 donde faltaban.

La operación tomó el mismo lock del migrador y comprobó conteos y hashes de todas las tablas existentes dentro de una única transacción. Se ignora exclusivamente la nueva columna nullable definition_v2_json al comparar la fila de learning_path_versions. Cuentas: 5; publicaciones: 488; rutas v1: 1; matrículas v1: 2; respuestas v1: 19, conservadas. No hay respuestas v2 migradas del entorno de prueba.

0036 cierra el acceso directo de anon/authenticated a content_topic_item_order, preservando DML del rol de la API. No quedan tablas public sin RLS ni grants para los roles de navegador. La tabla de exclusiones vacía tiene denegación por defecto sin políticas: aviso INFO esperado.

Se sustituyó la credencial de cediah_runtime tras aparecer en la salida de una inspección del panel. La nueva conexión funciona; la anterior falla con 28P01. La API sigue con migraciones automáticas desactivadas y el pool transaccional de Supabase. Los archivos de credenciales permanecen ignorados por Git.

Dependencias: versiones corregidas de Next, Fastify, Nodemailer, sharp, fast-uri, ProseMirror, source-map-js y brace-expansion. braces 3.0.3 no tiene reparación publicada: se mantiene un parche versionado que limita a 128 niveles tanto el parser como los recorridos. La única excepción del audit corresponde a GHSA-vfj7-8cjw-p6xm; CI ejecuta antes una regresión con globs normales, doce patrones hostiles y tres AST hostiles. No se desactiva el audit de otras alertas.

Estado del lanzamiento: EN CURSO. Falta terminar verificaciones, integrar PR #61, comprobar despliegues y publicar el piloto con bindings productivos. La base temporal de Render se conserva hasta concluir esas comprobaciones.
