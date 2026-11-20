import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router/stack';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import {
  BibliotecaProvider,
  useBiblioteca,
} from '../context/BibliotecaContext';
import { useTema } from '../hooks/useTema';
import { configurarManejadorNotificaciones } from '../lib/notificaciones';

export const unstable_settings = {
  anchor: '(tabs)',
};

void SplashScreen.preventAutoHideAsync();
configurarManejadorNotificaciones();

function NavegadorRaiz() {
  const { hidratado, sesionPersonal } = useBiblioteca();
  const { colores, esOscuro } = useTema();

  useEffect(() => {
    if (hidratado) {
      void SplashScreen.hideAsync();
    }
  }, [hidratado]);

  if (!hidratado) {
    return null;
  }

  return (
    <ThemeProvider value={esOscuro ? DarkTheme : DefaultTheme}>
      <StatusBar style={esOscuro ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colores.superficie },
          headerTintColor: colores.texto,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colores.fondo },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="buscar" options={{ title: 'Buscar libros' }} />
        <Stack.Screen name="escanear" options={{ title: 'Escanear ISBN' }} />
        <Stack.Screen
          name="reservar/[isbn]"
          options={{
            title: 'Confirmar reserva',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="permisos/[recurso]"
          options={{
            title: 'Permiso necesario',
            presentation: 'modal',
          }}
        />
        <Stack.Protected guard={!sesionPersonal}>
          <Stack.Screen
            name="login"
            options={{
              title: 'Acceso del personal',
              presentation: 'modal',
            }}
          />
        </Stack.Protected>
        <Stack.Protected guard={sesionPersonal}>
          <Stack.Screen
            name="mostrador"
            options={{
              title: 'Mostrador de entregas',
            }}
          />
        </Stack.Protected>
        <Stack.Screen name="reserva" options={{ headerShown: false }} />
        <Stack.Screen
          name="+not-found"
          options={{ title: 'Página no encontrada' }}
        />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <BibliotecaProvider>
      <NavegadorRaiz />
    </BibliotecaProvider>
  );
}
