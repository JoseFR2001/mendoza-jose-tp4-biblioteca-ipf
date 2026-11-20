import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { EstadoError } from '../components/EstadoError';
import { EstadoVacio } from '../components/EstadoVacio';
import { TarjetaLibro } from '../components/TarjetaLibro';
import {
  ESPACIADO,
  RADIO,
  TAMANO_TACTIL_MINIMO,
  TIPOGRAFIA,
  type PaletaColores,
} from '../constants/tema';
import { useBiblioteca } from '../context/BibliotecaContext';
import { useTema } from '../hooks/useTema';
import { buscarLibros } from '../lib/api';
import type { Libro } from '../types';

const DEBOUNCE_MS = 300;

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    contenedor: {
      flex: 1,
      backgroundColor: colores.fondo,
    },
    barraBusqueda: {
      padding: ESPACIADO.md,
      backgroundColor: colores.superficie,
      borderBottomWidth: 1,
      borderColor: colores.borde,
    },
    cajaInput: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colores.superficieSecundaria,
      borderRadius: RADIO.md,
      paddingLeft: ESPACIADO.sm,
      paddingRight: ESPACIADO.xxs,
      minHeight: TAMANO_TACTIL_MINIMO + 4,
      gap: ESPACIADO.xs,
    },
    input: {
      flex: 1,
      fontSize: TIPOGRAFIA.md,
      color: colores.texto,
      paddingVertical: ESPACIADO.xs,
    },
    botonLimpiar: {
      width: TAMANO_TACTIL_MINIMO,
      height: TAMANO_TACTIL_MINIMO,
      alignItems: 'center',
      justifyContent: 'center',
    },
    barraEstado: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: ESPACIADO.md,
      paddingTop: ESPACIADO.sm,
    },
    textoEstado: {
      fontSize: TIPOGRAFIA.xs,
      color: colores.textoTerciario,
      fontWeight: '600',
    },
    contenidoLista: {
      padding: ESPACIADO.md,
      paddingBottom: ESPACIADO.xxl,
      gap: ESPACIADO.sm,
    },
  });
}

export default function BuscarScreen() {
  const params = useLocalSearchParams<{ q?: string }>();
  const consultaUrl = typeof params.q === 'string' ? params.q : '';

  const [resultados, setResultados] = useState<Libro[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reintento, setReintento] = useState(0);

  const { obtenerDisponibles, obtenerListaEspera } = useBiblioteca();
  const { colores } = useTema();
  const estilos = useMemo(() => crearEstilos(colores), [colores]);

  const alCambiarTexto = useCallback((texto: string) => {
    router.setParams({ q: texto });
  }, []);

  const limpiarBusqueda = useCallback(() => {
    router.setParams({ q: '' });
  }, []);

  useEffect(() => {
    let cancelado = false;

    const temporizador = setTimeout(() => {
      async function ejecutarBusqueda() {
        setCargando(true);
        setError(null);
        try {
          const datos = await buscarLibros(consultaUrl);
          if (!cancelado) {
            setResultados(datos);
          }
        } catch {
          if (!cancelado) {
            setError('No pudimos completar la búsqueda. Intentá nuevamente.');
          }
        } finally {
          if (!cancelado) {
            setCargando(false);
          }
        }
      }
      void ejecutarBusqueda();
    }, DEBOUNCE_MS);

    return () => {
      cancelado = true;
      clearTimeout(temporizador);
    };
  }, [consultaUrl, reintento]);

  const abrirDetalle = useCallback((isbn: string) => {
    router.push({ pathname: '/libro/[isbn]', params: { isbn } });
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

  return (
    <View style={estilos.contenedor}>
      <View style={estilos.barraBusqueda}>
        <View style={estilos.cajaInput}>
          <Ionicons
            name="search-outline"
            size={20}
            color={colores.textoTerciario}
          />
          <TextInput
            value={consultaUrl}
            onChangeText={alCambiarTexto}
            placeholder="Buscar por título o autor..."
            placeholderTextColor={colores.textoTerciario}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            style={estilos.input}
            accessibilityLabel="Campo de búsqueda de libros por título o autor"
          />
          {consultaUrl.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Limpiar búsqueda"
              onPress={limpiarBusqueda}
              style={estilos.botonLimpiar}
            >
              <Ionicons
                name="close-circle"
                size={20}
                color={colores.textoTerciario}
              />
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={estilos.barraEstado}>
        <Text style={estilos.textoEstado}>
          {cargando
            ? 'Buscando en el catálogo...'
            : consultaUrl.trim()
              ? `${resultados.length} ${resultados.length === 1 ? 'resultado' : 'resultados'} para "${consultaUrl.trim()}"`
              : `${resultados.length} libros en el catálogo`}
        </Text>
        {cargando ? (
          <ActivityIndicator size="small" color={colores.primario} />
        ) : null}
      </View>

      {error ? (
        <EstadoError
          titulo="Error al buscar"
          mensaje={error}
          onReintentar={() => setReintento((n) => n + 1)}
        />
      ) : (
        <FlatList
          data={resultados}
          keyExtractor={(item) => item.isbn}
          renderItem={renderizarLibro}
          contentContainerStyle={estilos.contenidoLista}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            cargando ? undefined : (
              <EstadoVacio
                icono="search-outline"
                titulo="Sin coincidencias"
                descripcion={`No encontramos libros que coincidan con "${consultaUrl.trim()}". Probá con otro título o autor.`}
                etiquetaAccion="Limpiar búsqueda"
                onAccion={limpiarBusqueda}
              />
            )
          }
        />
      )}
    </View>
  );
}
