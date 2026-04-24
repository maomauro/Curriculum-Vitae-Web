import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { BehaviorSubject, Subject } from 'rxjs';
import { BuscarCvsComponent } from './buscar-cvs.component';
import { PublicService, type CvListadoResponse, type SnapshotListadoResponse } from '../../../core/services/public/public.service';

describe('BuscarCvsComponent', () => {
  let fixture: ComponentFixture<BuscarCvsComponent>;
  let component: BuscarCvsComponent;
  let router: Router;

  let queryParams$: BehaviorSubject<Record<string, string>>;
  let snapshot$: Subject<SnapshotListadoResponse | null>;
  let api$: Subject<CvListadoResponse>;
  let publicServiceMock: {
    buscarCvsSnapshot: jasmine.Spy;
    buscarCvs: jasmine.Spy;
  };

  beforeEach(async () => {
    queryParams$ = new BehaviorSubject<Record<string, string>>({});
    snapshot$ = new Subject<SnapshotListadoResponse | null>();
    api$ = new Subject<CvListadoResponse>();
    publicServiceMock = {
      buscarCvsSnapshot: jasmine.createSpy('buscarCvsSnapshot').and.returnValue(snapshot$.asObservable()),
      buscarCvs: jasmine.createSpy('buscarCvs').and.returnValue(api$.asObservable()),
    };

    await TestBed.configureTestingModule({
      imports: [FormsModule, RouterTestingModule],
      declarations: [BuscarCvsComponent],
      providers: [
        { provide: PublicService, useValue: publicServiceMock },
        { provide: ActivatedRoute, useValue: { queryParams: queryParams$.asObservable() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BuscarCvsComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
  });

  it('muestra snapshot temporal y luego reemplaza con API oficial', () => {
    fixture.detectChanges();

    snapshot$.next({
      generatedAtUtc: '2026-04-24T12:00:00Z',
      items: [
        {
          curriculumId: 1,
          urlPublica: 'ana-dev',
          nombreCompleto: 'Ana',
          fotoUrl: null,
          ciudad: null,
          pais: null,
          nombrePerfil: null,
          contadorVisitas: 0,
          contadorContactos: 0,
          habilidades: [],
        },
      ],
      total: 1,
      page: 1,
      pageSize: 12,
      totalPages: 1,
    });

    expect(component.usandoSnapshot).toBeTrue();
    expect(component.cvs.length).toBe(1);
    expect(component.loading).toBeFalse();

    api$.next({
      items: [],
      total: 0,
      page: 1,
      pageSize: 12,
      totalPages: 1,
    });

    expect(component.usandoSnapshot).toBeFalse();
    expect(component.snapshotActualizadoEn).toBeNull();
    expect(component.loading).toBeFalse();
  });

  it('navega a página ajustada cuando page actual supera totalPages', () => {
    queryParams$.next({ page: '4' });
    fixture.detectChanges();

    api$.next({
      items: [],
      total: 2,
      page: 1,
      pageSize: 12,
      totalPages: 1,
    });

    expect(router.navigate).toHaveBeenCalled();
  });
});

