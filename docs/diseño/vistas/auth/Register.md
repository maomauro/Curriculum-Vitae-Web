# Vista: Register (`/auth/register`)

**Layout:** `AuthLayoutComponent`  
**Módulo:** `AuthModule`  
**Componente:** `RegisterComponent`  
**Clases `<body>`:** `login-page bg-body-secondary` (via `Renderer2`)

---

## Mockup

```
+--------------------------------------------------------------+
|              fondo gris claro  (bg-body-secondary)           |
|                                                              |
|          ┌─────────────────────────────────┐                 |
|          │         PortalCV                │  .login-logo    |
|          ├─────────────────────────────────┤                 |
|          │  Crea tu cuenta gratuita        │  .login-box-msg |
|          │                                 │                 |
|          │  [ nombre completo       👤 ]   │                 |
|          │  [ correo electrónico    ✉ ]    │  .login-card-   |
|          │  [ contraseña            🔒 ]   │   body          |
|          │                                 │                 |
|          │  [        Registrarse       ]   │                 |
|          │                                 │                 |
|          │  ¿Ya tienes cuenta?             │                 |
|          │  Inicia sesión aquí            │                 |
|          └─────────────────────────────────┘                 |
|                    max-width: 360px                          |
+--------------------------------------------------------------+
```

---

## Estructura de capas (Penpot)

```
Board (1440×1024)
└── login-box
    ├── login-logo
    │   └── texto-PortalCV
    └── card
        └── login-card-body
            ├── mensaje
            ├── input-nombre
            ├── input-email
            ├── input-password
            ├── btn-register
            └── link-login
```

---

## Especificaciones de estilos

Idénticas a [Login.md](./Login.md) con estos cambios:

| Diferencia | Login | Register |
|---|---|---|
| Mensaje | "Inicia sesión para continuar" | "Crea tu cuenta gratuita" |
| Campos | email + password | nombre + email + password |
| Botón | "Iniciar sesión" | "Registrarse" |
| Link inferior | "Regístrate aquí" → `/auth/register` | "Inicia sesión aquí" → `/auth/login` |

---

## Comportamientos

- Al hacer submit llama a `authService.register(nombre, email, password)`
- En caso de éxito navega a `/dashboard`
- En caso de error muestra alerta `alert-danger` bajo el formulario
- Validación: todos los campos requeridos antes de enviar
