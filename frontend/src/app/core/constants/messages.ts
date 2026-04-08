export const APP_MESSAGES = {
  es: {
    notifications: {
      loadError: 'No se pudo cargar la información.',
      saveSuccess: 'Información guardada correctamente.',
      saveError: 'No se pudo guardar la información.',
      requiredFieldsWarning: 'Completa los campos obligatorios antes de continuar.',
      invalidDateWarning: 'Hay una fecha inválida. Usa el formato AAAA-MM-DD.',
      createSuccess: 'Registro creado correctamente.',
      updateSuccess: 'Registro actualizado correctamente.',
      deleteSuccess: 'Registro eliminado correctamente.',
      deleteError: 'No se pudo eliminar el registro.',
      operationSuccess: 'Operación completada correctamente.',
      operationError: 'No se pudo completar la operación.',
      operationPartial: 'Operación completada parcialmente.',
    },
    forms: {
      personales: {
        requiredNames: 'Completa primer nombre y primer apellido.',
        requiredEmail: 'Indica el correo electrónico.',
        invalidEmail: 'El correo electrónico no es válido.',
        invalidDate: 'Revisa las fechas de datos personales. Usa formato AAAA-MM-DD.',
      },
      experiencia: {
        invalidDate: 'Revisa las fechas de experiencia. Usa formato AAAA-MM-DD.',
      },
      educacion: {
        invalidDate: 'Revisa las fechas de educación. Usa formato AAAA-MM-DD.',
      },
      referencias: {
        requiredNombre: 'Indica el nombre de la referencia.',
        invalidEmail: 'El correo de la referencia no es válido.',
      },
      familiares: {
        requiredNombres: 'Indica el nombre del contacto familiar.',
        invalidEmail: 'El correo del familiar no es válido.',
      },
      redes: {
        requiredNombreRed: 'Indica el nombre de la red social.',
      },
    },
  },
} as const;

export type AppLocale = keyof typeof APP_MESSAGES;
export const DEFAULT_APP_LOCALE: AppLocale = 'es';

