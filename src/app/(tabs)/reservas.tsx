import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { BannerAviso } from '../../components/BannerAviso';
import { Boton } from '../../components/Boton';
import { EstadoVacio } from '../../components/EstadoVacio';
import { TarjetaEspera } from '../../components/TarjetaEspera';
import { TarjetaPrestamo } from '../../components/TarjetaPrestamo';
import { USUARIO_ACTUAL } from '../../constants/personal';
import {
  ESPACIADO,
  RADIO,
  TIPOGRAFIA,
  type PaletaColores,
} from '../../constants/tema';
import { useBiblioteca } from '../../context/BibliotecaContext';
import { LIBROS } from '../../data/libros';
import { usePermiso } from '../../hooks/usePermiso';
import { useTema } from '../../hooks/useTema';
import { tienePermisoNotificaciones } from '../../lib/notificaciones';

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    contenedor: {
      flex: 1,
      backgroundColor: colores.fondo,
    },
    contenido: {
      padding: ESPACIADO.md,
      paddingBottom: ESPACIADO.xxl,
      gap: ESPACIADO.lg,
    },
    tarjetaEstadoNotif: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colores.superficie,
      borderRadius: RADIO.lg,
      borderWidth: 1,
      borderColor: colores.borde,
      padding: ESPACIADO.md,
      gap: ESPACIADO.sm,
    },
    infoNotif: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: ESPACIADO.sm,
    },
    textosNotif: {
      flex: 1,
      gap: 2,
    },
    tituloNotif: {
      fontSize: TIPOGRAFIA.sm,
      fontWeight: '700',
      color: colores.texto,
    },
    subtituloNotif: {
      fontSize: TIPOGRAFIA.xs,
      color: colores.textoSecundario,
    },
    seccion: {
      gap: ESPACIADO.sm,
    },
    tituloSeccion: {
      fontSize: TIPOGRAFIA.lg,
      fontWeight: '700',
      color: colores.texto,
    },
  });
}

export default function ReservasScreen() {
  const {
    prestamos,
    listasEspera,
    avisos,
    devolverLibro,
    activarRecordatorio,
    desactivarRecordatorio,
    agregarAviso,
    descartarAviso,
  } = useBiblioteca();

  const {
    estado: estadoNotif,
    abrirAjustes,
    actualizar: actualizarNotif,
  } = usePermiso('notificaciones');
  const { colores } = useTema();
  const estilos = useMemo(() => crearEstilos(colores), [colores]);

  const [procesandoIsbn, setProcesandoIsbn] = useState<string | null>(null);
  const pendienteRecordatorioRef = useRef<{
    isbn: string;
    titulo: string;
  } | null>(null);

  useFocusEffect(
    useCallback(() => {
      let activo = true;
      async function sincronizarYCompletar() {
        await actualizarNotif();
        const pendiente = pendienteRecordatorioRef.current;
        if (!activo || !pendiente) {
          return;
        }
        pendienteRecordatorioRef.current = null;
        const permitido = await tienePermisoNotificaciones();
        if (!activo) {
          return;
        }
        if (permitido) {
          setProcesandoIsbn(pendiente.isbn);
          try {
            await activarRecordatorio(pendiente.isbn, pendiente.titulo);
          } finally {
            if (activo) {
              setProcesandoIsbn(null);
            }
          }
        } else {
          agregarAviso(
            'Notificaciones desactivadas',
            `No pudimos programar el recordatorio externo para "${pendiente.titulo}", pero verás tus avisos en esta pantalla.`,
            pendiente.isbn,
          );
        }
      }
      void sincronizarYCompletar();
      return () => {
        activo = false;
      };
    }, [actualizarNotif, activarRecordatorio, agregarAviso]),
  );

  const misEsperas = useMemo(() => {
    const lista: {
      isbn: string;
      posicion: number;
      total: number;
    }[] = [];

    for (const [isbn, cola] of Object.entries(listasEspera)) {
      const posicion = cola.posicionDe(USUARIO_ACTUAL);
      if (posicion !== -1) {
        lista.push({ isbn, posicion, total: cola.tamanio });
      }
    }
    return lista;
  }, [listasEspera]);

  const manejarRecordatorio = useCallback(
    async (isbn: string, titulo: string, activar: boolean) => {
      if (!activar) {
        setProcesandoIsbn(isbn);
        try {
          await desactivarRecordatorio(isbn);
        } finally {
          setProcesandoIsbn(null);
        }
        return;
      }

      if (estadoNotif === 'concedido') {
        setProcesandoIsbn(isbn);
        try {
          await activarRecordatorio(isbn, titulo);
        } finally {
          setProcesandoIsbn(null);
        }
        return;
      }

      pendienteRecordatorioRef.current = { isbn, titulo };
      router.push({
        pathname: '/permisos/[recurso]',
        params: { recurso: 'notificaciones' },
      });
    },
    [estadoNotif, activarRecordatorio, desactivarRecordatorio],
  );

  const textoEstadoNotif =
    estadoNotif === 'concedido'
      ? 'Permitidas'
      : estadoNotif === 'bloqueado'
        ? 'Bloqueadas en Ajustes'
        : estadoNotif === 'cargando'
          ? 'Verificando...'
          : 'Sin activar';

  return (
    <ScrollView
      style={estilos.contenedor}
      contentContainerStyle={estilos.contenido}
    >
      <View style={estilos.tarjetaEstadoNotif}>
        <View style={estilos.infoNotif}>
          <Ionicons
            name={
              estadoNotif === 'concedido'
                ? 'notifications'
                : 'notifications-off-outline'
            }
            size={22}
            color={
              estadoNotif === 'concedido'
                ? colores.exito
                : colores.textoSecundario
            }
          />
          <View style={estilos.textosNotif}>
            <Text style={estilos.tituloNotif}>
              Notificaciones: {textoEstadoNotif}
            </Text>
            <Text style={estilos.subtituloNotif}>
              {estadoNotif === 'concedido'
                ? 'Recibirás recordatorios y avisos de entrega.'
                : 'Si no las activás, igual verás tus avisos dentro de la app.'}
            </Text>
          </View>
        </View>
        {estadoNotif === 'bloqueado' ? (
          <Boton
            etiqueta="Ajustes"
            variante="secundario"
            onPress={() => void abrirAjustes()}
          />
        ) : null}
      </View>

      {avisos.length > 0 ? (
        <View style={estilos.seccion}>
          <Text style={estilos.tituloSeccion}>Avisos</Text>
          {avisos.map((aviso) => (
            <BannerAviso
              key={aviso.id}
              aviso={aviso}
              onDescartar={descartarAviso}
            />
          ))}
        </View>
      ) : null}

      <View style={estilos.seccion}>
        <Text style={estilos.tituloSeccion}>
          Mis préstamos ({prestamos.length})
        </Text>
        {prestamos.length === 0 ? (
          <EstadoVacio
            icono="book-outline"
            titulo="Sin préstamos activos"
            descripcion="Cuando reserves un libro con ejemplares disponibles, aparecerá acá con su fecha de devolución."
            etiquetaAccion="Explorar catálogo"
            onAccion={() => router.navigate('/')}
          />
        ) : (
          prestamos.map((prestamo) => {
            const libro = LIBROS.find((l) => l.isbn === prestamo.isbn);
            const titulo = libro?.titulo ?? prestamo.isbn;
            return (
              <TarjetaPrestamo
                key={prestamo.isbn}
                prestamo={prestamo}
                libro={libro}
                procesandoRecordatorio={procesandoIsbn === prestamo.isbn}
                onCambiarRecordatorio={(activar) =>
                  void manejarRecordatorio(prestamo.isbn, titulo, activar)
                }
                onDevolver={() => void devolverLibro(prestamo.isbn)}
              />
            );
          })
        )}
      </View>

      <View style={estilos.seccion}>
        <Text style={estilos.tituloSeccion}>
          En lista de espera ({misEsperas.length})
        </Text>
        {misEsperas.length === 0 ? (
          <EstadoVacio
            icono="hourglass-outline"
            titulo="Sin reservas en espera"
            descripcion="Si reservás un libro sin ejemplares disponibles, verás tu posición en la fila acá."
          />
        ) : (
          misEsperas.map((item) => {
            const libro = LIBROS.find((l) => l.isbn === item.isbn);
            if (!libro) {
              return null;
            }
            return (
              <TarjetaEspera
                key={item.isbn}
                libro={libro}
                posicion={item.posicion}
                totalEnEspera={item.total}
              />
            );
          })
        )}
      </View>
    </ScrollView>
  );
}
