export type Libro = {
  isbn: string; // 13 dígitos, sin guiones
  titulo: string;
  autor: string;
  anio: number;
  ejemplares: number; // ejemplares en el estante al iniciar la app
};

export type Prestamo = {
  isbn: string;
  fechaPrestamo: string; // ISO string
  fechaDevolucion: string; // ISO string (7 días después)
  recordatorioId: string | null;
};

export type AvisoApp = {
  id: string;
  titulo: string;
  mensaje: string;
  fecha: string;
  isbn?: string;
};

export type EstadoPermiso =
  | 'cargando'
  | 'concedido'
  | 'preguntable'
  | 'bloqueado';

export type RecursoPermiso = 'camara' | 'notificaciones';

export type ResultadoReserva =
  | { tipo: 'prestamo'; prestamo: Prestamo }
  | { tipo: 'espera'; posicion: number }
  | { tipo: 'duplicado'; mensaje: string }
  | { tipo: 'error'; mensaje: string };

export type ResultadoEntrega = {
  entregadoA: string | null;
  esUsuarioActual: boolean;
  restantesEnEspera: number;
};
