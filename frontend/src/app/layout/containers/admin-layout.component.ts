import {
  AfterViewInit,
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  Renderer2,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { PrivateLayoutSidebarService } from '../services/private-layout-sidebar.service';
import { AdminService } from '../../core/services/admin/admin.service';
import { NotificationService } from '../../core/services/shared/notification.service';
import { extractApiErrorMessage } from '../../core/utils/form-validation.util';
import { AuthService } from '../../core/services/auth/auth.service';
import { CV_ROL } from '../../core/constants/cv-roles';

@Component({
  selector: 'app-admin-layout',
  standalone: false,
  providers: [PrivateLayoutSidebarService],
  styles: [`
    .snapshot-preview-backdrop {
      position: fixed;
      inset: 0;
      z-index: 1060;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.45);
      padding: 1rem;
    }
    .snapshot-preview-card {
      width: min(1100px, 96vw);
      background: #fff;
      border-radius: 0.5rem;
      box-shadow: 0 1rem 2rem rgba(0, 0, 0, 0.2);
      padding: 0.75rem;
    }
    .snapshot-preview-textarea {
      width: 100%;
      min-height: 60vh;
      resize: vertical;
      white-space: pre;
    }
  `],
  templateUrl: './admin-layout.component.html',
})
export class AdminLayoutComponent implements OnInit, OnDestroy, AfterViewInit {
  snapshotStale: boolean | null = null;
  snapshotDownloading = false;
  snapshotPreviewing = false;
  snapshotPreviewOpen = false;
  snapshotPreviewJson = '';
  snapshotAcking = false;

  constructor(
    private renderer: Renderer2,
    private readonly sidebarNav: PrivateLayoutSidebarService,
    private readonly adminService: AdminService,
    private readonly notificationService: NotificationService,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    if (this.authService.hasRol(CV_ROL.admin)) {
      this.adminService.getPublicCvSnapshotPending().subscribe({
        next: r => {
          this.snapshotStale = r.stale === true;
        },
        error: () => {
          this.snapshotStale = null;
        },
      });
    }
    this.renderer.addClass(document.body, 'layout-fixed');
    this.renderer.addClass(document.body, 'sidebar-expand-lg');
    /** Mini sidebar en escritorio: con sidebar-collapse solo quedan iconos + abreviatura (brand logo-xs). */
    this.renderer.addClass(document.body, 'sidebar-mini');
    this.renderer.addClass(document.body, 'bg-body-tertiary');
  }

  ngAfterViewInit(): void {
    queueMicrotask(() => this.sidebarNav.syncWithViewport());
  }

  ngOnDestroy(): void {
    this.renderer.removeClass(document.body, 'layout-fixed');
    this.renderer.removeClass(document.body, 'sidebar-expand-lg');
    this.renderer.removeClass(document.body, 'sidebar-mini');
    this.renderer.removeClass(document.body, 'sidebar-collapse');
    this.renderer.removeClass(document.body, 'sidebar-open');
    this.renderer.removeClass(document.body, 'bg-body-tertiary');
  }

  onSidebarOverlayClick(): void {
    this.sidebarNav.closeMobileDrawer();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.sidebarNav.syncWithViewport();
  }

  downloadSnapshot(): void {
    this.snapshotDownloading = true;
    this.adminService.downloadPublicCvSnapshot().subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'public-cvs-snapshot.json';
        a.rel = 'noopener';
        a.click();
        URL.revokeObjectURL(url);
        this.snapshotDownloading = false;
        this.notificationService.success('Descarga lista. Sustituye el archivo en el repo y haz commit.');
      },
      error: (e: HttpErrorResponse) => {
        this.snapshotDownloading = false;
        this.notificationService.error(extractApiErrorMessage(e) ?? 'No se pudo descargar el snapshot.');
      },
    });
  }

  previewSnapshot(): void {
    this.snapshotPreviewing = true;
    this.adminService.previewPublicCvSnapshot().subscribe({
      next: json => {
        this.snapshotPreviewing = false;
        this.snapshotPreviewJson = json ?? '';
        this.snapshotPreviewOpen = true;
      },
      error: (e: HttpErrorResponse) => {
        this.snapshotPreviewing = false;
        this.notificationService.error(extractApiErrorMessage(e) ?? 'No se pudo cargar el preview del snapshot.');
      },
    });
  }

  closeSnapshotPreview(): void {
    this.snapshotPreviewOpen = false;
  }

  ackSnapshot(): void {
    this.snapshotAcking = true;
    this.adminService.acknowledgePublicCvSnapshot().subscribe({
      next: () => {
        this.snapshotAcking = false;
        this.snapshotStale = false;
        this.notificationService.success('Marcado como al día.');
      },
      error: (e: HttpErrorResponse) => {
        this.snapshotAcking = false;
        this.notificationService.error(extractApiErrorMessage(e) ?? 'No se pudo actualizar el estado.');
      },
    });
  }
}
