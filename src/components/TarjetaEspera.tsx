import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  ESPACIADO,
  RADIO,
  TIPOGRAFIA,
  type PaletaColores,
} from '../constants/tema';
import { useTema } from '../hooks/useTema';
import type { Libro } from '../types';

type PropsTarjetaEspera = {
  libro: Libro;
  posicion: number;
  totalEnEspera: number;
};

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    tarjeta: {
      backgroundColor: colores.superficie,
      borderRadius: RADIO.lg,
      borderWidth: 1,
      borderColor: colores.borde,
      padding: ESPACIADO.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: ESPACIADO.md,
    },
    info: {
      flex: 1,
      gap: 4,
    },
    titulo: {
      fontSize: TIPOGRAFIA.md,
      fontWeight: '700',
      color: colores.texto,
    },
    autor: {
      fontSize: TIPOGRAFIA.sm,
      color: colores.textoSecundario,
    },
    detalle: {
      fontSize: TIPOGRAFIA.xs,
      color: colores.textoTerciario,
    },
    insignia: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colores.advertenciaSuave,
      borderRadius: RADIO.md,
      paddingHorizontal: ESPACIADO.sm,
      paddingVertical: ESPACIADO.xs,
      minWidth: 72,
      gap: 2,
    },
    numero: {
      fontSize: TIPOGRAFIA.lg,
      fontWeight: '800',
      color: colores.advertencia,
    },
    etiqueta: {
      fontSize: TIPOGRAFIA.xs,
      fontWeight: '600',
      color: colores.advertencia,
    },
  });
}

export function TarjetaEspera({
  libro,
  posicion,
  totalEnEspera,
}: PropsTarjetaEspera) {
  const { colores } = useTema();
  const estilos = useMemo(() => crearEstilos(colores), [colores]);

  return (
    <View style={estilos.tarjeta}>
      <View style={estilos.info}>
        <Text style={estilos.titulo}>{libro.titulo}</Text>
        <Text style={estilos.autor}>{libro.autor}</Text>
        <Text style={estilos.detalle}>
          {totalEnEspera} {totalEnEspera === 1 ? 'persona' : 'personas'} en lista de espera
        </Text>
      </View>
      <View style={estilos.insignia}>
        <Ionicons name="hourglass-outline" size={16} color={colores.advertencia} />
        <Text style={estilos.numero}>#{posicion}</Text>
        <Text style={estilos.etiqueta}>Tu turno</Text>
      </View>
    </View>
  );
}
