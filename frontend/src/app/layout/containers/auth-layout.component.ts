import { Component, OnInit, OnDestroy, Renderer2 } from '@angular/core';

@Component({
  selector: 'app-auth-layout',
  standalone: false,
  template: `<router-outlet></router-outlet>`
})
export class AuthLayoutComponent implements OnInit, OnDestroy {
  constructor(private renderer: Renderer2) {}

  ngOnInit(): void {
    this.renderer.addClass(document.body, 'login-page');
    this.renderer.addClass(document.body, 'bg-body-secondary');
  }

  ngOnDestroy(): void {
    this.renderer.removeClass(document.body, 'login-page');
    this.renderer.removeClass(document.body, 'bg-body-secondary');
  }
}
