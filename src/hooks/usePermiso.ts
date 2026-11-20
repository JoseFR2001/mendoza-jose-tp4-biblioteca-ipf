import { useCameraPermissions } from 'expo-camera';
import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useState } from 'react';
import { AppState, Linking } from 'react-native';

import { asegurarCanalPrestamos } from '../lib/notificaciones';
import type { EstadoPermiso, RecursoPermiso } from '../types';

type RespuestaBase = {
  granted: boolean;
  canAskAgain: boolean;
};

type ResultadoUsePermiso = {
  estado: EstadoPermiso;
  pedir: () => Promise<EstadoPermiso>;
  abrirAjustes: () => Promise<void>;
  actualizar: () => Promise<void>;
};

function mapearEstado(respuesta: RespuestaBase | null): EstadoPermiso {
  if (!respuesta) {
    return 'cargando';
  }
  if (respuesta.granted) {
    return 'concedido';
  }
  if (respuesta.canAskAgain) {
    return 'preguntable';
  }
  return 'bloqueado';
}

export function usePermiso(recurso: RecursoPermiso): ResultadoUsePermiso {
  const [permisoCamara, pedirPermisoCamara, consultarPermisoCamara] =
    useCameraPermissions();
  const [permisoNotif, setPermisoNotif] = useState<RespuestaBase | null>(null);

  const consultarNotificaciones = useCallback(async () => {
    const respuesta = await Notifications.getPermissionsAsync();
    setPermisoNotif({
      granted: respuesta.granted,
      canAskAgain: respuesta.canAskAgain,
    });
  }, []);

  useEffect(() => {
    if (recurso !== 'notificaciones') {
      return;
    }
    let activo = true;
    async function cargar() {
      const respuesta = await Notifications.getPermissionsAsync();
      if (activo) {
        setPermisoNotif({
          granted: respuesta.granted,
          canAskAgain: respuesta.canAskAgain,
        });
      }
    }
    void cargar();
    return () => {
      activo = false;
    };
  }, [recurso]);

  const actualizar = useCallback(async () => {
    if (recurso === 'camara') {
      await consultarPermisoCamara();
      return;
    }
    await consultarNotificaciones();
  }, [recurso, consultarPermisoCamara, consultarNotificaciones]);

  useEffect(() => {
    const suscripcion = AppState.addEventListener('change', (nuevoEstado) => {
      if (nuevoEstado === 'active') {
        void actualizar();
      }
    });
    return () => {
      suscripcion.remove();
    };
  }, [actualizar]);

  const pedir = useCallback(async (): Promise<EstadoPermiso> => {
    if (recurso === 'camara') {
      const respuesta = await pedirPermisoCamara();
      return mapearEstado(respuesta);
    }
    await asegurarCanalPrestamos();
    const respuesta = await Notifications.requestPermissionsAsync();
    const base: RespuestaBase = {
      granted: respuesta.granted,
      canAskAgain: respuesta.canAskAgain,
    };
    setPermisoNotif(base);
    return mapearEstado(base);
  }, [recurso, pedirPermisoCamara]);

  const abrirAjustes = useCallback(async () => {
    await Linking.openSettings();
  }, []);

  const estado =
    recurso === 'camara'
      ? mapearEstado(permisoCamara)
      : mapearEstado(permisoNotif);

  return {
    estado,
    pedir,
    abrirAjustes,
    actualizar,
  };
}
