# Respuestas — Trabajo Práctico N° 4: “Biblioteca IPF”

Todas las respuestas de este documento se apoyan directamente en el código fuente del proyecto (Expo SDK 58, React Native 0.88, Expo Router 58).

---

## Parte B · Estado, efectos y renderizado

### B1. El ciclo de vida de `useLibros`

En `src/hooks/useLibros.ts` (líneas 12–52):

```ts
const [libros, setLibros] = useState<Libro[]>([]);
const [cargando, setCargando] = useState(true);
const [error, setError] = useState<string | null>(null);
const [intento, setIntento] = useState(0);
```

#### a) Render por render

**Caso exitoso (montaje inicial de `CatalogoScreen` en `src/app/(tabs)/(catalogo)/index.tsx`):**

1. **Render 1 (montaje):** `libros = []`, `cargando = true`, `error = null`. Provocado por el montaje inicial del componente. En pantalla se muestra `<EstadoCarga />`.
2. **Ejecución del `useEffect` (línea 18):** inicia `cargar()`, que llama a `setCargando(true)` y `setError(null)` (no generan re-render porque los valores ya son idénticos) y espera `await obtenerLibros()` (800 ms).
3. **Render 2 (resolución de la promesa):** al resolverse `obtenerLibros()`, React agrupa (automatic batching) `setLibros(datos)` y `setCargando(false)` del `finally` en un único render. Ahora `libros = [16 libros]`, `cargando = false`, `error = null`. En pantalla se renderiza la `FlatList` con el catálogo.

**Caso con fallo y clic en “Reintentar”:**

1. **Render 1 (montaje):** `libros = []`, `cargando = true`, `error = null` → muestra `<EstadoCarga />`.
2. **Render 2 (rechazo de `obtenerLibros()`):** el bloque `catch` ejecuta `setError('No pudimos cargar el catálogo...')` y el `finally` ejecuta `setCargando(false)` (batcheados). Estado: `libros = []`, `cargando = false`, `error = 'No pudimos...'` → muestra `<EstadoError />` con el botón **“Reintentar”**.
3. **Render 3 (al tocar “Reintentar”):** `reintentar()` incrementa `intento` de `0` a `1` (`setIntento((n) => n + 1)`). El cambio de `intento` provoca un render y dispara nuevamente el `useEffect` (limpiando el anterior primero).
4. **Render 4 (inicio del nuevo `cargar()`):** `setCargando(true)` y `setError(null)` → vuelve a mostrarse `<EstadoCarga />`.
5. **Render 5 (resolución exitosa):** `setLibros(datos)` y `setCargando(false)` → aparece la lista completa.

#### b) Desmontaje del Catálogo y limpieza del efecto

- **Al cambiar a la pestaña “Mis reservas”:** el Catálogo **no se desmonta**; Expo Router / React Navigation mantiene montadas las pantallas de las pestañas inactivas para conservar su estado y posición de scroll. La función de limpieza (`return () => { cancelado = true; }`) **no** se ejecuta.
- **Al abrir un detalle (`/libro/[isbn]`):** el Catálogo **tampoco se desmonta** porque queda debajo en la pila del Stack de `(catalogo)`.
- **Cuándo sí se ejecuta la limpieza en situaciones reales:**
  1. Cuando el usuario toca **“Reintentar”** (cambia la dependencia `intento`, por lo que React ejecuta la limpieza del efecto anterior antes de correr el nuevo).
  2. Si el componente se desmonta por completo (por ejemplo, al reiniciar el árbol de navegación o cerrar/reemplazar la vista raíz durante una recarga).

#### c) ¿Por qué no pasar una función `async` directamente a `useEffect`?

Una función `async` siempre devuelve una `Promise`, pero `useEffect` espera que el valor de retorno sea `undefined` o una **función síncrona de limpieza** (`() => void`). Si se pasara `useEffect(async () => ...)`, React recibiría una promesa en lugar de una función de cleanup (y TypeScript lo marca como error de tipos).

En `src/hooks/useLibros.ts` (líneas 18–45) se resuelve definiendo una función interna `async function cargar()` dentro del efecto, invocándola con `void cargar()`, y devolviendo la función síncrona `return () => { cancelado = true; };`.

#### d) Implementación de `reintentar`

En `src/hooks/useLibros.ts` (líneas 16 y 47–49):

```ts
const [intento, setIntento] = useState(0);
// ...
useEffect(() => {
  // ...
}, [intento]);

const reintentar = useCallback(() => {
  setIntento((n) => n + 1);
}, []);
```

Al incrementar `intento`, su valor cambia (`0 → 1 → 2…`), lo que hace que React vuelva a disparar el `useEffect`. Se usa un contador numérico en lugar de, por ejemplo, un booleano o `error`, porque un contador garantiza un valor distinto en cada reintento sin generar bucles (poner `error` en las dependencias haría que el efecto se dispare solo cada vez que cambia `error`).

---

### B2. La condición de carrera del buscador

En `src/app/buscar.tsx` (líneas 106–133), el efecto usa un temporizador de debounce (`300 ms`) y la bandera local `let cancelado = false;` con limpieza `return () => { cancelado = true; clearTimeout(temporizador); };`.

| Momento | Qué pasa | Sin limpieza: qué se ve | Con tu código: qué se ve |
| :--- | :--- | :--- | :--- |
| `t = 0 ms` | Escribe “bor” → se programa/pide `buscarLibros("bor")` (1.400 ms). | Indicador de carga o lista previa. | Se programa el debounce (300 ms) para “bor”. |
| `t = 200 ms` | Escribe “borges” → se pide `buscarLibros("borges")` (300 ms). | Sigue esperando ambas respuestas. | El cleanup cancela el temporizador de “bor” (ni siquiera sale el pedido viejo; y si ya hubiese salido, `cancelado = true` descarta su respuesta) y programa “borges”. |
| `t = 500 ms` | Llega la respuesta de “borges”. | Se ven los libros de **Borges** (*Ficciones*, *El Aleph*). | Se ven los libros de **Borges** (*Ficciones*, *El Aleph*). |
| `t = 1.400 ms` | Llega la respuesta de “bor”. | **Se sobrescribe la pantalla** con los resultados viejos de “bor”, desincronizados con el texto “borges”. | Siguen viéndose **solo** los libros de **Borges** porque la respuesta vieja fue descartada por `if (!cancelado)` (y en nuestro caso ni llegó a dispararse por el debounce). |

#### a) Qué hace exactamente la limpieza y cuándo se ejecuta

```ts
return () => {
  cancelado = true;
  clearTimeout(temporizador);
};
```

React ejecuta esa función de limpieza **inmediatamente antes** de volver a correr el efecto cuando cambia `consultaUrl` (o `reintento`), y también al desmontar `BuscarScreen`. Al poner `cancelado = true`, la clausura del efecto anterior ya no puede ejecutar `setResultados`, `setError` ni `setCargando` cuando su promesa finalmente resuelva.

#### b) ¿Funciona `if (texto === q) setResultados(datos)` dentro del `.then()`?

**No funciona.** Por las **clausuras (closures)** de JavaScript, tanto `texto` como `q` fueron capturados en el momento en que se ejecutó ese render y ese efecto. Dentro del `.then()`, `q` **no** apunta al valor actual de la URL sino al valor congelado que tenía `q` en el render en el que se creó esa promesa. Por lo tanto `texto === q` siempre evalúa a `true` (compara el valor viejo consigo mismo) y termina pisando los resultados más nuevos.

#### c) URL y botón atrás: `router.setParams` vs `router.push`

- Con `router.setParams({ q: texto })` (`src/app/buscar.tsx`, línea 99), cada tecla actualiza el parámetro `q` de la **misma** entrada en la pila (`/buscar?q=b`, `/buscar?q=bo`, `/buscar?q=bor`) sin apilar pantallas nuevas. Al tocar **atrás**, el usuario vuelve directamente al Catálogo.
- Si se usara `router.push('/buscar?q=' + texto)`, cada letra apilaría una pantalla nueva de `/buscar` en el Stack; para volver al Catálogo habría que tocar “atrás” tantas veces como caracteres se escribieron.

---

### B3. Mutar o reemplazar

#### a) Tocar “Anotarme” tres veces

El texto sigue mostrando **`Personas en espera: 0`**. Porque `espera.encolar('Ana')` muta internamente el objeto `Cola` sin llamar a un setter de `useState`, y aunque se llamara a `setEspera(espera)`, React compara referencias con `Object.is`: al ser la **misma instancia** en memoria, React asume que nada cambió y no vuelve a renderizar.

#### b) Por qué “salta” a 3 al escribir en un `TextInput` controlado

Escribir en el `TextInput` dispara el `setState` de ese input y fuerza un re-render del componente. Durante ese render, React lee `{espera.tamanio}` de la instancia mutada —que silenciosamente ya tenía 3 elementos— y el número salta de golpe de 0 a 3. Un error intermitente (“a veces”) es mucho peor que uno constante porque oculta su causa raíz, pasa pruebas superficiales y aparece en producción solo según el orden en que el usuario interactúa con otros controles.

#### c) Solución usada en `BibliotecaContext` y comparación

En `src/context/BibliotecaContext.tsx` (líneas 196–205 y 266–274) usamos **clonación inmutable** con el método `.clonar()` de `Cola` y `Pila`:

```ts
const colaActual = listasEspera[libro.isbn] ?? new Cola<string>();
const colaNueva = colaActual.clonar();
colaNueva.encolar(USUARIO_ACTUAL);

setListasEspera((prev) => ({
  ...prev,
  [libro.isbn]: colaNueva,
}));
```

| Estrategia | Ventaja | Costo |
| :--- | :--- | :--- |
| **Clonar instancia (`clonar()`)** *(usada en nuestra app)* | Respeta la inmutabilidad de React, mantiene encapsulado `#items` dentro de la clase y funciona sin sorpresas con `useMemo` / React Compiler. | Copia O(n) de los elementos al mutar (despreciable para listas de espera y últimos 3 recientes). |
| **Contador de versión (`version + 1`)** | Evita copiar los elementos (O(1)). | Rompe la inmutabilidad: la referencia de `Cola` no cambia, dificulta memoizar hijos y es propenso a olvidos si alguien muta sin incrementar la versión. |
| **`useReducer`** | Centraliza todas las transiciones de estado en una función pura fácil de testear. | Igual requiere devolver referencias nuevas (o clonar) y agrega más código repetitivo para una app de este tamaño. |

---

### B4. ¿Dónde vive cada dato?

| Dato | Dónde vive en tu app | Por qué ahí y no en otro lugar |
| :--- | :--- | :--- |
| **Texto del buscador** | **URL** (`useLocalSearchParams` + `router.setParams` en `src/app/buscar.tsx`). | Permite deep links como `bibliotecaipf://buscar?q=borges` y mantiene la búsqueda sincronizada con la ruta. |
| **Préstamos y reservas** | **Context** (`BibliotecaContext` + persistencia en `AsyncStorage`). | Se leen y modifican desde múltiples pantallas: Catálogo, Detalle, Modal de reserva, Mis reservas y Mostrador. |
| **Listas de espera** | **Context** (`listasEspera: Record<string, Cola<string>>` en `BibliotecaContext`). | Compartidas entre Catálogo, Detalle, Modal de reserva, Mis reservas y Mostrador. |
| **Vistos recientemente** | **Context** (`recientes: Pila<Libro>` en `BibliotecaContext` + `AsyncStorage`). | Se escribe al abrir `/libro/[isbn]` y se lee en `/` (Catálogo). |
| **Sesión del personal** | **Context** (`sesionPersonal: boolean` en `BibliotecaContext`). | Controla `<Stack.Protected>` en `src/app/_layout.tsx`, el botón “Personal” en `(catalogo)/_layout.tsx` y el cierre de sesión en `/mostrador`. |
| **Ejemplares disponibles de un libro** | **Se calcula** (`obtenerDisponibles(libro)` en `src/context/BibliotecaContext.tsx`, líneas 159–166). | Evita duplicar información y quedar desincronizado respecto a `libro.ejemplares` y `prestamos`. |
| **Estado del permiso de cámara** | **Sistema operativo** (consultado vía `usePermiso('camara')` / `useCameraPermissions`). | El usuario puede cambiarlo en cualquier momento desde Ajustes del teléfono; la app solo refleja lo que informa el SO. |
| **Identificador de la notificación programada** | **Context + AsyncStorage** (campo `recordatorioId` dentro de cada `Prestamo`). | Necesitamos conservar el ID para poder cancelar la notificación si el usuario apaga el interruptor o devuelve el libro, incluso tras cerrar y reabrir la app. |

#### Re-renders del Context

Cuando cambia el objeto `value` de `BibliotecaContext`, **todos** los componentes que llaman a `useBiblioteca()` se vuelven a renderizar. Por eso, si `CatalogoScreen` consume `useBiblioteca()`, al activar un recordatorio en `/reservas` (que actualiza `prestamos` y genera un nuevo `value`), el Catálogo también se re-renderiza.

Para evitarlo se podrían dividir los contextos por dominio (`RecientesContext`, `PrestamosContext`, `SesionContext`) o separar estado y dispatch. En una app de este tamaño (16 libros, pocas pantallas) **no vale la pena** esa complejidad extra porque el costo de render es mínimo y un único `BibliotecaContext` memoizado con `useMemo` mantiene el código simple y mantenible.

---

## Parte C · Navegación y rutas

### C1. La pila en tu app

| # | Acción | Pilas resultantes (base → tope) |
| :--- | :--- | :--- |
| 1 | Abre la app. | **Stack raíz:** `[(tabs)]` · **Stack tab Catálogo:** `[index (/)]` |
| 2 | Toca un libro del Catálogo. | **Stack raíz:** `[(tabs)]` · **Stack tab Catálogo:** `[index (/), libro/[isbn]]` |
| 3 | Toca “Reservar”. | **Stack raíz:** `[(tabs), reservar/[isbn] (modal)]` · **Stack tab Catálogo:** `[index (/), libro/[isbn]]` |
| 4 | Toca “Confirmar”. | **Stack raíz:** `[(tabs)]` (tab activa: `reservas`) · **Stack tab Catálogo:** `[index (/), libro/[isbn]]` |
| 5 | Toca atrás (Android). | **Stack raíz:** `[(tabs)]` (vuelve a tab `Catálogo` o sale según el historial de tabs; **nunca** vuelve a `reservar/[isbn]`) |
| 6 | Toca la tab “Catálogo”. | **Stack raíz:** `[(tabs)]` · **Stack tab Catálogo:** `[index (/), libro/[isbn]]` |

#### a) Método usado en el paso 4 (`src/app/reservar/[isbn].tsx`, línea 150)

Usamos **`router.dismissTo('/reservas')`**.

- Si hubiéramos usado **`push('/reservas')`**, el modal `reservar/[isbn]` quedaría debajo en la pila y al tocar “atrás” el usuario volvería a la pantalla de confirmación (rompiendo el requisito A3.5).
- Si hubiéramos usado **`replace('/reservas')`**, se reemplazaría el modal en el Stack raíz, pero `dismissTo` es más explícito porque descarta el modal hacia la ruta destino ya existente en `(tabs)`.
- Con **`dismissTo('/reservas')`**, el modal se cierra y se activa la pestaña `/reservas`, garantizando que “atrás” nunca regrese a la confirmación.

#### b) Qué ve la persona en el paso 6

Al tocar la tab **“Catálogo”**, la persona ve el **detalle del libro** (`/libro/[isbn]`), porque la pestaña Catálogo tiene su **propio Stack** (`src/app/(tabs)/(catalogo)/_layout.tsx`) que conserva su historial independiente al cambiar de pestaña. Es el comportamiento esperado en apps móviles con tabs: el usuario puede consultar “Mis reservas” y retomar exactamente donde estaba leyendo en el Catálogo (y si toca de nuevo la tab o “atrás”, vuelve a la lista).

---

### C2. El escáner que dispara de más

#### a) Qué pasaría con `router.push` sin protección

`onBarcodeScanned` se dispara en cada frame en el que el código EAN-13 sigue frente a la cámara (varias veces por segundo). Sin protección, se encolarían múltiples acciones `PUSH` en la **cola de acciones de navegación** (como vimos en el TP 2), apilando 5, 10 o más copias idénticas de `/libro/[isbn]`. El usuario tendría que apretar “atrás” repetidas veces para salir.

#### b) `useRef` vs `useState` (`src/app/escanear.tsx`, líneas 157 y 186–205)

Usamos **`useRef(false)`** (`yaNavegoRef`):

```ts
const yaNavegoRef = useRef(false);
// ...
if (yaNavegoRef.current) {
  return;
}
// ...
yaNavegoRef.current = true;
router.replace({ pathname: '/libro/[isbn]', params: { isbn: codigo } });
```

Un `useState` puesto en `true` **no alcanza** porque `setState` es asíncrono y recién se refleja en el siguiente render: entre el primer disparo de `onBarcodeScanned` y el re-render, pueden entrar varios callbacks más viendo todavía el valor `false` en su clausura. En cambio, mutar `yaNavegoRef.current = true` es **síncrono e inmediato** en memoria.

#### c) Por qué conviene `router.replace`

Con `router.replace`, la pantalla `/escanear` se reemplaza por `/libro/[isbn]`. Así, al tocar “atrás” desde el detalle, la persona vuelve al **Catálogo**. Si se usara `router.push`, al tocar “atrás” volvería a la cámara activa y si el libro siguiera frente al lente lo volvería a escanear de inmediato.

#### d) ISBN que no está en el catálogo

En `src/app/escanear.tsx` (líneas 208–221), si el código EAN-13 no figura en `LIBROS`, se muestra un banner amarillo claro dentro de la pantalla sin navegar y se deja seguir escaneando. Para evitar que el mismo aviso se dispare 10 veces seguidas mientras el código sigue enfocado, guardamos `ultimoDesconocidoRef.current = codigo` y lo liberamos recién después de `2.500 ms` con un `setTimeout` que tiene su `clearTimeout` en el `useEffect` de desmontaje (líneas 173–179).

---

### C3. Deep links y rutas protegidas

| Link | Qué ve la persona | Qué queda debajo en la pila | Qué parte de tu código lo decide |
| :--- | :--- | :--- | :--- |
| `bibliotecaipf://libro/9789500426152` | Detalle de *Ficciones* con su título en el header. | `index` (`/`) dentro del Stack de Catálogo. | `src/app/(tabs)/(catalogo)/libro/[isbn].tsx` + `anchor: '(tabs)'` en `src/app/_layout.tsx`. |
| `bibliotecaipf://libro/123` | Mensaje **“ISBN inválido”** con botón “Volver al Catálogo”. | `index` (`/`) dentro del Stack de Catálogo. | Validación `esIsbnValido(isbn)` en `src/app/(tabs)/(catalogo)/libro/[isbn].tsx` (líneas 190–217). |
| `bibliotecaipf://buscar?q=borges` | Buscador con el input en `"borges"` y los resultados filtrados. | `(tabs)` (Catálogo). | `unstable_settings = { anchor: '(tabs)' }` en `src/app/_layout.tsx` y `useLocalSearchParams` en `src/app/buscar.tsx`. |
| `bibliotecaipf://mostrador` *(sin sesión)* | No puede acceder al mostrador (la ruta no existe sin sesión; redirige a la raíz / 404). | `(tabs)`. | `<Stack.Protected guard={sesionPersonal}>` en `src/app/_layout.tsx` (líneas 69–76). |
| `bibliotecaipf://reserva` | Pestaña **“Mis reservas”** (`/reservas`). | `(tabs)`. | `<Redirect href="/reservas" />` en `src/app/reserva.tsx`. |
| `bibliotecaipf://escanear` *(cámara bloqueada)* | Tarjeta **“Cámara bloqueada”** con botón “Abrir Ajustes” + formulario para escribir el ISBN a mano. | `(tabs)`. | `usePermiso('camara')` en `src/app/escanear.tsx` (líneas 286–305). |

**¿Por qué `/libro/123` llega a la pantalla de detalle?** Porque Expo Router hace coincidir el patrón de ruta dinámica `/libro/[isbn]` solo por su estructura de segmentos, sin conocer las reglas de negocio del dominio. Es responsabilidad de la pantalla `libro/[isbn].tsx` validar el formato (13 dígitos) y la existencia del libro, y responder con una salida clara hacia el Catálogo.

---

### C4. Foco, montaje y primer plano

#### a) Qué evento detecta cada herramienta

- **`useEffect(..., [])`**: se ejecuta una sola vez al **montar** el componente (y su limpieza al desmontar).
- **`useFocusEffect`**: se ejecuta cada vez que la pantalla **gana foco** dentro del navegador (por ejemplo al cambiar de pestaña o volver de un modal).
- **`AppState`**: escucha los cambios de estado de la app a nivel sistema operativo (`active`, `background`, `inactive`), por ejemplo cuando el usuario sale a Ajustes y regresa.

#### b) Quién se entera en cada caso

- **Sale a Ajustes, habilita notificaciones y vuelve a la app:** se entera **`AppState`** (cambio a `'active'`). Ni `useEffect([])` ni `useFocusEffect` se disparan por sí solos al volver de otra app.
- **Va a la pestaña Catálogo y vuelve a “Mis reservas”:** se entera **`useFocusEffect`**. `useEffect([])` no corre (la tab nunca se desmontó) y `AppState` tampoco cambia (la app nunca salió de primer plano).

#### c) Cuál usamos en nuestra app

Usamos **ambas combinadas**:

1. `AppState` dentro de `src/hooks/usePermiso.ts` (líneas 67–76) para detectar el regreso desde Ajustes del sistema.
2. `useFocusEffect` en `src/app/(tabs)/reservas.tsx` (líneas 101–137) y `src/app/escanear.tsx` (líneas 162–166) para refrescar el estado cada vez que se vuelve desde el modal `/permisos/[recurso]` o desde otra pestaña.

Si usáramos solo `useEffect([])`, la pantalla mostraría un estado desactualizado apenas el usuario cambiara el permiso en Ajustes o en el modal previo.

---

## Parte D · Permisos en tu app

### D1. Recorrido completo de la cámara (Android 14, app recién instalada)

| # | Acción | Qué muestra tu app | `status` | `canAskAgain` |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Toca “Escanear” por primera vez. | Abre `/escanear` y presenta automáticamente el modal `/permisos/camara` con el beneficio y el botón **“Continuar”**. | `undetermined` | `true` |
| 2 | “Continuar” → “No permitir”. | Se cierra el modal; `/escanear` muestra la tarjeta “Habilitá la cámara” (botón “Permitir cámara”) y el formulario manual de ISBN. | `denied` | `true` |
| 3 | Toca “Escanear” otra vez. | Muestra `/permisos/camara` con **“Continuar”**. | `denied` | `true` |
| 4 | “Continuar” → “No permitir”. | Android 14 bloquea futuras solicitudes tras la segunda denegación; `/escanear` pasa al estado **“Cámara bloqueada”** con botón **“Abrir Ajustes”** + ingreso manual. | `denied` | `false` |
| 5 | Toca “Escanear” otra vez. | Muestra directamente el estado **“Cámara bloqueada”** con **“Abrir Ajustes”** y el formulario manual (no intenta abrir el diálogo del sistema). | `denied` | `false` |
| 6 | “Abrir Ajustes” → habilita la cámara → vuelve a la app. | Al volver al primer plano, `AppState` actualiza el permiso y `/escanear` muestra inmediatamente `<CameraView />` listo para leer EAN-13. | `granted` | `true` |

#### a) Diferencia en iOS

En **iOS**, el sistema permite preguntar **una sola vez**. Ya en el **paso 2** (después del primer “No permitir”), `canAskAgain` pasa inmediatamente a `false`. Por lo tanto, en el paso 3 la app ya muestra **“Cámara bloqueada”** y el botón **“Abrir Ajustes”** (no existe el segundo intento de diálogo que tiene Android 14).

#### b) Línea de código que decide entre “Continuar” y “Abrir Ajustes”

En `src/hooks/usePermiso.ts` (líneas 20–30):

```ts
function mapearEstado(respuesta: RespuestaBase | null): EstadoPermiso {
  if (!respuesta) return 'cargando';
  if (respuesta.granted) return 'concedido';
  if (respuesta.canAskAgain) return 'preguntable';
  return 'bloqueado';
}
```

Y en `src/app/permisos/[recurso].tsx` (líneas 133 y 157):

```ts
const estaBloqueado = estado === 'bloqueado';
// ...
etiqueta={estaBloqueado ? 'Abrir Ajustes' : 'Continuar'}
```

Usa el campo **`canAskAgain`** (además de `granted`). No alcanza con mirar `status` porque tanto tras la primera denegación en Android como tras el bloqueo definitivo, `status` es `'denied'`; solo `canAskAgain` distingue si todavía se puede invocar el diálogo del sistema o si la única salida es `Linking.openSettings()`.

#### c) Qué parte del código detecta el regreso de Ajustes en el paso 6

En `src/hooks/usePermiso.ts` (líneas 67–76):

```ts
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
```

Si esa suscripción no existiera, al volver desde Ajustes la app seguiría mostrando el estado viejo (“Cámara bloqueada”) y el usuario tendría que salir y volver a entrar a la pantalla (o reiniciar la app) para ver la cámara funcionando.

---

### D2. Notificaciones y consistencia

#### a) Si no se cancelara la notificación al devolver antes de los 15 segundos

La notificación programada en el sistema operativo **se dispararía igual** a los 15 segundos recordándole al usuario que devuelva un libro que ya devolvió. Eso rompe la consistencia entre el estado de la app y los avisos del sistema. En `src/context/BibliotecaContext.tsx` (líneas 212–223), `devolverLibro` cancela primero `prestamo.recordatorioId` mediante `cancelarRecordatorio(...)` antes de quitar el préstamo.

#### b) Dónde se guarda el identificador y qué pasa si la app se cierra

El identificador (`recordatorioId`) se guarda dentro de cada `Prestamo` en `BibliotecaContext` **y se persiste en `AsyncStorage`** (`CLAVE_STORAGE_BIBLIOTECA`).

- Si la app **no** tuviera persistencia y se cerrara antes de los 15 segundos, la notificación **igual llegaría** (porque está agendada en el sistema operativo), pero al reabrir la app se perdería el `recordatorioId` en memoria y ya no se podría cancelar esa notificación puntual desde el interruptor ni al devolver el libro.
- Con la persistencia implementada en `AsyncStorage`, el `recordatorioId` sobrevive al cierre de la app y se hidrata antes de mostrar las pantallas.

#### c) Canal en Android 13+ vs Android 12

En **Android 13 (API 33) o superior**, el sistema requiere que la app haya creado al menos un canal de notificaciones (`setNotificationChannelAsync`) **antes** de mostrar el diálogo de permiso `POST_NOTIFICATIONS` (si no existe canal, el diálogo del sistema puede no aparecer o comportarse de forma inconsistente). En **Android 12 (API 31–32)** no existe el permiso en tiempo de ejecución `POST_NOTIFICATIONS` (las notificaciones están habilitadas por defecto al instalar), pero el canal igual es obligatorio para que la notificación se muestre con la importancia configurada (`AndroidImportance.HIGH`).

#### d) Entrega desde el mostrador con permiso denegado

En `src/context/BibliotecaContext.tsx` (líneas 286–297):

```ts
const permitido = await tienePermisoNotificaciones();
if (permitido) {
  await enviarNotificacionEntrega(tituloLibro, isbn);
} else {
  agregarAviso(
    '¡Tu libro ya está disponible!',
    `El personal te asignó "${tituloLibro}". Ya figura en tus préstamos activos.`,
    isbn,
  );
}
```

El código **consulta el permiso en ese momento** (`await tienePermisoNotificaciones()`, que llama a `getPermissionsAsync()`), en lugar de leer un booleano guardado. Esto importa porque el usuario pudo haber revocado o habilitado las notificaciones en Ajustes del sistema minutos antes; si usáramos un valor viejo en memoria, podríamos intentar mandar una notificación silenciosamente descartada por el SO y no mostrar el aviso in-app en `/reservas`.

---

### D3. Lo que tu app pide y lo que no

| Plataforma | Permiso o clave declarada | Función de la app que lo justifica | ¿Quién lo agrega? |
| :--- | :--- | :--- | :--- |
| **Android** | `android.permission.CAMERA` | Escanear el código de barras EAN-13 de los libros en `/escanear`. | Plugin `expo-camera` en `app.json`. |
| **Android** | `android.permission.POST_NOTIFICATIONS` | Recordatorios de devolución (15 s demo) y aviso de entrega en mostrador. | Plugin `expo-notifications` (Android 13+). |
| **iOS** | `NSCameraUsageDescription` | Explicar al usuario por qué se pide la cámara al escanear ISBN. | Plugin `expo-camera` (`cameraPermission`) + `ios.infoPlist` en `app.json`. |
| **iOS** | Notificaciones locales (`UNUserNotificationCenter`) | Recordatorios de devolución y avisos de entrega. | Plugin `expo-notifications` en `app.json`. |

#### a) Por qué la app no declara `RECORD_AUDIO`

En `app.json` (líneas 25–31 y 45–52):

```json
"android": {
  "blockedPermissions": [
    "android.permission.RECORD_AUDIO",
    "android.permission.ACCESS_COARSE_LOCATION",
    "android.permission.ACCESS_FINE_LOCATION",
    "android.permission.READ_EXTERNAL_STORAGE",
    "android.permission.WRITE_EXTERNAL_STORAGE"
  ]
},
"plugins": [
  [
    "expo-camera",
    {
      "cameraPermission": "Usamos tu cámara para escanear el código de barras ISBN de los libros del catálogo.",
      "microphonePermission": false,
      "recordAudioAndroid": false
    }
  ]
]
```

`microphonePermission: false` y `recordAudioAndroid: false` le indican al config plugin de `expo-camera` que no inyecte permisos de micrófono, y `blockedPermissions` refuerza el bloqueo en el `AndroidManifest.xml`.

#### b) Si mañana piden “elegir una foto de portada desde la galería”

Usaría **`expo-image-picker`**. En Android 13+ y iOS modernos, el selector fotográfico nativo del sistema (**Photo Picker**) **no requiere** pedir permiso amplio de lectura de toda la galería (`READ_MEDIA_IMAGES` / `NSPhotoLibraryUsageDescription` solo se necesita si se accede directamente a la biblioteca fuera del picker estándar). Como `expo-image-picker` incorpora **código nativo nuevo** que no estaba compilado en el binario anterior, **no alcanza con una actualización OTA** (Expo Updates solo actualiza el bundle JS/assets): hace falta generar una **build nativa nueva**.

#### c) Qué no se puede verificar del todo en Expo Go

En **Expo Go** no se pueden verificar por completo:
1. Los **textos de propósito** personalizados de `app.json` (`cameraPermission` / `NSCameraUsageDescription`), porque Expo Go usa su propio binario precompilado con sus textos genéricos.
2. El bloque `blockedPermissions` del `AndroidManifest.xml` final y la configuración exacta del ícono/color nativo de `expo-notifications`.

Para verificarlos se debe compilar una **Development Build** (`npx expo prebuild` / `eas build --profile development`) e instalarla en un dispositivo real.

---

## Parte E · Buenas prácticas y decisiones de diseño

### E1. Revisión de código

#### a) Problemas encontrados en el código del compañero (10 problemas)

1. **Línea 10 y 22 (`useState<any[]>`, `{ libro: any }`) — Mala práctica (TypeScript):** pierde todo el tipado estático. **Corrección:** usar `Libro[]` y `{ libro: Libro }` desde `src/types`.
2. **Líneas 13–16 (pedir cámara y notificaciones al montar el Catálogo) — Mala práctica (Permisos / UX):** pide dos permisos de golpe sin contexto ni pantalla previa apenas abre la app, antes de que el usuario siquiera toque “Escanear” o “Recordarme”. **Corrección:** pedir cámara solo al entrar a `/escanear` pasando por `/permisos/camara`, y notificaciones solo al activar “Recordarme”.
3. **Líneas 18–20 (`useEffect` sin array de dependencias) — Error de ejecución / rendimiento grave:** dispara un bucle infinito de llamadas a `obtenerLibros()`. **Corrección:** extraer la lógica a `useLibros()` con array de dependencias `[intento]` y cleanup.
4. **Línea 19 (`.then()` sin `.catch()` ni estado de carga/error) — Error de ejecución / mala práctica:** `obtenerLibros()` falla 1 de cada 5 veces, generando un rechazo no manejado (`UnhandledPromiseRejection`) y dejando la pantalla vacía sin forma de reintentar. **Corrección:** manejar `try/catch/finally` con estados `cargando`, `error` y botón “Reintentar”.
5. **Línea 19 (sin limpieza en el efecto) — Advertencia / posible fuga:** si el componente se desmonta antes de los 800 ms, intenta actualizar estado desmontado. **Corrección:** bandera `let cancelado = false` limpiada en `return () => { cancelado = true; }`.
6. **Líneas 22–30 (`function Fila` declarada dentro de `Catalogo`) — Rendimiento / mala práctica:** se crea una nueva definición de componente en cada render, haciendo que React desmonte y vuelva a montar cada fila constantemente. **Corrección:** mover a su propio archivo `src/components/TarjetaLibro.tsx` a nivel de módulo.
7. **Línea 25 (`style={{ fontSize: 16, color: '#333', padding: 12 }}`) — Mala práctica / rendimiento:** estilo en línea con valores mágicos repetidos y sin soporte de tema oscuro. **Corrección:** `StyleSheet.create` usando constantes de `src/constants/tema.ts`.
8. **Líneas 33–36 (`ScrollView` + `.map` con `key={i}`) — Rendimiento / mala práctica:** renderiza todos los ítems de golpe sin virtualización y usa el índice del array como `key`. **Corrección:** usar `FlatList` con `keyExtractor={(item) => item.isbn}` y `ListEmptyComponent`.
9. **Líneas 24 y 37–39 (`Pressable` sin accesibilidad ni área táctil mínima) — Mala práctica (Accesibilidad):** el botón de cámara solo tiene un ícono de 28 px sin `accessibilityRole="button"`, sin `accessibilityLabel` y con área menor a 44×44. **Corrección:** agregar roles, etiquetas descriptivas y `minHeight: 44` / `minWidth: 44`.
10. **Línea 11 (`permiso` sin usar) — Advertencia (Lint):** variable declarada y nunca leída. **Corrección:** eliminar el hook de cámara de esta pantalla.

#### b) Qué pasa durante el primer minuto con el `useEffect` sin dependencias (líneas 18–20)

1. Al montar (`t = 0`), corre el efecto y llama a `obtenerLibros()`.
2. A los `800 ms`, `obtenerLibros()` devuelve un **nuevo array** (`LIBROS.map((libro) => ({ ...libro }))`).
3. `setLibros(datos)` detecta una referencia nueva → provoca un **re-render**.
4. Como el `useEffect` no tiene array de dependencias, vuelve a ejecutarse en ese re-render → llama otra vez a `obtenerLibros()`.
5. En 60 segundos se disparan alrededor de **60–75 llamadas continuas** (y cada ~5 llamadas lanza un error no capturado), consumiendo CPU, red y batería sin detenerse jamás.

**¿Cambiaría algo si `obtenerLibros()` devolviera siempre el mismo array?** Sí: en el primer render cambiaría `[] → LIBROS` (1 re-render), se dispararía una segunda llamada que devolvería la **misma referencia** `LIBROS`; al llamar `setLibros(LIBROS)`, React compararía con `Object.is(LIBROS, LIBROS) === true`, omitiría el re-render y el bucle se detendría. Aun así seguiría siendo un bug porque cada render externo volvería a disparar el pedido.

#### c) Pantalla reescrita con los hooks, componentes y constantes de nuestra app

Es exactamente la implementación de `src/app/(tabs)/(catalogo)/index.tsx`: utiliza `useLibros()`, `useBiblioteca()`, `useTema()`, `<EstadoCarga />`, `<EstadoError />`, `<EstadoVacio />`, `<TarjetaLibro />`, `<TarjetaReciente />`, `FlatList` con `keyExtractor={(item) => item.isbn}` y `StyleSheet.create` basado en `src/constants/tema.ts`.

#### d) Rechazo en tienda vs desinstalación rápida

- **Rechazo en tienda (App Store / Google Play):** pedir permisos de cámara y notificaciones **apenas se abre la app** sin contexto ni justificación previa (líneas 13–16), especialmente en Apple App Review (Guideline 5.1.1), que rechaza apps que solicitan permisos antes de que el usuario inicie la acción que los necesita.
- **Desinstalación más rápida por parte del usuario:** el **bucle infinito de red + crashes/pantalla vacía sin reintento** (líneas 18–20), sumado a los dos popups invasivos de permisos al segundo cero, hace que la app se sienta rota, lenta y desconfiable desde el primer uso.

---

### E2. Organización y acoplamiento

#### a) Grafo de importaciones entre carpetas

```text
src/app/         ──► components, context, hooks, data, lib, constants, types
src/components/  ──► hooks (useTema), lib (validacion), constants, types
src/context/     ──► estructuras (Pila, Cola), data, lib (notificaciones), constants, types
src/hooks/       ──► lib (api, notificaciones), constants, types
src/lib/         ──► data, constants, types
src/data/        ──► types
src/estructuras/ ──► (sin dependencias externas)
src/constants/   ──► (sin dependencias externas)
src/types/       ──► (sin dependencias externas)
```

**No existe ninguna importación “hacia arriba”** (ningún hook, componente o módulo de `lib` importa nada desde `src/app/`). Una importación hacia arriba crearía dependencias circulares, acoplaría la lógica reutilizable a una pantalla puntual y haría imposible testear o reutilizar los hooks de forma aislada.

#### b) Si el catálogo pasara a venir de una API real

Cambiaría principalmente **`src/lib/api.ts`** (reemplazando la lectura del array `LIBROS` por `fetch(...)` al servidor) y, para el detalle/reservas/mostrador que hoy consultan `LIBROS` de forma síncrona por ISBN, se agregaría una función `obtenerLibroPorIsbn(isbn)` en `src/lib/api.ts` (o se compartiría el catálogo cargado en `BibliotecaContext`). El hecho de que `CatalogoScreen` y `BuscarScreen` dependan solo de `useLibros()` y `buscarLibros()` demuestra un **bajo acoplamiento**: las pantallas no saben si los datos vienen de memoria o de un backend HTTP.

#### c) `<ConPermiso recurso="camara">` vs `usePermiso` + pantalla previa

- **Qué se gana:** menos código repetitivo si muchas pantallas distintas necesitaran envolver contenido protegido por el mismo permiso.
- **Qué se pierde:** flexibilidad para manejar flujos donde la pantalla **sigue siendo utilizable sin el permiso** (en `/escanear`, el formulario manual de ISBN debe verse siempre, incluso si la cámara está bloqueada).
- **¿Sirve para notificaciones?** **No.** Las notificaciones en esta app **no bloquean ninguna pantalla**: se piden de forma puntual al activar un interruptor (“Recordarme”) dentro de `/reservas`. Un wrapper visual alrededor de la pantalla no encaja con una acción disparada por un evento de usuario; ahí un hook imperativo (`usePermiso`) es la abstracción correcta.

---

### E3. Mapa de fallas

| Situación | Qué ve la persona | Dónde se maneja (archivo y línea) |
| :--- | :--- | :--- |
| `obtenerLibros()` falla | Tarjeta de error clara en español con botón **“Reintentar”**. | `src/hooks/useLibros.ts` (líneas 29–35) y `src/app/(tabs)/(catalogo)/index.tsx` (líneas 189–197). |
| Se abre `/libro/abc` | Pantalla con título **“ISBN inválido”**, explicación de los 13 dígitos y botón **“Volver al Catálogo”**. | `src/app/(tabs)/(catalogo)/libro/[isbn].tsx` (líneas 190–233). |
| Se escanea un ISBN que no está en el catálogo | Banner amarillo avisando que el ISBN no está en el catálogo y permitiendo seguir escaneando (sin spam repetido). | `src/app/escanear.tsx` (líneas 208–221 y 307–316). |
| La cámara está bloqueada | Tarjeta **“Cámara bloqueada”** con botón **“Abrir Ajustes”** y formulario de ingreso manual de ISBN siempre visible. | `src/app/escanear.tsx` (líneas 286–305 y 318–346). |
| Las notificaciones están denegadas | Indicador de estado en `/reservas` + avisos dentro de la app (`BannerAviso`) al activar recordatorio fallido o al recibir entrega del mostrador. | `src/app/(tabs)/reservas.tsx` (líneas 126–133 y 216–226) y `src/context/BibliotecaContext.tsx` (líneas 286–297). |
| Se intenta reservar un libro ya reservado | En Detalle el botón dice **“Ya reservado”** (deshabilitado) y en el modal de reserva se bloquea la confirmación con un mensaje claro. | `src/app/(tabs)/(catalogo)/libro/[isbn].tsx` (líneas 290–308) y `src/app/reservar/[isbn].tsx` (líneas 146–154 y 199–209). |
| “Entregar al siguiente” con la lista de espera vacía | El libro no aparece en la lista activa (y si se invocara igual, el botón queda deshabilitado y `entregarAlSiguiente` devuelve `entregadoA: null` con mensaje informativo). | `src/context/BibliotecaContext.tsx` (líneas 260–269) y `src/app/mostrador.tsx` (líneas 74–82 y 127–133). |
| Login con clave incorrecta | Caja roja clara: *“Usuario o clave incorrectos. Revisá los datos e intentá nuevamente.”* sin cerrar el modal. | `src/app/login.tsx` (líneas 123–129 y 185–194). |

---

### E4. Decisiones con argumentos

#### a) Identificador: ISBN vs ID numérico propio

En esta app elegimos **ISBN-13** porque el dominio del TP exige abrir libros directamente desde el código de barras EAN-13 del escáner y validar 13 dígitos en `/libro/[isbn]`. Además, `useLocalSearchParams` siempre devuelve `string` (o `string[]`), por lo que el ISBN en formato `string` evita conversiones y errores de `NaN` al parsear enteros.

Sin embargo, en una biblioteca real con libros antiguos sin ISBN o múltiples ediciones del mismo título, un **ID interno (UUID o numérico)** sería más robusto como clave primaria y `isbn` pasaría a ser un índice secundario opcional.

#### b) Estructuras: Clase `Pila` con `#items` vs array inmutable en estado

- **Qué nos dio la clase `Pila` (y `Cola`):** encapsulamiento estricto con `#items`, operaciones con semántica clara (`push`, `peek`, `encolar`, `desencolar` sin `shift()` en O(1)) y código testeable de forma aislada con Jest.
- **Qué complicó al combinarla con React:** React detecta cambios por identidad de referencia (`Object.is`), mientras que las clases tradicionales mutan su estado interno. Tuvimos que agregar el método `clonar()` para producir una instancia nueva en cada actualización de estado. Para algo simple como 3 recientes, un array `[libro, ...prev].slice(0, 3)` habría sido más idiomático en React, aunque la clase resulta muy valiosa para estudiar estructuras de datos y encapsulamiento.

#### c) Memorización (`useMemo` / `useCallback`)

- **Dónde aporta:** en `src/context/BibliotecaContext.tsx` (líneas 319–366), memorizar el objeto `valor` del Provider con `useMemo` y sus acciones con `useCallback` evita crear un objeto nuevo en cada render del Provider cuando el estado interno no cambió. También en `CatalogoScreen` y `BuscarScreen` al pasar `renderItem` a `FlatList`.
- **Dónde sería ruido:** memorizar expresiones triviales como `const hayDisponibles = disponibles > 0` o strings cortos dentro de una tarjeta pequeña; el costo de guardar dependencias y compararlas supera al cálculo original.
- **Cómo comprobarlo en lugar de suponerlo:** midiendo con **React DevTools Profiler** (grabando interacciones como activar un interruptor o scrollear el catálogo) para ver exactamente qué componentes se re-renderizan, por qué motivo y cuántos milisegundos tarda cada commit.

#### d) Datos duplicados (“ejemplares disponibles”)

**No guardamos** los ejemplares disponibles en estado; los **calculamos** en `obtenerDisponibles(libro)` (`src/context/BibliotecaContext.tsx`, líneas 159–166) a partir de `libro.ejemplares` y la lista actual de `prestamos`.

Si guardáramos tanto `ejemplaresDisponibles` como `prestamos` por separado, cualquier olvido al prestar, devolver o hidratar desde `AsyncStorage` provocaría inconsistencias (por ejemplo, devolver un libro y que siga marcando `0 disponibles`, o superar el stock original). Mantener una **única fuente de verdad** elimina esa clase entera de bugs por diseño.
