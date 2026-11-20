import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Boton } from '../../components/Boton';
import { DIAS_PRESTAMO } from '../../constants/personal';
import {
  ESPACIADO,
  RADIO,
  TIPOGRAFIA,
  type PaletaColores,
} from '../../constants/tema';
import { useBiblioteca } from '../../context/BibliotecaContext';
import { LIBROS } from '../../data/libros';
import { useTema } from '../../hooks/useTema';
import { esIsbnValido, formatearFechaCorta } from '../../lib/validacion';

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    contenedor: {
      flex: 1,
      backgroundColor: colores.fondo,
    },
    contenido: {
      padding: ESPACIADO.lg,
      gap: ESPACIADO.md,
    },
    tarjeta: {
      backgroundColor: colores.superficie,
      borderRadius: RADIO.xl,
      borderWidth: 1,
      borderColor: colores.borde,
      padding: ESPACIADO.lg,
      gap: ESPACIADO.md,
    },
    circulo: {
      width: 56,
      height: 56,
      borderRadius: RADIO.completo,
      alignItems: 'center',
      justifyContent: 'center',
    },
    circuloExito: {
      backgroundColor: colores.exitoSuave,
    },
    circuloEspera: {
      backgroundColor: colores.advertenciaSuave,
    },
    titulo: {
      fontSize: TIPOGRAFIA.xl,
      fontWeight: '800',
      color: colores.texto,
    },
    subtitulo: {
      fontSize: TIPOGRAFIA.sm,
      color: colores.textoSecundario,
      lineHeight: 20,
    },
    cajaResumen: {
      backgroundColor: colores.superficieSecundaria,
      borderRadius: RADIO.md,
      padding: ESPACIADO.md,
      gap: ESPACIADO.xs,
    },
    filaResumen: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: ESPACIADO.sm,
    },
    etiqueta: {
      fontSize: TIPOGRAFIA.sm,
      color: colores.textoSecundario,
    },
    valor: {
      fontSize: TIPOGRAFIA.sm,
      fontWeight: '700',
      color: colores.texto,
      flexShrink: 1,
      textAlign: 'right',
    },
    textoError: {
      fontSize: TIPOGRAFIA.sm,
      color: colores.peligro,
      fontWeight: '600',
      textAlign: 'center',
    },
    acciones: {
      gap: ESPACIADO.sm,
    },
  });
}

export default function ReservarModalScreen() {
  const { isbn: isbnParam } = useLocalSearchParams<{ isbn: string }>();
  const isbn = typeof isbnParam === 'string' ? isbnParam : '';
  const [mensajeError, setMensajeError] = useState<string | null>(null);
  const [fechaDevolucionEstimada] = useState(() =>
    new Date(
      Date.now() + DIAS_PRESTAMO * 24 * 60 * 60 * 1000,
    ).toISOString(),
  );

  const {
    obtenerDisponibles,
    obtenerListaEspera,
    estaReservadoPorMi,
    reservarLibro,
  } = useBiblioteca();
  const { colores } = useTema();
  const estilos = useMemo(() => crearEstilos(colores), [colores]);

  const libro = useMemo(
    () => (esIsbnValido(isbn) ? LIBROS.find((l) => l.isbn === isbn) : undefined),
    [isbn],
  );

  if (!libro) {
    return (
      <View style={estilos.contenido}>
        <View style={estilos.tarjeta}>
          <Text style={estilos.titulo}>Libro no encontrado</Text>
          <Text style={estilos.subtitulo}>
            No se pudo identificar el libro que intentás reservar.
          </Text>
          <Boton
            etiqueta="Cerrar"
            variante="secundario"
            onPress={() => router.back()}
          />
        </View>
      </View>
    );
  }

  const disponibles = obtenerDisponibles(libro);
  const enEspera = obtenerListaEspera(libro.isbn).tamanio;
  const yaReservado = estaReservadoPorMi(libro.isbn);
  const esPrestamoDirecto = disponibles > 0;
  const posicionEstimada = enEspera + 1;

  const confirmar = () => {
    const resultado = reservarLibro(libro);
    if (resultado.tipo === 'duplicado' || resultado.tipo === 'error') {
      setMensajeError(resultado.mensaje);
      return;
    }
    router.dismissTo('/reservas');
  };

  return (
    <ScrollView
      style={estilos.contenedor}
      contentContainerStyle={estilos.contenido}
    >
      <View style={estilos.tarjeta}>
        <View
          style={[
            estilos.circulo,
            esPrestamoDirecto ? estilos.circuloExito : estilos.circuloEspera,
          ]}
        >
          <Ionicons
            name={esPrestamoDirecto ? 'book-outline' : 'hourglass-outline'}
            size={28}
            color={esPrestamoDirecto ? colores.exito : colores.advertencia}
          />
        </View>

        <Text style={estilos.titulo}>
          {esPrestamoDirecto
            ? 'Préstamo por 7 días'
            : 'Ingreso a lista de espera'}
        </Text>

        <Text style={estilos.subtitulo}>
          {esPrestamoDirecto
            ? 'Hay ejemplares disponibles en estante. Al confirmar, el libro quedará registrado a tu nombre.'
            : 'No quedan ejemplares en este momento. Te anotamos en la lista de espera respetando el orden de llegada.'}
        </Text>

        <View style={estilos.cajaResumen}>
          <View style={estilos.filaResumen}>
            <Text style={estilos.etiqueta}>Libro</Text>
            <Text style={estilos.valor}>{libro.titulo}</Text>
          </View>
          <View style={estilos.filaResumen}>
            <Text style={estilos.etiqueta}>Autor</Text>
            <Text style={estilos.valor}>{libro.autor}</Text>
          </View>
          {esPrestamoDirecto ? (
            <View style={estilos.filaResumen}>
              <Text style={estilos.etiqueta}>Fecha de devolución</Text>
              <Text style={estilos.valor}>
                {formatearFechaCorta(fechaDevolucionEstimada)}
              </Text>
            </View>
          ) : (
            <View style={estilos.filaResumen}>
              <Text style={estilos.etiqueta}>Tu posición en espera</Text>
              <Text style={estilos.valor}>#{posicionEstimada}</Text>
            </View>
          )}
        </View>

        {yaReservado ? (
          <Text style={estilos.textoError}>
            Ya tenés un préstamo o reserva activa para este libro.
          </Text>
        ) : null}

        {mensajeError ? (
          <Text style={estilos.textoError}>{mensajeError}</Text>
        ) : null}

        <View style={estilos.acciones}>
          <Boton
            etiqueta="Confirmar"
            icono="checkmark-circle-outline"
            deshabilitado={yaReservado}
            onPress={confirmar}
          />
          <Boton
            etiqueta="Cancelar"
            variante="fantasma"
            onPress={() => router.back()}
          />
        </View>
      </View>
    </ScrollView>
  );
}
