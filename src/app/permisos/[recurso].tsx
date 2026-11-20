import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Boton } from '../../components/Boton';
import { EstadoCarga } from '../../components/EstadoCarga';
import {
  ESPACIADO,
  RADIO,
  TIPOGRAFIA,
  type PaletaColores,
} from '../../constants/tema';
import { usePermiso } from '../../hooks/usePermiso';
import { useTema } from '../../hooks/useTema';
import type { RecursoPermiso } from '../../types';

const CONFIG_RECURSO: Record<
  RecursoPermiso,
  {
    icono: keyof typeof Ionicons.glyphMap;
    titulo: string;
    beneficio: string;
    bloqueadoMensaje: string;
  }
> = {
  camara: {
    icono: 'camera-outline',
    titulo: 'Acceso a la cámara',
    beneficio:
      'Usamos tu cámara para escanear el código de barras ISBN y abrir el libro al instante.',
    bloqueadoMensaje:
      'El permiso de cámara está bloqueado en los ajustes del sistema. Habilitalo desde Ajustes o escribí el ISBN a mano.',
  },
  notificaciones: {
    icono: 'notifications-outline',
    titulo: 'Recordatorios de devolución',
    beneficio:
      'Usamos notificaciones locales para avisarte antes de la devolución de un libro y cuando tu reserva esté lista.',
    bloqueadoMensaje:
      'Las notificaciones están bloqueadas en el sistema. Podés activarlas desde Ajustes o seguir viendo tus avisos dentro de la app.',
  },
};

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    contenedor: {
      flex: 1,
      backgroundColor: colores.fondo,
      justifyContent: 'center',
      padding: ESPACIADO.lg,
    },
    tarjeta: {
      backgroundColor: colores.superficie,
      borderRadius: RADIO.xl,
      borderWidth: 1,
      borderColor: colores.borde,
      padding: ESPACIADO.xl,
      alignItems: 'center',
      gap: ESPACIADO.md,
    },
    circulo: {
      width: 72,
      height: 72,
      borderRadius: RADIO.completo,
      backgroundColor: colores.primarioSuave,
      alignItems: 'center',
      justifyContent: 'center',
    },
    titulo: {
      fontSize: TIPOGRAFIA.xl,
      fontWeight: '800',
      color: colores.texto,
      textAlign: 'center',
    },
    beneficio: {
      fontSize: TIPOGRAFIA.md,
      color: colores.textoSecundario,
      textAlign: 'center',
      lineHeight: 22,
    },
    botonContenedor: {
      width: '100%',
      marginTop: ESPACIADO.sm,
    },
  });
}

export default function PermisoPrevioScreen() {
  const { recurso: recursoParam } = useLocalSearchParams<{ recurso: string }>();
  const recursoValido: RecursoPermiso | null =
    recursoParam === 'camara' || recursoParam === 'notificaciones'
      ? recursoParam
      : null;

  const { estado, pedir, abrirAjustes } = usePermiso(recursoValido ?? 'camara');
  const [solicitando, setSolicitando] = useState(false);
  const { colores } = useTema();
  const estilos = useMemo(() => crearEstilos(colores), [colores]);

  useEffect(() => {
    if (recursoValido && estado === 'concedido') {
      router.back();
    }
  }, [recursoValido, estado]);

  if (!recursoValido) {
    return (
      <View style={estilos.contenedor}>
        <View style={estilos.tarjeta}>
          <Text style={estilos.titulo}>Permiso no reconocido</Text>
          <Text style={estilos.beneficio}>
            El recurso solicitado no corresponde a ningún permiso de la app.
          </Text>
          <View style={estilos.botonContenedor}>
            <Boton etiqueta="Volver" onPress={() => router.back()} />
          </View>
        </View>
      </View>
    );
  }

  if (estado === 'cargando') {
    return <EstadoCarga mensaje="Verificando estado del permiso..." />;
  }

  const info = CONFIG_RECURSO[recursoValido];
  const estaBloqueado = estado === 'bloqueado';

  const manejarAccion = async () => {
    if (estaBloqueado) {
      await abrirAjustes();
      return;
    }
    setSolicitando(true);
    try {
      await pedir();
      router.back();
    } finally {
      setSolicitando(false);
    }
  };

  return (
    <View style={estilos.contenedor}>
      <View style={estilos.tarjeta}>
        <View style={estilos.circulo}>
          <Ionicons name={info.icono} size={34} color={colores.primario} />
        </View>
        <Text style={estilos.titulo}>{info.titulo}</Text>
        <Text style={estilos.beneficio}>
          {estaBloqueado ? info.bloqueadoMensaje : info.beneficio}
        </Text>
        <View style={estilos.botonContenedor}>
          <Boton
            etiqueta={estaBloqueado ? 'Abrir Ajustes' : 'Continuar'}
            icono={
              estaBloqueado ? 'settings-outline' : 'arrow-forward-outline'
            }
            cargando={solicitando}
            onPress={() => void manejarAccion()}
          />
        </View>
      </View>
    </View>
  );
}
