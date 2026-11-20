import { Ionicons } from '@expo/vector-icons';
import { Link, usePathname } from 'expo-router';
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

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    contenedor: {
      flex: 1,
      backgroundColor: colores.fondo,
      alignItems: 'center',
      justifyContent: 'center',
      padding: ESPACIADO.xl,
    },
    tarjeta: {
      width: '100%',
      backgroundColor: colores.superficie,
      borderRadius: RADIO.xl,
      borderWidth: 1,
      borderColor: colores.borde,
      padding: ESPACIADO.xl,
      alignItems: 'center',
      gap: ESPACIADO.md,
    },
    circulo: {
      width: 68,
      height: 68,
      borderRadius: RADIO.completo,
      backgroundColor: colores.primarioSuave,
      alignItems: 'center',
      justifyContent: 'center',
    },
    codigo: {
      fontSize: TIPOGRAFIA.xxl,
      fontWeight: '800',
      color: colores.primario,
    },
    titulo: {
      fontSize: TIPOGRAFIA.lg,
      fontWeight: '700',
      color: colores.texto,
      textAlign: 'center',
    },
    ruta: {
      fontSize: TIPOGRAFIA.sm,
      fontWeight: '600',
      color: colores.textoSecundario,
      backgroundColor: colores.superficieSecundaria,
      paddingHorizontal: ESPACIADO.md,
      paddingVertical: ESPACIADO.xs,
      borderRadius: RADIO.sm,
      overflow: 'hidden',
    },
    descripcion: {
      fontSize: TIPOGRAFIA.sm,
      color: colores.textoSecundario,
      textAlign: 'center',
      lineHeight: 20,
    },
    botonVolver: {
      minHeight: TAMANO_TACTIL_MINIMO + 4,
      width: '100%',
      backgroundColor: colores.primario,
      borderRadius: RADIO.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: ESPACIADO.xs,
    },
    textoVolver: {
      fontSize: TIPOGRAFIA.md,
      fontWeight: '600',
      color: colores.primarioTexto,
    },
  });
}

export default function NotFoundScreen() {
  const pathname = usePathname();
  const { colores } = useTema();
  const estilos = useMemo(() => crearEstilos(colores), [colores]);

  return (
    <View style={estilos.contenedor}>
      <View style={estilos.tarjeta}>
        <View style={estilos.circulo}>
          <Ionicons
            name="compass-outline"
            size={34}
            color={colores.primario}
          />
        </View>
        <Text style={estilos.codigo}>404</Text>
        <Text style={estilos.titulo}>No encontramos esta pantalla</Text>
        <Text style={estilos.ruta}>{pathname}</Text>
        <Text style={estilos.descripcion}>
          La dirección a la que intentaste acceder no existe en Biblioteca IPF.
        </Text>
        <Link href="/" asChild>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver al Catálogo"
            style={estilos.botonVolver}
          >
            <Text style={estilos.textoVolver}>Volver al Catálogo</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}
