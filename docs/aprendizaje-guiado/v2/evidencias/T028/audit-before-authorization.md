# T028 — Auditoría de dependencias

Fecha: 03/10/2026. Estado: **NO VERIFICADO**. Implementación pendiente.

La solicitud del propietario autoriza continuar con T028. Se revisaron su ficha,
el diseño vigente, el estado del checkout y las evidencias de sus dependencias.
La instrucción histórica «comienza por T001» no reinicia el trabajo existente.

T016 tiene resultado PASS y T027 está cerrada en PASS. Sin embargo, T028 declara
T021 como dependencia obligatoria y el resultado de T021 sigue en PARTIAL.
Su aceptación de todos los endpoints está pendiente: GET/POST upgrade devuelven
conflicto hasta implementar la adopción explícita de T034. Se corroboró en el
código actual de `apps/api/src/guided-learning/v2/routes.ts`, no solo en una nota
histórica. No se encontró evidencia posterior que cierre T021.

El handoff adjunto, línea 1701, establece: «Una dependencia obligatoria no
verificada bloquea su consumidor, no todas las tareas independientes».
Por ese criterio no se inició la implementación de T028 ni se modificó T034.
Los checks previos de T021 no se repitieron ni se presentan como checks nuevos.

## Decisión concreta pendiente

Para continuar sin adelantar T034, el propietario puede autorizar una excepción
limitada: consumir en T028 los contratos y endpoints de catálogo, home, ruta,
matrícula y estado ya verificados de T021; mantener la adopción de versiones
fuera de T028 y conservar T021 como PARTIAL hasta su cierre real. Esa excepción
no está aprobada por esta auditoría. La alternativa es cerrar primero la
dependencia T021 mediante el trabajo de adopción de T034 autorizado por separado.

## Evidencia y límites

- `result.json`: estado, dependencias, bloqueo y siguiente decisión.
- `source-hashes.json`: hashes de las evidencias y del código inspeccionados.
- `base-sha.txt` y `state-before.txt`: HEAD y cambios previos preservados.
- Solo se agregaron documentos de evidencia T028; no se editó código, no se
  ejecutaron pruebas ni se inició T029. No hay commit ni despliegue.
