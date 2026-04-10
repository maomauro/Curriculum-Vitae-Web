import { HttpErrorResponse } from '@angular/common/http';

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Comprueba formato de correo (no vacío tras trim). */
export function isValidEmail(value: string | null | undefined): boolean {
  const s = (value ?? '').trim();
  if (!s) {
    return false;
  }
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
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
