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
      passwordChanged: 'Contraseña actualizada correctamente.',
      cvPublicacionUpdated: 'Estado de publicación del CV actualizado.',
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
        invalidDateRange: 'Las fechas de experiencia deben estar entre 1950-01-01 y hoy.',
        endBeforeStart: 'La fecha de fin no puede ser anterior a la fecha de inicio.',
        requiredEmpresa: 'Indica el nombre de la empresa.',
        requiredCargo: 'Indica el cargo o puesto.',
        refPendientesAlCrearEmpleo:
          'Agrega referencias con el mismo formulario que en empleos guardados; pulsa Guardar en cada una y luego Crear empleo.',
        refBorradorSinGuardar:
          'Guarda o cancela cada referencia en borrador (sin Guardar) antes de crear el empleo.',
        completeNuevoAntesDeOtro: 'Termina o cancela el empleo nuevo antes de agregar otro.',
      },
      educacion: {
        invalidDate: 'Revisa las fechas de educación. Usa formato AAAA-MM-DD.',
        requiredTituloObtenido: 'Indica el título obtenido.',
        requiredNombreCertificado: 'Indica el nombre del certificado.',
        requiredInstitucion: 'Indica la institución.',
        requiredEntidadCertificadora: 'Indica la entidad certificadora.',
        completeNuevaAntesDeOtra: 'Termina o cancela la formación nueva antes de agregar otra.',
        confirmDelete: '¿Eliminar esta formación?',
      },
      referencias: {
        requiredNombre: 'Indica el nombre de la referencia.',
        invalidEmail: 'El correo de la referencia no es válido.',
      },
      familiares: {
        requiredNombres: 'Indica el nombre del contacto familiar.',
        invalidEmail: 'El correo del familiar no es válido.',
      },
      habilidades: {
        confirmDelete: '¿Eliminar esta habilidad?',
        nothingToSaveTecnicas: 'Agrega al menos una fila con nombre antes de guardar las habilidades técnicas.',
        nothingToSaveBlandas: 'Agrega al menos una fila con nombre antes de guardar las habilidades blandas.',
        nothingToSaveIdiomas: 'Agrega al menos una fila con nombre antes de guardar los idiomas.',
      },
      redes: {
        requiredNombreRed: 'Indica el nombre de la red social.',
      },
      perfil: {
        requiredNombre: 'Indica el nombre del perfil o cargo objetivo.',
      },
      proyectos: {
        requiredNombreRol: 'Indica el nombre del proyecto y tu rol en el proyecto.',
        completeNuevoAntesDeOtro: 'Termina o cancela el proyecto nuevo antes de agregar otro.',
        confirmDelete: '¿Eliminar este proyecto?',
      },
      configuracion: {
        passwordCurrentRequired: 'Indica tu contraseña actual.',
        passwordNewRequired: 'Indica la nueva contraseña.',
        passwordMinLength: 'La nueva contraseña debe tener al menos 8 caracteres.',
        passwordMismatch: 'La nueva contraseña y su confirmación no coinciden.',
      },
    },
  },
} as const;

export type AppLocale = keyof typeof APP_MESSAGES;
export const DEFAULT_APP_LOCALE: AppLocale = 'es';

