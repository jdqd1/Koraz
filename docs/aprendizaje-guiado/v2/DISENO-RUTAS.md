# Directriz de diseño para las rutas v2

**Decisión del propietario: 29/09/2026.** La interfaz actual de rutas de aprendizaje
es la base visual y de interacción aprobada. El sistema guided-v2 debe adaptarse
a ese diseño tanto para el alumno como para el administrador.

Conservar la esencia del diseño actual: estructura, jerarquía, navegación,
distribución, componentes, lenguaje visual y patrones de interacción. No iniciar
un rediseño general ni reemplazar la experiencia aprobada por las maquetas o
descripciones históricas del plan. Las secciones funcionales de §8.11 y §8.12
indican capacidades que deben integrarse en la interfaz existente, no una nueva
distribución visual obligatoria.

Se permite crear y modificar controles, formularios, tarjetas, estados, mensajes,
vistas y flujos necesarios para aprender y crear rutas v2. Se permiten mejoras
graduales que mantengan su esencia y la hagan más moderna, intuitiva,
profesional y fácil de usar para alumnos y administradores. Reutilizar primero
los componentes y estilos existentes; evitar duplicar shells, navegación y
patrones para cada versión del motor.

Antes de una tarea de UI, inspeccionar la versión vigente de las pantallas y
capturar la base cuando corresponda. Verificar después la continuidad visual,
los flujos completos de alumno y administrador, estados vacíos/carga/error,
teclado, foco, móvil y zoom. Los nuevos estados pedagógicos deben ser claros y
accionables, sin exponer detalles técnicos innecesarios.

Esta directriz prevalece sobre propuestas visuales anteriores del plan y el
handoff. No cambia umbrales, reglas pedagógicas, contratos, permisos ni criterios
de aceptación funcional. Aplica especialmente a T023–T033 y a la verificación
de UX/accesibilidad T037. T016 implementa backend y no modifica la interfaz.

Referencias iniciales en el repositorio: `learning-path-screen.tsx`,
`learning-path-card.tsx`, `learning-route-editor.tsx`,
`editor/learning-paths-editor-index.tsx`, `editor/route-editor.module.css` y las
pantallas/componentes del mapa vigentes. La referencia visual es siempre el
diseño actual, incluyendo mejoras del propietario posteriores a este documento.
