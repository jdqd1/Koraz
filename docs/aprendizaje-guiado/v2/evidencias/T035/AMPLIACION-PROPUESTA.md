# Ampliación mínima T035 — entrada de creación v2
E01 exige crear una ruta v2 desde cero por UI/teclado. La página actual
/panel/rutas/nueva abre v1 y no proporciona initialV2Draft, aunque el facade
ya admite ese prop. La importación y la edición v2 existentes no sustituyen E01.

Propuesta concreta:
1. apps/web/src/app/panel/rutas/nueva/page.tsx: mode=v2 explícito, catálogo v2
   confirmado por servidor antes de mostrar el constructor; default v1 preservado.
2. apps/web/src/app/panel/rutas/page.tsx: enlace Crear ruta v2 únicamente si la
   lectura editorial v2 está disponible para esta sesión.
3. apps/web/src/components/learning/editor/v2/new-draft.ts: fábrica vacía,
   sin actividades/dominio/fuentes inventadas; reutiliza EditorShellV2.
4. apps/web/src/components/learning/editor/v2/new-draft.test.ts: shape inicial,
   identificadores locales independientes y ausencia de contenido/progreso.

Sin modificar política, contrato, API ni publicar automáticamente.
Los E2E/harness y scripts permanecen dentro de la ficha T035.

Autorización recibida del usuario en esta conversación: «Sí, autorizar la ampliación T035».
