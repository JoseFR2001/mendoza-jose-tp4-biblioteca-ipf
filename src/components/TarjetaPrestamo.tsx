import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { SEGUNDOS_RECORDATORIO_DEMO } from '../constants/personal';
import {
  ESPACIADO,
  RADIO,
  TIPOGRAFIA,
  type PaletaColores,
} from '../constants/tema';
import { useTema } from '../hooks/useTema';
import { formatearFechaCorta } from '../lib/validacion';
import type { Libro, Prestamo } from '../types';
import { Boton } from './Boton';

type PropsTarjetaPrestamo = {
  prestamo: Prestamo;
  libro: Libro | undefined;
  procesandoRecordatorio: boolean;
  onCambiarRecordatorio: (activar: boolean) => void;
  onDevolver: () => void;
};

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    tarjeta: {
      backgroundColor: colores.superficie,
      borderRadius: RADIO.lg,
      borderWidth: 1,
      borderColor: colores.borde,
      padding: ESPACIADO.md,
      gap: ESPACIADO.sm,
    },
    encabezado: {
      gap: 2,
    },
    titulo: {
      fontSize: TIPOGRAFIA.md,
      fontWeight: '700',
      color: colores.texto,
    },
    autor: {
      fontSize: TIPOGRAFIA.sm,
      color: colores.textoSecundario,
    },
    filaFecha: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ESPACIADO.xs,
      backgroundColor: colores.primarioSuave,
      paddingHorizontal: ESPACIADO.sm,
      paddingVertical: ESPACIADO.xs,
      borderRadius: RADIO.sm,
    },
    textoFecha: {
      fontSize: TIPOGRAFIA.sm,
      fontWeight: '600',
      color: colores.primario,
    },
    filaSwitch: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: ESPACIADO.xxs,
      gap: ESPACIADO.sm,
    },
    bloqueSwitch: {
      flex: 1,
      gap: 2,
    },
    etiquetaSwitch: {
      fontSize: TIPOGRAFIA.sm,
      fontWeight: '600',
      color: colores.texto,
    },
    subtituloSwitch: {
      fontSize: TIPOGRAFIA.xs,
      color: colores.textoTerciario,
    },
  });
}

export function TarjetaPrestamo({
  prestamo,
  libro,
  procesandoRecordatorio,
  onCambiarRecordatorio,
  onDevolver,
}: PropsTarjetaPrestamo) {
  const { colores } = useTema();
  const estilos = useMemo(() => crearEstilos(colores), [colores]);
  const recordatorioActivo = prestamo.recordatorioId !== null;

  return (
    <View style={estilos.tarjeta}>
      <View style={estilos.encabezado}>
        <Text style={estilos.titulo}>
          {libro?.titulo ?? `Libro ISBN ${prestamo.isbn}`}
        </Text>
        {libro ? <Text style={estilos.autor}>{libro.autor}</Text> : null}
      </View>

      <View style={estilos.filaFecha}>
        <Ionicons name="calendar-outline" size={16} color={colores.primario} />
        <Text style={estilos.textoFecha}>
          Devolución: {formatearFechaCorta(prestamo.fechaDevolucion)}
        </Text>
      </View>

      <View style={estilos.filaSwitch}>
        <View style={estilos.bloqueSwitch}>
          <Text style={estilos.etiquetaSwitch}>Recordarme</Text>
          <Text style={estilos.subtituloSwitch}>
            {recordatorioActivo
              ? `Aviso programado (${SEGUNDOS_RECORDATORIO_DEMO} s en modo demo)`
              : 'Recibí un recordatorio antes de devolverlo'}
          </Text>
        </View>
        <Switch
          accessibilityLabel={`Recordarme devolver ${libro?.titulo ?? prestamo.isbn}`}
          value={recordatorioActivo}
          disabled={procesandoRecordatorio}
          onValueChange={onCambiarRecordatorio}
          trackColor={{ false: colores.borde, true: colores.primario }}
          thumbColor={colores.superficie}
        />
      </View>

      <Boton
        etiqueta="Devolver"
        icono="return-up-back-outline"
        variante="secundario"
        onPress={onDevolver}
      />
    </View>
  );
}
