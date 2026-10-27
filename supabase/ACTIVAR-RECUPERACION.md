# Recuperación de contraseña del personal

La pantalla `administrador.html` permite entrar con nombre o correo y contraseña.
El correo se valida directamente con Supabase Auth; el ingreso por nombre conserva
la función `crear-usuario`. Ambos verifican el perfil, el rol y el estado activo.

## Configuración única antes de publicar

En el proyecto Supabase, abrir Authentication → Email Templates → Reset Password
(según la versión del panel, las plantillas pueden aparecer dentro de Notifications).
Guardar como asunto: `Código para recuperar tu contraseña · INCO`.
Reemplazar el contenido por `templates/recuperacion.html` de esta carpeta. Debe
incluir `{{ .Token }}`: la pantalla espera un código, no un enlace. No sustituir
las plantillas de otros tipos de correo.

Configurar el proveedor de correo SMTP para entregar mensajes a las direcciones
del personal. El servicio de correo predeterminado de Supabase tiene restricciones
y no debe asumirse que permite enviar a todo el personal. Las credenciales SMTP
solo se guardan en Supabase, nunca en los archivos públicos del sitio.

Publicar juntos `administrador.html`, `app.js`, `style.css`, `ver-contrasena.js`,
`recuperar-acceso.html` y `recuperar-acceso.js` en GitHub.

## Comprobación antes de entregar al personal

Con una cuenta de prueba autorizada y su correo real:

1. Solicitar un código desde “¿Olvidaste tu contraseña?” y comprobar la recepción.
2. Confirmar que un código incorrecto no permite cambiar la contraseña.
3. Introducir el código correcto; comprobar que las contraseñas diferentes se rechazan.
4. Guardar una contraseña nueva e ingresar desde la pantalla de acceso.
5. Comprobar que el código usado ya no permite otra recuperación y que una cuenta
   inhabilitada sigue sin acceder al panel.

El flujo no crea cuentas, no altera roles ni habilita cuentas. Si la persona ya no
tiene acceso al correo, el texto indica que debe contactar a la administración;
no se envía automáticamente una solicitud ni se aprueba un cambio sin verificar
la identidad. No se ha comprobado el envío real desde este entorno.

Referencia: https://supabase.com/docs/guides/auth/auth-email-templates
