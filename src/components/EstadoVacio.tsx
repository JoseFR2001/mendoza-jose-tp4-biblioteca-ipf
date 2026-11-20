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

type PropsEstadoVacio = {
  icono?: keyof typeof Ionicons.glyphMap;
  titulo: string;
  descripcion: string;
  etiquetaAccion?: string;
  onAccion?: () => void;
};

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    contenedor: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: ESPACIADO.xxl,
      paddingHorizontal: ESPACIADO.lg,
      gap: ESPACIADO.sm,
    },
    circulo: {
      width: 60,
      height: 60,
      borderRadius: RADIO.completo,
      backgroundColor: colores.superficieSecundaria,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: ESPACIADO.xs,
    },
    titulo: {
      fontSize: TIPOGRAFIA.lg,
      fontWeight: '700',
      color: colores.texto,
      textAlign: 'center',
    },
    descripcion: {
      fontSize: TIPOGRAFIA.sm,
      color: colores.textoSecundario,
      textAlign: 'center',
      lineHeight: 20,
    },
    accion: {
      marginTop: ESPACIADO.sm,
    },
  });
}

export function EstadoVacio({
  icono = 'book-outline',
  titulo,
  descripcion,
  etiquetaAccion,
  onAccion,
}: PropsEstadoVacio) {
  const { colores } = useTema();
  const estilos = useMemo(() => crearEstilos(colores), [colores]);

  return (
    <View style={estilos.contenedor}>
      <View style={estilos.circulo}>
        <Ionicons name={icono} size={28} color={colores.textoSecundario} />
      </View>
      <Text style={estilos.titulo}>{titulo}</Text>
      <Text style={estilos.descripcion}>{descripcion}</Text>
      {etiquetaAccion && onAccion ? (
        <View style={estilos.accion}>
          <Boton
            etiqueta={etiquetaAccion}
            variante="secundario"
            onPress={onAccion}
          />
        </View>
      ) : null}
    </View>
  );
}
