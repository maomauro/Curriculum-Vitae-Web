import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin } from 'rxjs';
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
  template: `
    <!-- Cabecera — prototipo habilidades.html -->
    <div class="page-header">
      <div>
        <h4><i class="bi bi-stars me-2 text-primary"></i>Habilidades</h4>
        <p class="text-muted small mb-0">
          Registra habilidades técnicas, blandas e idiomas; cada bloque se guarda con su botón Guardar.
        </p>
      </div>
    </div>

    <div *ngIf="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
    </div>

    <ng-container *ngIf="!loading">

    <!-- Habilidades técnicas — acordeón -->
    <div class="seccion-card hab-tecnica-block overflow-hidden">
      <div class="d-flex flex-wrap justify-content-between align-items-center gap-3 hab-tecnica-head">
        <div class="d-flex align-items-start gap-2 flex-grow-1 min-w-0 hab-accordion-title-hit rounded px-1 py-1"
             role="button" tabindex="0"
             id="hab-trigger-tecnica"
             [attr.aria-expanded]="accordionTecnicasOpen"
             aria-controls="hab-panel-tecnica"
             (click)="accordionTecnicasOpen = !accordionTecnicasOpen"
             (keydown.enter)="accordionTecnicasOpen = !accordionTecnicasOpen"
             (keydown.space)="$event.preventDefault(); accordionTecnicasOpen = !accordionTecnicasOpen">
          <i class="bi cv-chevron-muted flex-shrink-0 mt-1" aria-hidden="true"
             [class.bi-chevron-down]="!accordionTecnicasOpen"
             [class.bi-chevron-up]="accordionTecnicasOpen"></i>
          <div>
            <div class="seccion-titulo mb-0"><i class="bi bi-cpu-fill"></i>Habilidades Técnicas</div>
            <div class="seccion-subtitulo mb-0">Tecnologías, lenguajes, frameworks y herramientas</div>
          </div>
        </div>
        <button type="button" class="btn btn-outline-secondary btn-sm flex-shrink-0"
                (click)="onAgregarHabilidadClick($event, 'Tecnica')"
                [disabled]="hayBorradorTecnica || guardandoTecnicas"
                [attr.title]="hayBorradorTecnica ? 'Guarda con «Guardar» o cancela la fila nueva antes de agregar otra.' : null">
          <i class="bi bi-plus-circle me-1"></i>Agregar habilidad técnica
        </button>
      </div>

      <div *ngIf="accordionTecnicasOpen" id="hab-panel-tecnica" role="region" aria-labelledby="hab-trigger-tecnica"
           class="hab-accordion-panel cv-border-t-soft pt-3">
      <div class="hab-tecnica-rows">
        <div class="skill-row skill-row--header">
          <div class="skill-name"><small class="text-muted fw-bold">Nombre</small></div>
          <div class="skill-level"><small class="text-muted fw-bold">Nivel</small></div>
          <div class="skill-desc"><small class="text-muted fw-bold">Descripción (opcional)</small></div>
          <div class="skill-actions" aria-hidden="true"></div>
        </div>

        <div class="skill-row" *ngFor="let skill of tecnicasGuardadas">
          <div class="skill-name">
            <input type="text" class="form-control form-control-sm" [(ngModel)]="skill.nombre"
                   placeholder="Nombre de la habilidad">
          </div>
          <div class="skill-level">
            <select class="form-select form-select-sm" [(ngModel)]="skill.nivel">
              <option *ngFor="let n of niveles" [ngValue]="n">{{ n }}</option>
            </select>
          </div>
          <div class="skill-desc">
            <input type="text" class="form-control form-control-sm" [(ngModel)]="skill.descripcion"
                   placeholder="Descripción opcional">
          </div>
          <div class="skill-actions">
            <button type="button" class="btn-hab-del" (click)="eliminar(skill)" title="Eliminar habilidad">
              <i class="bi bi-trash3"></i>
            </button>
          </div>
        </div>

        <div class="skill-row" *ngIf="borradorTecnica as draft">
          <div class="skill-name">
            <input type="text" class="form-control form-control-sm" [(ngModel)]="draft.nombre"
                   placeholder="Nombre de la habilidad">
          </div>
          <div class="skill-level">
            <select class="form-select form-select-sm" [(ngModel)]="draft.nivel">
              <option *ngFor="let n of niveles" [ngValue]="n">{{ n }}</option>
            </select>
          </div>
          <div class="skill-desc">
            <input type="text" class="form-control form-control-sm" [(ngModel)]="draft.descripcion"
                   placeholder="Descripción opcional">
          </div>
          <div class="skill-actions">
            <button type="button" class="btn-hab-del" (click)="cancelarBorrador(borradorTecnica)"
                    title="Cancelar fila nueva (sin guardar)">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>
        </div>

        <div class="skill-row" *ngIf="tecnicasGuardadas.length === 0 && !borradorTecnica">
          <div class="w-100 text-muted small text-center py-3">
            No hay habilidades técnicas. Usa «Agregar habilidad técnica» para añadir la primera.
          </div>
        </div>
      </div>

      <div class="d-flex justify-content-end mt-3 flex-wrap gap-2">
        <button type="button" class="btn btn-primary px-4" (click)="guardarTodasTecnicas()" [disabled]="guardandoTecnicas">
          <span *ngIf="guardandoTecnicas" class="spinner-border spinner-border-sm me-2" role="status"></span>
          <i *ngIf="!guardandoTecnicas" class="bi bi-floppy-fill me-2"></i>Guardar
        </button>
      </div>
      </div>
    </div>

    <!-- Habilidades blandas — acordeón -->
    <div class="seccion-card hab-blanda-block overflow-hidden">
      <div class="d-flex flex-wrap justify-content-between align-items-center gap-3 hab-blanda-head">
        <div class="d-flex align-items-start gap-2 flex-grow-1 min-w-0 hab-accordion-title-hit rounded px-1 py-1"
             role="button" tabindex="0"
             id="hab-trigger-blanda"
             [attr.aria-expanded]="accordionBlandasOpen"
             aria-controls="hab-panel-blanda"
             (click)="accordionBlandasOpen = !accordionBlandasOpen"
             (keydown.enter)="accordionBlandasOpen = !accordionBlandasOpen"
             (keydown.space)="$event.preventDefault(); accordionBlandasOpen = !accordionBlandasOpen">
          <i class="bi cv-chevron-muted flex-shrink-0 mt-1" aria-hidden="true"
             [class.bi-chevron-down]="!accordionBlandasOpen"
             [class.bi-chevron-up]="accordionBlandasOpen"></i>
          <div>
            <div class="seccion-titulo mb-0"><i class="bi bi-heart-fill"></i>Habilidades blandas</div>
            <div class="seccion-subtitulo mb-0">Competencias interpersonales y soft skills</div>
          </div>
        </div>
        <button type="button" class="btn btn-outline-secondary btn-sm flex-shrink-0"
                (click)="onAgregarHabilidadClick($event, 'Blanda')"
                [disabled]="hayBorradorBlanda || guardandoBlandas"
                [attr.title]="hayBorradorBlanda ? 'Guarda con «Guardar» o cancela la fila nueva antes de agregar otra.' : null">
          <i class="bi bi-plus-circle me-1"></i>Agregar habilidad blanda
        </button>
      </div>

      <div *ngIf="accordionBlandasOpen" id="hab-panel-blanda" role="region" aria-labelledby="hab-trigger-blanda"
           class="hab-accordion-panel cv-border-t-soft pt-3">
      <div class="hab-blanda-rows">
        <div class="skill-row skill-row--header">
          <div class="skill-name"><small class="text-muted fw-bold">Nombre</small></div>
          <div class="skill-level"><small class="text-muted fw-bold">Nivel</small></div>
          <div class="skill-desc"><small class="text-muted fw-bold">Descripción (opcional)</small></div>
          <div class="skill-actions" aria-hidden="true"></div>
        </div>

        <div class="skill-row" *ngFor="let skill of blandasGuardadas">
          <div class="skill-name">
            <input type="text" class="form-control form-control-sm" [(ngModel)]="skill.nombre"
                   placeholder="Nombre de la habilidad">
          </div>
          <div class="skill-level">
            <select class="form-select form-select-sm" [(ngModel)]="skill.nivel">
              <option *ngFor="let n of niveles" [ngValue]="n">{{ n }}</option>
            </select>
          </div>
          <div class="skill-desc">
            <input type="text" class="form-control form-control-sm" [(ngModel)]="skill.descripcion"
                   placeholder="Descripción opcional">
          </div>
          <div class="skill-actions">
            <button type="button" class="btn-hab-del" (click)="eliminar(skill)" title="Eliminar habilidad">
              <i class="bi bi-trash3"></i>
            </button>
          </div>
        </div>

        <div class="skill-row" *ngIf="borradorBlanda as draftB">
          <div class="skill-name">
            <input type="text" class="form-control form-control-sm" [(ngModel)]="draftB.nombre"
                   placeholder="Nombre de la habilidad">
          </div>
          <div class="skill-level">
            <select class="form-select form-select-sm" [(ngModel)]="draftB.nivel">
              <option *ngFor="let n of niveles" [ngValue]="n">{{ n }}</option>
            </select>
          </div>
          <div class="skill-desc">
            <input type="text" class="form-control form-control-sm" [(ngModel)]="draftB.descripcion"
                   placeholder="Descripción opcional">
          </div>
          <div class="skill-actions">
            <button type="button" class="btn-hab-del" (click)="cancelarBorrador(borradorBlanda)"
                    title="Cancelar fila nueva (sin guardar)">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>
        </div>

        <div class="skill-row" *ngIf="blandasGuardadas.length === 0 && !borradorBlanda">
          <div class="w-100 text-muted small text-center py-3">
            No hay habilidades blandas. Usa «Agregar habilidad blanda» para añadir la primera.
          </div>
        </div>
      </div>

      <div class="d-flex justify-content-end mt-3 flex-wrap gap-2">
        <button type="button" class="btn btn-primary px-4" (click)="guardarTodasBlandas()" [disabled]="guardandoBlandas">
          <span *ngIf="guardandoBlandas" class="spinner-border spinner-border-sm me-2" role="status"></span>
          <i *ngIf="!guardandoBlandas" class="bi bi-floppy-fill me-2"></i>Guardar
        </button>
      </div>
      </div>
    </div>

    <!-- Idiomas — acordeón -->
    <div class="seccion-card hab-idioma-block overflow-hidden">
      <div class="d-flex flex-wrap justify-content-between align-items-center gap-3 hab-idioma-head">
        <div class="d-flex align-items-start gap-2 flex-grow-1 min-w-0 hab-accordion-title-hit rounded px-1 py-1"
             role="button" tabindex="0"
             id="hab-trigger-idioma"
             [attr.aria-expanded]="accordionIdiomasOpen"
             aria-controls="hab-panel-idioma"
             (click)="accordionIdiomasOpen = !accordionIdiomasOpen"
             (keydown.enter)="accordionIdiomasOpen = !accordionIdiomasOpen"
             (keydown.space)="$event.preventDefault(); accordionIdiomasOpen = !accordionIdiomasOpen">
          <i class="bi cv-chevron-muted flex-shrink-0 mt-1" aria-hidden="true"
             [class.bi-chevron-down]="!accordionIdiomasOpen"
             [class.bi-chevron-up]="accordionIdiomasOpen"></i>
          <div>
            <div class="seccion-titulo mb-0"><i class="bi bi-translate"></i>Idiomas</div>
            <div class="seccion-subtitulo mb-0">Lenguas que manejas: nombre, nivel general y detalle opcional</div>
          </div>
        </div>
        <button type="button" class="btn btn-outline-secondary btn-sm flex-shrink-0"
                (click)="onAgregarHabilidadClick($event, 'Idioma')"
                [disabled]="hayBorradorIdioma || guardandoIdiomas"
                [attr.title]="hayBorradorIdioma ? 'Guarda con «Guardar» o cancela la fila nueva antes de agregar otra.' : null">
          <i class="bi bi-plus-circle me-1"></i>Agregar idioma
        </button>
      </div>

      <div *ngIf="accordionIdiomasOpen" id="hab-panel-idioma" role="region" aria-labelledby="hab-trigger-idioma"
           class="hab-accordion-panel cv-border-t-soft pt-3">
      <div class="hab-idioma-rows">
        <div class="skill-row skill-row--header">
          <div class="skill-name"><small class="text-muted fw-bold">Nombre</small></div>
          <div class="skill-level"><small class="text-muted fw-bold">Nivel</small></div>
          <div class="skill-desc"><small class="text-muted fw-bold">Descripción (opcional)</small></div>
          <div class="skill-actions" aria-hidden="true"></div>
        </div>

        <div class="skill-row" *ngFor="let skill of idiomasGuardadas">
          <div class="skill-name">
            <input type="text" class="form-control form-control-sm" [(ngModel)]="skill.nombre"
                   placeholder="Nombre del idioma">
          </div>
          <div class="skill-level">
            <select class="form-select form-select-sm" [(ngModel)]="skill.nivel">
              <option *ngFor="let n of niveles" [ngValue]="n">{{ n }}</option>
            </select>
          </div>
          <div class="skill-desc">
            <input type="text" class="form-control form-control-sm" [(ngModel)]="skill.descripcion"
                   placeholder="Descripción opcional">
          </div>
          <div class="skill-actions">
            <button type="button" class="btn-hab-del" (click)="eliminar(skill)" title="Eliminar idioma">
              <i class="bi bi-trash3"></i>
            </button>
          </div>
        </div>

        <div class="skill-row" *ngIf="borradorIdioma as draftI">
          <div class="skill-name">
            <input type="text" class="form-control form-control-sm" [(ngModel)]="draftI.nombre"
                   placeholder="Nombre del idioma">
          </div>
          <div class="skill-level">
            <select class="form-select form-select-sm" [(ngModel)]="draftI.nivel">
              <option *ngFor="let n of niveles" [ngValue]="n">{{ n }}</option>
            </select>
          </div>
          <div class="skill-desc">
            <input type="text" class="form-control form-control-sm" [(ngModel)]="draftI.descripcion"
                   placeholder="Descripción opcional">
          </div>
          <div class="skill-actions">
            <button type="button" class="btn-hab-del" (click)="cancelarBorrador(borradorIdioma)"
                    title="Cancelar fila nueva (sin guardar)">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>
        </div>

        <div class="skill-row" *ngIf="idiomasGuardadas.length === 0 && !borradorIdioma">
          <div class="w-100 text-muted small text-center py-3">
            No hay idiomas registrados. Usa «Agregar idioma» para añadir el primero.
          </div>
        </div>
      </div>

      <div class="d-flex justify-content-end mt-3 flex-wrap gap-2">
        <button type="button" class="btn btn-primary px-4" (click)="guardarTodasIdiomas()" [disabled]="guardandoIdiomas">
          <span *ngIf="guardandoIdiomas" class="spinner-border spinner-border-sm me-2" role="status"></span>
          <i *ngIf="!guardandoIdiomas" class="bi bi-floppy-fill me-2"></i>Guardar
        </button>
      </div>
      </div>
    </div>

    </ng-container>
  `,
})
export class HabilidadesComponent implements OnInit {
  habilidades: HabilidadUI[] = [];
  loading = false;
  guardandoTecnicas = false;
  guardandoBlandas = false;
  guardandoIdiomas = false;

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

  guardarTodasTecnicas(): void {
    this.guardarLoteHabilidades(
      this.tecnicas.filter(s => s.nombre.trim().length > 0),
      v => { this.guardandoTecnicas = v; },
      FORM_MESSAGES.habilidades.nothingToSaveTecnicas
    );
  }

  guardarTodasBlandas(): void {
    this.guardarLoteHabilidades(
      this.blandas.filter(s => s.nombre.trim().length > 0),
      v => { this.guardandoBlandas = v; },
      FORM_MESSAGES.habilidades.nothingToSaveBlandas
    );
  }

  guardarTodasIdiomas(): void {
    this.guardarLoteHabilidades(
      this.idiomas.filter(s => s.nombre.trim().length > 0),
      v => { this.guardandoIdiomas = v; },
      FORM_MESSAGES.habilidades.nothingToSaveIdiomas
    );
  }

  /**
   * POST/PUT en paralelo para las filas con nombre. Las referencias en `filas` deben ser
   * las mismas instancias que en `habilidades` para que Object.assign actualice la UI.
   */
  private guardarLoteHabilidades(
    filas: HabilidadUI[],
    setLoading: (value: boolean) => void,
    mensajeSinDatos: string
  ): void {
    if (filas.length === 0) {
      this.notificationService.warning(mensajeSinDatos);
      return;
    }

    const requests = filas.map(skill => {
      const form = this.buildUpsert(skill);
      return skill.habilidadId === 0
        ? this.cvEditorService.createHabilidad(form)
        : this.cvEditorService.updateHabilidad(skill.habilidadId, form);
    });

    setLoading(true);
    forkJoin(requests).subscribe({
      next: resultados => {
        resultados.forEach((dto, i) => {
          Object.assign(filas[i], dto);
        });
        setLoading(false);
        this.notificationService.success(NOTIFICATION_MESSAGES.saveSuccess);
      },
      error: (error: HttpErrorResponse) => {
        setLoading(false);
        this.notificationService.error(extractApiErrorMessage(error) || NOTIFICATION_MESSAGES.saveError);
      },
    });
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
        this.habilidades = this.habilidades.filter(h => h !== skill);
        this.notificationService.success(NOTIFICATION_MESSAGES.deleteSuccess);
      },
      error: () => this.notificationService.error(NOTIFICATION_MESSAGES.deleteError),
    });
  }
}
