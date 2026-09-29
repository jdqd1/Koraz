# T015 — cierre de concurrencia

La implementación previa pasó 7/7 pruebas en PGlite, pero dejó la concurrencia
sin verificar. El cierre añade pruebas a `apps/api/test/guided-v2-attempts.test.ts`
y ejecuta PostgreSQL 17.11 portátil, aislado, en `127.0.0.1:55415`, con la base
`koraz_t015_test`. No instala servicio ni usa `.env` o `DATABASE_URL`.

## Resultado

- 19/19 pruebas PASS: 7 anteriores en PGlite y 12 en PostgreSQL independiente.
- Creación duplicada simultánea: un intento/snapshot y recibo original.
- Respuesta duplicada simultánea: un efecto y recibo original, cinco rondas.
- Respuestas diferentes con el mismo expectedVersion: una aceptada y una
  rechazada; receipts 200/409, cinco rondas.
- Cuerpos diferentes con la misma clave: idempotency_conflict y un solo efecto.
- Cada carrera exige observar dos PID distintos esperando locks antes de
  liberarlos. No basta con lanzar Promise.all.
- Contadores verifican una respuesta, un estado de actividad, un incremento
  de versión y dos eventos (creación + respuesta), sin duplicados.

La primera ejecución falló al preparar la matrícula fuera de una transacción.
Se conserva `postgres-fixture-first-run.txt`; el fixture corregido inserta
matrícula y versión adoptada en una misma transacción. La ejecución final está
en `postgres-concurrency-tests.txt`. No se modificó la lógica del servicio.

## Reproducción en Windows

Con los binarios portátiles de PostgreSQL y Node 24 disponibles:

```powershell
& '.\docs\aprendizaje-guiado\v2\evidencias\T015\run-postgres-concurrency.ps1' `
  -PostgresBin 'C:\Users\josed\.codex\tmp\koraz-t015-postgres\pgsql\bin'
```

El script crea un cluster nuevo, rechaza un puerto ocupado, ejecuta la suite y
detiene el servidor en finally. Conserva su carpeta temporal para inspección.
La suite solo admite la URL local fijada y `KORAZ_TEST_DATABASE=true`, y rechaza
una base con tablas existentes. Sin URL explícita, las 12 pruebas PostgreSQL
se omiten; esa ejecución no demuestra concurrencia ni renueva este PASS.

Binarios: https://get.enterprisedb.com/postgresql/postgresql-17.11-3-windows-x64-binaries.zip
Proveedor: https://www.enterprisedb.com/download-postgresql-binaries

## Límites

El esquema aislado aplica las migraciones hasta 0031, omitiendo
`0005_restore_legacy_content.sql` igual que el fixture T008: esa migración
histórica necesita una identidad real que no se fabrica. No se acredita M01
completo ni el runner de checksums por estas pruebas.

HTTP/SSR, permisos completos, staging y producción siguen fuera de este cierre.
T016 no se inició. El PASS corresponde al alcance de servicios de T015.
