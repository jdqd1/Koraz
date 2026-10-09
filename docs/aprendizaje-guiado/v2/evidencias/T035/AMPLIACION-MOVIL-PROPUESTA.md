# Ampliación mínima T035 — botón cubierto por navegación móvil

E04 reproduce en iPhone 13 el botón «Comprobar relaciones» cubierto por la
navegación móvil fija. Playwright no consigue descubrirlo mediante scroll y
el clic normal es interceptado por `.mobile-materials-nav`. La captura y traza
están en `browser-artifacts/guided-v2-journeys-E04-all-bf9c7-er-UI-on-desktop-and-mobile-mobile/`.

Archivo adicional solicitado: `apps/web/src/app/learning.css`.

Cambio propuesto dentro de `@media (max-width: 700px)`:

```css
.learning-activity-main[data-engine-version="guided-v2"] {
  padding-bottom: calc(112px + env(safe-area-inset-bottom));
}
```

La reserva inferior permite desplazar los controles de la sesión por encima
de la barra fija (72px más separación y margen de uso). Solo afecta sesiones
v2 móviles. Conserva la estructura visual, navegación y lógica de aprendizaje.

Verificación: E04 completo en escritorio y móvil con clics normales,
comprobación de persistencia por tipo, captura del botón descubierto y
ausencia de desbordamiento horizontal. No usar clic forzado ni ocultar la barra.

Autorización recibida del usuario: «Sí, autorizar la corrección móvil».
Resultado: E04 móvil PASS con clics normales; `mobile-controls-after.png` muestra
el botón completo por encima de la navegación. Se conserva `mobile-overlap-before.png`.
