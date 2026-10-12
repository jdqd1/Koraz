# Publicación del editor de rutas v2

2026-10-12. Koraz.app sirve la revisión `82bef3ca9ab31bd4a21fca1c7ae8bcfc68c638d3`, anterior al rediseño. La revisión `f616da05b010b77eb6ef91294724652b994850a6` está compilada como vista previa en Vercel, no como producción.

Se prepara `codex/publicar-editor-rutas-v2` desde el `main` vigente, copiando únicamente componentes del editor v2, su fixture de desarrollo, pruebas y evidencia del rediseño. Conserva los últimos cambios publicados de la landing. No incorpora el cambio de longitud mínima de contraseñas, autenticación, backend, Supabase ni el rediseño del reproductor del alumno.

Los selectores de las pruebas de integración se actualizan únicamente para las etiquetas visibles del editor. La validación local previa registró 98 pruebas unitarias y 14 de navegador (escritorio/móvil); se vuelve a verificar la integración aislada antes de la publicación. La inspección autenticada del editor publicado sigue pendiente: el navegador disponible redirige a iniciar sesión.
