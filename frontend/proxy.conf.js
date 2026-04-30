/**
 * Proxy del `ng serve` hacia la API local.
 *
 * Si el API no escucha en 5005 (p. ej. `dotnet run --urls http://127.0.0.1:5307`),
 * arranca Angular con:
 *   PowerShell:  $env:PORTALCV_API_PROXY_TARGET='http://127.0.0.1:5307'; npm start
 *   cmd:         set PORTALCV_API_PROXY_TARGET=http://127.0.0.1:5307&& npm start
 *
 * Por defecto se usa http://localhost:5005 (perfil `http` del launchSettings del API).
 */
const { env } = require('process');

const target = env.PORTALCV_API_PROXY_TARGET || 'http://localhost:5005';

module.exports = {
  '/api': {
    target,
    secure: false,
    changeOrigin: true,
    logLevel: 'info',
  },
  '/health': {
    target,
    secure: false,
    changeOrigin: true,
    logLevel: 'info',
  },
};
