export type PaletaColores = {
  fondo: string;
  superficie: string;
  superficieSecundaria: string;
  borde: string;
  texto: string;
  textoSecundario: string;
  textoTerciario: string;
  primario: string;
  primarioSuave: string;
  primarioTexto: string;
  acento: string;
  acentoSuave: string;
  exito: string;
  exitoSuave: string;
  advertencia: string;
  advertenciaSuave: string;
  peligro: string;
  peligroSuave: string;
  sombra: string;
  camaraFondo: string;
  camaraOverlay: string;
};

export const COLORES_CLARO: PaletaColores = {
  fondo: '#F6F7FB',
  superficie: '#FFFFFF',
  superficieSecundaria: '#EEF1F7',
  borde: '#E2E8F0',
  texto: '#0F172A',
  textoSecundario: '#475569',
  textoTerciario: '#64748B',
  primario: '#1E3A5F',
  primarioSuave: '#E6EEF8',
  primarioTexto: '#FFFFFF',
  acento: '#D97706',
  acentoSuave: '#FEF3C7',
  exito: '#0F766E',
  exitoSuave: '#CCFBF1',
  advertencia: '#B45309',
  advertenciaSuave: '#FEF3C7',
  peligro: '#BE123C',
  peligroSuave: '#FFE4E6',
  sombra: '#0F172A',
  camaraFondo: '#0B1120',
  camaraOverlay: 'rgba(15, 23, 42, 0.72)',
};

export const COLORES_OSCURO: PaletaColores = {
  fondo: '#0B1120',
  superficie: '#151E32',
  superficieSecundaria: '#1E293B',
  borde: '#2A3950',
  texto: '#F8FAFC',
  textoSecundario: '#CBD5E1',
  textoTerciario: '#94A3B8',
  primario: '#60A5FA',
  primarioSuave: '#1E3A5F',
  primarioTexto: '#0B1120',
  acento: '#FBBF24',
  acentoSuave: '#451A03',
  exito: '#2DD4BF',
  exitoSuave: '#134E4A',
  advertencia: '#FBBF24',
  advertenciaSuave: '#451A03',
  peligro: '#FB7185',
  peligroSuave: '#4C0519',
  sombra: '#000000',
  camaraFondo: '#020617',
  camaraOverlay: 'rgba(2, 6, 23, 0.78)',
};

export const COLORES_LOMO: readonly string[] = [
  '#1E3A5F',
  '#0F766E',
  '#B45309',
  '#4338CA',
  '#9F1239',
  '#155E75',
];

export const ESPACIADO = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const;

export const RADIO = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  completo: 999,
} as const;

export const TIPOGRAFIA = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
} as const;

export const TAMANO_TACTIL_MINIMO = 44;
