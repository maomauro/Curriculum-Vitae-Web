const STORAGE_KEY = 'portalcv_vid';

function isLikelyUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function newUuidV4(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  // Fallback cripto-seguro para navegadores sin crypto.randomUUID
  // (todos los navegadores modernos soportan crypto.getRandomValues desde IE11).
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  // RFC 4122 v4: forzar version (byte 6) y variant (byte 8).
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0'));
  return (
    `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-` +
    `${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-` +
    `${hex.slice(10, 16).join('')}`
  );
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
