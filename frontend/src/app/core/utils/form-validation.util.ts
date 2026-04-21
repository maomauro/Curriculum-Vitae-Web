import { HttpErrorResponse } from '@angular/common/http';

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const MAX_EMAIL_LENGTH = 254; // RFC 5321: longitud máxima total de un email.

/**
 * Comprueba formato basico de correo sin usar regex con cuantificadores
 * sobre clases de caracteres (evita ReDoS / backtracking superlineal).
 */
export function isValidEmail(value: string | null | undefined): boolean {
  const s = (value ?? '').trim();
  if (!s || s.length > MAX_EMAIL_LENGTH) {
    return false;
  }

  if (/\s/.test(s)) {
    return false;
  }

  const atIndex = s.indexOf('@');
  if (atIndex <= 0 || atIndex !== s.lastIndexOf('@') || atIndex === s.length - 1) {
    return false;
  }

  const domain = s.slice(atIndex + 1);
  const dotIndex = domain.indexOf('.');
  return dotIndex > 0 && dotIndex < domain.length - 1;
}

export function normalizeDateOrNull(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!datePattern.test(trimmed)) {
    return null;
  }

  const [year, month, day] = trimmed.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  const isValid =
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day;

  return isValid ? trimmed : null;
}

export function extractApiErrorMessage(error: HttpErrorResponse): string | null {
  if (!error?.error) {
    return null;
  }

  if (typeof error.error === 'string' && error.error.trim()) {
    return error.error;
  }

  const apiError = error.error as {
    title?: string;
    message?: string;
    errors?: Record<string, string[]>;
  };

  if (apiError.message?.trim()) {
    return apiError.message;
  }

  if (apiError.errors) {
    const first = Object.values(apiError.errors).flat().find(Boolean);
    if (first) {
      return first;
    }
  }

  if (apiError.title?.trim()) {
    return apiError.title;
  }

  return null;
}
