/**
 * Nombres de rol alineados con `dbo.Rol` / JWT.
 * Visitante existe en catálogo pero no se emite en token (usuario no autenticado).
 */
export const CV_ROL = {
  visitante: 'Visitante',
  publicador: 'Publicador',
  admin: 'Admin',
} as const;

export type CvRolNombre = (typeof CV_ROL)[keyof typeof CV_ROL];
