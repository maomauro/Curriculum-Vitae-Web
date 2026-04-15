# Vista: Recuperar Contraseña (`/auth/forgot-password`)

**Layout:** `AuthLayoutComponent`  
**Módulo:** `AuthModule`  
**Componente:** `ForgotPasswordComponent`  
**Clases `<body>`:** `login-page bg-body-secondary` (via `Renderer2`)  
**Acceso:** Público (redirige a `/dashboard` si ya está autenticado)  
**Historias relacionadas:** HS-29 (solicitar restablecimiento), HS-32 (validar token y cambiar contraseña)

---

## Flujo en dos pasos

La vista tiene dos estados visuales (mismo componente, sin navegación entre rutas):

| Paso | Descripción | Trigger |
|---|---|---|
| **Paso 1** — Solicitud | Formulario con campo de email + botón "Enviar enlace" | Estado inicial |
| **Paso 2** — Confirmación | Pantalla de éxito con instrucciones de revisión de correo | Al enviar el formulario |

---

## Mockup

### Paso 1 — Solicitud de recuperación

```
         PortalCV
  ┌─────────────────────────┐
  │  Ingresa tu correo y    │
  │  te enviaremos un enlace│
  │  para restablecer tu    │
  │  contraseña.            │
  │                         │
  │  [  correo@email.com  ] │
  │                         │
  │  [ Enviar enlace      ] │
  │                         │
  │  ¿Recordaste tu clave?  │
  │       Inicia sesión     │
  └─────────────────────────┘
```

### Paso 2 — Confirmación de envío

```
         PortalCV
  ┌─────────────────────────┐
  │        [✉ ✓]            │
  │   ¡Revisa tu correo!    │
  │                         │
  │  Enviamos un enlace a   │
  │  correo@email.com       │
  │  Válido 30 minutos.     │
  │                         │
  │  [  Reenviar enlace   ] │
  │  ← Volver al login      │
  └─────────────────────────┘
```

---

## Estructura de capas (Penpot)

```
Board (1440×1024)
└── auth-container  (centrado vertical y horizontal)
    ├── login-logo
    │   └── enlace-home
    ├── card-paso1  (visible inicialmente)
    │   ├── texto-instruccion
    │   ├── campo-email
    │   ├── btn-enviar
    │   └── link-volver-login
    └── card-paso2  (oculto inicialmente, se muestra tras envío)
        ├── icono-exito
        ├── titulo-revisar-correo
        ├── descripcion-correo-enviado
        ├── btn-reenviar
        └── link-volver-login
```

---

## Especificaciones de estilos

| Elemento | Clase / Color | Detalle |
|---|---|---|
| Body | `login-page bg-body-secondary` | AdminLTE AuthLayout |
| Contenedor | `.login-box` | max-width: 360px, centrado |
| Logo | `.login-logo a` | `#2C7BE5`, 2rem, bold |
| Card | `.card` | `border-radius: 12px`, sin borde, sombra `0 4px 24px rgba(0,0,0,.10)` |
| Padding card | `.login-card-body` | 32px horizontal y vertical (28px) |
| Input email | `.input-group` + `.form-control` | Bootstrap, foco `#2C7BE5` |
| Botón enviar | `.btn-login.btn-primary` | `#2C7BE5`, `border-radius: 8px` |
| Ícono éxito | Círculo `#d1e7dd`, ícono `bi-envelope-check-fill` | 72×72px |
| Link volver | `.link-secondary-text a` | `#2C7BE5`, sin subrayado, bold |

---

## Comportamientos

- Si el usuario ya está autenticado, `AuthGuard` redirige a `/dashboard`
- Al enviar el formulario (Paso 1):
  - Validación: email requerido, formato RFC válido
  - Si válido: oculta `card-paso1`, muestra `card-paso2` (sin recarga)
  - Llama a `AuthService.requestPasswordReset(email)` → POST `/api/auth/forgot-password`
  - El backend genera token seguro, envía email con enlace `/auth/reset-password?token=…`
- En Paso 2, botón "Reenviar enlace" vuelve a Paso 1 para permitir reenvío
- El enlace de recuperación del correo lleva a `/auth/reset-password` (fuera de scope de esta vista)
- El token expira en 30 minutos (configuración backend)
- Si el correo no existe en la BD, el backend responde igualmente con éxito (seguridad anti-enumeración)
