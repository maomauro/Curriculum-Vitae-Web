/**
 * Bandera en localStorage (no sensible: solo indica "hubo login exitoso antes,
 * probablemente sigo autenticado"). Sirve para evitar llamar a /api/auth/me al
 * cargar la app cuando ya sabemos que no hay sesion — sin esto, esa llamada
 * responde 401 (correcto) pero el navegador la loguea como error de red en la
 * consola aunque el codigo la maneje bien.
 *
 * No reemplaza la verificacion real contra el backend: si la bandera esta
 * presente igual se llama a /me para confirmar (la cookie HttpOnly pudo vencer
 * o ser revocada), y si esa llamada falla la bandera se limpia.
 */
const SESSION_HINT_KEY = 'portalcv_session_hint';

export function markSessionHint(): void {
  try {
    localStorage.setItem(SESSION_HINT_KEY, '1');
  } catch {
    // localStorage puede fallar en modo privado estricto; no es critico.
  }
}

export function clearSessionHint(): void {
  try {
    localStorage.removeItem(SESSION_HINT_KEY);
  } catch {
    // ver nota de markSessionHint
  }
}

export function hasSessionHint(): boolean {
  try {
    return localStorage.getItem(SESSION_HINT_KEY) === '1';
  } catch {
    return false;
  }
}
