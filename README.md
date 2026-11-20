# Biblioteca IPF — Trabajo Práctico N° 4

Aplicación integradora desarrollada con **React Native**, **Expo SDK 58** (`expo ~58.0.26`), **TypeScript** y **Expo Router** (`expo-router ~58.0.32`) para la Tecnicatura Superior en Desarrollo de Software Multiplataforma (Instituto Politécnico Formosa).

---

## Cómo ejecutar el proyecto

1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Iniciar el servidor de desarrollo de Expo:
   ```bash
   npx expo start
   ```
3. Abrir en **Expo Go** escaneando el código QR desde un teléfono real (Android o iOS).

### Otros comandos útiles

- Verificación de tipos: `npx tsc --noEmit`
- Linter: `npx expo lint`
- Tests unitarios (`Pila` y `Cola`): `npm test`

### Credenciales de prueba (Personal de biblioteca)

- **Usuario:** `bibliotecario`
- **Clave:** `ipf2026`

---

## Árbol de carpetas de `src/app`

```text
src/app/
├── _layout.tsx                 # Stack raíz (anchor: "(tabs)", BibliotecaProvider, Stack.Protected)
├── (tabs)/
│   ├── _layout.tsx             # Tabs (expo-router/js-tabs con íconos de @expo/vector-icons)
│   ├── (catalogo)/
│   │   ├── _layout.tsx         # Stack propio de la pestaña Catálogo
│   │   ├── index.tsx           # "/" — Catálogo, recientes (Pila), accesos a Buscar y Escanear
│   │   └── libro/
│   │       └── [isbn].tsx      # "/libro/[isbn]" — Detalle validado con título dinámico
│   └── reservas.tsx            # "/reservas" — Préstamos, recordatorios, espera y avisos in-app
├── buscar.tsx                  # "/buscar?q=" — Buscador sincronizado en la URL con debounce
├── escanear.tsx                # "/escanear" — Escáner EAN-13 con 4 estados + ingreso manual
├── reservar/
│   └── [isbn].tsx              # "/reservar/[isbn]" — Modal de confirmación de préstamo o espera
├── permisos/
│   └── [recurso].tsx           # "/permisos/[recurso]" — Modal previo (camara | notificaciones)
├── login.tsx                   # "/login" — Modal protegido (solo existe sin sesión)
├── mostrador.tsx               # "/mostrador" — Stack protegido (solo existe con sesión)
├── reserva.tsx                 # "/reserva" — <Redirect href="/reservas" />
└── +not-found.tsx              # Pantalla 404 mostrando la URL inexistente
```

---

## Bloque `plugins` de `app.json` comentado

```jsonc
"plugins": [
  // Habilita el enrutamiento basado en archivos y las rutas tipadas.
  "expo-router",
  [
    // Configura la pantalla de carga inicial mientras se hidrata AsyncStorage.
    "expo-splash-screen",
    {
      "backgroundColor": "#1E3A5F",
      "image": "./assets/images/splash-icon.png",
      "imageWidth": 76
    }
  ],
  [
    // Configura la cámara con texto de propósito claro y mínimo privilegio:
    // se desactiva el micrófono en iOS y Android porque solo leemos códigos EAN-13.
    "expo-camera",
    {
      "cameraPermission": "Usamos tu cámara para escanear el código de barras ISBN de los libros del catálogo.",
      "microphonePermission": false,
      "recordAudioAndroid": false
    }
  ],
  [
    // Habilita notificaciones locales para recordatorios de devolución y entregas.
    "expo-notifications",
    {
      "color": "#1E3A5F"
    }
  ]
]
```

---

## Tabla de permisos

| Recurso | Módulo | Cuándo se pide | Alternativa sin permiso |
| :--- | :--- | :--- | :--- |
| Cámara | `expo-camera` | Al entrar a `/escanear`, pasando primero por la pantalla previa `/permisos/camara`. | Formulario manual en `/escanear` para escribir el ISBN de 13 dígitos y abrir el libro igual. |
| Notificaciones locales | `expo-notifications` | Únicamente al activar el interruptor **"Recordarme"** de un préstamo en `/reservas` (creando antes el canal `"prestamos"` en Android). | Avisos visibles dentro de la propia pestaña `/reservas` (`BannerAviso`), incluyendo cuando el mostrador entrega un libro. |

---

## Justificación de `blockedPermissions` (mínimo privilegio)

En `app.json` (`expo.android.blockedPermissions`) se bloquean explícitamente los permisos que la app **no necesita**:

- `android.permission.RECORD_AUDIO`: la app solo escanea códigos de barras y nunca graba video ni audio.
- `android.permission.ACCESS_COARSE_LOCATION` y `android.permission.ACCESS_FINE_LOCATION`: la app no utiliza geolocalización.
- `android.permission.READ_EXTERNAL_STORAGE` y `android.permission.WRITE_EXTERNAL_STORAGE`: la app no accede a archivos ni galería del dispositivo.

De esta forma se aplica el principio de **mínimo privilegio**, evitando que dependencias transitivas o configuraciones por defecto declaren permisos innecesarios en el `AndroidManifest.xml`.

---

## Deep links de prueba

Reemplazá `IP` por la IP local que muestra `npx expo start` en tu red:

| Deep link (esquema propio) | Equivalente en Expo Go | Comportamiento esperado |
| :--- | :--- | :--- |
| `bibliotecaipf://libro/9789500426152` | `exp://IP:8081/--/libro/9789500426152` | Abre el detalle de *Ficciones* dentro de la pestaña Catálogo. |
| `bibliotecaipf://libro/123` | `exp://IP:8081/--/libro/123` | Abre el detalle y muestra mensaje de ISBN inválido con link al Catálogo. |
| `bibliotecaipf://buscar?q=borges` | `exp://IP:8081/--/buscar?q=borges` | Abre el buscador prellenado con `"borges"` dejando `(tabs)` debajo en la pila. |
| `bibliotecaipf://mostrador` | `exp://IP:8081/--/mostrador` | Sin sesión no existe en el stack protegido (redirige / cae en no encontrado según estado). |
| `bibliotecaipf://reserva` | `exp://IP:8081/--/reserva` | Redirige automáticamente a `/reservas` mediante `<Redirect />`. |
| `bibliotecaipf://escanear` | `exp://IP:8081/--/escanear` | Abre el escáner respetando el estado actual del permiso y ofreciendo ingreso manual. |

---

## Desafíos opcionales implementados (A6)

- **Persistencia:** `prestamos`, `recientes` y `avisos` se guardan en `@react-native-async-storage/async-storage` y la app mantiene el splash hasta hidratar el estado.
- **Pruebas unitarias:** 8 tests unitarios para `Pila` y `Cola` con `jest-expo` en `src/estructuras/__tests__/estructuras.test.ts`.
- **Debounce:** el buscador espera `300 ms` sin escribir antes de invocar `buscarLibros(q)`, limpiando temporizador y cancelando respuestas viejas.
- **Modo oscuro:** soporte completo con `useColorScheme` y paletas `COLORES_CLARO` / `COLORES_OSCURO` en `src/constants/tema.ts`.

---

## Verificación (`tsc`, `lint` y `test`)

### `npx tsc --noEmit`

```text
(sin errores — exit code 0)
```

### `npx expo lint`

```text
(sin errores ni advertencias — exit code 0)
```

### `npm test -- --watchAll=false`

```text
PASS src/estructuras/__tests__/estructuras.test.ts
Test Suites: 1 passed, 1 total
Tests:       8 passed, 8 total
```
