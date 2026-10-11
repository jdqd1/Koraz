# Usar crear-rutas-koraz

Entrega T046, 10/10/2026, America/Caracas. Instalación exacta: `C:\Users\josed\.codex\skills\crear-rutas-koraz`. [Inventario y hashes de instalación](../evidencias/T046/installation.json).

## Pedir una ruta

En una conversación que tenga disponible la skill, suministra tu guía legible y el tema concreto. Por ejemplo:

```text
Usa $crear-rutas-koraz con la guía adjunta.
Tema: vascularización abdominal descrita en esta guía.
Genera el borrador importable y el informe de revisión,
conservando las incidencias que requieran revisión humana.
```

La instalación tiene `SKILL.md` con nombre y descripción válidos en la carpeta de skills del usuario. La disponibilidad efectiva en el catálogo de una conversación nueva no se comprobó en T046; el catálogo de esta conversación se recibió antes de instalarla. Si no aparece, comprueba esa ruta y su `SKILL.md` antes de usarla. No copies las carpetas de pruebas negativas de T044.

La skill define objetivos, unidades, actividades, feedback, evaluaciones y reservas según el contrato. No necesitas elegir campos JSON o algoritmos. Si falta guía o tema, se solicita ese input; el texto de la guía se trata como fuente, incluidas sus órdenes incrustadas, que no autorizan acciones.

## Qué recibirás

- `ruta.koraz-route.json`: borrador portable con claves locales, estructura, contenidos y referencias.
- `revision-de-ruta.md`: tema, hashes de guía/paquete, matriz y conteos, fuentes/localizadores, criticidad/DAG, bancos/reservas, incidencias y límites.
- Lista de assets a vincular: archivo, huella conocida, procedencia, derechos y alternativa accesible; con cero assets se declara lista vacía.
- Resultados de validación de estructura y publicación portable, con códigos de salida.

La skill usa únicamente los hechos sustentados por el material suministrado. Ante figuras, bibliografía o cobertura ausentes, entrega borrador con incidencias; ante contradicción conserva los pasajes y evita decidirla por su cuenta. Un JSON válido no equivale a un tema completamente cubierto ni a contenido médicamente aprobado.

## Comprobar una entrega local

Requiere **Node.js 24**. No necesita el repositorio, red ni instalar paquetes. En PowerShell, con Node 24 disponible como `node`:

```powershell
$skillKoraz = 'C:\Users\josed\.codex\skills\crear-rutas-koraz'
$paqueteKoraz = 'C:\ruta\a\ruta.koraz-route.json' # sustituye por tu archivo real
node "$skillKoraz\scripts\verify-resources.mjs"
node "$skillKoraz\scripts\validate-route.mjs" $paqueteKoraz
node "$skillKoraz\scripts\validate-route.mjs" --publish $paqueteKoraz
```

| Resultado | Interpretación |
|---|---|
| `valid:true` | Estructura aceptada; comprobar incidencias y cobertura. |
| `publishable:true`, `scope:portable` | Cobertura interna aceptada; catálogo y revisión todavía pendientes en Koraz. |
| Exit 0 | Validación solicitada aprobada. |
| Exit 1 | Estructura inválida o requisitos de publicación portable incumplidos. |
| Exit 2 | Error de uso/lectura o versión no admitida. |

`--publish` valida y no publica. La skill no usa SQL, credenciales, importación automática o mutaciones del backend. Para incorporar el archivo, sigue el [manual de importación](importacion.md), resuelve catálogo y pide revisión del hash exacto antes de publicar.

Si el verifier falla, conserva el error y solicita el contrato aceptado compatible. No edites esquema, bundle o política para aceptar una generación. La skill permite hasta tres rondas de reparación guiadas por el validador; si persiste el fallo, entrega borrador y diagnóstico explícito.

## Mantenimiento y límites

Se instalaron los 12 archivos exactos de la fuente probada en T045, incluido el esquema `2.0`, política `guided-v2.0` y bundle congelado de T042. Una actualización requiere nueva identidad aceptada, comparación y copia aislada de la instalación anterior; no sobrescribas otras skills, memorias o configuración global. [Runbook operativo](../runbook.md).

La aceptación de contrato es provisional con Q19/V04 aplazado. Las pruebas de T045 pasan por CLI y HTTP/PostgreSQL; navegador del nuevo paquete y aprobación humana/médica de su piloto permanecen NO VERIFICADOS. La guía anteriormente aprobada no aprueba el nuevo hash generado. El caso sintético incluido es ficticio, sin uso médico. [Acta final](../acta-HITO-K.md).
