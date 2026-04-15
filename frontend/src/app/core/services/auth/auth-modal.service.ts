import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type AuthModalKind = 'none' | 'login' | 'register' | 'recuperar';

@Injectable({ providedIn: 'root' })
export class AuthModalService {
  private readonly _kind = new BehaviorSubject<AuthModalKind>('none');
  readonly kind$ = this._kind.asObservable();

  openLogin(): void {
    this.setKind('login');
  }

  openRegister(): void {
    this.setKind('register');
  }

  openRecuperar(): void {
    this.setKind('recuperar');
  }

  close(): void {
    this.setKind('none');
  }

  private setKind(kind: AuthModalKind): void {
    this._kind.next(kind);
    document.body.style.overflow = kind === 'none' ? '' : 'hidden';
  }
}
