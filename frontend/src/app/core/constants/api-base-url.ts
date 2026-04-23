const SWA_HOST_SUFFIX = '.azurestaticapps.net';
const PROD_API_BASE_URL = 'https://portalcv-api.wittyriver-e6fd0cd4.brazilsouth.azurecontainerapps.io';

function isStaticWebAppsHost(hostname: string | undefined): boolean {
  return typeof hostname === 'string' && hostname.endsWith(SWA_HOST_SUFFIX);
}

const hostname = globalThis.location?.hostname;

/**
 * En SWA usamos URL absoluta al backend (ACA) porque no hay backend enlazado
 * en Static Web Apps para resolver rutas relativas /api.
 */
export const API_BASE_URL = isStaticWebAppsHost(hostname) ? PROD_API_BASE_URL : '';
