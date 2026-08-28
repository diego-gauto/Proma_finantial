# Autenticacion

La app usa usuarios propios en la tabla `users` y una cookie httpOnly llamada `fd_session`. En v1 todos los usuarios autenticados tienen el mismo acceso.

## Usuario inicial

Con la base configurada en `DATABASE_URL`, crear o actualizar el primer usuario con:

```bash
pnpm seed:user --email=gerente@example.com --password=change-me
```

El script guarda un hash `scrypt`; nunca guarda la contrasena en texto plano.

## Variables requeridas

- `DATABASE_URL`: conexion PostgreSQL de la app.
- `SESSION_SECRET`: secreto de al menos 32 caracteres para firmar sesiones.
