import { NgForm } from '@angular/forms';
import type { ContactarDto } from '../../core/services/public/public.service';

/** Primer token del nombre completo (botón “Contactar a …”). */
export function primerNombrePublico(nombreCompleto: string | null | undefined): string {
  const t = nombreCompleto?.trim();
  return t ? t.split(/\s+/)[0] : '';
}

export function contactoPublicoVacio(): ContactarDto {
  return { nombre: '', empresa: '', email: '', motivoContacto: '' };
}

export function marcarControlesTocados(form: NgForm): void {
  for (const k of Object.keys(form.controls)) {
    form.controls[k].markAsTouched();
  }
}
