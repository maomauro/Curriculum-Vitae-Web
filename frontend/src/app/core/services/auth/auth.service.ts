import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { CV_ROL } from '../../constants/cv-roles';
import { API_BASE_URL } from '../../constants/api-base-url';
import { clearSessionHint, markSessionHint } from '../../constants/session-hint';

export interface UserInfo {
  id: number;
  nombre: string;
  email: string;
  /** Primer rol del token (compatibilidad con UI que muestra un solo rol). */
  rol: string;
  /** Todos los roles del JWT (p. ej. Admin, Publicador). */
  roles: string[];
  curriculumId: number;
}

/** Respuesta exacta del endpoint POST /api/auth/login (sin el JWT: viaja como cookie HttpOnly). */
interface LoginApiResponse {
  usuarioId: number;
  email: string;
  nombreCompleto: string;
  roles: string[];
  curriculumId: number;
  expiracion: string;
}

/** Respuesta exacta del endpoint POST /api/auth/register */
interface RegisterApiResponse {
  usuarioId: number;
  email: string;
  nombreCompleto: string;
}

interface ForgotPasswordApiResponse {
  message: string;
}

/** Respuesta exacta del endpoint GET /api/auth/me */
export interface MeApiResponse {
  usuarioId: number;
  email: string;
  nombreCompleto: string;
  roles: string[];
  curriculumId: number | null;
}

/**
 * Semilla de sesión resuelta por main.ts (GET /api/auth/me con la cookie del
 * navegador) antes de arrancar Angular. El JWT vive en una cookie HttpOnly:
 * este servicio nunca lo lee, decodifica ni guarda — solo confía en lo que el
 * backend confirma vía /me (al cargar la app) o /login (al autenticarse).
 */
declare global {
  interface Window {
    __PORTALCV_SESSION__?: MeApiResponse | null;
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API_URL = `${API_BASE_URL}/api/auth`;

  private currentUserSubject = new BehaviorSubject<UserInfo | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  get currentUser(): UserInfo | null {
    return this.currentUserSubject.value;
  }

  constructor(private http: HttpClient) {
    const seed = globalThis.window?.__PORTALCV_SESSION__;
    if (seed) {
      this.currentUserSubject.next(this.buildUserFromResponse(seed));
    }
  }

  login(email: string, password: string): Observable<LoginApiResponse> {
    return this.http.post<LoginApiResponse>(`${this.API_URL}/login`, { email, password }).pipe(
      tap(res => {
        this.currentUserSubject.next(this.buildUserFromResponse(res));
        markSessionHint();
      })
    );
  }

  register(nombreCompleto: string, email: string, password: string): Observable<RegisterApiResponse> {
    return this.http.post<RegisterApiResponse>(
      `${this.API_URL}/register`,
      { nombreCompleto, email, password }
    );
  }

  forgotPassword(email: string): Observable<ForgotPasswordApiResponse> {
    return this.http.post<ForgotPasswordApiResponse>(`${this.API_URL}/forgot-password`, { email });
  }

  changePassword(currentPassword: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API_URL}/change-password`, {
      currentPassword,
      newPassword,
    });
  }

  /** Cierre de sesión explícito (botón "Cerrar sesión", inactividad): limpia el estado local y borra la cookie en el backend. */
  logout(): void {
    this.clearLocalSession();
    this.http.post(`${this.API_URL}/logout`, {}).subscribe({ error: () => { /* la cookie ya se borra aunque la llamada falle */ } });
  }

  /**
   * Solo limpia el estado local, sin llamar al backend. La usa el interceptor
   * de errores ante un 401: si el servidor ya rechazó la cookie, no hace falta
   * pedirle que la borre.
   */
  clearLocalSession(): void {
    this.currentUserSubject.next(null);
    clearSessionHint();
  }

  isLoggedIn(): boolean {
    return this.currentUser !== null;
  }

  hasRol(nombreRol: string): boolean {
    return (this.currentUser?.roles ?? []).some(r => r === nombreRol);
  }

  /** Tras login: Publicador → área CV; solo Admin → panel administración. */
  postLoginPath(): string {
    if (this.hasRol(CV_ROL.publicador)) {
      return '/dashboard';
    }
    if (this.hasRol(CV_ROL.admin)) {
      return '/admin/usuarios';
    }
    return '/dashboard';
  }

  private buildUserFromResponse(res: LoginApiResponse | MeApiResponse): UserInfo {
    const roles = res.roles ?? [];
    return {
      id: res.usuarioId,
      nombre: (res.nombreCompleto && res.nombreCompleto.trim()) || res.email || 'Usuario',
      email: res.email,
      rol: roles[0] ?? '',
      roles,
      curriculumId: res.curriculumId ?? 0,
    };
  }
}
