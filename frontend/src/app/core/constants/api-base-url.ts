const SWA_HOST_SUFFIX = '.azurestaticapps.net';

interface RuntimeConfig {
  apiBaseUrl?: string;
}

declare global {
  interface Window {
    __PORTALCV_CONFIG__?: RuntimeConfig;
  }
}

function isStaticWebAppsHost(hostname: string | undefined): boolean {
  return typeof hostname === 'string' && hostname.endsWith(SWA_HOST_SUFFIX);
}

const hostname = globalThis.location?.hostname;
const runtimeApiBaseUrl = globalThis.window?.__PORTALCV_CONFIG__?.apiBaseUrl?.trim();

/**
 * En SWA usamos URL absoluta al backend (ACA) porque no hay backend enlazado
 * en Static Web Apps para resolver rutas relativas /api.
 */
export const API_BASE_URL = runtimeApiBaseUrl || (isStaticWebAppsHost(hostname) ? '/api' : '');
