import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

export interface UserInfo {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  curriculumId: number;
}

/** Respuesta exacta del endpoint POST /api/auth/login */
interface LoginApiResponse {
  token: string;
  email: string;
  nombreCompleto: string;
  roles: string[];
  expiracion: string;
}

/** Respuesta exacta del endpoint POST /api/auth/register */
interface RegisterApiResponse {
  usuarioId: number;
  email: string;
  nombreCompleto: string;
}

// Claim name que usa ClaimTypes.Role en .NET
const ROLE_CLAIM = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API_URL = '/api/auth';
  private readonly TOKEN_KEY = 'portalcv_token';

  private currentUserSubject = new BehaviorSubject<UserInfo | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  get currentUser(): UserInfo | null {
    return this.currentUserSubject.value;
  }

  constructor(private http: HttpClient) {
    const token = this.getToken();
    if (token) {
      const user = this.buildUserFromToken(token);
      if (user) this.currentUserSubject.next(user);
    }
  }

  login(email: string, password: string): Observable<LoginApiResponse> {
    return this.http.post<LoginApiResponse>(`${this.API_URL}/login`, { email, password }).pipe(
      tap(res => {
        localStorage.setItem(this.TOKEN_KEY, res.token);
        const user = this.buildUserFromToken(res.token, res.nombreCompleto);
        this.currentUserSubject.next(user);
      })
    );
  }

  register(nombreCompleto: string, email: string, password: string): Observable<RegisterApiResponse> {
    return this.http.post<RegisterApiResponse>(
      `${this.API_URL}/register`,
      { nombreCompleto, email, password }
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  private buildUserFromToken(token: string, nombreCompleto?: string): UserInfo | null {
    const payload = this.parseJwt(token);
    if (!payload) return null;

    const str = (v: unknown): string => (typeof v === 'string' ? v : '');

    const roles: string[] = [];
    const roleRaw = payload[ROLE_CLAIM] ?? payload['role'];
    if (Array.isArray(roleRaw)) roles.push(...roleRaw.map(str));
    else if (roleRaw) roles.push(str(roleRaw));

    return {
      id:           Number(payload['sub'] ?? 0),
      nombre:       nombreCompleto ?? str(payload['nombre']) ?? str(payload['email']),
      email:        str(payload['email']),
      rol:          roles[0] ?? '',
      curriculumId: Number(payload['curriculum_id'] ?? 0),
    };
  }

  private parseJwt(token: string): Record<string, unknown> | null {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload)) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}
