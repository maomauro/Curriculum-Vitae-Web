import {
  AfterViewInit,
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  Renderer2,
} from '@angular/core';
import { PrivateLayoutSidebarService } from '../services/private-layout-sidebar.service';

@Component({
  selector: 'app-admin-layout',
  standalone: false,
  providers: [PrivateLayoutSidebarService],
  template: `
    <div class="app-wrapper">
      <app-topbar></app-topbar>
      <app-sidebar></app-sidebar>
      <main class="app-main portal-private-main">
        <router-outlet></router-outlet>
      </main>
      <div
        class="sidebar-overlay"
        role="presentation"
        aria-hidden="true"
        (click)="onSidebarOverlayClick()"></div>
    </div>
  `,
})
export class AdminLayoutComponent implements OnInit, OnDestroy, AfterViewInit {
  constructor(
    private renderer: Renderer2,
    private sidebarNav: PrivateLayoutSidebarService
  ) {}

  ngOnInit(): void {
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
}
