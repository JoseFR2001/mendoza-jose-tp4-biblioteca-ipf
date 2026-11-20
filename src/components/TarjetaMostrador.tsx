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
import { Boton } from './Boton';

type PropsTarjetaMostrador = {
  libro: Libro;
  personaAlFrente: string | undefined;
  cantidadEnEspera: number;
  entregando: boolean;
  onEntregar: () => void;
};

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    tarjeta: {
      backgroundColor: colores.superficie,
      borderRadius: RADIO.lg,
      borderWidth: 1,
      borderColor: colores.borde,
      padding: ESPACIADO.md,
      gap: ESPACIADO.sm,
    },
    encabezado: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: ESPACIADO.sm,
    },
    tituloBloque: {
      flex: 1,
      gap: 2,
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
    badgeCantidad: {
      backgroundColor: colores.primarioSuave,
      paddingHorizontal: ESPACIADO.sm,
      paddingVertical: 4,
      borderRadius: RADIO.completo,
    },
    textoCantidad: {
      fontSize: TIPOGRAFIA.xs,
      fontWeight: '700',
      color: colores.primario,
    },
    cajaFrente: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ESPACIADO.xs,
      backgroundColor: colores.superficieSecundaria,
      padding: ESPACIADO.sm,
      borderRadius: RADIO.md,
    },
    textoFrente: {
      flex: 1,
      fontSize: TIPOGRAFIA.sm,
      color: colores.texto,
    },
    nombreFrente: {
      fontWeight: '700',
      color: colores.primario,
    },
  });
}

export function TarjetaMostrador({
  libro,
  personaAlFrente,
  cantidadEnEspera,
  entregando,
  onEntregar,
}: PropsTarjetaMostrador) {
  const { colores } = useTema();
  const estilos = useMemo(() => crearEstilos(colores), [colores]);

  return (
    <View style={estilos.tarjeta}>
      <View style={estilos.encabezado}>
        <View style={estilos.tituloBloque}>
          <Text style={estilos.titulo}>{libro.titulo}</Text>
          <Text style={estilos.autor}>{libro.autor}</Text>
        </View>
        <View style={estilos.badgeCantidad}>
          <Text style={estilos.textoCantidad}>
            {cantidadEnEspera} en espera
          </Text>
        </View>
      </View>

      <View style={estilos.cajaFrente}>
        <Ionicons
          name="person-circle-outline"
          size={20}
          color={colores.primario}
        />
        <Text style={estilos.textoFrente}>
          Al frente de la fila:{' '}
          <Text style={estilos.nombreFrente}>
            {personaAlFrente ?? 'Sin personas en espera'}
          </Text>
        </Text>
      </View>

      <Boton
        etiqueta="Entregar al siguiente"
        icono="checkmark-done-outline"
        cargando={entregando}
        deshabilitado={cantidadEnEspera === 0}
        onPress={onEntregar}
      />
    </View>
  );
}
