import { platformBrowser } from '@angular/platform-browser';
import * as bootstrap from 'bootstrap';
import DataTable from 'datatables.net-bs5';
import 'datatables.net-responsive-bs5';

/** Modales de DataTables Responsive (columnas colapsadas en móvil). Ver https://datatables.net/ */
DataTable.use(bootstrap as never, 'bootstrap');

import { AppModule } from './app/app-module';
import { API_BASE_URL } from './app/core/constants/api-base-url';

interface RuntimeConfig {
  apiBaseUrl?: string;
}

declare global {
  interface Window {
    __PORTALCV_CONFIG__?: RuntimeConfig;
  }
}

async function loadRuntimeConfig(): Promise<void> {
  try {
    const response = await fetch('/app-config.json', { cache: 'no-store' });
    if (!response.ok) {
      return;
    }

    const config = await response.json() as RuntimeConfig;
    globalThis.window.__PORTALCV_CONFIG__ = config;
  } catch (err) {
    console.warn('No se pudo cargar app-config.json; se usará la configuración por defecto.', err);
  }
}

/**
 * El JWT vive en una cookie HttpOnly (no accesible desde JS), así que la única
 * forma de restaurar la sesión al recargar la página es preguntarle al backend.
 * Se resuelve antes del bootstrap para que AuthService pueda leer el resultado
 * de forma síncrona en su constructor (mismo patrón que loadRuntimeConfig) y
 * los guards de rutas (authGuard, adminGuard, publicadorGuard) sigan siendo
 * síncronos sin tener que rediseñarlos como asíncronos.
 */
async function loadInitialSession(): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      credentials: 'include',
      cache: 'no-store',
    });
    globalThis.window.__PORTALCV_SESSION__ = response.ok ? await response.json() : null;
  } catch (err) {
    globalThis.window.__PORTALCV_SESSION__ = null;
    console.warn('No se pudo restaurar la sesión; se continúa sin usuario autenticado.', err);
  }
}

void loadRuntimeConfig()
  .then(loadInitialSession)
  .then(() => platformBrowser().bootstrapModule(AppModule, {
    ngZoneEventCoalescing: true,
  }))
  .catch(err => console.error(err));
