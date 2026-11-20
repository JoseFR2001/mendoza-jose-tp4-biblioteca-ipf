import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  COLORES_LOMO,
  ESPACIADO,
  RADIO,
  TAMANO_TACTIL_MINIMO,
  TIPOGRAFIA,
  type PaletaColores,
} from '../constants/tema';
import { useTema } from '../hooks/useTema';
import type { Libro } from '../types';

type PropsTarjetaLibro = {
  libro: Libro;
  disponibles: number;
  enEspera: number;
  onPress: (isbn: string) => void;
};

function indiceLomo(isbn: string): number {
  let suma = 0;
  for (let i = 0; i < isbn.length; i += 1) {
    suma += isbn.charCodeAt(i);
  }
  return suma % COLORES_LOMO.length;
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    tarjeta: {
      flexDirection: 'row',
      backgroundColor: colores.superficie,
      borderRadius: RADIO.lg,
      borderWidth: 1,
      borderColor: colores.borde,
      overflow: 'hidden',
      minHeight: TAMANO_TACTIL_MINIMO + 44,
    },
    presionada: {
      opacity: 0.86,
    },
    lomoBase: {
      width: 8,
    },
    lomo0: { backgroundColor: COLORES_LOMO[0] },
    lomo1: { backgroundColor: COLORES_LOMO[1] },
    lomo2: { backgroundColor: COLORES_LOMO[2] },
    lomo3: { backgroundColor: COLORES_LOMO[3] },
    lomo4: { backgroundColor: COLORES_LOMO[4] },
    lomo5: { backgroundColor: COLORES_LOMO[5] },
    cuerpo: {
      flex: 1,
      padding: ESPACIADO.md,
      gap: ESPACIADO.xs,
    },
    filaSuperior: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: ESPACIADO.sm,
    },
    titulo: {
      flex: 1,
      fontSize: TIPOGRAFIA.md,
      fontWeight: '700',
      color: colores.texto,
      lineHeight: 22,
    },
    anio: {
      fontSize: TIPOGRAFIA.xs,
      fontWeight: '600',
      color: colores.textoTerciario,
      backgroundColor: colores.superficieSecundaria,
      paddingHorizontal: ESPACIADO.xs,
      paddingVertical: 2,
      borderRadius: RADIO.sm,
      overflow: 'hidden',
    },
    autor: {
      fontSize: TIPOGRAFIA.sm,
      color: colores.textoSecundario,
    },
    pie: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: ESPACIADO.xxs,
    },
    badges: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ESPACIADO.xs,
      flexWrap: 'wrap',
    },
    badgeDisponible: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colores.exitoSuave,
      paddingHorizontal: ESPACIADO.xs,
      paddingVertical: 4,
      borderRadius: RADIO.completo,
    },
    badgeAgotado: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colores.advertenciaSuave,
      paddingHorizontal: ESPACIADO.xs,
      paddingVertical: 4,
      borderRadius: RADIO.completo,
    },
    textoDisponible: {
      fontSize: TIPOGRAFIA.xs,
      fontWeight: '600',
      color: colores.exito,
    },
    textoAgotado: {
      fontSize: TIPOGRAFIA.xs,
      fontWeight: '600',
      color: colores.advertencia,
    },
    espera: {
      fontSize: TIPOGRAFIA.xs,
      color: colores.textoTerciario,
      fontWeight: '500',
    },
  });
}

export function TarjetaLibro({
  libro,
  disponibles,
  enEspera,
  onPress,
}: PropsTarjetaLibro) {
  const { colores } = useTema();
  const estilos = useMemo(() => crearEstilos(colores), [colores]);

  const estilosLomo = [
    estilos.lomo0,
    estilos.lomo1,
    estilos.lomo2,
    estilos.lomo3,
    estilos.lomo4,
    estilos.lomo5,
  ];
  const lomo = estilosLomo[indiceLomo(libro.isbn)];
  const hayDisponibles = disponibles > 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${libro.titulo}, de ${libro.autor}. ${
        hayDisponibles
          ? `${disponibles} ejemplares disponibles`
          : 'Sin ejemplares disponibles'
      }`}
      onPress={() => onPress(libro.isbn)}
      style={({ pressed }) => [estilos.tarjeta, pressed && estilos.presionada]}
    >
      <View style={[estilos.lomoBase, lomo]} />
      <View style={estilos.cuerpo}>
        <View style={estilos.filaSuperior}>
          <Text style={estilos.titulo} numberOfLines={2}>
            {libro.titulo}
          </Text>
          <Text style={estilos.anio}>{libro.anio}</Text>
        </View>
        <Text style={estilos.autor} numberOfLines={1}>
          {libro.autor}
        </Text>
        <View style={estilos.pie}>
          <View style={estilos.badges}>
            <View
              style={
                hayDisponibles ? estilos.badgeDisponible : estilos.badgeAgotado
              }
            >
              <Ionicons
                name={hayDisponibles ? 'checkmark-circle' : 'time-outline'}
                size={14}
                color={hayDisponibles ? colores.exito : colores.advertencia}
              />
              <Text
                style={
                  hayDisponibles
                    ? estilos.textoDisponible
                    : estilos.textoAgotado
                }
              >
                {hayDisponibles
                  ? `${disponibles} ${disponibles === 1 ? 'disponible' : 'disponibles'}`
                  : 'Sin ejemplares'}
              </Text>
            </View>
            {enEspera > 0 ? (
              <Text style={estilos.espera}>
                {enEspera} en espera
              </Text>
            ) : null}
          </View>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colores.textoTerciario}
          />
        </View>
      </View>
    </Pressable>
  );
}
