# T028 — Estado v2 en ruta, hoy, tarjetas y mapa

**PASS del alcance local de T028, 03/10/2026.** Base
`e1bbc8f9154b5cfe9fb6d5de3562fc11ff4fb30a`. Sin commit ni despliegue.

## Autorización y dependencias

El propietario pidió continuar T028 y, tras revisar el bloqueo documental,
autorizó expresamente («ok, hazlo») consumir la parte verificada de T021 y
dejar upgrade para T034. T021 **continúa PARTIAL**: no se editó su resultado ni
se implementó adopción de versiones. T016 y el predecesor T027 tienen PASS.
`audit-before-authorization-result.json` y `audit-before-authorization.md`
conservan el diagnóstico inicial; ya no describen el estado final de T028.

Se leyeron la ficha T028, §8.12, `DISENO-RUTAS.md`, `apps/web/AGENTS.md` y la guía
local Next sobre componentes servidor/cliente. El handoff define el alcance;
su instrucción histórica de comenzar T001 no sustituye la solicitud vigente.

## Implementación

- Despacho en las páginas existentes de ruta y sesión. Un DTO v1 válido conserva
  su experiencia. El almacenamiento v1 omite filas v2 con 404: solo una lectura
  v2 estrictamente validada permite cambiar de motor. Se admite también el
  mismatch explícito; 401/403/503/conflictos genéricos no disparan el fallback.
- Inicio con catálogo mixto y estado privado. Una matrícula v1 sigue fijada a
  su motor/versionado hasta una adopción explícita. Hoy, tarjetas, progreso,
  ruta, mapa y entrada de sesión separan consumo, dominio histórico,
  consolidación, evidencia actual, refuerzo y repaso. Un recorrido completado
  no se convierte en dominado. Estado ausente no se muestra como cero.
- Los objetivos muestran errores esenciales, refuerzo, logros históricos y la
  razón/siguiente acción recibida del servidor. La interfaz permite examinar
  unidades, pero solo abre la actividad/evaluación/repaso seleccionado por el
  servidor. Una lectura o un click no acredita dominio.
- Matrícula y launcher exclusivamente por BFF v2. Misma idempotency key e ID de
  intento al repetir el mismo input, CAS confirmado y bloqueo de doble click.
  Reanudación lee el intento existente. Errores de conexión no simulan éxito;
  conflictos ofrecen actualizar. Estado/manifest de otra matrícula o versión
  no permite continuar. `returnTo` acepta solo URLs canónicas del mapa.
- Adaptador local de lectura sobre el mapa existente: conserva temas e IDs
  suministrados por su API, navegación tema→ruta→unidad, React Flow, layout,
  controles y v1. No infiere identidad por nombres de temas ni prerrequisitos
  por aristas personales. Unidades v2 muestran objetivos, sin copiarles el
  porcentaje de consumo de la ruta. No hay check ni arrastre para acreditar
  progreso; el guard del adaptador rechaza complete-block para rutas v2 y
  mantiene el transporte existente para layout/operaciones v1.
- El panel de unidad usa el mismo estado y razón que la ruta; vuelve a la URL
  exacta del mapa. Se reutilizan el panel móvil y los patrones existentes.

## Verificación

- Build de contratos: PASS con Node 24.19.0, sin instalar dependencias.
- Regresión focalizada: **67 pruebas / 7 archivos PASS**, incluidas **32 pruebas
  T028** de estado compartido, dispatcher, readers, launcher y adaptador. La
  última pasada (`focused-after-polish.txt`) incluye los ajustes finales.
- Suite web: **386 pruebas / 53 archivos PASS** (`web-suite-final.txt`).
  Los ajustes posteriores se verificaron con la suite focalizada, typecheck,
  ESLint y navegador; no se repitió una pasada global innecesaria.
- Typecheck web y ESLint del alcance modificado: PASS. Diff-check: PASS.
- Chromium real sobre Next en desarrollo con fixtures y mocks tipados: E06 de
  superficies; completitud sin dominio; refuerzo crítico; review/missing/
  revoked/empty; teclado para acción y segunda unidad; mapa por tres niveles;
  URL segura; panel móvil y Escape; pérdida de red/reintento con idénticos
  body/key/CAS y apertura de la URL de sesión. `browser-checks.json`: PASS,
  cero page errors. No es evidencia de persistencia autenticada.
- Viewports DOM reales 360×800, 390×844, 768×1024 y 1440×900: ruta y mapa con
  detalle activo, sin desbordamiento horizontal final ni controles fuera del
  viewport. `map-responsive.json` registra la geometría. La primera lectura
  inmediata de geometría falló; el diagnóstico posterior pasó sin modificar
  código. La pasada definitiva espera fuentes y dos frames de layout, conserva
  el fallo inicial y mide el estado asentado. No se atribuye un arreglo de
  código a ese resultado transitorio.
- CSS zoom 200 % explorado; **zoom nativo de navegador NO VERIFICADO**. Capturas
  inspeccionadas: referencia v1, ruta y mapa en escritorio y móvil.
- Los hashes de los **378 archivos** previos al trabajo permanecen iguales.
  Los cambios anteriores de T020–T027 y las evidencias T021 se conservaron.

## Integración mínima y límites

Se añadió `/visual-fixtures/aprendizaje-v2` como envoltorio mínimo de QA,
protegido por `NODE_ENV=development`, fuera de las páginas productivas. Solo
presenta componentes T028 con datos sintéticos; no es fallback de runtime ni
escribe progreso. El helper de URL conserva esta navegación en el fixture.
Esta extensión de la allowlist permite evidencia concreta de interacción.

La entrada de sesión v2 es la conexión de navegación/estado de T028: **no
implementa formularios, respuestas, ayuda, feedback ni completado de intentos**,
que corresponden a T029–T031. No se inició T029, T032, T034 ni T035.

Los DTO públicos actuales no incluyen fechas futuras de repaso, duración
editorial, lista de prerrequisitos ni consumo por unidad. No se inventaron
esos datos ni se ampliaron contratos. Se usan los contadores, objetivos y
razones públicas disponibles. El adaptador consulta estados y niveles por
tema; la carga a escala corresponde a L03/T038, no se acredita aquí.

E06 autenticado con persistencia real/T035, auditoría completa axe/lector y
zoom nativo/T037, rendimiento a escala, PostgreSQL independiente, contenido
clínico, Hito S y producción siguen **NO VERIFICADO en T028**. Continúan el
timeout API heredado de T024 y el warning `::highlight` preexistente; no se
atribuyen reparaciones a esta tarea. No se activaron flags ni migraciones.
