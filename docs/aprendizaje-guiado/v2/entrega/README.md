# Entrega de guided-v2 y crear-rutas-koraz

Fecha del usuario: 10/10/2026, America/Caracas. **Instalación y documentación T046: PASS local. Hito K original completo: NO VERIFICADO.** [Acta](../acta-HITO-K.md), [resultado auditable](../evidencias/T046/result.json), [checklist Q01–Q28](../evidencias/T046/checklist-final.json).

La skill está instalada en `C:\Users\josed\.codex\skills\crear-rutas-koraz`, con 12 archivos idénticos a la copia usada en T045. Validador original de skills PASS; seis recursos congelados y 14 hashes del contrato comprobados. Desde el destino se ejecutaron siete comprobaciones CLI: los casos sintético, piloto y adversarial como borrador/publicación portable, y el ejemplo instalado desde otra carpeta. El piloto y el adversarial conservan su bloqueo esperado de publicación. Disponibilidad en el catálogo de una conversación nueva: NO VERIFICADO.

## Manuales

| Necesidad | Documento |
|---|---|
| Crear, corregir, revisar, publicar y versionar | [Administración](../manuales/administracion.md) |
| Diagnóstico, práctica, feedback, progreso y repaso | [Alumno](../manuales/alumno.md) |
| Importar, resolver catálogo/huellas, exportar y reimportar | [Importación](../manuales/importacion.md) |
| Guía + tema, entrega, validación y mantenimiento de skill | [Skill](../manuales/skill.md) |
| Migración, flags, backup, recuperación y operación | [Runbook](../runbook.md) |

## Paquete portable

[Descargar entrega local](../evidencias/T046/entrega-koraz-guided-v2.zip). [Inventario y hashes](../evidencias/T046/delivery-manifest.json).

El ZIP contiene la skill exacta, manuales, runbook, actas, checklist y resúmenes de evidencia. Incluye los tres JSON generados originales de T045 con sus informes y listas de assets, claramente separados: sintético ficticio, piloto curricular **no publicable** y adversarial **no publicable**. Los paquetes contienen soluciones editoriales; se destinan a autoría/importación. Los hashes originales de fuentes pueden requerir vinculación al snapshot real del catálogo; el ZIP no contiene IDs, permisos o aprobaciones productivas.

El paquete permite entregar la implementación y sus instrucciones. El repositorio y los dossiers originales siguen siendo la fuente de evidencia completa; el ZIP contiene una selección declarada, no todas las capturas ni logs.

## Pendientes conservados

1. Q19/V04: inspección hablada completa y discrepancia de persistencia manual, aplazadas expresamente por el usuario en T042. Su aceptación provisional no convierte esa prueba en PASS.
2. Recorrido por navegador del paquete nuevo T045: NO VERIFICADO, con rechazo automático del arranque registrado en su dossier. La prueba HTTP/PostgreSQL no se presenta como prueba de UI.
3. Nuevo piloto T045: `SOURCE_UNRESOLVED` y `SOURCE_CONFLICT`, revisión humana/médica del nuevo hash y publicación pendientes. Se conserva como borrador; la aprobación T039 corresponde a otro paquete.
4. Descubrimiento efectivo de la skill en una conversación posterior, staging, producción y dispositivos físicos: NO VERIFICADO. Better Auth real tiene evidencia local específica en T042; los actores de T045 son fixtures y no acreditan esa capa.

No hubo despliegue, publicación productiva, commit ni cambio de otras skills/configuración/memorias en T046. No se atribuye eficacia educativa o competencia clínica al software. Ninguna tarea posterior se inició.
