import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import {
  ESPACIADO,
  RADIO,
  TAMANO_TACTIL_MINIMO,
  TIPOGRAFIA,
  type PaletaColores,
} from '../../../constants/tema';
import { useBiblioteca } from '../../../context/BibliotecaContext';
import { useTema } from '../../../hooks/useTema';

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    botonHeader: {
      minHeight: TAMANO_TACTIL_MINIMO,
      paddingHorizontal: ESPACIADO.sm,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderRadius: RADIO.completo,
      backgroundColor: colores.primarioSuave,
    },
    presionado: {
      opacity: 0.78,
    },
    textoHeader: {
      fontSize: TIPOGRAFIA.sm,
      fontWeight: '600',
      color: colores.primario,
    },
  });
}

function EnlacePersonal() {
  const { sesionPersonal } = useBiblioteca();
  const { colores } = useTema();
  const estilos = useMemo(() => crearEstilos(colores), [colores]);

  return (
    <Link href={sesionPersonal ? '/mostrador' : '/login'} asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          sesionPersonal
            ? 'Abrir mostrador del personal'
            : 'Ingresar como personal de biblioteca'
        }
        style={({ pressed }) => [
          estilos.botonHeader,
          pressed && estilos.presionado,
        ]}
      >
        <Ionicons
          name={sesionPersonal ? 'shield-checkmark-outline' : 'person-outline'}
          size={16}
          color={colores.primario}
        />
        <Text style={estilos.textoHeader}>Personal</Text>
      </Pressable>
    </Link>
  );
}

export default function CatalogoStackLayout() {
  const { colores } = useTema();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colores.superficie },
        headerTintColor: colores.texto,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colores.fondo },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Biblioteca IPF',
          headerRight: () => <EnlacePersonal />,
        }}
      />
      <Stack.Screen
        name="libro/[isbn]"
        options={{
          title: 'Detalle del libro',
        }}
      />
    </Stack>
  );
}
