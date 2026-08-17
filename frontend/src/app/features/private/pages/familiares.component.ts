import { Component, Input, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { CvEditorService, FamiliarContactoDto, UpsertFamiliarContactoRequest } from '../../../core/services/private/cv-editor.service';
import { NOTIFICATION_MESSAGES } from '../../../core/constants/notification-messages';
import { NotificationService } from '../../../core/services/shared/notification.service';
import { FORM_MESSAGES } from '../../../core/constants/form-messages';
import { extractApiErrorMessage, isValidEmail } from '../../../core/utils/form-validation.util';

interface FamiliarUI extends FamiliarContactoDto {
  editando: boolean;
  form: UpsertFamiliarContactoRequest;
}

@Component({
  selector: 'app-familiares',
  standalone: false,
  templateUrl: './familiares.component.html',
})
export class FamiliaresComponent implements OnInit {
  /** Cuando es true, oculta la cabecera de página (uso dentro de Datos personales). */
  @Input() embedded = false;

  familiares: FamiliarUI[] = [];
  loading = false;
  guardando = false;

  constructor(
    private cvEditorService: CvEditorService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.loading = true;
    this.cvEditorService.getFamiliares().subscribe({
      next: data => {
        this.familiares = data.map(f => ({ ...f, editando: false, form: this.toForm(f) }));
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.notificationService.error(NOTIFICATION_MESSAGES.loadError);
      }
    });
  }

  trackByFamiliar(_index: number, fam: FamiliarUI): string | number {
    return fam.familiarId > 0 ? fam.familiarId : `nuevo-${_index}`;
  }

  tituloCabecera(fam: FamiliarUI): string {
    const d = this.datosFamiliarParaCabecera(fam);
    const linea = `${d.nombres ?? ''} ${d.apellidos ?? ''}`.trim();
    return linea || 'Nuevo contacto';
  }

  subtituloCabecera(fam: FamiliarUI): string {
    const p = (this.datosFamiliarParaCabecera(fam).parentesco ?? '') as string;
    return p.trim() || '—';
  }

  /** En edición o contacto nuevo, la cabecera sigue el formulario; si no, los datos guardados. */
  private datosFamiliarParaCabecera(fam: FamiliarUI): UpsertFamiliarContactoRequest {
    return fam.familiarId === 0 || fam.editando ? fam.form : this.toForm(fam);
  }

  esPrincipalCabecera(fam: FamiliarUI): boolean {
    return fam.familiarId === 0 || fam.editando ? fam.form.esContactoPrincipal : fam.esContactoPrincipal;
  }

  toggleEditarFamiliar(fam: FamiliarUI): void {
    fam.editando = !fam.editando;
    if (fam.editando && fam.familiarId !== 0) {
      fam.form = this.toForm(fam);
    }
  }

  toForm(f: FamiliarContactoDto): UpsertFamiliarContactoRequest {
    return {
      parentesco: f.parentesco ?? null,
      nombres: f.nombres,
      apellidos: f.apellidos,
      email: f.email,
      telefono: f.telefono,
      esContactoPrincipal: f.esContactoPrincipal,
    };
  }

  agregar(): void {
    this.familiares.push({
      familiarId: 0,
      parentesco: null,
      nombres: null,
      apellidos: null,
      email: null,
      telefono: null,
      esContactoPrincipal: false,
      editando: true,
      form: { parentesco: null, nombres: null, apellidos: null, email: null, telefono: null, esContactoPrincipal: false },
    });
  }

  guardar(fam: FamiliarUI): void {
    const nombres = (fam.form.nombres ?? '').trim();
    if (!nombres) {
      this.notificationService.warning(FORM_MESSAGES.familiares.requiredNombres);
      return;
    }
    const emailRaw = (fam.form.email ?? '').trim();
    if (emailRaw && !isValidEmail(emailRaw)) {
      this.notificationService.warning(FORM_MESSAGES.familiares.invalidEmail);
      return;
    }

    fam.form = {
      parentesco: fam.form.parentesco?.trim() || null,
      nombres,
      apellidos: fam.form.apellidos?.trim() || null,
      email: emailRaw || null,
      telefono: fam.form.telefono?.trim() || null,
      esContactoPrincipal: fam.form.esContactoPrincipal,
    };

    this.guardando = true;
    const obs = fam.familiarId === 0
      ? this.cvEditorService.createFamiliar(fam.form)
      : this.cvEditorService.updateFamiliar(fam.familiarId, fam.form);

    obs.subscribe({
      next: data => {
        Object.assign(fam, data, { editando: false, form: this.toForm(data) });
        this.guardando = false;
        this.notificationService.success(NOTIFICATION_MESSAGES.saveSuccess);
      },
      error: (error: HttpErrorResponse) => {
        this.guardando = false;
        this.notificationService.error(extractApiErrorMessage(error) || NOTIFICATION_MESSAGES.saveError);
      }
    });
  }

  /** Quita un contacto recién agregado que aún no se ha guardado en el servidor. */
  cancelar(fam: FamiliarUI): void {
    if (fam.familiarId !== 0) return;
    this.familiares = this.familiares.filter(f => f !== fam);
  }

  eliminar(fam: FamiliarUI): void {
    if (fam.familiarId === 0) return;
    if (!confirm('¿Eliminar este contacto?')) return;
    this.cvEditorService.deleteFamiliar(fam.familiarId).subscribe({
      next: () => {
        this.familiares = this.familiares.filter(f => f !== fam);
        this.notificationService.success(NOTIFICATION_MESSAGES.deleteSuccess);
      },
      error: () => this.notificationService.error(NOTIFICATION_MESSAGES.deleteError)
    });
  }
}
