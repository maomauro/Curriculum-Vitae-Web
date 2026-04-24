import { API_BASE_URL } from './api-base-url';

/** Snapshot dinámico actualizado por backend en memoria (si DB estuvo lista). */
export const PUBLIC_CVS_SNAPSHOT_API_URL = `${API_BASE_URL}/api/public/snapshot`;

/** Fallback estático si aún no existe snapshot dinámico. */
export const PUBLIC_CVS_SNAPSHOT_STATIC_URL = '/snapshots/public-cvs-snapshot.json';

