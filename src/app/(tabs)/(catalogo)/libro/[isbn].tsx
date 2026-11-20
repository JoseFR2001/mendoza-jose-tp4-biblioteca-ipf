import { Ionicons } from '@expo/vector-icons';
import {
  Link,
  router,
  useLocalSearchParams,
  useNavigation,
} from 'expo-router';
import { useEffect, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Boton } from '../../../../components/Boton';
import {
  ESPACIADO,
  RADIO,
  TAMANO_TACTIL_MINIMO,
  TIPOGRAFIA,
  type PaletaColores,
} from '../../../../constants/tema';
import { useBiblioteca } from '../../../../context/BibliotecaContext';
import { LIBROS } from '../../../../data/libros';
import { useTema } from '../../../../hooks/useTema';
import { esIsbnValido } from '../../../../lib/validacion';

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    contenedor: {
      flex: 1,
      backgroundColor: colores.fondo,
    },
    contenido: {
      padding: ESPACIADO.md,
      paddingBottom: ESPACIADO.xxl,
      gap: ESPACIADO.md,
    },
    portada: {
      backgroundColor: colores.primario,
      borderRadius: RADIO.xl,
      padding: ESPACIADO.xl,
      gap: ESPACIADO.sm,
      alignItems: 'flex-start',
    },
    iconoPortada: {
      width: 48,
      height: 48,
      borderRadius: RADIO.md,
      backgroundColor: 'rgba(255, 255, 255, 0.16)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: ESPACIADO.xs,
    },
    titulo: {
      fontSize: TIPOGRAFIA.xxl,
      fontWeight: '800',
      color: colores.primarioTexto,
      lineHeight: 34,
    },
    autor: {
      fontSize: TIPOGRAFIA.md,
      color: colores.primarioTexto,
      opacity: 0.9,
      fontWeight: '500',
    },
    tarjetaMetricas: {
      backgroundColor: colores.superficie,
      borderRadius: RADIO.lg,
      borderWidth: 1,
      borderColor: colores.borde,
      padding: ESPACIADO.md,
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: ESPACIADO.sm,
    },
    metrica: {
      flex: 1,
      alignItems: 'center',
      gap: 4,
      paddingVertical: ESPACIADO.xs,
    },
    valorMetrica: {
      fontSize: TIPOGRAFIA.xl,
      fontWeight: '800',
      color: colores.texto,
    },
    etiquetaMetrica: {
      fontSize: TIPOGRAFIA.xs,
      color: colores.textoSecundario,
      textAlign: 'center',
    },
    divisorVertical: {
      width: 1,
      backgroundColor: colores.borde,
    },
    tarjetaFicha: {
      backgroundColor: colores.superficie,
      borderRadius: RADIO.lg,
      borderWidth: 1,
      borderColor: colores.borde,
      padding: ESPACIADO.md,
      gap: ESPACIADO.sm,
    },
    filaFicha: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 4,
    },
    claveFicha: {
      fontSize: TIPOGRAFIA.sm,
      color: colores.textoSecundario,
    },
    valorFicha: {
      fontSize: TIPOGRAFIA.sm,
      fontWeight: '600',
      color: colores.texto,
    },
    avisoYaReservado: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ESPACIADO.sm,
      backgroundColor: colores.exitoSuave,
      borderRadius: RADIO.md,
      padding: ESPACIADO.md,
      borderWidth: 1,
      borderColor: colores.exito,
    },
    textoYaReservado: {
      flex: 1,
      fontSize: TIPOGRAFIA.sm,
      fontWeight: '600',
      color: colores.exito,
    },
    contenedorError: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: ESPACIADO.xl,
      gap: ESPACIADO.md,
      backgroundColor: colores.fondo,
    },
    circuloError: {
      width: 64,
      height: 64,
      borderRadius: RADIO.completo,
      backgroundColor: colores.advertenciaSuave,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tituloError: {
      fontSize: TIPOGRAFIA.xl,
      fontWeight: '700',
      color: colores.texto,
      textAlign: 'center',
    },
    mensajeError: {
      fontSize: TIPOGRAFIA.sm,
      color: colores.textoSecundario,
      textAlign: 'center',
      lineHeight: 20,
    },
    linkVolver: {
      minHeight: TAMANO_TACTIL_MINIMO + 4,
      backgroundColor: colores.primario,
      paddingHorizontal: ESPACIADO.lg,
      borderRadius: RADIO.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: ESPACIADO.xs,
    },
    textoLinkVolver: {
      fontSize: TIPOGRAFIA.md,
      fontWeight: '600',
      color: colores.primarioTexto,
    },
  });
}

export default function DetalleLibroScreen() {
  const { isbn: isbnParam } = useLocalSearchParams<{ isbn: string }>();
  const isbn = typeof isbnParam === 'string' ? isbnParam : '';
  const navigation = useNavigation();
  const { colores } = useTema();
  const estilos = useMemo(() => crearEstilos(colores), [colores]);

  const {
    registrarReciente,
    obtenerDisponibles,
    obtenerListaEspera,
    estaReservadoPorMi,
  } = useBiblioteca();

  const isbnValido = esIsbnValido(isbn);
  const libro = useMemo(
    () => (isbnValido ? LIBROS.find((l) => l.isbn === isbn) : undefined),
    [isbnValido, isbn],
  );

  useEffect(() => {
    navigation.setOptions({
      title: libro ? libro.titulo : 'Libro no encontrado',
    });
  }, [navigation, libro]);

  useEffect(() => {
    if (libro) {
      registrarReciente(libro);
    }
  }, [libro, registrarReciente]);

  if (!isbnValido || !libro) {
    return (
      <View style={estilos.contenedorError}>
        <View style={estilos.circuloError}>
          <Ionicons
            name="alert-circle-outline"
            size={32}
            color={colores.advertencia}
          />
        </View>
        <Text style={estilos.tituloError}>
          {!isbnValido ? 'ISBN inválido' : 'Libro no encontrado'}
        </Text>
        <Text style={estilos.mensajeError}>
          {!isbnValido
            ? `El código "${isbn}" no es un ISBN válido. Debe contener exactamente 13 dígitos numéricos.`
            : `No encontramos ningún libro registrado con el ISBN ${isbn} en el catálogo de la Biblioteca IPF.`}
        </Text>
        <Link href="/" asChild>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver al Catálogo"
            style={estilos.linkVolver}
          >
            <Text style={estilos.textoLinkVolver}>Volver al Catálogo</Text>
          </Pressable>
        </Link>
      </View>
    );
  }

  const disponibles = obtenerDisponibles(libro);
  const enEspera = obtenerListaEspera(libro.isbn).tamanio;
  const yaReservado = estaReservadoPorMi(libro.isbn);

  return (
    <ScrollView
      style={estilos.contenedor}
      contentContainerStyle={estilos.contenido}
    >
      <View style={estilos.portada}>
        <View style={estilos.iconoPortada}>
          <Ionicons name="book" size={24} color={colores.primarioTexto} />
        </View>
        <Text style={estilos.titulo}>{libro.titulo}</Text>
        <Text style={estilos.autor}>{libro.autor}</Text>
      </View>

      <View style={estilos.tarjetaMetricas}>
        <View style={estilos.metrica}>
          <Text style={estilos.valorMetrica}>{libro.anio}</Text>
          <Text style={estilos.etiquetaMetrica}>Año</Text>
        </View>
        <View style={estilos.divisorVertical} />
        <View style={estilos.metrica}>
          <Text style={estilos.valorMetrica}>{disponibles}</Text>
          <Text style={estilos.etiquetaMetrica}>Disponibles</Text>
        </View>
        <View style={estilos.divisorVertical} />
        <View style={estilos.metrica}>
          <Text style={estilos.valorMetrica}>{enEspera}</Text>
          <Text style={estilos.etiquetaMetrica}>En espera</Text>
        </View>
      </View>

      <View style={estilos.tarjetaFicha}>
        <View style={estilos.filaFicha}>
          <Text style={estilos.claveFicha}>ISBN-13</Text>
          <Text style={estilos.valorFicha}>{libro.isbn}</Text>
        </View>
        <View style={estilos.filaFicha}>
          <Text style={estilos.claveFicha}>Estado</Text>
          <Text style={estilos.valorFicha}>
            {disponibles > 0
              ? 'Disponible para préstamo inmediato (7 días)'
              : 'Sin ejemplares; ingreso a lista de espera'}
          </Text>
        </View>
      </View>

      {yaReservado ? (
        <View style={estilos.avisoYaReservado}>
          <Ionicons
            name="checkmark-circle"
            size={22}
            color={colores.exito}
          />
          <Text style={estilos.textoYaReservado}>
            Ya tenés este libro en tus préstamos o lista de espera.
          </Text>
        </View>
      ) : null}

      <Boton
        etiqueta={
          yaReservado
            ? 'Ya reservado'
            : disponibles > 0
              ? 'Reservar'
              : 'Anotarme en lista de espera'
        }
        icono={yaReservado ? 'checkmark-outline' : 'bookmark-outline'}
        deshabilitado={yaReservado}
        onPress={() =>
          router.push({
            pathname: '/reservar/[isbn]',
            params: { isbn: libro.isbn },
          })
        }
      />
    </ScrollView>
  );
}
