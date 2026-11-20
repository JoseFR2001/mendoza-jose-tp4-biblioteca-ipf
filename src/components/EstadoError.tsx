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
import { Boton } from './Boton';

type PropsEstadoError = {
  titulo?: string;
  mensaje: string;
  etiquetaAccion?: string;
  onReintentar: () => void;
};

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    contenedor: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: ESPACIADO.xl,
      backgroundColor: colores.fondo,
    },
    tarjeta: {
      width: '100%',
      backgroundColor: colores.superficie,
      borderRadius: RADIO.lg,
      padding: ESPACIADO.xl,
      alignItems: 'center',
      gap: ESPACIADO.md,
      borderWidth: 1,
      borderColor: colores.borde,
    },
    circuloIcono: {
      width: 56,
      height: 56,
      borderRadius: RADIO.completo,
      backgroundColor: colores.peligroSuave,
      alignItems: 'center',
      justifyContent: 'center',
    },
    titulo: {
      fontSize: TIPOGRAFIA.lg,
      fontWeight: '700',
      color: colores.texto,
      textAlign: 'center',
    },
    mensaje: {
      fontSize: TIPOGRAFIA.sm,
      color: colores.textoSecundario,
      textAlign: 'center',
      lineHeight: 20,
    },
    acciones: {
      width: '100%',
      marginTop: ESPACIADO.xs,
    },
  });
}

export function EstadoError({
  titulo = 'Ocurrió un problema',
  mensaje,
  etiquetaAccion = 'Reintentar',
  onReintentar,
}: PropsEstadoError) {
  const { colores } = useTema();
  const estilos = useMemo(() => crearEstilos(colores), [colores]);

  return (
    <View style={estilos.contenedor}>
      <View style={estilos.tarjeta}>
        <View style={estilos.circuloIcono}>
          <Ionicons
            name="cloud-offline-outline"
            size={28}
            color={colores.peligro}
          />
        </View>
        <Text style={estilos.titulo}>{titulo}</Text>
        <Text style={estilos.mensaje}>{mensaje}</Text>
        <View style={estilos.acciones}>
          <Boton
            etiqueta={etiquetaAccion}
            icono="refresh-outline"
            onPress={onReintentar}
          />
        </View>
      </View>
    </View>
  );
}
