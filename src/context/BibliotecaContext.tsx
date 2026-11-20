import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  CLAVE_STORAGE_BIBLIOTECA,
  CREDENCIALES_PERSONAL,
  DIAS_PRESTAMO,
  MAX_RECIENTES,
  USUARIO_ACTUAL,
} from '../constants/personal';
import { LISTAS_ESPERA_INICIALES } from '../data/libros';
import { Cola } from '../estructuras/Cola';
import { Pila } from '../estructuras/Pila';
import {
  cancelarRecordatorio,
  enviarNotificacionEntrega,
  programarRecordatorioDevolucion,
  tienePermisoNotificaciones,
} from '../lib/notificaciones';
import type {
  AvisoApp,
  Libro,
  Prestamo,
  ResultadoEntrega,
  ResultadoReserva,
} from '../types';

type EstadoPersistido = {
  prestamos: Prestamo[];
  recientes: Libro[];
  avisos: AvisoApp[];
};

type BibliotecaContextValor = {
  hidratado: boolean;
  prestamos: Prestamo[];
  listasEspera: Record<string, Cola<string>>;
  ultimosRecientes: Libro[];
  avisos: AvisoApp[];
  sesionPersonal: boolean;
  registrarReciente: (libro: Libro) => void;
  obtenerDisponibles: (libro: Libro) => number;
  obtenerListaEspera: (isbn: string) => Cola<string>;
  estaReservadoPorMi: (isbn: string) => boolean;
  reservarLibro: (libro: Libro) => ResultadoReserva;
  devolverLibro: (isbn: string) => Promise<void>;
  activarRecordatorio: (isbn: string, tituloLibro: string) => Promise<void>;
  desactivarRecordatorio: (isbn: string) => Promise<void>;
  entregarAlSiguiente: (
    isbn: string,
    tituloLibro: string,
  ) => Promise<ResultadoEntrega>;
  agregarAviso: (titulo: string, mensaje: string, isbn?: string) => void;
  descartarAviso: (id: string) => void;
  iniciarSesionPersonal: (usuario: string, clave: string) => boolean;
  cerrarSesionPersonal: () => void;
};

const BibliotecaContext = createContext<BibliotecaContextValor | null>(null);

function crearListasEsperaIniciales(): Record<string, Cola<string>> {
  const mapa: Record<string, Cola<string>> = {};
  for (const [isbn, personas] of Object.entries(LISTAS_ESPERA_INICIALES)) {
    mapa[isbn] = new Cola<string>(personas);
  }
  return mapa;
}

function crearPrestamoNuevo(isbn: string): Prestamo {
  const ahora = new Date();
  const devolucion = new Date(
    ahora.getTime() + DIAS_PRESTAMO * 24 * 60 * 60 * 1000,
  );
  return {
    isbn,
    fechaPrestamo: ahora.toISOString(),
    fechaDevolucion: devolucion.toISOString(),
    recordatorioId: null,
  };
}

export function BibliotecaProvider({ children }: { children: ReactNode }) {
  const [hidratado, setHidratado] = useState(false);
  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
  const [listasEspera, setListasEspera] = useState<Record<string, Cola<string>>>(
    () => crearListasEsperaIniciales(),
  );
  const [recientes, setRecientes] = useState<Pila<Libro>>(
    () => new Pila<Libro>(),
  );
  const [avisos, setAvisos] = useState<AvisoApp[]>([]);
  const [sesionPersonal, setSesionPersonal] = useState(false);

  useEffect(() => {
    let activo = true;

    async function cargarEstado() {
      try {
        const crudo = await AsyncStorage.getItem(CLAVE_STORAGE_BIBLIOTECA);
        if (!activo || !crudo) {
          return;
        }
        const datos = JSON.parse(crudo) as Partial<EstadoPersistido>;
        if (Array.isArray(datos.prestamos)) {
          setPrestamos(datos.prestamos);
        }
        if (Array.isArray(datos.recientes)) {
          setRecientes(new Pila<Libro>(datos.recientes));
        }
        if (Array.isArray(datos.avisos)) {
          setAvisos(datos.avisos);
        }
      } catch {
        // Si falla la lectura local, la app inicia con el estado limpio.
      } finally {
        if (activo) {
          setHidratado(true);
        }
      }
    }

    void cargarEstado();

    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    if (!hidratado) {
      return;
    }
    const payload: EstadoPersistido = {
      prestamos,
      recientes: recientes.aArray(),
      avisos,
    };
    void AsyncStorage.setItem(
      CLAVE_STORAGE_BIBLIOTECA,
      JSON.stringify(payload),
    ).catch(() => {
      // Ignoramos errores silenciosos de escritura para no interrumpir la UI.
    });
  }, [hidratado, prestamos, recientes, avisos]);

  const registrarReciente = useCallback((libro: Libro) => {
    setRecientes((pilaAnterior) => {
      if (pilaAnterior.peek()?.isbn === libro.isbn) {
        return pilaAnterior;
      }
      const nuevaPila = pilaAnterior.clonar();
      nuevaPila.push(libro);
      return nuevaPila;
    });
  }, []);

  const obtenerDisponibles = useCallback(
    (libro: Libro): number => {
      const prestadoPorMi = prestamos.some((p) => p.isbn === libro.isbn)
        ? 1
        : 0;
      return Math.max(0, libro.ejemplares - prestadoPorMi);
    },
    [prestamos],
  );

  const obtenerListaEspera = useCallback(
    (isbn: string): Cola<string> => {
      return listasEspera[isbn] ?? new Cola<string>();
    },
    [listasEspera],
  );

  const estaReservadoPorMi = useCallback(
    (isbn: string): boolean => {
      if (prestamos.some((p) => p.isbn === isbn)) {
        return true;
      }
      const cola = listasEspera[isbn];
      if (!cola) {
        return false;
      }
      return cola.posicionDe(USUARIO_ACTUAL) !== -1;
    },
    [prestamos, listasEspera],
  );

  const reservarLibro = useCallback(
    (libro: Libro): ResultadoReserva => {
      if (estaReservadoPorMi(libro.isbn)) {
        return {
          tipo: 'duplicado',
          mensaje: 'Ya tenés un préstamo o una reserva activa para este libro.',
        };
      }

      const disponibles = obtenerDisponibles(libro);
      if (disponibles > 0) {
        const prestamo = crearPrestamoNuevo(libro.isbn);
        setPrestamos((prev) => [prestamo, ...prev]);
        return { tipo: 'prestamo', prestamo };
      }

      const colaActual = listasEspera[libro.isbn] ?? new Cola<string>();
      const colaNueva = colaActual.clonar();
      colaNueva.encolar(USUARIO_ACTUAL);
      const posicion = colaNueva.tamanio;

      setListasEspera((prev) => ({
        ...prev,
        [libro.isbn]: colaNueva,
      }));

      return { tipo: 'espera', posicion };
    },
    [estaReservadoPorMi, obtenerDisponibles, listasEspera],
  );

  const devolverLibro = useCallback(
    async (isbn: string): Promise<void> => {
      const prestamo = prestamos.find((p) => p.isbn === isbn);
      if (prestamo?.recordatorioId) {
        try {
          await cancelarRecordatorio(prestamo.recordatorioId);
        } catch {
          // Si la notificación ya venció o no existe, continuamos la devolución.
        }
      }
      setPrestamos((prev) => prev.filter((p) => p.isbn !== isbn));
    },
    [prestamos],
  );

  const activarRecordatorio = useCallback(
    async (isbn: string, tituloLibro: string): Promise<void> => {
      const id = await programarRecordatorioDevolucion(tituloLibro, isbn);
      setPrestamos((prev) =>
        prev.map((p) => (p.isbn === isbn ? { ...p, recordatorioId: id } : p)),
      );
    },
    [],
  );

  const desactivarRecordatorio = useCallback(
    async (isbn: string): Promise<void> => {
      const prestamo = prestamos.find((p) => p.isbn === isbn);
      if (prestamo?.recordatorioId) {
        try {
          await cancelarRecordatorio(prestamo.recordatorioId);
        } catch {
          // Continuamos limpiando el estado local aunque ya no esté programada.
        }
      }
      setPrestamos((prev) =>
        prev.map((p) => (p.isbn === isbn ? { ...p, recordatorioId: null } : p)),
      );
    },
    [prestamos],
  );

  const agregarAviso = useCallback(
    (titulo: string, mensaje: string, isbn?: string) => {
      const nuevoAviso: AvisoApp = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        titulo,
        mensaje,
        fecha: new Date().toISOString(),
        isbn,
      };
      setAvisos((prev) => [nuevoAviso, ...prev]);
    },
    [],
  );

  const descartarAviso = useCallback((id: string) => {
    setAvisos((prev) => prev.filter((aviso) => aviso.id !== id));
  }, []);

  const entregarAlSiguiente = useCallback(
    async (isbn: string, tituloLibro: string): Promise<ResultadoEntrega> => {
      const colaActual = listasEspera[isbn];
      if (!colaActual || colaActual.estaVacia()) {
        return {
          entregadoA: null,
          esUsuarioActual: false,
          restantesEnEspera: 0,
        };
      }

      const colaNueva = colaActual.clonar();
      const persona = colaNueva.desencolar() ?? null;

      setListasEspera((prev) => ({
        ...prev,
        [isbn]: colaNueva,
      }));

      const esUsuarioActual = persona === USUARIO_ACTUAL;
      if (esUsuarioActual) {
        setPrestamos((prev) => {
          if (prev.some((p) => p.isbn === isbn)) {
            return prev;
          }
          return [crearPrestamoNuevo(isbn), ...prev];
        });

        const permitido = await tienePermisoNotificaciones();
        if (permitido) {
          await enviarNotificacionEntrega(tituloLibro, isbn);
        } else {
          agregarAviso(
            '¡Tu libro ya está disponible!',
            `El personal te asignó "${tituloLibro}". Ya figura en tus préstamos activos.`,
            isbn,
          );
        }
      }

      return {
        entregadoA: persona,
        esUsuarioActual,
        restantesEnEspera: colaNueva.tamanio,
      };
    },
    [listasEspera, agregarAviso],
  );

  const iniciarSesionPersonal = useCallback(
    (usuario: string, clave: string): boolean => {
      const valido =
        usuario.trim().toLowerCase() === CREDENCIALES_PERSONAL.usuario &&
        clave === CREDENCIALES_PERSONAL.clave;
      if (valido) {
        setSesionPersonal(true);
      }
      return valido;
    },
    [],
  );

  const cerrarSesionPersonal = useCallback(() => {
    setSesionPersonal(false);
  }, []);

  const ultimosRecientes = useMemo(() => {
    return recientes.aArray().slice(-MAX_RECIENTES).reverse();
  }, [recientes]);

  const valor = useMemo<BibliotecaContextValor>(
    () => ({
      hidratado,
      prestamos,
      listasEspera,
      ultimosRecientes,
      avisos,
      sesionPersonal,
      registrarReciente,
      obtenerDisponibles,
      obtenerListaEspera,
      estaReservadoPorMi,
      reservarLibro,
      devolverLibro,
      activarRecordatorio,
      desactivarRecordatorio,
      entregarAlSiguiente,
      agregarAviso,
      descartarAviso,
      iniciarSesionPersonal,
      cerrarSesionPersonal,
    }),
    [
      hidratado,
      prestamos,
      listasEspera,
      ultimosRecientes,
      avisos,
      sesionPersonal,
      registrarReciente,
      obtenerDisponibles,
      obtenerListaEspera,
      estaReservadoPorMi,
      reservarLibro,
      devolverLibro,
      activarRecordatorio,
      desactivarRecordatorio,
      entregarAlSiguiente,
      agregarAviso,
      descartarAviso,
      iniciarSesionPersonal,
      cerrarSesionPersonal,
    ],
  );

  return (
    <BibliotecaContext.Provider value={valor}>
      {children}
    </BibliotecaContext.Provider>
  );
}

export function useBiblioteca(): BibliotecaContextValor {
  const contexto = useContext(BibliotecaContext);
  if (!contexto) {
    throw new Error(
      'useBiblioteca debe usarse dentro de un BibliotecaProvider.',
    );
  }
  return contexto;
}
