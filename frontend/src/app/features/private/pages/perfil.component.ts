import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin, Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { CvEditorService, PerfilDto, UpsertPerfilRequest, EnfoqueSugeridoDto } from '../../../core/services/private/cv-editor.service';
import { FORM_MESSAGES } from '../../../core/constants/form-messages';
import { NOTIFICATION_MESSAGES } from '../../../core/constants/notification-messages';
import { NotificationService } from '../../../core/services/shared/notification.service';
import { extractApiErrorMessage } from '../../../core/utils/form-validation.util';

interface PerfilUI extends PerfilDto {
  form: UpsertPerfilRequest;
}

@Component({
  selector: 'app-perfil',
  standalone: false,
  templateUrl: './perfil.component.html',
})
export class PerfilComponent implements OnInit {
  perfiles: PerfilUI[] = [];
  loading = false;
  guardando = false;
  mostrarFormNuevo = false;
  private perfilesAbiertos = new Set<number>();

  enfoqueIa = '';
  generandoConIa = false;
  /** true si el CV todavía no tiene una versión activa propia de GENERADOR_PERFIL
   * y se usó el prompt por defecto del sistema en la última generación. */
  promptGeneradorPorDefecto = false;

  sugerenciasEnfoque: EnfoqueSugeridoDto[] = [];
  sugiriendoEnfoques = false;
  /** true si el CV todavía no tiene una versión activa propia de
   * SUGERIDOR_ENFOQUE_PERFIL y se usó el prompt por defecto del sistema en la última
   * sugerencia. */
  promptSugeridorPorDefecto = false;

  formNuevo: UpsertPerfilRequest = {
    nombrePerfil: null,
    descripcionPerfil: null,
    experienciaPerfilAnios: null,
    aspiracionSalarialPesos: null,
    aspiracionSalarialDolares: null,
    esActivo: true,
    mostrarExperienciaPerfil: true,
    mostrarAspiracionSalarial: true,
  };

  constructor(
    private cvEditorService: CvEditorService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  trackByPerfil(_index: number, p: PerfilUI): number {
    return p.perfilId;
  }

  togglePerfilAccordion(perfilId: number): void {
    if (this.perfilesAbiertos.has(perfilId)) {
      this.perfilesAbiertos.delete(perfilId);
      return;
    }
    this.perfilesAbiertos.add(perfilId);
  }

  isPerfilAccordionOpen(perfilId: number): boolean {
    return this.perfilesAbiertos.has(perfilId);
  }

  private toForm(p: PerfilDto): UpsertPerfilRequest {
    return {
      nombrePerfil: p.nombrePerfil,
      descripcionPerfil: p.descripcionPerfil,
      experienciaPerfilAnios: p.experienciaPerfilAnios,
      aspiracionSalarialPesos: p.aspiracionSalarialPesos,
      aspiracionSalarialDolares: p.aspiracionSalarialDolares,
      esActivo: p.esActivo,
      mostrarExperienciaPerfil: p.mostrarExperienciaPerfil,
      mostrarAspiracionSalarial: p.mostrarAspiracionSalarial,
    };
  }

  private buildRequest(ui: PerfilUI): UpsertPerfilRequest {
    const f = ui.form;
    return {
      nombrePerfil: f.nombrePerfil?.trim() || null,
      descripcionPerfil: f.descripcionPerfil?.trim() || null,
      experienciaPerfilAnios: f.experienciaPerfilAnios ?? null,
      aspiracionSalarialPesos: f.aspiracionSalarialPesos ?? null,
      aspiracionSalarialDolares: f.aspiracionSalarialDolares ?? null,
      esActivo: f.esActivo,
      mostrarExperienciaPerfil: f.mostrarExperienciaPerfil,
      mostrarAspiracionSalarial: f.mostrarAspiracionSalarial,
    };
  }

  cargar(): void {
    this.loading = true;
    this.cvEditorService.getPerfiles().subscribe({
      next: data => {
        this.perfiles = data.map(p => ({ ...p, form: this.toForm(p) }));
        this.perfilesAbiertos.clear();
        this.loading = false;
        this.guardando = false;
      },
      error: () => {
        this.loading = false;
        this.guardando = false;
        this.notificationService.error(NOTIFICATION_MESSAGES.loadError);
      },
    });
  }

  abrirNuevo(): void {
    this.formNuevo = {
      nombrePerfil: null,
      descripcionPerfil: null,
      experienciaPerfilAnios: null,
      aspiracionSalarialPesos: null,
      aspiracionSalarialDolares: null,
      esActivo: true,
      mostrarExperienciaPerfil: true,
      mostrarAspiracionSalarial: true,
    };
    this.enfoqueIa = '';
    this.promptGeneradorPorDefecto = false;
    this.sugerenciasEnfoque = [];
    this.promptSugeridorPorDefecto = false;
    this.mostrarFormNuevo = true;
  }

  cancelarNuevo(): void {
    this.mostrarFormNuevo = false;
    this.sugerenciasEnfoque = [];
  }

  trackBySugerenciaEnfoque(_index: number, s: EnfoqueSugeridoDto): string {
    return s.nombre;
  }

  /** Pide a la IA ideas de enfoque a partir de todo el currículum (Experiencia,
   * Formación, Proyectos, Habilidades) -- para el usuario que no sabe qué escribir en
   * "enfoque". Elegir una sugerencia solo precarga el campo, no genera el perfil por sí
   * sola: el usuario sigue con "Generar con IA" como siempre, o edita el texto antes. */
  sugerirEnfoques(): void {
    if (this.sugiriendoEnfoques) return;

    this.sugiriendoEnfoques = true;
    this.sugerenciasEnfoque = [];
    this.cvEditorService.sugerirEnfoquesPerfil().subscribe({
      next: respuesta => {
        this.sugiriendoEnfoques = false;
        this.sugerenciasEnfoque = respuesta.sugerencias;
        this.promptSugeridorPorDefecto = respuesta.promptPorDefecto;
      },
      error: (error: HttpErrorResponse) => {
        this.sugiriendoEnfoques = false;
        this.notificationService.warning(extractApiErrorMessage(error) || 'No se pudieron sugerir enfoques con IA.');
      },
    });
  }

  usarSugerenciaEnfoque(s: EnfoqueSugeridoDto): void {
    this.enfoqueIa = s.nombre;
    this.sugerenciasEnfoque = [];
  }

  /** Genera con IA un borrador de Nombre + Descripción a partir del enfoque escrito y
   * el currículum real -- solo precarga los campos, el usuario los revisa y edita antes
   * de "Crear perfil" (no persiste nada por sí solo). */
  generarConIa(): void {
    const enfoque = this.enfoqueIa.trim();
    if (!enfoque || this.generandoConIa) return;

    this.generandoConIa = true;
    this.cvEditorService.generarPerfilConIa(enfoque).subscribe({
      next: borrador => {
        this.generandoConIa = false;
        this.formNuevo.nombrePerfil = borrador.nombrePerfil;
        this.formNuevo.descripcionPerfil = borrador.descripcionPerfil;
        this.promptGeneradorPorDefecto = borrador.promptPorDefecto;
      },
      error: (error: HttpErrorResponse) => {
        this.generandoConIa = false;
        this.notificationService.warning(extractApiErrorMessage(error) || 'No se pudo generar el perfil con IA.');
      },
    });
  }

  /** Al activar un perfil, se desactivan el resto en servidor y se refresca la lista. */
  onActivoChange(p: PerfilUI, checked: boolean): void {
    if (checked) {
      this.perfiles.forEach(x => {
        if (x.perfilId !== p.perfilId) {
          x.form.esActivo = false;
        }
      });
      p.form.esActivo = true;
      this.persistirActivacionUnica(p);
    } else {
      p.form.esActivo = false;
    }
  }

  private persistirActivacionUnica(p: PerfilUI): void {
    const otros = this.perfiles.filter(x => x.perfilId !== p.perfilId);
    const desactivar$: Observable<PerfilDto[] | null> =
      otros.length > 0
        ? forkJoin(
            otros.map(o =>
              this.cvEditorService.updatePerfil(o.perfilId, {
                ...this.buildRequest(o),
                esActivo: false,
              })
            )
          )
        : of(null);

    this.guardando = true;
    desactivar$
      .pipe(
        switchMap(() =>
          this.cvEditorService.updatePerfil(p.perfilId, {
            ...this.buildRequest(p),
            esActivo: true,
          })
        )
      )
      .subscribe({
        next: () => {
          this.notificationService.success(NOTIFICATION_MESSAGES.updateSuccess);
          this.cargar();
        },
        error: (error: HttpErrorResponse) => {
          this.guardando = false;
          this.notificationService.error(extractApiErrorMessage(error) || NOTIFICATION_MESSAGES.saveError);
          this.cargar();
        },
      });
  }

  crear(): void {
    const nombre = (this.formNuevo.nombrePerfil ?? '').trim();
    if (!nombre) {
      this.notificationService.warning(FORM_MESSAGES.perfil.requiredNombre);
      return;
    }

    const payload: UpsertPerfilRequest = {
      nombrePerfil: nombre,
      descripcionPerfil: this.formNuevo.descripcionPerfil?.trim() || null,
      experienciaPerfilAnios: this.formNuevo.experienciaPerfilAnios ?? null,
      aspiracionSalarialPesos: this.formNuevo.aspiracionSalarialPesos ?? null,
      aspiracionSalarialDolares: this.formNuevo.aspiracionSalarialDolares ?? null,
      esActivo: this.formNuevo.esActivo,
      mostrarExperienciaPerfil: this.formNuevo.mostrarExperienciaPerfil,
      mostrarAspiracionSalarial: this.formNuevo.mostrarAspiracionSalarial,
    };

    this.guardando = true;

    const desactivarExistentes$: Observable<PerfilDto[] | null> =
      payload.esActivo && this.perfiles.length > 0
        ? forkJoin(
            this.perfiles.map(o =>
              this.cvEditorService.updatePerfil(o.perfilId, {
                ...this.buildRequest(o),
                esActivo: false,
              })
            )
          )
        : of(null);

    desactivarExistentes$
      .pipe(switchMap(() => this.cvEditorService.createPerfil(payload)))
      .subscribe({
        next: () => {
          this.mostrarFormNuevo = false;
          this.notificationService.success(NOTIFICATION_MESSAGES.createSuccess);
          this.cargar();
        },
        error: (error: HttpErrorResponse) => {
          this.guardando = false;
          this.notificationService.error(extractApiErrorMessage(error) || NOTIFICATION_MESSAGES.saveError);
        },
      });
  }

  guardar(p: PerfilUI): void {
    const nombre = (p.form.nombrePerfil ?? '').trim();
    if (!nombre) {
      this.notificationService.warning(FORM_MESSAGES.perfil.requiredNombre);
      return;
    }
    p.form.nombrePerfil = nombre;
    const payload = this.buildRequest(p);

    this.guardando = true;

    if (payload.esActivo) {
      const otros = this.perfiles.filter(x => x.perfilId !== p.perfilId);
      const desactivar$: Observable<PerfilDto[] | null> =
        otros.length > 0
          ? forkJoin(
              otros.map(o =>
                this.cvEditorService.updatePerfil(o.perfilId, {
                  ...this.buildRequest(o),
                  esActivo: false,
                })
              )
            )
          : of(null);

      desactivar$
        .pipe(switchMap(() => this.cvEditorService.updatePerfil(p.perfilId, { ...payload, esActivo: true })))
        .subscribe({
          next: () => {
            this.notificationService.success(NOTIFICATION_MESSAGES.updateSuccess);
            this.cargar();
          },
          error: (error: HttpErrorResponse) => {
            this.guardando = false;
            this.notificationService.error(extractApiErrorMessage(error) || NOTIFICATION_MESSAGES.saveError);
            this.cargar();
          },
        });
    } else {
      this.cvEditorService.updatePerfil(p.perfilId, payload).subscribe({
        next: () => {
          this.notificationService.success(NOTIFICATION_MESSAGES.updateSuccess);
          this.cargar();
        },
        error: (error: HttpErrorResponse) => {
          this.guardando = false;
          this.notificationService.error(extractApiErrorMessage(error) || NOTIFICATION_MESSAGES.saveError);
          this.cargar();
        },
      });
    }
  }

  eliminar(p: PerfilUI): void {
    if (!confirm('¿Eliminar este perfil?')) {
      return;
    }
    this.guardando = true;
    this.cvEditorService.deletePerfil(p.perfilId).subscribe({
      next: () => {
        this.notificationService.success(NOTIFICATION_MESSAGES.deleteSuccess);
        this.cargar();
      },
      error: () => {
        this.guardando = false;
        this.notificationService.error(NOTIFICATION_MESSAGES.deleteError);
      },
    });
  }
}
