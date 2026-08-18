import { platformBrowser } from '@angular/platform-browser';
import * as bootstrap from 'bootstrap';
import DataTable from 'datatables.net-bs5';
import 'datatables.net-responsive-bs5';

/** Modales de DataTables Responsive (columnas colapsadas en móvil). Ver https://datatables.net/ */
DataTable.use(bootstrap as never, 'bootstrap');

import { AppModule } from './app/app-module';
import { API_BASE_URL } from './app/core/constants/api-base-url';
import { clearSessionHint, hasSessionHint, markSessionHint } from './app/core/constants/session-hint';

/**
 * El JWT vive en una cookie HttpOnly (no accesible desde JS), así que la única
 * forma de restaurar la sesión al recargar la página es preguntarle al backend.
 * Se resuelve antes del bootstrap para que AuthService pueda leer el resultado
 * de forma síncrona en su constructor y los guards de rutas (authGuard, adminGuard,
 * publicadorGuard) sigan siendo síncronos sin tener que rediseñarlos como asíncronos.
 *
 * API_BASE_URL ya llega resuelto correctamente en este punto: index.html define
 * window.__PORTALCV_CONFIG__ (inyectado en build por deploy-frontend-swa.yml) antes
 * de evaluar este bundle. En dev (sin inyeccion) usa su fallback por hostname.
 *
 * Si no hay indicio de sesión previa (hasSessionHint), se omite la llamada a /me:
 * de otro modo el backend respondería 401 (correcto, pero es una petición de red
 * fallida que el navegador loguea igual, aunque el código la maneje bien).
 */
async function loadInitialSession(): Promise<void> {
  if (!hasSessionHint()) {
    globalThis.window.__PORTALCV_SESSION__ = null;
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      credentials: 'include',
      cache: 'no-store',
    });
    if (response.ok) {
      globalThis.window.__PORTALCV_SESSION__ = await response.json();
      markSessionHint();
    } else {
      globalThis.window.__PORTALCV_SESSION__ = null;
      clearSessionHint();
    }
  } catch (err) {
    globalThis.window.__PORTALCV_SESSION__ = null;
    console.warn('No se pudo restaurar la sesión; se continúa sin usuario autenticado.', err);
  }
}

void loadInitialSession()
  .then(() => platformBrowser().bootstrapModule(AppModule, {
    ngZoneEventCoalescing: true,
  }))
  .catch(err => console.error(err));
