import { Ionicons } from '@expo/vector-icons';
import {
  CameraView,
  type BarcodeScanningResult,
} from 'expo-camera';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Boton } from '../components/Boton';
import { EstadoCarga } from '../components/EstadoCarga';
import {
  ESPACIADO,
  RADIO,
  TAMANO_TACTIL_MINIMO,
  TIPOGRAFIA,
  type PaletaColores,
} from '../constants/tema';
import { LIBROS } from '../data/libros';
import { usePermiso } from '../hooks/usePermiso';
import { useTema } from '../hooks/useTema';
import { esIsbnValido, limpiarIsbn } from '../lib/validacion';

const PAUSA_AVISO_NO_ENCONTRADO_MS = 2500;

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    contenedor: {
      flex: 1,
      backgroundColor: colores.fondo,
    },
    contenido: {
      padding: ESPACIADO.md,
      paddingBottom: ESPACIADO.xxl,
      gap: ESPACIADO.md,
    },
    marcoCamara: {
      height: 300,
      borderRadius: RADIO.xl,
      overflow: 'hidden',
      backgroundColor: colores.camaraFondo,
      borderWidth: 1,
      borderColor: colores.borde,
    },
    camara: {
      flex: 1,
    },
    overlay: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      alignItems: 'center',
      justifyContent: 'center',
      padding: ESPACIADO.lg,
    },
    visor: {
      width: 230,
      height: 120,
      borderRadius: RADIO.md,
      borderWidth: 2,
      borderColor: '#FFFFFF',
      backgroundColor: 'rgba(255, 255, 255, 0.06)',
    },
    etiquetaVisor: {
      marginTop: ESPACIADO.md,
      backgroundColor: colores.camaraOverlay,
      paddingHorizontal: ESPACIADO.md,
      paddingVertical: ESPACIADO.xs,
      borderRadius: RADIO.completo,
    },
    textoVisor: {
      color: '#FFFFFF',
      fontSize: TIPOGRAFIA.xs,
      fontWeight: '600',
    },
    tarjetaPermiso: {
      backgroundColor: colores.superficie,
      borderRadius: RADIO.xl,
      borderWidth: 1,
      borderColor: colores.borde,
      padding: ESPACIADO.lg,
      alignItems: 'center',
      gap: ESPACIADO.sm,
    },
    circuloPermiso: {
      width: 56,
      height: 56,
      borderRadius: RADIO.completo,
      backgroundColor: colores.primarioSuave,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tituloPermiso: {
      fontSize: TIPOGRAFIA.lg,
      fontWeight: '700',
      color: colores.texto,
      textAlign: 'center',
    },
    descripcionPermiso: {
      fontSize: TIPOGRAFIA.sm,
      color: colores.textoSecundario,
      textAlign: 'center',
      lineHeight: 20,
    },
    avisoEscaneo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ESPACIADO.sm,
      backgroundColor: colores.advertenciaSuave,
      borderRadius: RADIO.md,
      borderWidth: 1,
      borderColor: colores.advertencia,
      padding: ESPACIADO.md,
    },
    textoAvisoEscaneo: {
      flex: 1,
      fontSize: TIPOGRAFIA.sm,
      color: colores.advertencia,
      fontWeight: '600',
    },
    tarjetaManual: {
      backgroundColor: colores.superficie,
      borderRadius: RADIO.xl,
      borderWidth: 1,
      borderColor: colores.borde,
      padding: ESPACIADO.lg,
      gap: ESPACIADO.sm,
    },
    tituloManual: {
      fontSize: TIPOGRAFIA.md,
      fontWeight: '700',
      color: colores.texto,
    },
    subtituloManual: {
      fontSize: TIPOGRAFIA.xs,
      color: colores.textoSecundario,
      lineHeight: 18,
    },
    input: {
      minHeight: TAMANO_TACTIL_MINIMO + 4,
      backgroundColor: colores.superficieSecundaria,
      borderRadius: RADIO.md,
      borderWidth: 1,
      borderColor: colores.borde,
      paddingHorizontal: ESPACIADO.md,
      fontSize: TIPOGRAFIA.md,
      color: colores.texto,
    },
    errorManual: {
      fontSize: TIPOGRAFIA.xs,
      color: colores.peligro,
      fontWeight: '600',
    },
  });
}

export default function EscanearScreen() {
  const { estado, abrirAjustes, actualizar } = usePermiso('camara');
  const { colores } = useTema();
  const estilos = useMemo(() => crearEstilos(colores), [colores]);

  const [isbnManual, setIsbnManual] = useState('');
  const [errorManual, setErrorManual] = useState<string | null>(null);
  const [avisoNoEncontrado, setAvisoNoEncontrado] = useState<string | null>(
    null,
  );

  const yaNavegoRef = useRef(false);
  const yaMostroPreviaRef = useRef(false);
  const ultimoDesconocidoRef = useRef<string | null>(null);
  const timerDesconocidoRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  useFocusEffect(
    useCallback(() => {
      void actualizar();
    }, [actualizar]),
  );

  useEffect(() => {
    if (estado === 'preguntable' && !yaMostroPreviaRef.current) {
      yaMostroPreviaRef.current = true;
      router.push({
        pathname: '/permisos/[recurso]',
        params: { recurso: 'camara' },
      });
    }
  }, [estado]);

  useEffect(() => {
    return () => {
      if (timerDesconocidoRef.current) {
        clearTimeout(timerDesconocidoRef.current);
      }
    };
  }, []);

  const abrirPreviaCamara = useCallback(() => {
    router.push({
      pathname: '/permisos/[recurso]',
      params: { recurso: 'camara' },
    });
  }, []);

  const manejarCodigoEscaneado = useCallback(
    (resultado: BarcodeScanningResult) => {
      if (yaNavegoRef.current) {
        return;
      }
      const codigo = limpiarIsbn(resultado.data);
      if (!esIsbnValido(codigo)) {
        return;
      }

      const existe = LIBROS.some((l) => l.isbn === codigo);
      if (existe) {
        yaNavegoRef.current = true;
        router.replace({
          pathname: '/libro/[isbn]',
          params: { isbn: codigo },
        });
        return;
      }

      if (ultimoDesconocidoRef.current === codigo) {
        return;
      }

      ultimoDesconocidoRef.current = codigo;
      setAvisoNoEncontrado(
        `El ISBN ${codigo} no está en el catálogo. Podés seguir escaneando otro libro.`,
      );

      if (timerDesconocidoRef.current) {
        clearTimeout(timerDesconocidoRef.current);
      }
      timerDesconocidoRef.current = setTimeout(() => {
        ultimoDesconocidoRef.current = null;
      }, PAUSA_AVISO_NO_ENCONTRADO_MS);
    },
    [],
  );

  const buscarIsbnManual = useCallback(() => {
    const limpio = limpiarIsbn(isbnManual);
    if (!esIsbnValido(limpio)) {
      setErrorManual('Ingresá un ISBN válido de 13 dígitos sin guiones.');
      return;
    }
    setErrorManual(null);
    router.replace({
      pathname: '/libro/[isbn]',
      params: { isbn: limpio },
    });
  }, [isbnManual]);

  return (
    <KeyboardAvoidingView
      style={estilos.contenedor}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={estilos.contenido}
        keyboardShouldPersistTaps="handled"
      >
        {estado === 'cargando' ? (
          <View style={estilos.tarjetaPermiso}>
            <EstadoCarga mensaje="Verificando permiso de cámara..." />
          </View>
        ) : null}

        {estado === 'concedido' ? (
          <View style={estilos.marcoCamara}>
            <CameraView
              style={estilos.camara}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['ean13'] }}
              onBarcodeScanned={manejarCodigoEscaneado}
            />
            <View style={estilos.overlay} pointerEvents="none">
              <View style={estilos.visor} />
              <View style={estilos.etiquetaVisor}>
                <Text style={estilos.textoVisor}>
                  Apuntá al código de barras EAN-13
                </Text>
              </View>
            </View>
          </View>
        ) : null}

        {estado === 'preguntable' ? (
          <View style={estilos.tarjetaPermiso}>
            <View style={estilos.circuloPermiso}>
              <Ionicons
                name="camera-outline"
                size={28}
                color={colores.primario}
              />
            </View>
            <Text style={estilos.tituloPermiso}>
              Habilitá la cámara para escanear
            </Text>
            <Text style={estilos.descripcionPermiso}>
              Necesitamos acceso a tu cámara para leer el código de barras de la
              contratapa. Si preferís no activarla, podés escribir el ISBN abajo.
            </Text>
            <Boton
              etiqueta="Permitir cámara"
              icono="camera-outline"
              onPress={abrirPreviaCamara}
            />
          </View>
        ) : null}

        {estado === 'bloqueado' ? (
          <View style={estilos.tarjetaPermiso}>
            <View style={estilos.circuloPermiso}>
              <Ionicons
                name="lock-closed-outline"
                size={28}
                color={colores.primario}
              />
            </View>
            <Text style={estilos.tituloPermiso}>Cámara bloqueada</Text>
            <Text style={estilos.descripcionPermiso}>
              Desactivaste el permiso de cámara en el sistema. Podés habilitarlo
              desde Ajustes o escribir el ISBN manualmente acá abajo.
            </Text>
            <Boton
              etiqueta="Abrir Ajustes"
              icono="settings-outline"
              onPress={() => void abrirAjustes()}
            />
          </View>
        ) : null}

        {avisoNoEncontrado ? (
          <View style={estilos.avisoEscaneo}>
            <Ionicons
              name="alert-circle-outline"
              size={22}
              color={colores.advertencia}
            />
            <Text style={estilos.textoAvisoEscaneo}>{avisoNoEncontrado}</Text>
          </View>
        ) : null}

        <View style={estilos.tarjetaManual}>
          <Text style={estilos.tituloManual}>Ingresar ISBN a mano</Text>
          <Text style={estilos.subtituloManual}>
            Escribí los 13 dígitos del libro (por ejemplo: 9789500426152).
          </Text>
          <TextInput
            value={isbnManual}
            onChangeText={(texto) => {
              setIsbnManual(texto);
              if (errorManual) {
                setErrorManual(null);
              }
            }}
            placeholder="9789500426152"
            placeholderTextColor={colores.textoTerciario}
            keyboardType="number-pad"
            maxLength={17}
            style={estilos.input}
            accessibilityLabel="Ingresar ISBN de 13 dígitos manualmente"
          />
          {errorManual ? (
            <Text style={estilos.errorManual}>{errorManual}</Text>
          ) : null}
          <Boton
            etiqueta="Abrir libro"
            icono="arrow-forward-outline"
            variante="secundario"
            onPress={buscarIsbnManual}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
