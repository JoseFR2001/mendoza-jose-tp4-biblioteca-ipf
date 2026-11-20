import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
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
import { CREDENCIALES_PERSONAL } from '../constants/personal';
import {
  ESPACIADO,
  RADIO,
  TAMANO_TACTIL_MINIMO,
  TIPOGRAFIA,
  type PaletaColores,
} from '../constants/tema';
import { useBiblioteca } from '../context/BibliotecaContext';
import { useTema } from '../hooks/useTema';

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    contenedor: {
      flex: 1,
      backgroundColor: colores.fondo,
    },
    contenido: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: ESPACIADO.lg,
    },
    tarjeta: {
      backgroundColor: colores.superficie,
      borderRadius: RADIO.xl,
      borderWidth: 1,
      borderColor: colores.borde,
      padding: ESPACIADO.xl,
      gap: ESPACIADO.md,
    },
    circulo: {
      width: 60,
      height: 60,
      borderRadius: RADIO.completo,
      backgroundColor: colores.primarioSuave,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
    },
    titulo: {
      fontSize: TIPOGRAFIA.xl,
      fontWeight: '800',
      color: colores.texto,
      textAlign: 'center',
    },
    subtitulo: {
      fontSize: TIPOGRAFIA.sm,
      color: colores.textoSecundario,
      textAlign: 'center',
      lineHeight: 20,
    },
    campo: {
      gap: ESPACIADO.xxs,
    },
    etiqueta: {
      fontSize: TIPOGRAFIA.sm,
      fontWeight: '600',
      color: colores.texto,
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
    cajaError: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ESPACIADO.xs,
      backgroundColor: colores.peligroSuave,
      borderRadius: RADIO.md,
      padding: ESPACIADO.sm,
    },
    textoError: {
      flex: 1,
      fontSize: TIPOGRAFIA.sm,
      color: colores.peligro,
      fontWeight: '600',
    },
    ayudaDemo: {
      fontSize: TIPOGRAFIA.xs,
      color: colores.textoTerciario,
      textAlign: 'center',
    },
  });
}

export default function LoginScreen() {
  const { iniciarSesionPersonal } = useBiblioteca();
  const { colores } = useTema();
  const estilos = useMemo(() => crearEstilos(colores), [colores]);

  const [usuario, setUsuario] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState<string | null>(null);

  const manejarIngreso = () => {
    if (!usuario.trim() || !clave) {
      setError('Completá tu usuario y clave para ingresar.');
      return;
    }

    const ok = iniciarSesionPersonal(usuario, clave);
    if (!ok) {
      setError(
        'Usuario o clave incorrectos. Revisá los datos e intentá nuevamente.',
      );
      return;
    }

    setError(null);
    router.replace('/mostrador');
  };

  return (
    <KeyboardAvoidingView
      style={estilos.contenedor}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={estilos.contenido}
        keyboardShouldPersistTaps="handled"
      >
        <View style={estilos.tarjeta}>
          <View style={estilos.circulo}>
            <Ionicons
              name="shield-outline"
              size={30}
              color={colores.primario}
            />
          </View>
          <Text style={estilos.titulo}>Personal de Biblioteca</Text>
          <Text style={estilos.subtitulo}>
            Iniciá sesión para gestionar las listas de espera y entregar libros
            en el mostrador.
          </Text>

          <View style={estilos.campo}>
            <Text style={estilos.etiqueta}>Usuario</Text>
            <TextInput
              value={usuario}
              onChangeText={(valor) => {
                setUsuario(valor);
                if (error) {
                  setError(null);
                }
              }}
              placeholder="bibliotecario"
              placeholderTextColor={colores.textoTerciario}
              autoCapitalize="none"
              autoCorrect={false}
              style={estilos.input}
              accessibilityLabel="Usuario del personal de biblioteca"
            />
          </View>

          <View style={estilos.campo}>
            <Text style={estilos.etiqueta}>Clave</Text>
            <TextInput
              value={clave}
              onChangeText={(valor) => {
                setClave(valor);
                if (error) {
                  setError(null);
                }
              }}
              placeholder="••••••••"
              placeholderTextColor={colores.textoTerciario}
              secureTextEntry
              autoCapitalize="none"
              style={estilos.input}
              accessibilityLabel="Clave del personal de biblioteca"
            />
          </View>

          {error ? (
            <View style={estilos.cajaError}>
              <Ionicons
                name="alert-circle-outline"
                size={18}
                color={colores.peligro}
              />
              <Text style={estilos.textoError}>{error}</Text>
            </View>
          ) : null}

          <Boton
            etiqueta="Ingresar"
            icono="log-in-outline"
            onPress={manejarIngreso}
          />

          <Text style={estilos.ayudaDemo}>
            Demo: usuario &quot;{CREDENCIALES_PERSONAL.usuario}&quot; · clave &quot;
            {CREDENCIALES_PERSONAL.clave}&quot;
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
