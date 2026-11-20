import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { EstadoCarga } from '../../../components/EstadoCarga';
import { EstadoError } from '../../../components/EstadoError';
import { EstadoVacio } from '../../../components/EstadoVacio';
import { TarjetaLibro } from '../../../components/TarjetaLibro';
import { TarjetaReciente } from '../../../components/TarjetaReciente';
import {
  ESPACIADO,
  RADIO,
  TAMANO_TACTIL_MINIMO,
  TIPOGRAFIA,
  type PaletaColores,
} from '../../../constants/tema';
import { useBiblioteca } from '../../../context/BibliotecaContext';
import { useLibros } from '../../../hooks/useLibros';
import { useTema } from '../../../hooks/useTema';
import type { Libro } from '../../../types';

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    contenedor: {
      flex: 1,
      backgroundColor: colores.fondo,
    },
    contenidoLista: {
      padding: ESPACIADO.md,
      paddingBottom: ESPACIADO.xxl,
      gap: ESPACIADO.sm,
    },
    cabecera: {
      gap: ESPACIADO.lg,
      marginBottom: ESPACIADO.xs,
    },
    bannerBienvenida: {
      backgroundColor: colores.primario,
      borderRadius: RADIO.xl,
      padding: ESPACIADO.lg,
      gap: ESPACIADO.sm,
    },
    tituloBanner: {
      fontSize: TIPOGRAFIA.xl,
      fontWeight: '800',
      color: colores.primarioTexto,
    },
    subtituloBanner: {
      fontSize: TIPOGRAFIA.sm,
      color: colores.primarioTexto,
      opacity: 0.88,
      lineHeight: 20,
    },
    filaAcciones: {
      flexDirection: 'row',
      gap: ESPACIADO.sm,
      marginTop: ESPACIADO.xs,
    },
    botonAccionBuscar: {
      flex: 1,
      minHeight: TAMANO_TACTIL_MINIMO + 4,
      backgroundColor: colores.superficie,
      borderRadius: RADIO.md,
      paddingHorizontal: ESPACIADO.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: ESPACIADO.xs,
    },
    botonAccionEscanear: {
      minHeight: TAMANO_TACTIL_MINIMO + 4,
      minWidth: TAMANO_TACTIL_MINIMO + 68,
      backgroundColor: colores.acento,
      borderRadius: RADIO.md,
      paddingHorizontal: ESPACIADO.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: ESPACIADO.xs,
    },
    presionado: {
      opacity: 0.82,
    },
    textoBuscar: {
      fontSize: TIPOGRAFIA.sm,
      fontWeight: '700',
      color: colores.primario,
    },
    textoEscanear: {
      fontSize: TIPOGRAFIA.sm,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    seccionRecientes: {
      gap: ESPACIADO.sm,
    },
    filaTituloSeccion: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    tituloSeccion: {
      fontSize: TIPOGRAFIA.lg,
      fontWeight: '700',
      color: colores.texto,
    },
    contadorSeccion: {
      fontSize: TIPOGRAFIA.xs,
      fontWeight: '600',
      color: colores.textoTerciario,
      backgroundColor: colores.superficieSecundaria,
      paddingHorizontal: ESPACIADO.xs,
      paddingVertical: 4,
      borderRadius: RADIO.completo,
      overflow: 'hidden',
    },
    listaRecientes: {
      gap: ESPACIADO.sm,
    },
  });
}

export default function CatalogoScreen() {
  const { libros, cargando, error, reintentar } = useLibros();
  const { ultimosRecientes, obtenerDisponibles, obtenerListaEspera } =
    useBiblioteca();
  const { colores } = useTema();
  const estilos = useMemo(() => crearEstilos(colores), [colores]);

  const abrirDetalle = useCallback((isbn: string) => {
    router.push({ pathname: '/libro/[isbn]', params: { isbn } });
  }, []);

  const abrirBuscador = useCallback(() => {
    router.push('/buscar');
  }, []);

  const abrirEscaner = useCallback(() => {
    router.push('/escanear');
  }, []);

  const renderizarLibro = useCallback(
    ({ item }: { item: Libro }) => (
      <TarjetaLibro
        libro={item}
        disponibles={obtenerDisponibles(item)}
        enEspera={obtenerListaEspera(item.isbn).tamanio}
        onPress={abrirDetalle}
      />
    ),
    [obtenerDisponibles, obtenerListaEspera, abrirDetalle],
  );

  const renderizarReciente = useCallback(
    ({ item }: { item: Libro }) => (
      <TarjetaReciente libro={item} onPress={abrirDetalle} />
    ),
    [abrirDetalle],
  );

  if (cargando) {
    return <EstadoCarga />;
  }

  if (error) {
    return (
      <EstadoError
        titulo="No se pudo cargar el catálogo"
        mensaje={error}
        onReintentar={reintentar}
      />
    );
  }

  return (
    <View style={estilos.contenedor}>
      <FlatList
        data={libros}
        keyExtractor={(item) => item.isbn}
        renderItem={renderizarLibro}
        contentContainerStyle={estilos.contenidoLista}
        ListHeaderComponent={
          <View style={estilos.cabecera}>
            <View style={estilos.bannerBienvenida}>
              <Text style={estilos.tituloBanner}>Tu próxima lectura</Text>
              <Text style={estilos.subtituloBanner}>
                Consultá disponibilidad, reservá libros y activá recordatorios de
                devolución.
              </Text>
              <View style={estilos.filaAcciones}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Buscar libros por título o autor"
                  onPress={abrirBuscador}
                  style={({ pressed }) => [
                    estilos.botonAccionBuscar,
                    pressed && estilos.presionado,
                  ]}
                >
                  <Ionicons
                    name="search-outline"
                    size={18}
                    color={colores.primario}
                  />
                  <Text style={estilos.textoBuscar}>Buscar</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Escanear código de barras ISBN de un libro"
                  onPress={abrirEscaner}
                  style={({ pressed }) => [
                    estilos.botonAccionEscanear,
                    pressed && estilos.presionado,
                  ]}
                >
                  <Ionicons
                    name="barcode-outline"
                    size={18}
                    color="#FFFFFF"
                  />
                  <Text style={estilos.textoEscanear}>Escanear</Text>
                </Pressable>
              </View>
            </View>

            {ultimosRecientes.length > 0 ? (
              <View style={estilos.seccionRecientes}>
                <View style={estilos.filaTituloSeccion}>
                  <Text style={estilos.tituloSeccion}>
                    Vistos recientemente
                  </Text>
                  <Text style={estilos.contadorSeccion}>
                    Últimos {ultimosRecientes.length}
                  </Text>
                </View>
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={ultimosRecientes}
                  keyExtractor={(item) => item.isbn}
                  renderItem={renderizarReciente}
                  contentContainerStyle={estilos.listaRecientes}
                />
              </View>
            ) : null}

            <View style={estilos.filaTituloSeccion}>
              <Text style={estilos.tituloSeccion}>Catálogo completo</Text>
              <Text style={estilos.contadorSeccion}>
                {libros.length} títulos
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <EstadoVacio
            icono="library-outline"
            titulo="El catálogo está vacío"
            descripcion="Por el momento no hay libros registrados en la biblioteca."
            etiquetaAccion="Volver a cargar"
            onAccion={reintentar}
          />
        }
      />
    </View>
  );
}
