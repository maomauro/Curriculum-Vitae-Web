import { TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import type { DbReadinessState } from '../../core/services/startup-readiness.service';
import { StartupReadinessService } from '../../core/services/startup-readiness.service';
import { StartupReadinessHostComponent } from './startup-readiness-host.component';

describe('StartupReadinessHostComponent', () => {
  let stateSubject: BehaviorSubject<DbReadinessState>;
  let dismissedSubject: BehaviorSubject<boolean>;
  let mock: {
    state$: ReturnType<BehaviorSubject<DbReadinessState>['asObservable']>;
    dismissed$: ReturnType<BehaviorSubject<boolean>['asObservable']>;
    startPolling: jasmine.Spy;
    stop: jasmine.Spy;
    dismiss: jasmine.Spy;
    resetDismiss: jasmine.Spy;
  };

  beforeEach(() => {
    stateSubject = new BehaviorSubject<DbReadinessState>('checking');
    dismissedSubject = new BehaviorSubject(false);
    mock = {
      state$: stateSubject.asObservable(),
      dismissed$: dismissedSubject.asObservable(),
      startPolling: jasmine.createSpy('startPolling'),
      stop: jasmine.createSpy('stop'),
      dismiss: jasmine.createSpy('dismiss'),
      resetDismiss: jasmine.createSpy('resetDismiss'),
    };

    TestBed.configureTestingModule({
      imports: [StartupReadinessHostComponent],
      providers: [{ provide: StartupReadinessService, useValue: mock }],
    });
  });

  it('crea el componente y arranca el polling al inicializar', () => {
    const fixture = TestBed.createComponent(StartupReadinessHostComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
    expect(mock.resetDismiss).toHaveBeenCalled();
    expect(mock.startPolling).toHaveBeenCalled();
  });

  it('visible es false cuando el estado es ready', () => {
    const fixture = TestBed.createComponent(StartupReadinessHostComponent);
    stateSubject.next('ready');
    fixture.detectChanges();
    expect(fixture.componentInstance.visible()).toBeFalse();
  });

  it('visible es false cuando el usuario descarto el modal', () => {
    const fixture = TestBed.createComponent(StartupReadinessHostComponent);
    dismissedSubject.next(true);
    fixture.detectChanges();
    expect(fixture.componentInstance.visible()).toBeFalse();
  });

  it('pillText y pillClass reflejan el estado', () => {
    const fixture = TestBed.createComponent(StartupReadinessHostComponent);
    const c = fixture.componentInstance;

    stateSubject.next('ready');
    fixture.detectChanges();
    expect(c.pillText()).toBe('Lista');
    expect(c.pillClass()).toBe('startup-readiness__pill--ok');

    stateSubject.next('degraded');
    fixture.detectChanges();
    expect(c.pillText()).toBe('Revisar');
    expect(c.pillClass()).toBe('startup-readiness__pill--warn');

    stateSubject.next('checking');
    fixture.detectChanges();
    expect(c.pillText()).toBe('En espera');
    expect(c.pillClass()).toBe('startup-readiness__pill--pending');
  });

  it('entrar detiene y descarta', () => {
    const fixture = TestBed.createComponent(StartupReadinessHostComponent);
    fixture.detectChanges();
    fixture.componentInstance.entrar();
    expect(mock.stop).toHaveBeenCalled();
    expect(mock.dismiss).toHaveBeenCalled();
  });

  it('continuarDeTodasFormas solo descarta', () => {
    const fixture = TestBed.createComponent(StartupReadinessHostComponent);
    fixture.detectChanges();
    mock.dismiss.calls.reset();
    fixture.componentInstance.continuarDeTodasFormas();
    expect(mock.dismiss).toHaveBeenCalled();
  });

  it('reintentar llama startPolling', () => {
    const fixture = TestBed.createComponent(StartupReadinessHostComponent);
    fixture.detectChanges();
    mock.startPolling.calls.reset();
    fixture.componentInstance.reintentar();
    expect(mock.startPolling).toHaveBeenCalled();
  });

  it('ngOnDestroy llama stop en el servicio', () => {
    const fixture = TestBed.createComponent(StartupReadinessHostComponent);
    fixture.detectChanges();
    mock.stop.calls.reset();
    fixture.destroy();
    expect(mock.stop).toHaveBeenCalled();
  });

  it('muestra el boton Reintentar solo en estado degradado', () => {
    const fixture = TestBed.createComponent(StartupReadinessHostComponent);
    stateSubject.next('checking');
    dismissedSubject.next(false);
    fixture.detectChanges();
    let el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).not.toContain('Reintentar');

    stateSubject.next('degraded');
    fixture.detectChanges();
    el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Reintentar');
  });
});
