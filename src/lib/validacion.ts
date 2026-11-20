import { COLORES_LOMO } from '../constants/tema';

const REGEX_ISBN_13 = /^\d{13}$/;

export function limpiarIsbn(valor: string): string {
  return valor.replace(/[\s-]/g, '').trim();
}

export function esIsbnValido(isbn: string): boolean {
  return REGEX_ISBN_13.test(isbn);
}

export function formatearFechaCorta(iso: string): string {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) {
    return 'Fecha desconocida';
  }
  return fecha.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function colorLomoPorIsbn(isbn: string): string {
  let suma = 0;
  for (let i = 0; i < isbn.length; i += 1) {
    suma += isbn.charCodeAt(i);
  }
  return COLORES_LOMO[suma % COLORES_LOMO.length];
}
