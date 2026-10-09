# Cierre del timeout heredado de T024

PASS local, 04/10/2026. Petición: ejecutar T024 → 0005/M01 → T035.
La reproducción inicial pasó 18/18; el fallo histórico era intermitente.
El caso I01/I02 arrancaba otra PGlite y aplicaba migraciones dentro de sus 5000 ms.
La segunda DB y su catálogo se preparan ahora en el beforeAll existente;
el caso conserva todos los checks de UUID distintos, hashes semánticos, bindings,
commit, replay y exportación. No se cambia timeout ni código de producto.

Regresión relevante: 55 PASS en seis archivos. Dos repeticiones aisladas:
18 PASS cada una; el roundtrip pasó en 270 ms en la primera. ESLint PASS.
Los logs históricos de T024 permanecen; result.json original señala el cierre.
Esto no acredita Hito S, producción ni toda la regresión API.
