# Autenticación y sesiones

## Contrato

- Better Auth y PostgreSQL siguen siendo la autoridad de identidad. No se usa Supabase Auth ni se almacena la sesión en localStorage.
- Registro con acceso inmediato, sin confirmación de correo. Contraseña nueva: 8–128 caracteres, mayúscula, minúscula y número; símbolo opcional. La política compartida se valida también en API y en cambios/restablecimientos.
- La comprobación de contraseñas filtradas usa la utilidad oficial de Better Auth: solamente envía los primeros cinco caracteres del hash SHA-1. Su espera se limita a cinco segundos; un fallo no crea cuentas ni cambia contraseñas.
- `rememberMe` se envía explícitamente. El servidor guarda `remember_me` en cada sesión; el cliente no puede editar este campo.
- Sesión temporal: cookie sin Max-Age/Expires y vigencia de servidor de 24 horas. Sesión recordada: 30 días desde la última renovación, renovación diaria con actividad y límite absoluto de 90 días desde su creación.
- Las sesiones anteriores a la migración tienen `remember_me=NULL`: conservan la caducidad previa y no se renuevan.
- Better Auth no renueva desde lecturas internas. Solo la respuesta HTTP de `/api/auth/get-session` renueva atómicamente en PostgreSQL y devuelve la cookie. La navegación activa y el enfoque de la ventana vuelven a consultar la sesión. Una revocación concurrente no puede resucitarla.
- Cambio de contraseña y cierre global requieren la contraseña actual. El cambio invalida las sesiones anteriores y la interfaz cierra la sesión de reemplazo. Se conservan los hashes existentes.

## Operación

- `AUTH_PROXY_SECRET` debe tener el mismo valor aleatorio en Vercel y Render; nunca debe llevar prefijo NEXT_PUBLIC. La configuración productiva de API rechaza su ausencia.
- El BFF reemplaza los metadatos de IP usando `x-vercel-forwarded-for` del edge. La API exige el secreto interno antes de aceptar esos datos. Se rechazan mutaciones de origen externo y no se cachean respuestas privadas.
- Límites compartidos en PostgreSQL: 100 accesos/IP/15 minutos, cinco intentos de acceso/correo-IP/15 minutos y diez registros/IP/hora. Las escrituras de los contadores son atómicas. Las respuestas 429 incluyen Retry-After.
- Turnstile conserva la integración existente con apariencia `interaction-only`. Activarlo requiere claves válidas en API y web; no se inventan credenciales ni se presenta como activado cuando no están configuradas.
- Pool principal: máximo ocho conexiones por instancia; pool auxiliar: dos; si se usa AUTH_DATABASE_URL separada, autenticación admite cuatro adicionales. Dimensionar el conjunto de réplicas con la capacidad disponible del pooler antes de aumentarlas.
- Cada hora se eliminan por lotes de hasta 1000 filas las sesiones/verificaciones vencidas y contadores antiguos. Solo los eventos `auth.*` del registro de auditoría se conservan durante 30 días; no se modifica la retención de otros eventos del producto.
- Los logs HTTP aportan estado y latencia sin cookies, contraseñas, secretos ni parámetros de recuperación. Los eventos exitosos se registran en audit_log. Alertar ante aumentos sostenidos de 5xx/429, latencia y saturación del pool.

## Publicación y reversión

1. Aplicar `0037_auth_session_persistence.sql` y registrar su SHA-256 en cediah_schema_migrations. No elimina ni reescribe cuentas o sesiones.
2. Configurar el secreto compartido en ambos servicios. Publicar primero la web que lo envía, antes de habilitar la nueva API que lo exige. La API anterior ignora esa cabecera.
3. Exigir CI, pruebas reales de autenticación y build. Verificar el SHA servido por Vercel y Render, además de los flujos autenticados en producción.
4. Para revertir el código, conservar la columna nullable y las variables; la versión anterior las ignora. No revertir con borrado de usuarios/sesiones ni cambiar BETTER_AUTH_SECRET arbitrariamente.

## Verificación

- Pruebas de API: `test/auth-security.test.ts` usa una base PostgreSQL desechable y Better Auth real. Incluye dos instancias compartiendo contadores, caducidad, límite absoluto, revocación, contraseñas filtradas y ausencia de SMTP. La comprobación externa de filtraciones se simula expresamente.
- Pruebas de BFF: cookies independientes, metadatos del proxy, origen y caída de red.
- Navegador: `work/test/auth-security-server.mts` y `work/test/auth-security-browser.mjs` comprueban registro inmediato, cierre y reapertura del navegador con perfil persistente, sesión temporal, cierre global y 320/390/1440 px. Son fixtures locales, no pruebas de producción ni de reinicio físico del equipo.
- La suite real de autenticación se ejecuta también en CI con PostgreSQL 17.

## Límites aceptados

No se configura SMTP, confirmación de correo ni segundo factor en esta entrega. La recuperación sin SMTP devuelve un error y nunca afirma que envió un enlace. No hay avisos de verificación pendiente en registro/login.

Ocho caracteres sin segundo factor reducen la resistencia ante contraseñas robadas/adivinadas. Un correo sin verificar no acredita titularidad y el registro con acceso inmediato no oculta completamente la existencia de una cuenta. Borrar cookies, usar navegación privada o restaurar sesiones desde funciones del navegador puede cambiar la persistencia observada; el servidor siempre impone su caducidad.
