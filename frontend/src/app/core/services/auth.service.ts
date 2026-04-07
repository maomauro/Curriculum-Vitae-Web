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

interface LoginResponse {
  token: string;
  user: UserInfo;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API_URL = '/api/auth';
  private readonly TOKEN_KEY = 'portalcv_token';

  private currentUserSubject = new BehaviorSubject<UserInfo | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    const token = this.getToken();
    if (token) {
      const payload = this.parseJwt(token);
      if (payload) {
        this.currentUserSubject.next({
          id: Number(payload['sub']),
          nombre: payload['nombre'] ?? '',
          email: payload['email'] ?? '',
          rol: payload['role'] ?? '',
          curriculumId: Number(payload['curriculum_id'] ?? 0)
        });
      }
    }
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/login`, { email, password }).pipe(
      tap(res => {
        localStorage.setItem(this.TOKEN_KEY, res.token);
        this.currentUserSubject.next(res.user);
      })
    );
  }

  register(nombre: string, email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/register`, { nombre, email, password }).pipe(
      tap(res => {
        localStorage.setItem(this.TOKEN_KEY, res.token);
        this.currentUserSubject.next(res.user);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private parseJwt(token: string): Record<string, string> | null {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch {
      return null;
    }
  }
}
