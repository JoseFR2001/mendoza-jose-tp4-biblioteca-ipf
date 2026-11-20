import { Ionicons } from '@expo/vector-icons';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { Boton } from '../components/Boton';
import { EstadoVacio } from '../components/EstadoVacio';
import { TarjetaMostrador } from '../components/TarjetaMostrador';
import {
  ESPACIADO,
  RADIO,
  TIPOGRAFIA,
  type PaletaColores,
} from '../constants/tema';
import { useBiblioteca } from '../context/BibliotecaContext';
import { LIBROS } from '../data/libros';
import { useTema } from '../hooks/useTema';
import type { Libro } from '../types';

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    contenedor: {
      flex: 1,
      backgroundColor: colores.fondo,
    },
    contenidoLista: {
      padding: ESPACIADO.md,
      paddingBottom: ESPACIADO.xxl,
      gap: ESPACIADO.md,
    },
    cabecera: {
      gap: ESPACIADO.md,
    },
    bannerFeedback: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ESPACIADO.sm,
      backgroundColor: colores.exitoSuave,
      borderRadius: RADIO.md,
      borderWidth: 1,
      borderColor: colores.exito,
      padding: ESPACIADO.md,
    },
    textoFeedback: {
      flex: 1,
      fontSize: TIPOGRAFIA.sm,
      fontWeight: '600',
      color: colores.exito,
    },
    pie: {
      marginTop: ESPACIADO.sm,
    },
  });
}

export default function MostradorScreen() {
  const { listasEspera, entregarAlSiguiente, cerrarSesionPersonal } =
    useBiblioteca();
  const { colores } = useTema();
  const estilos = useMemo(() => crearEstilos(colores), [colores]);

  const [entregandoIsbn, setEntregandoIsbn] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const librosConEspera = useMemo(() => {
    return LIBROS.filter((libro) => {
      const cola = listasEspera[libro.isbn];
      return cola && !cola.estaVacia();
    });
  }, [listasEspera]);

  const manejarEntrega = useCallback(
    async (libro: Libro) => {
      setEntregandoIsbn(libro.isbn);
      try {
        const resultado = await entregarAlSiguiente(libro.isbn, libro.titulo);
        if (!resultado.entregadoA) {
          setFeedback(
            `No hay personas en espera para "${libro.titulo}".`,
          );
          return;
        }
        setFeedback(
          `Se entregó "${libro.titulo}" a ${resultado.entregadoA}. Quedan ${resultado.restantesEnEspera} en espera.`,
        );
      } finally {
        setEntregandoIsbn(null);
      }
    },
    [entregarAlSiguiente],
  );

  const renderizarItem = useCallback(
    ({ item }: { item: Libro }) => {
      const cola = listasEspera[item.isbn];
      return (
        <TarjetaMostrador
          libro={item}
          personaAlFrente={cola?.frente()}
          cantidadEnEspera={cola?.tamanio ?? 0}
          entregando={entregandoIsbn === item.isbn}
          onEntregar={() => void manejarEntrega(item)}
        />
      );
    },
    [listasEspera, entregandoIsbn, manejarEntrega],
  );

  return (
    <View style={estilos.contenedor}>
      <FlatList
        data={librosConEspera}
        keyExtractor={(item) => item.isbn}
        renderItem={renderizarItem}
        contentContainerStyle={estilos.contenidoLista}
        ListHeaderComponent={
          feedback ? (
            <View style={estilos.cabecera}>
              <View style={estilos.bannerFeedback}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={22}
                  color={colores.exito}
                />
                <Text style={estilos.textoFeedback}>{feedback}</Text>
              </View>
            </View>
          ) : undefined
        }
        ListEmptyComponent={
          <EstadoVacio
            icono="checkmark-done-circle-outline"
            titulo="Todas las filas al día"
            descripcion="No hay libros con personas en lista de espera en este momento."
          />
        }
        ListFooterComponent={
          <View style={estilos.pie}>
            <Boton
              etiqueta="Cerrar sesión"
              icono="log-out-outline"
              variante="peligro"
              onPress={cerrarSesionPersonal}
            />
          </View>
        }
      />
    </View>
  );
}
