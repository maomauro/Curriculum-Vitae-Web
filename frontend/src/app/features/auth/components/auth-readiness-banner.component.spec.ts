import { TestBed } from '@angular/core/testing';
import { AuthReadinessBannerComponent } from './auth-readiness-banner.component';

describe('AuthReadinessBannerComponent', () => {
  let component: AuthReadinessBannerComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [AuthReadinessBannerComponent] });
    component = TestBed.inject(AuthReadinessBannerComponent);
  });

  it('arranca con state "checking" por defecto', () => {
    expect(component.state).toBe('checking');
  });

  it('permite fijar el estado vía @Input', () => {
    component.state = 'ready';
    expect(component.state).toBe('ready');
  });
});
