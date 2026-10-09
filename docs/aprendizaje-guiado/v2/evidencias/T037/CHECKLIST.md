# T037 — Checklist V01–V05

Estado: **PASS local**, con lector de pantalla **NO VERIFICADO**. Resultados en `result.json`; recorrido completo y repeticiones afectadas trazados en `browser-matrix-summary.json`.

| Criterio | Evidencia y límite |
| --- | --- |
| V01 | Axe de página completa sin exclusiones; informes por pantalla, capturas, geometría y árbol Chromium. El cierre exige cero serious/critical. |
| V02 | Creación de ruta con teclado y persistencia/reapertura (E01); Tab secuencial hasta campo, flechas entre pestañas, matching y secuencias sin arrastre; diálogo con foco contenido y devuelto al enlace al cancelar/Escape. Centros de sus tres botones alcanzables con puntero. |
| V03 | 1440×900, 360×800, 390×844 y 768×1024; zoom CSS 200 % adicional y zoom nativo Edge 200 %. Sin desborde de página. Campo enfocado a zoom nativo con centro y cuatro esquinas libres. Cabecera ampliada sin solapamiento ni texto dividido letra por letra. |
| V04 | Nombres, landmarks, headings y estados en árbol accesible; feedback con texto, explicación y fuentes; foco contextual tras responder. **Inspección de lector de pantalla: NO VERIFICADO**; no se inspeccionó salida hablada. No se afirma WCAG completa ni aprobación humana. |
| V05 | Selección por touch/puntero dentro del área contenida; letterboxing ignorado; tolerancia ≤1 píxel renderizado, coordenadas conservadas con zoom de imagen 200 %, flechas y variante textual confirmada por el motor. Imagen sintética de un píxel: no acredita legibilidad clínica. |

La galería incluye carga, error, reintento y feedback; el mapa cargado muestra origen, tarjetas, conexiones continuas y control de ajuste alcanzable. Su retorno se comprueba con movimiento reducido y cero animaciones en ejecución. Las tablas y mapas pueden tener desplazamiento dentro de su propia región; la página debe conservar su ancho.
