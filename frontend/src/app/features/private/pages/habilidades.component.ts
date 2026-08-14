import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { CvEditorService, HabilidadDto, UpsertHabilidadRequest } from '../../../core/services/private/cv-editor.service';
import { NOTIFICATION_MESSAGES } from '../../../core/constants/notification-messages';
import { FORM_MESSAGES } from '../../../core/constants/form-messages';
import { NotificationService } from '../../../core/services/shared/notification.service';
import { extractApiErrorMessage } from '../../../core/utils/form-validation.util';

/** Modelo de fila en pantalla (mismo contrato que la API). */
type HabilidadUI = HabilidadDto;

type HabilidadTipoCv = 'Tecnica' | 'Blanda' | 'Idioma';

@Component({
  selector: 'app-habilidades',
  standalone: false,
  templateUrl: './habilidades.component.html',
})
export class HabilidadesComponent implements OnInit {
  habilidades: HabilidadUI[] = [];
  loading = false;
  private tempSkillSeq = 0;
  private readonly tempSkillKeys = new WeakMap<HabilidadUI, string>();
  private readonly savedFingerprintByKey = new Map<string, string>();
  private readonly savingKeys = new Set<string>();
  private readonly pendingAutosaveKeys = new Set<string>();

  /** Acordeón por sección (todas colapsadas por defecto). */
  accordionTecnicasOpen = false;
  accordionBlandasOpen = false;
  accordionIdiomasOpen = false;

  niveles = ['Básico', 'Intermedio', 'Avanzado', 'Experto'];

  get tecnicas(): HabilidadUI[] {
    return this.habilidades.filter(h => h.tipo !== 'Blanda' && h.tipo !== 'Idioma');
  }

  /** Técnicas ya persistidas (el borrador es la única fila con habilidadId === 0). */
  get tecnicasGuardadas(): HabilidadUI[] {
    return this.tecnicas.filter(h => h.habilidadId !== 0);
  }

  /** Como máximo una fila nueva sin guardar, al estilo del prototipo habilidades.html. */
  get borradorTecnica(): HabilidadUI | null {
    return this.tecnicas.find(h => h.habilidadId === 0) ?? null;
  }

  get hayBorradorTecnica(): boolean {
    return this.borradorTecnica !== null;
  }

  get blandas(): HabilidadUI[] {
    return this.habilidades.filter(h => h.tipo === 'Blanda');
  }

  get blandasGuardadas(): HabilidadUI[] {
    return this.blandas.filter(h => h.habilidadId !== 0);
  }

  get borradorBlanda(): HabilidadUI | null {
    return this.blandas.find(h => h.habilidadId === 0) ?? null;
  }

  get hayBorradorBlanda(): boolean {
    return this.borradorBlanda !== null;
  }

  get idiomas(): HabilidadUI[] {
    return this.habilidades.filter(h => h.tipo === 'Idioma');
  }

  get idiomasGuardadas(): HabilidadUI[] {
    return this.idiomas.filter(h => h.habilidadId !== 0);
  }

  get borradorIdioma(): HabilidadUI | null {
    return this.idiomas.find(h => h.habilidadId === 0) ?? null;
  }

  get hayBorradorIdioma(): boolean {
    return this.borradorIdioma !== null;
  }

  constructor(
    private cvEditorService: CvEditorService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.loading = true;
    this.cvEditorService.getHabilidades().subscribe({
      next: data => {
        this.habilidades = data.map(h => ({ ...h }));
        this.rebuildAutosaveState();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.notificationService.error(NOTIFICATION_MESSAGES.loadError);
      },
    });
  }

  onAgregarHabilidadClick(ev: Event, tipo: HabilidadTipoCv): void {
    ev.stopPropagation();
    if (tipo === 'Tecnica') {
      this.accordionTecnicasOpen = true;
    } else if (tipo === 'Blanda') {
      this.accordionBlandasOpen = true;
    } else {
      this.accordionIdiomasOpen = true;
    }
    this.agregarHabilidad(tipo);
  }

  agregarHabilidad(tipo: HabilidadTipoCv): void {
    if (tipo === 'Tecnica' && this.hayBorradorTecnica) {
      return;
    }
    if (tipo === 'Blanda' && this.hayBorradorBlanda) {
      return;
    }
    if (tipo === 'Idioma' && this.hayBorradorIdioma) {
      return;
    }
    const nueva: HabilidadUI = {
      habilidadId: 0,
      nombre: '',
      tipo,
      nivel: 'Intermedio',
      descripcion: null,
      nivelLectura: null,
      nivelEscritura: null,
      nivelEscucha: null,
      nivelHabla: null,
    };
    this.habilidades.push(nueva);
  }

  /** Quita la fila borrador (habilidadId === 0) sin confirmación. */
  cancelarBorrador(borrador: HabilidadUI | null): void {
    if (borrador) {
      this.eliminar(borrador);
    }
  }

  private buildUpsert(skill: HabilidadUI): UpsertHabilidadRequest {
    return {
      nombre: skill.nombre.trim(),
      tipo: skill.tipo,
      nivel: skill.nivel,
      descripcion: skill.descripcion?.trim() || null,
      nivelLectura: skill.nivelLectura,
      nivelEscritura: skill.nivelEscritura,
      nivelEscucha: skill.nivelEscucha,
      nivelHabla: skill.nivelHabla,
    };
  }

  onSkillFieldCommit(skill: HabilidadUI): void {
    if (!skill.nombre.trim()) {
      return;
    }

    const key = this.getSkillKey(skill);
    if (this.savingKeys.has(key)) {
      this.pendingAutosaveKeys.add(key);
      return;
    }

    if (!this.needsAutosave(skill, key)) {
      return;
    }

    this.persistSkill(skill);
  }

  eliminar(skill: HabilidadUI): void {
    if (skill.habilidadId === 0) {
      this.habilidades = this.habilidades.filter(h => h !== skill);
      return;
    }
    if (!confirm(FORM_MESSAGES.habilidades.confirmDelete)) {
      return;
    }
    this.cvEditorService.deleteHabilidad(skill.habilidadId).subscribe({
      next: () => {
        this.clearSkillTracking(skill);
        this.habilidades = this.habilidades.filter(h => h !== skill);
        this.notificationService.success(NOTIFICATION_MESSAGES.deleteSuccess);
      },
      error: () => this.notificationService.error(NOTIFICATION_MESSAGES.deleteError),
    });
  }

  private persistSkill(skill: HabilidadUI): void {
    const payload = this.buildUpsert(skill);
    const key = this.getSkillKey(skill);
    const request = skill.habilidadId === 0
      ? this.cvEditorService.createHabilidad(payload)
      : this.cvEditorService.updateHabilidad(skill.habilidadId, payload);

    this.savingKeys.add(key);
    request.subscribe({
      next: dto => {
        Object.assign(skill, dto);
        this.markSkillSynced(skill);
        this.notificationService.success(NOTIFICATION_MESSAGES.saveSuccess);
      },
      error: (error: HttpErrorResponse) => {
        this.notificationService.error(extractApiErrorMessage(error) || NOTIFICATION_MESSAGES.saveError);
      },
      complete: () => {
        this.savingKeys.delete(key);
        if (this.pendingAutosaveKeys.delete(key)) {
          this.onSkillFieldCommit(skill);
        }
      },
    });
  }

  private rebuildAutosaveState(): void {
    this.savedFingerprintByKey.clear();
    this.savingKeys.clear();
    this.pendingAutosaveKeys.clear();
    for (const skill of this.habilidades) {
      this.markSkillSynced(skill);
    }
  }

  private markSkillSynced(skill: HabilidadUI): void {
    this.savedFingerprintByKey.set(this.getSkillKey(skill), this.buildSkillFingerprint(skill));
  }

  private needsAutosave(skill: HabilidadUI, key: string): boolean {
    return this.savedFingerprintByKey.get(key) !== this.buildSkillFingerprint(skill);
  }

  private clearSkillTracking(skill: HabilidadUI): void {
    const key = this.getSkillKey(skill);
    this.savedFingerprintByKey.delete(key);
    this.savingKeys.delete(key);
    this.pendingAutosaveKeys.delete(key);
  }

  private getSkillKey(skill: HabilidadUI): string {
    if (skill.habilidadId > 0) {
      return `id:${skill.habilidadId}`;
    }

    const existing = this.tempSkillKeys.get(skill);
    if (existing) {
      return existing;
    }

    this.tempSkillSeq += 1;
    const generated = `tmp:${this.tempSkillSeq}`;
    this.tempSkillKeys.set(skill, generated);
    return generated;
  }

  private buildSkillFingerprint(skill: HabilidadUI): string {
    return JSON.stringify({
      nombre: skill.nombre.trim(),
      tipo: skill.tipo,
      nivel: skill.nivel,
      descripcion: skill.descripcion?.trim() || null,
      nivelLectura: skill.nivelLectura,
      nivelEscritura: skill.nivelEscritura,
      nivelEscucha: skill.nivelEscucha,
      nivelHabla: skill.nivelHabla,
    });
  }
}
