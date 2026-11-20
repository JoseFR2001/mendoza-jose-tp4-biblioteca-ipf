import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  ESPACIADO,
  RADIO,
  TAMANO_TACTIL_MINIMO,
  TIPOGRAFIA,
  type PaletaColores,
} from '../constants/tema';
import { useTema } from '../hooks/useTema';
import type { Libro } from '../types';

type PropsTarjetaReciente = {
  libro: Libro;
  onPress: (isbn: string) => void;
};

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    tarjeta: {
      width: 168,
      minHeight: TAMANO_TACTIL_MINIMO + 44,
      backgroundColor: colores.superficie,
      borderRadius: RADIO.md,
      borderWidth: 1,
      borderColor: colores.borde,
      padding: ESPACIADO.sm,
      justifyContent: 'space-between',
      gap: ESPACIADO.xs,
    },
    presionada: {
      opacity: 0.82,
    },
    cabecera: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ESPACIADO.xxs,
    },
    etiqueta: {
      fontSize: TIPOGRAFIA.xs,
      fontWeight: '600',
      color: colores.primario,
    },
    titulo: {
      fontSize: TIPOGRAFIA.sm,
      fontWeight: '700',
      color: colores.texto,
      lineHeight: 18,
    },
    autor: {
      fontSize: TIPOGRAFIA.xs,
      color: colores.textoSecundario,
    },
  });
}

export function TarjetaReciente({ libro, onPress }: PropsTarjetaReciente) {
  const { colores } = useTema();
  const estilos = useMemo(() => crearEstilos(colores), [colores]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Abrir visto recientemente: ${libro.titulo}`}
      onPress={() => onPress(libro.isbn)}
      style={({ pressed }) => [estilos.tarjeta, pressed && estilos.presionada]}
    >
      <View style={estilos.cabecera}>
        <Ionicons name="book-outline" size={14} color={colores.primario} />
        <Text style={estilos.etiqueta}>Reciente</Text>
      </View>
      <Text style={estilos.titulo} numberOfLines={2}>
        {libro.titulo}
      </Text>
      <Text style={estilos.autor} numberOfLines={1}>
        {libro.autor}
      </Text>
    </Pressable>
  );
}
