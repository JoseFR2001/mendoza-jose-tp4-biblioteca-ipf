import { useColorScheme } from 'react-native';

import {
  COLORES_CLARO,
  COLORES_OSCURO,
  type PaletaColores,
} from '../constants/tema';

export function useTema(): { colores: PaletaColores; esOscuro: boolean } {
  const esquema = useColorScheme();
  const esOscuro = esquema === 'dark';
  return {
    colores: esOscuro ? COLORES_OSCURO : COLORES_CLARO,
    esOscuro,
  };
}
