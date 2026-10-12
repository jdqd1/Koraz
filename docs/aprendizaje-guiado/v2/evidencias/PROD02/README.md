# PROD02 — rutas v2 visibles en el panel editorial

El propietario detectó que Vascularización del abdomen no aparecía en /panel/rutas. El listado pedía exclusivamente el workspace editorial v1, que excluye versiones v2. La ruta y su editor directo ya existían en producción. La captura panel-before.png conserva la reproducción.

Se añade una lectura privada de resúmenes v2 y se integra en la lista vigente, con enlaces al editor, unidades, estado y advertencia de fallo de carga. El servidor exige sesión y rol editorial; autores ven sus rutas, administradores y coordinadores pueden ver todas. Se consultan las últimas versiones, incluidos borradores y rutas archivadas, sin respuestas ni definiciones completas. No se cambian contenido aprobado, migraciones ni contratos v2 congelados.

Verificación local: API 13 PASS/2 archivos; web 10 PASS/2 archivos; build de contratos, tipos, lint y whitespace PASS. SQL de lectura comprobado también en Supabase productivo: piloto publicado, 4 unidades. PR #62; verificación de despliegue y captura final pendientes.
