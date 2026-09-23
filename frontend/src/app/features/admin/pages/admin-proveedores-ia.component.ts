import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ProveedorIaService,
  ProveedorIaCodigo,
  ProveedorIaDto,
} from '../../../core/services/admin/proveedor-ia.service';
import { NOTIFICATION_MESSAGES } from '../../../core/constants/notification-messages';
import { NotificationService } from '../../../core/services/shared/notification.service';
import { extractApiErrorMessage } from '../../../core/utils/form-validation.util';

interface ProveedorIaForm {
  proveedor: ProveedorIaCodigo;
  nombre: string;
  modelo: string;
  endpoint: string;
  apiKey: string;
}

function proveedorIaFormVacio(): ProveedorIaForm {
  return { proveedor: 'claude', nombre: '', modelo: '', endpoint: '', apiKey: '' };
}

const PROVEEDORES_SIN_API_KEY_OBLIGATORIA: readonly ProveedorIaCodigo[] = ['ollama', 'otro'];
const PROVEEDORES_QUE_REQUIEREN_ENDPOINT: readonly ProveedorIaCodigo[] = ['ollama'];

/** Conexión de IA GLOBAL para toda la plataforma -- una sola factura/cuota compartida
 * por todos los Publicadores. Reemplaza lo que antes era "Configuración > Proveedores
 * de IA" (self-service, por CV); ahora solo el Admin la administra. */
@Component({
  selector: 'app-admin-proveedores-ia',
  standalone: false,
  templateUrl: './admin-proveedores-ia.component.html',
})
export class AdminProveedoresIaComponent implements OnInit {
  loading = true;
  proveedoresIa: ProveedorIaDto[] = [];
  mostrarForm = false;
  editandoId: number | null = null;
  form: ProveedorIaForm = proveedorIaFormVacio();
  guardando = false;
  probandoConexion = false;
  resultadoPrueba: 'ok' | 'error' | null = null;
  mensajePrueba: string | null = null;
  activandoId: number | null = null;
  eliminandoId: number | null = null;
  probandoGuardadaId: number | null = null;

  readonly modelosSugeridosPorProveedor: Record<ProveedorIaCodigo, string> = {
    claude: 'claude-opus-4-20250514',
    openai: 'gpt-4.1',
    gemini: 'gemini-flash-latest',
    groq: 'openai/gpt-oss-120b',
    ollama: 'llama3.1',
    otro: '',
  };

  readonly nombresProveedor: Record<ProveedorIaCodigo, string> = {
    claude: 'Claude (Anthropic)',
    openai: 'OpenAI',
    gemini: 'Gemini (Google)',
    groq: 'Groq',
    ollama: 'Ollama (local / self-hosted)',
    otro: 'Otro (compatible con API REST)',
  };

  constructor(
    private proveedorIaService: ProveedorIaService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  private cargar(): void {
    this.loading = true;
    this.proveedorIaService.getConfigs().subscribe({
      next: data => {
        this.proveedoresIa = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.notificationService.error(NOTIFICATION_MESSAGES.loadError);
      },
    });
  }

  trackByProveedorIa(_index: number, p: ProveedorIaDto): number {
    return p.proveedorIaId;
  }

  nombreProveedor(codigo: ProveedorIaCodigo): string {
    return this.nombresProveedor[codigo];
  }

  etiquetaConexionIa(p: ProveedorIaDto): string {
    return p.nombre?.trim() || this.nombresProveedor[p.proveedor];
  }

  get requiereEndpoint(): boolean {
    return PROVEEDORES_QUE_REQUIEREN_ENDPOINT.includes(this.form.proveedor);
  }

  get requiereApiKey(): boolean {
    return !PROVEEDORES_SIN_API_KEY_OBLIGATORIA.includes(this.form.proveedor);
  }

  onProveedorChange(): void {
    this.resultadoPrueba = null;
    this.mensajePrueba = null;
    if (!this.form.modelo.trim()) {
      this.form.modelo = this.modelosSugeridosPorProveedor[this.form.proveedor];
    }
  }

  abrirNuevaConexion(): void {
    this.editandoId = null;
    this.form = proveedorIaFormVacio();
    this.resultadoPrueba = null;
    this.mensajePrueba = null;
    this.mostrarForm = true;
  }

  editarConexion(p: ProveedorIaDto): void {
    this.editandoId = p.proveedorIaId;
    this.form = {
      proveedor: p.proveedor,
      nombre: p.nombre ?? '',
      modelo: p.modelo ?? '',
      endpoint: p.endpoint ?? '',
      apiKey: '',
    };
    this.resultadoPrueba = null;
    this.mensajePrueba = null;
    this.mostrarForm = true;
  }

  cancelarForm(): void {
    this.mostrarForm = false;
  }

  probarConexion(): void {
    if (this.probandoConexion) return;
    if (this.requiereEndpoint && !this.form.endpoint.trim()) {
      this.notificationService.warning('La URL del servidor es requerida para este proveedor.');
      return;
    }

    this.probandoConexion = true;
    this.resultadoPrueba = null;
    this.mensajePrueba = null;
    this.proveedorIaService
      .probarConexion({
        proveedor: this.form.proveedor,
        modelo: this.form.modelo.trim() || null,
        endpoint: this.form.endpoint.trim() || null,
        apiKey: this.form.apiKey.trim() || null,
      })
      .subscribe({
        next: res => {
          this.probandoConexion = false;
          this.resultadoPrueba = res.ok ? 'ok' : 'error';
          this.mensajePrueba = res.mensaje;
        },
        error: (error: HttpErrorResponse) => {
          this.probandoConexion = false;
          this.resultadoPrueba = 'error';
          this.mensajePrueba = extractApiErrorMessage(error) || NOTIFICATION_MESSAGES.saveError;
        },
      });
  }

  guardarConexion(): void {
    if (this.guardando) return;
    if (this.requiereEndpoint && !this.form.endpoint.trim()) {
      this.notificationService.warning('La URL del servidor es requerida para este proveedor.');
      return;
    }
    if (this.editandoId === null && this.requiereApiKey && !this.form.apiKey.trim()) {
      this.notificationService.warning('La clave de API es requerida para este proveedor.');
      return;
    }

    const payload = {
      proveedor: this.form.proveedor,
      nombre: this.form.nombre.trim() || null,
      modelo: this.form.modelo.trim() || null,
      endpoint: this.form.endpoint.trim() || null,
      apiKey: this.form.apiKey.trim() || null,
    };

    this.guardando = true;
    const guardado$ = this.editandoId !== null
      ? this.proveedorIaService.actualizarConfig(this.editandoId, payload)
      : this.proveedorIaService.crearConfig(payload);

    guardado$.subscribe({
      next: () => {
        this.guardando = false;
        this.mostrarForm = false;
        this.notificationService.success(
          this.editandoId !== null ? NOTIFICATION_MESSAGES.updateSuccess : NOTIFICATION_MESSAGES.createSuccess
        );
        this.cargar();
      },
      error: (error: HttpErrorResponse) => {
        this.guardando = false;
        this.notificationService.error(extractApiErrorMessage(error) || NOTIFICATION_MESSAGES.saveError);
      },
    });
  }

  activarConexion(p: ProveedorIaDto): void {
    if (p.esActivo || this.activandoId) return;

    this.activandoId = p.proveedorIaId;
    this.proveedorIaService.activarConfig(p.proveedorIaId).subscribe({
      next: () => {
        this.activandoId = null;
        this.notificationService.success(NOTIFICATION_MESSAGES.updateSuccess);
        this.cargar();
      },
      error: (error: HttpErrorResponse) => {
        this.activandoId = null;
        this.notificationService.error(extractApiErrorMessage(error) || NOTIFICATION_MESSAGES.saveError);
      },
    });
  }

  probarConexionGuardada(p: ProveedorIaDto): void {
    if (this.probandoGuardadaId) return;

    this.probandoGuardadaId = p.proveedorIaId;
    this.proveedorIaService.probarConexionGuardada(p.proveedorIaId).subscribe({
      next: res => {
        this.probandoGuardadaId = null;
        if (res.ok) {
          this.notificationService.success(res.mensaje);
        } else {
          this.notificationService.warning(res.mensaje);
        }
      },
      error: (error: HttpErrorResponse) => {
        this.probandoGuardadaId = null;
        this.notificationService.error(extractApiErrorMessage(error) || NOTIFICATION_MESSAGES.loadError);
      },
    });
  }

  eliminarConexion(p: ProveedorIaDto): void {
    if (!confirm(`¿Eliminar la conexión "${this.etiquetaConexionIa(p)}"?`)) return;

    this.eliminandoId = p.proveedorIaId;
    this.proveedorIaService.eliminarConfig(p.proveedorIaId).subscribe({
      next: () => {
        this.eliminandoId = null;
        this.notificationService.success(NOTIFICATION_MESSAGES.deleteSuccess);
        this.cargar();
      },
      error: (error: HttpErrorResponse) => {
        this.eliminandoId = null;
        this.notificationService.error(extractApiErrorMessage(error) || NOTIFICATION_MESSAGES.deleteError);
      },
    });
  }
}
