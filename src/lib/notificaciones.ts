import {
  AndroidImportance,
  cancelScheduledNotificationAsync,
  getPermissionsAsync,
  SchedulableTriggerInputTypes,
  scheduleNotificationAsync,
  setNotificationChannelAsync,
  setNotificationHandler,
} from 'expo-notifications';
import { Platform } from 'react-native';

import {
  CANAL_NOTIFICACIONES_PRESTAMOS,
  SEGUNDOS_RECORDATORIO_DEMO,
} from '../constants/personal';

let handlerConfigurado = false;

export function configurarManejadorNotificaciones(): void {
  if (handlerConfigurado) {
    return;
  }
  setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  handlerConfigurado = true;
}

export async function asegurarCanalPrestamos(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }
  await setNotificationChannelAsync(CANAL_NOTIFICACIONES_PRESTAMOS, {
    name: 'Recordatorios de préstamos',
    importance: AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#1E3A5F',
  });
}

export async function tienePermisoNotificaciones(): Promise<boolean> {
  const respuesta = await getPermissionsAsync();
  return respuesta.granted;
}

export async function programarRecordatorioDevolucion(
  tituloLibro: string,
  isbn: string,
): Promise<string> {
  await asegurarCanalPrestamos();
  const id = await scheduleNotificationAsync({
    content: {
      title: 'Recordatorio de devolución',
      body: `Recordá devolver "${tituloLibro}" a la Biblioteca IPF.`,
      data: { isbn },
      ...(Platform.OS === 'android'
        ? { channelId: CANAL_NOTIFICACIONES_PRESTAMOS }
        : {}),
    },
    trigger: {
      type: SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: SEGUNDOS_RECORDATORIO_DEMO,
    },
  });
  return id;
}

export async function cancelarRecordatorio(
  identificador: string,
): Promise<void> {
  await cancelScheduledNotificationAsync(identificador);
}

export async function enviarNotificacionEntrega(
  tituloLibro: string,
  isbn: string,
): Promise<string> {
  await asegurarCanalPrestamos();
  const id = await scheduleNotificationAsync({
    content: {
      title: '¡Tu libro ya está disponible!',
      body: `Podés pasar por el mostrador a retirar "${tituloLibro}".`,
      data: { isbn },
      ...(Platform.OS === 'android'
        ? { channelId: CANAL_NOTIFICACIONES_PRESTAMOS }
        : {}),
    },
    trigger: null,
  });
  return id;
}
