# Vista: Login (`/auth/login`)

**Layout:** `AuthLayoutComponent`  
**Módulo:** `AuthModule`  
**Componente:** `LoginComponent`  
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
|          │  Inicia sesión para continuar   │  .login-box-msg |
|          │                                 │                 |
|          │  [ correo electrónico    ✉ ]    │                 |
|          │  [ contraseña            🔒 ]   │  .login-card-   |
|          │                                 │   body          |
|          │  [      Iniciar sesión      ]   │                 |
|          │                                 │                 |
|          │  ¿No tienes cuenta?             │                 |
|          │  Regístrate aquí               │                 |
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
            ├── input-email
            ├── input-password
            ├── btn-login
            └── link-registro
```

---

## Estructura HTML (AdminLTE 4)

```html
<div class="login-box">
  <div class="login-logo">
    <a routerLink="/"><b>Portal</b>CV</a>
  </div>
  <div class="card">
    <div class="card-body login-card-body">
      <p class="login-box-msg">Inicia sesión para continuar</p>
      <form>
        <div class="input-group mb-3">
          <input type="email" class="form-control" placeholder="Correo electrónico">
          <div class="input-group-text">
            <span class="bi bi-envelope"></span>
          </div>
        </div>
        <div class="input-group mb-3">
          <input type="password" class="form-control" placeholder="Contraseña">
          <div class="input-group-text">
            <span class="bi bi-lock-fill"></span>
          </div>
        </div>
        <button type="submit" class="btn btn-primary w-100">
          Iniciar sesión
        </button>
      </form>
      <p class="mt-3 text-center">
        ¿No tienes cuenta?
        <a routerLink="/auth/register">Regístrate aquí</a>
      </p>
    </div>
  </div>
</div>
```

---

## Especificaciones de estilos

| Elemento | Clase AdminLTE 4 | Detalle |
|---|---|---|
| Contenedor | `login-box` | max-width: 360px, centrado automático |
| Logo | `login-logo` | Texto bold, link a `/` |
| Tarjeta | `card` | Sombra leve |
| Cuerpo tarjeta | `card-body login-card-body` | padding: 20px |
| Mensaje | `login-box-msg` | Centrado, `#6C757D` |
| Inputs | `form-control` + `input-group-text` | Icono a la derecha |
| Botón submit | `btn btn-primary w-100` | Azul `#2C7BE5` |

---

## Comportamientos

- Al hacer submit llama a `authService.login(email, password)`
- En caso de éxito navega a `/dashboard`
- En caso de error muestra alerta `alert-danger` debajo del formulario
- Link "Regístrate aquí" navega a `/auth/register`
