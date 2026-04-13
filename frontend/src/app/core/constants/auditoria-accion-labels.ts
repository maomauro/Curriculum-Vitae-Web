/** Etiquetas en español para códigos de acción de auditoría (panel admin). */

export const AUDITORIA_ADMIN_ACCION_LABELS: Record<string, string> = {
  'usuario.estado': 'Estado de cuenta',
  'usuario.cv_publicacion': 'CV en portal',
  'usuario.rol_asignado': 'Rol asignado',
  'usuario.rol_quitado': 'Rol quitado',
};

export const AUDITORIA_CV_ACCION_LABELS: Record<string, string> = {
  'cv.personales_upsert': 'Datos personales',
  'cv.perfil_create': 'Perfil — crear',
  'cv.perfil_update': 'Perfil — actualizar',
  'cv.perfil_delete': 'Perfil — eliminar',
  'cv.experiencia_create': 'Experiencia — crear',
  'cv.experiencia_update': 'Experiencia — actualizar',
  'cv.experiencia_delete': 'Experiencia — eliminar',
  'cv.formacion_create': 'Formación — crear',
  'cv.formacion_update': 'Formación — actualizar',
  'cv.formacion_delete': 'Formación — eliminar',
  'cv.habilidad_create': 'Habilidad — crear',
  'cv.habilidad_update': 'Habilidad — actualizar',
  'cv.habilidad_delete': 'Habilidad — eliminar',
  'cv.proyecto_create': 'Proyecto — crear',
  'cv.proyecto_update': 'Proyecto — actualizar',
  'cv.proyecto_delete': 'Proyecto — eliminar',
  'cv.referencia_create': 'Referencia — crear',
  'cv.referencia_update': 'Referencia — actualizar',
  'cv.referencia_delete': 'Referencia — eliminar',
  'cv.redsocial_create': 'Red social — crear',
  'cv.redsocial_update': 'Red social — actualizar',
  'cv.redsocial_delete': 'Red social — eliminar',
  'cv.familiar_create': 'Contacto familiar — crear',
  'cv.familiar_update': 'Contacto familiar — actualizar',
  'cv.familiar_delete': 'Contacto familiar — eliminar',
  'cv.visibilidad_update': 'Visibilidad de secciones',
  'cv.presentacion_plantilla': 'Plantilla de presentación',
  'cv.curriculum_publicacion': 'Publicar / borrador',
};

export function etiquetaAuditoriaAccion(accion: string, map: Record<string, string>): string {
  return map[accion] ?? accion;
}
