# Importar y exportar paquetes de rutas

Entrega T046, 10/10/2026, America/Caracas. Consulta también [administración](administracion.md) y [uso de la skill](skill.md).

## Preparar la entrega

Conserva el JSON exacto, su SHA-256, guía original, revisión de contenido y lista de assets pendientes. Debe ser UTF-8, terminar en `.koraz-route.json`, pesar como máximo 10 MiB y declarar `schemaVersion:2.0` y `policyVersion:guided-v2.0`. El archivo contiene soluciones editoriales privadas y no se distribuye como manifiesto de alumno.

La validación estructural puede aprobar un borrador con incidencias. El resultado portable `publishable:true` solo comprueba reglas internas: tema, fuentes, archivos, permisos y aprobación se resuelven en Koraz. Un paquete `valid:false` necesita corrección antes de considerarse importable.

## Importar por el editor

1. Abre una nueva ruta v2 o el borrador que deseas actualizar en `/panel/rutas`. Pulsa **Importar archivo de ruta** y selecciona el archivo.
2. Selecciona el tema del catálogo, las guías con su revisión y los archivos correspondientes a cada clave portable. Las referencias externas conservan su trazabilidad; no inventes IDs para resolverlas. Un catálogo sin guía/revisión adecuada requiere incorporarla por el proceso editorial existente.
3. Coteja guía, versión, fragmentos, derechos y huellas. Seleccionar una revisión de catálogo no reescribe por sí solo la huella de fuente del paquete importado. Atiende `SOURCE_CHANGED` según el procedimiento siguiente.
4. Pulsa **Comprobar importación**. Revisa **Diferencias e incidencias**, usa **Ir al campo** y corrige lo señalado. Esta comprobación es temporal: cambios de archivo, revisión o vínculos y su vencimiento requieren otra comprobación.
5. Cuando el servidor indique **Listo para importar como borrador**, pulsa **Importar borrador** y espera su lectura confirmada. Si aceptó la operación pero falta confirmar la lectura, usa **Confirmar borrador importado**; conserva la identidad de esa operación.
6. Abre el borrador confirmado, valida, previsualiza y sigue la revisión del [manual administrativo](administracion.md). La importación nunca aprueba ni publica automáticamente.

## Resolver huellas de fuentes

El SHA-256 del archivo original identifica sus bytes. La huella de una revisión Koraz puede corresponder al snapshot canónico y diferir aunque contenga el mismo texto. Ante `SOURCE_CHANGED`, conserva el original y ambos hashes; coteja versión, contenido y **cada** excerpt con la revisión seleccionada. Si realmente cambiaron, registra fuente nueva y pide nueva revisión.

Solo tras ese cotejo puede prepararse una copia vinculada, cambiando `sources[].documentSha256` por la huella real comprobada del catálogo. Registra los campos cambiados y ambos archivos; vuelve a validar y somete el hash resultante a revisión. No reemplaces hashes a ciegas ni suprimas controles. En edición de fuentes, cambiar de guía puede limpiar localizador y excerpt: complétalos de nuevo sobre la revisión efectiva.

## Reimportar y recuperar errores

Mantén `packageKey` y `revision` para repetir la misma operación. Misma identidad/revisión y contenido se resuelven idempotentemente; misma revisión con otro contenido genera conflicto. Para actualizar, abre el borrador correspondiente y usa una revisión mayor, revisando las diferencias y la versión esperada. Una ruta publicada requiere nueva versión editorial.

| Aviso | Acción |
|---|---|
| Versión de esquema desconocida / JSON corrupto | Solicitar contrato compatible o corregir el archivo; no modificar el validador. |
| Fuente o archivo sin vínculo | Resolver el elemento y su revisión en catálogo antes de confirmar. |
| `SOURCE_CHANGED` | Cotejar original y snapshot, registrar ambos hashes y revisar nuevamente. |
| Fuente contradictoria, figura o derechos ausentes | Conservar incidencia y borrador; publicación bloqueada hasta resolución humana. |
| Comprobación vencida o conflicto de versión | Conservar copia; cargar el estado reciente y volver a comprobar. |
| Red falló después del commit | Confirmar la lectura de la operación registrada; no fabricar otra identidad. |

## Exportar y trasladar

Con los cambios guardados, **Exportar paquete** entrega el contenido confirmado y **Descargar cobertura** su informe. Al importar en otro catálogo se necesitan sus propios vínculos y revisión del hash. Los UUID internos pueden ser distintos; el contenido portable debe conservar su semántica. No transportar cookies, secretos, URLs firmadas o aprobaciones como permisos.

T045 comprobó round trip de tres paquetes en PostgreSQL de prueba. El sintético ficticio completó recorrido; el nuevo piloto médico y el adversarial permanecieron bloqueados. [Resultados y límites](../evidencias/T045/README.md).
