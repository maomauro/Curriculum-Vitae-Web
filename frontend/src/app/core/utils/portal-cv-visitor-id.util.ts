const STORAGE_KEY = 'portalcv_vid';

function isLikelyUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function newUuidV4(): string {
  // Angular 20 soporta solo navegadores modernos: crypto.randomUUID()
  // esta disponible (Chrome 92+, Firefox 95+, Safari 15.4+). No hace
  // falta fallback con Math.random (ReDoS/PRNG inseguro).
  return crypto.randomUUID();
}

/**
 * UUID v4 persistente en localStorage: identifica al visitante anónimo del portal público
 * sin formularios ni consentimiento explícito (solo almacenamiento técnico).
 */
export function getOrCreatePortalCvVisitorId(): string {
  if (typeof localStorage === 'undefined') {
    return '';
  }
  try {
    let id = localStorage.getItem(STORAGE_KEY)?.trim() ?? '';
    if (!id || !isLikelyUuid(id)) {
      id = newUuidV4();
      localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch {
    return '';
  }
}
