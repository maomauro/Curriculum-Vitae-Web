/**
 * Frontend y backend se sirven desde el mismo origen (el reverse proxy del
 * VPS enruta /api hacia el backend), así que las rutas relativas alcanzan
 * en todos los entornos: en local vía `proxy.conf.js`, en producción vía
 * el proxy del VPS.
 */
export const API_BASE_URL = '';
