import { HttpErrorResponse } from '@angular/common/http';
import {
  extractApiErrorMessage,
  getTodayDateString,
  isValidEmail,
  normalizeDateOrNull,
} from './form-validation.util';

describe('form-validation.util', () => {
  // ────────────────────────────────────────────────────────────────────────
  describe('getTodayDateString()', () => {
    it('devuelve la fecha actual en formato YYYY-MM-DD', () => {
      const result = getTodayDateString();

      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      const now = new Date();
      const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
        2,
        '0'
      )}-${String(now.getDate()).padStart(2, '0')}`;
      expect(result).toBe(expected);
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  describe('isValidEmail()', () => {
    it('devuelve true para correos con formato valido', () => {
      expect(isValidEmail('demo@local.test')).toBeTrue();
      expect(isValidEmail('name.surname@example.com')).toBeTrue();
      expect(isValidEmail('a@b.co')).toBeTrue();
    });

    it('recorta espacios en los bordes antes de validar', () => {
      expect(isValidEmail('  demo@local.test  ')).toBeTrue();
    });

    it('devuelve false para valores vacios, null o undefined', () => {
      expect(isValidEmail('')).toBeFalse();
      expect(isValidEmail('   ')).toBeFalse();
      expect(isValidEmail(null)).toBeFalse();
      expect(isValidEmail(undefined)).toBeFalse();
    });

    it('devuelve false cuando el largo supera MAX_EMAIL_LENGTH (254)', () => {
      const local = 'a'.repeat(250);
      const huge = `${local}@b.co`; // > 254
      expect(isValidEmail(huge)).toBeFalse();
    });

    it('devuelve false si contiene espacios internos', () => {
      expect(isValidEmail('dem o@local.test')).toBeFalse();
      expect(isValidEmail('demo@lo cal.test')).toBeFalse();
    });

    it('devuelve false si no hay @ o hay mas de uno', () => {
      expect(isValidEmail('demolocaltest')).toBeFalse();
      expect(isValidEmail('demo@@local.test')).toBeFalse();
      expect(isValidEmail('a@b@c.test')).toBeFalse();
    });

    it('devuelve false si @ esta al inicio o al final', () => {
      expect(isValidEmail('@local.test')).toBeFalse();
      expect(isValidEmail('demo@')).toBeFalse();
    });

    it('devuelve false si el dominio no tiene punto o esta mal ubicado', () => {
      expect(isValidEmail('demo@local')).toBeFalse();
      expect(isValidEmail('demo@.local')).toBeFalse();
      expect(isValidEmail('demo@local.')).toBeFalse();
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  describe('normalizeDateOrNull()', () => {
    it('devuelve la fecha si el formato y el valor son validos', () => {
      expect(normalizeDateOrNull('2026-02-15')).toBe('2026-02-15');
    });

    it('recorta espacios antes de normalizar', () => {
      expect(normalizeDateOrNull('  2026-02-15 ')).toBe('2026-02-15');
    });

    it('devuelve null para valores vacios, null o undefined', () => {
      expect(normalizeDateOrNull('')).toBeNull();
      expect(normalizeDateOrNull(null)).toBeNull();
      expect(normalizeDateOrNull(undefined)).toBeNull();
    });

    it('devuelve null cuando el formato no es YYYY-MM-DD', () => {
      expect(normalizeDateOrNull('2026/02/15')).toBeNull();
      expect(normalizeDateOrNull('15-02-2026')).toBeNull();
      expect(normalizeDateOrNull('2026-2-15')).toBeNull();
    });

    it('devuelve null cuando la fecha no existe en el calendario', () => {
      expect(normalizeDateOrNull('2026-02-30')).toBeNull();
      expect(normalizeDateOrNull('2026-13-01')).toBeNull();
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  describe('extractApiErrorMessage()', () => {
    function fakeError(body: unknown): HttpErrorResponse {
      return new HttpErrorResponse({ error: body, status: 400 });
    }

    it('devuelve null cuando no hay body de error', () => {
      expect(extractApiErrorMessage(fakeError(null))).toBeNull();
      expect(extractApiErrorMessage({} as HttpErrorResponse)).toBeNull();
    });

    it('devuelve el body cuando es un string no vacio', () => {
      expect(extractApiErrorMessage(fakeError('Algo salio mal'))).toBe('Algo salio mal');
    });

    it('devuelve null cuando el body es un string vacio o con solo espacios', () => {
      expect(extractApiErrorMessage(fakeError('   '))).toBeNull();
    });

    it('prefiere apiError.message cuando viene con contenido', () => {
      const err = fakeError({
        title: 'Titulo',
        message: 'Error de validacion',
        errors: { email: ['obligatorio'] },
      });
      expect(extractApiErrorMessage(err)).toBe('Error de validacion');
    });

    it('usa el primer mensaje de errors cuando no hay message', () => {
      const err = fakeError({
        errors: { email: ['Email obligatorio'], nombre: ['Nombre obligatorio'] },
      });
      expect(extractApiErrorMessage(err)).toBe('Email obligatorio');
    });

    it('cae a title como ultimo recurso', () => {
      const err = fakeError({ title: 'Bad Request' });
      expect(extractApiErrorMessage(err)).toBe('Bad Request');
    });

    it('devuelve null cuando no encuentra nada util en el body', () => {
      const err = fakeError({ errors: {} });
      expect(extractApiErrorMessage(err)).toBeNull();
    });
  });
});
