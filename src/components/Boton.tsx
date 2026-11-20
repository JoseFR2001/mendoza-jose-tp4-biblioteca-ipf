import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  ESPACIADO,
  RADIO,
  TAMANO_TACTIL_MINIMO,
  TIPOGRAFIA,
  type PaletaColores,
} from '../constants/tema';
import { useTema } from '../hooks/useTema';

type VarianteBoton = 'primario' | 'secundario' | 'peligro' | 'fantasma';

type PropsBoton = {
  etiqueta: string;
  onPress: () => void;
  variante?: VarianteBoton;
  icono?: keyof typeof Ionicons.glyphMap;
  deshabilitado?: boolean;
  cargando?: boolean;
  accessibilityLabel?: string;
};

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    base: {
      minHeight: TAMANO_TACTIL_MINIMO + 4,
      minWidth: TAMANO_TACTIL_MINIMO,
      paddingHorizontal: ESPACIADO.md,
      paddingVertical: ESPACIADO.sm,
      borderRadius: RADIO.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: ESPACIADO.xs,
    },
    primario: {
      backgroundColor: colores.primario,
    },
    secundario: {
      backgroundColor: colores.primarioSuave,
      borderWidth: 1,
      borderColor: colores.borde,
    },
    peligro: {
      backgroundColor: colores.peligroSuave,
      borderWidth: 1,
      borderColor: colores.peligro,
    },
    fantasma: {
      backgroundColor: 'transparent',
    },
    presionado: {
      opacity: 0.82,
    },
    deshabilitado: {
      opacity: 0.5,
    },
    textoBase: {
      fontSize: TIPOGRAFIA.md,
      fontWeight: '600',
    },
    textoPrimario: {
      color: colores.primarioTexto,
    },
    textoSecundario: {
      color: colores.primario,
    },
    textoPeligro: {
      color: colores.peligro,
    },
    textoFantasma: {
      color: colores.primario,
    },
    contenido: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ESPACIADO.xs,
    },
  });
}

export function Boton({
  etiqueta,
  onPress,
  variante = 'primario',
  icono,
  deshabilitado = false,
  cargando = false,
  accessibilityLabel,
}: PropsBoton) {
  const { colores } = useTema();
  const estilos = useMemo(() => crearEstilos(colores), [colores]);

  const colorIcono =
    variante === 'primario'
      ? colores.primarioTexto
      : variante === 'peligro'
        ? colores.peligro
        : colores.primario;

  const estiloVariante =
    variante === 'primario'
      ? estilos.primario
      : variante === 'secundario'
        ? estilos.secundario
        : variante === 'peligro'
          ? estilos.peligro
          : estilos.fantasma;

  const estiloTexto =
    variante === 'primario'
      ? estilos.textoPrimario
      : variante === 'secundario'
        ? estilos.textoSecundario
        : variante === 'peligro'
          ? estilos.textoPeligro
          : estilos.textoFantasma;

  const inactivo = deshabilitado || cargando;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? etiqueta}
      accessibilityState={{ disabled: inactivo, busy: cargando }}
      disabled={inactivo}
      onPress={onPress}
      style={({ pressed }) => [
        estilos.base,
        estiloVariante,
        pressed && !inactivo && estilos.presionado,
        inactivo && estilos.deshabilitado,
      ]}
    >
      {cargando ? (
        <ActivityIndicator color={colorIcono} size="small" />
      ) : (
        <View style={estilos.contenido}>
          {icono ? (
            <Ionicons name={icono} size={18} color={colorIcono} />
          ) : null}
          <Text style={[estilos.textoBase, estiloTexto]}>{etiqueta}</Text>
        </View>
      )}
    </Pressable>
  );
}
