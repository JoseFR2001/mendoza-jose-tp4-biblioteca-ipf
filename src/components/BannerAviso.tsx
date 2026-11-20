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
import type { AvisoApp } from '../types';

type PropsBannerAviso = {
  aviso: AvisoApp;
  onDescartar: (id: string) => void;
};

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    contenedor: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colores.exitoSuave,
      borderRadius: RADIO.md,
      borderWidth: 1,
      borderColor: colores.exito,
      paddingVertical: ESPACIADO.sm,
      paddingLeft: ESPACIADO.md,
      paddingRight: ESPACIADO.xs,
      gap: ESPACIADO.sm,
    },
    cuerpo: {
      flex: 1,
      gap: 2,
    },
    titulo: {
      fontSize: TIPOGRAFIA.sm,
      fontWeight: '700',
      color: colores.exito,
    },
    mensaje: {
      fontSize: TIPOGRAFIA.xs,
      color: colores.texto,
      lineHeight: 18,
    },
    botonCerrar: {
      width: TAMANO_TACTIL_MINIMO,
      height: TAMANO_TACTIL_MINIMO,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: RADIO.completo,
    },
  });
}

export function BannerAviso({ aviso, onDescartar }: PropsBannerAviso) {
  const { colores } = useTema();
  const estilos = useMemo(() => crearEstilos(colores), [colores]);

  return (
    <View style={estilos.contenedor}>
      <Ionicons
        name="notifications-circle-outline"
        size={24}
        color={colores.exito}
      />
      <View style={estilos.cuerpo}>
        <Text style={estilos.titulo}>{aviso.titulo}</Text>
        <Text style={estilos.mensaje}>{aviso.mensaje}</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Descartar aviso: ${aviso.titulo}`}
        onPress={() => onDescartar(aviso.id)}
        style={estilos.botonCerrar}
      >
        <Ionicons name="close" size={20} color={colores.textoSecundario} />
      </Pressable>
    </View>
  );
}
