import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { ESPACIADO, TIPOGRAFIA, type PaletaColores } from '../constants/tema';
import { useTema } from '../hooks/useTema';

type PropsEstadoCarga = {
  mensaje?: string;
};

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    contenedor: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: ESPACIADO.xl,
      gap: ESPACIADO.md,
      backgroundColor: colores.fondo,
    },
    texto: {
      fontSize: TIPOGRAFIA.md,
      color: colores.textoSecundario,
      textAlign: 'center',
    },
  });
}

export function EstadoCarga({
  mensaje = 'Cargando catálogo de la biblioteca...',
}: PropsEstadoCarga) {
  const { colores } = useTema();
  const estilos = useMemo(() => crearEstilos(colores), [colores]);

  return (
    <View style={estilos.contenedor}>
      <ActivityIndicator size="large" color={colores.primario} />
      <Text style={estilos.texto}>{mensaje}</Text>
    </View>
  );
}
