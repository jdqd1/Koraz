# Ampliación mínima propuesta para T045

Estado: pendiente de autorización explícita; no aplicada.

El paquete sintético generado pasa el validador portable (estructura y cobertura). La importación HTTP en PostgreSQL independiente devuelve 503. La llamada al mismo proveedor identifica el error PostgreSQL `22P02` en `learning_v2_imports.issues_json`: el driver pg convierte el array JavaScript de incidencias en un array PostgreSQL, pero la columna y su constraint exigen un documento JSON de tipo array.

Archivo adicional solicitado: `apps/api/src/providers/postgres-guided-learning-v2.ts`, exclusivamente la asignación de `issues_json` en `validateImport`.

```diff
- bindings_json: bindings.data as JsonValue, issues_json: issues as JsonValue,
+ bindings_json: bindings.data as JsonValue, issues_json: JSON.stringify(issues),
```

Se serializa el mismo array calculado, incluidos errores y advertencias; no se omiten incidencias, no se alteran validadores, contratos, constraints, permisos ni reglas de publicación. JSON válido y la forma array siguen siendo exigidos por PostgreSQL.

Verificación propuesta: repetir la importación con los tres paquetes originales y sus fuentes vinculadas, exportar/reimportar sin diferencias, conservar los bloqueos editoriales del piloto y del adversarial y recorrer el paquete sintético a través de HTTP e interfaz con persistencia. Los casos de prueba y sus registros permanecen en `evidencias/T045/`.

Evidencia: `initial-server-failure/`, `synthetic-provider-diagnostic.json`, `server-rerun.txt`. La ejecución usa una base aleatoria desechable derivada del control explícito de prueba en 127.0.0.1:55435; las bases fallidas ya se cerraron y eliminaron mediante el helper existente.

La skill de ejecución exige autorización para archivos fuera de la allowlist; la ficha T045 autoriza la skill y los fixtures/evidencias aislados, no este proveedor. No se inicia T046.
