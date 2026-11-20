import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router/js-tabs';

import { useBiblioteca } from '../../context/BibliotecaContext';
import { useTema } from '../../hooks/useTema';

export default function TabsLayout() {
  const { colores } = useTema();
  const { avisos } = useBiblioteca();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colores.primario,
        tabBarInactiveTintColor: colores.textoTerciario,
        tabBarStyle: {
          backgroundColor: colores.superficie,
          borderTopColor: colores.borde,
        },
        headerStyle: {
          backgroundColor: colores.superficie,
        },
        headerTintColor: colores.texto,
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="(catalogo)"
        options={{
          title: 'Catálogo',
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'library' : 'library-outline'}
              size={size}
              color={typeof color === 'string' ? color : colores.primario}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="reservas"
        options={{
          title: 'Mis reservas',
          tabBarBadge: avisos.length > 0 ? avisos.length : undefined,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'bookmark' : 'bookmark-outline'}
              size={size}
              color={typeof color === 'string' ? color : colores.primario}
            />
          ),
        }}
      />
    </Tabs>
  );
}
