# 4.30.0 (B) · el refugio, las casas y la mochila

Rama `v4300-b` (desde main = 4.29.2). Lo que vio el usuario de esta zona (el espejo del refugio afuera; la cabaña junto al molino que no se entra) quedó resuelto y visto en el juego. 0 shaders nuevos, 0 luces nuevas.

## Arreglado

### 1. El espejo del refugio, adentro (lo vio el usuario)
- **Antes:** el espejo de fábrica se armaba **afuera**, a 3,4–6 m del refugio (`colocarEspejoDeFabrica` probaba una vuelta alrededor de la casa), y adentro no se podía poner ni mover: la regla de la 3.8.6 («adentro de un edificio del valle no se construye») frenaba toda pieza, y además el piso del refugio no contaba como piso (el terreno queda a menos de 12 cm de las tablas).
- **Ahora:**
  - `planos-espejo.js`: el espejo es un mueble que **entra en el refugio** (`entraEnRefugio`).
  - `construccion.js` (`revisarSitio`): un mueble así, con sus cuatro esquinas entre las paredes del refugio, se apoya en el **piso del refugio** y no pisa los muebles fijos (mesa, cama, hogar, estante, leña: `ref.muebles`, nuevo en `estructuras.js`, y sus choques), ni los adornos de Personalizar, ni otra pieza tuya. Cualquier otra pieza sigue sin entrar (la regla de la 3.8.6 queda igual).
  - `resolverSnap`: adentro del refugio el giro se pone **a escuadra con las paredes** (los pasos de 45° son del mundo y el refugio está girado: quedaba torcido). `fijarRotacion` nueva en la construcción.
  - `main.js`: el de fábrica se arma **adentro, contra la pared de la ventana del costado** (entre el hogar y la ventana), mirando al cuarto; si no entra, la pared derecha, la del fondo y por último afuera como antes. Se mueve con **Shift+Y** como cualquier mueble, adentro (a otra pared) o afuera.
  - **Partidas de antes:** al cargar, el espejo de fábrica que quedó afuera (a menos de 6,5 m del refugio) se **muda adentro una vez** (`mudarEspejoAdentro`). Si ya lo habías llevado a otro lado, o hay uno adentro, no se toca. Clave nueva de guardado: `personal.bruno.espejoAdentro` (saneada: sólo verdadera si vino verdadera; las partidas viejas la traen falsa).
  - En el Desafío nada de esto (no hay espejo).
- **Visto en el juego:** el espejo de fábrica queda en lx −3,07 / lz −1,25 del refugio, a la altura del piso (0,37) y a escuadra; E frente a él dice «Mirarte al espejo»; adentro rechaza cama, mesa y hogar («Choca con un mueble del refugio») y acepta el medio del cuarto y la pared del fondo; se lleva afuera y una partida con el espejo afuera lo muda adentro al cargar. Capturas (mismas vistas, main 4.29.2 contra esta rama): `hx\b4300\antes\p1-refugio-adentro.jpg` (sin espejo: estaba afuera, `p2`) y `hx\b4300\despues\p1-refugio-adentro.jpg` (el espejo contra la pared, entre la ventana y el hogar); además `hx\b4300\v2\espejo-*.jpg`.
- También se tocó `estructuras.js`, sólo para el dato `ref.muebles` (sin cambiar geometría ni choques).

### 2. La casa del molino se entra (lo vio el usuario)
- **Antes:** «de adorno por dentro: no se entra». La puerta era una tabla oscura pegada sobre la pared entera, la galería tenía una pared invisible en todo el frente (también en la escalerita), los dos escalones eran tablas sueltas sin piso y adentro no había nada.
- **Ahora (`molino-paisaje.js`):**
  - el frente tiene el **vano de la puerta** (1 × 2 m) con jambas y dintel, y una **puerta de verdad** de `puertas.js` (se abre con E, «Abrir la puerta de la casa del molino», choca cerrada y se abre hacia adentro para no barrer la galería);
  - la galería se abre en la escalerita; los **escalones son parejos** (de 0,28 m como mucho, contando el suelo al pie del último, que en la loma baja), macizos hasta el suelo y se pisan;
  - pisos que se pisan (la casa, la galería y cada escalón);
  - **adentro:** piso de tablas, forro en las paredes (tapa las juntas de las tablas de afuera), cielorraso con vigas, las cinco ventanas por dentro, un hogar de piedra contra la pared de la chimenea, cama, mesa con dos bancos, estante con frascos, arcón y alfombra; todo choca como se ve. Todo va en la misma malla de la casa: **0 llamadas de dibujo nuevas** en esa malla (la hoja de la puerta es un objeto de `puertas.js`, como las demás puertas del valle, lejos de la plaza);
  - **la regla de interiores de la 4.26.0:** la casa expone su caja (`interior`, sólo la puerta como abertura: las ventanas son opacas, como las casas prefabricadas) y `interiorDelValle` en `main.js` la usa; adentro y de espaldas a la puerta no se dibuja lo de afuera, pero la casa misma queda a la vista (es la misma malla que los cercos del grupo `molino-paisaje`: `apagarExterior` apaga los hijos del grupo menos ésa).
- **Visto en el juego:** caminando desde el frente se sube la escalerita, se llega a la puerta (aviso de E), se abre, se entra sobre el piso (y 0,82, el piso de la casa) hasta los muebles, y se sale caminando. Capturas: `hx\b4300\antes\p3..p5` y `hx\b4300\despues\p3..p5` (frente, puerta, escalones), y el interior en `hx\b4300\v1\casa-3..6-*.jpg`.

### 3. La mochila: cada objeto, ida y vuelta por el suelo
- Inventario desde el código (`armarMochila`, `ranurasZona`, `ranurasGranja`, `ranurasCocina`, `ranurasHistoria`): **95 casillas distintas**. Cada una se tira con V (de a una y entera), pasa por guardar y cargar (`sanearBultos`) y vuelve con E: la barra queda exactamente igual. Sólo la cámara y las cuatro cosas de la Historia no se tiran (a propósito). **Sin fallas encontradas** (190 idas y vueltas); queda como prueba.

## Revisado sin cambios (anotado)
- **Desafío, noches 1 a 20** (`herramientas/auditoria-4-22-a-noches.mjs`): la curva es la de la 4.22.0; la noche 5 (primer mandamás, x2,7 sobre la 4) y los saltos de 10, 15 y 20 son de diseño. No se tocó (la cadena de las noches no es de esta versión).
- **Economía, granja, puestos, colmena y panales, guardado y partidas viejas:** las pruebas existentes de esas zonas (127 que leen lo que se tocó, entre ellas granja, economía, puestos, tirar, guardado, partidas y Desafío) en verde. No se encontró plata que se duplique o se pierda; no hubo una corrida larga de Desafío ni de Relax en partida real en esta rama.
- **Otras casas y puertas:** no se recorrieron en partida real una por una en esta rama (la prioridad fueron el espejo y la casa del molino); sus pruebas de edificios, puertas e interiores (4.12.1, 4.22.0, 4.23.0, 4.26.0) siguen en verde.

## Pruebas
- Nueva: `pruebas/verificar-4-30-0-b.mjs` (en `verify:pasos`): **588 comprobaciones** con el valle de verdad (terreno, estructuras, colisiones, puertas, el paisaje del molino y la construcción) y las funciones de `main.js` corridas con un mundo de mentira (`colocarEspejoDeFabrica`, `mudarEspejoAdentro`, `enMiRefugio`…), y **15 mutaciones** (un proceso por mutación), todas detectadas.
- `pruebas/ayuda-4-0-3-valle.mjs`: gancho `globalThis.__cambiarFuente` para las mutaciones (no cambia nada si no está).
- Ajustadas a propósito: `verificar-4-0-1-molino.mjs` (por el eje de la galería ahora se entra a la casa: se frena adentro, en los muebles; por los costados la baranda sigue frenando), `verificar-4-1-espejo.mjs` (el de fábrica se anota `espejoAdentro`), `verificar-4-26-0-c.mjs` (el texto de la mutación «sin-lugares»: después del bucle va la casa del molino).
- Previas: las 127 `verificar-*.mjs` que leen los archivos tocados, en verde (`verificar-3-7-2-granja` y `verificar-4-28-0-c` fallaron una vez corriendo de a cuatro en paralelo y pasan solas dos veces: son de tiempo). No se corrió `npm run verify` completo.
- Partida real (Electron minimizado, perfil propio, con el candado): `tmp` de trabajo fuera del repositorio; resultados y capturas en `hx\b4300\`.

## Claves nuevas
- Guardado: `personal.bruno.espejoAdentro` (booleana).
- Estructuras: `T.lugares.refugio.muebles` (no se guarda). Mundo: `T.dentroRefugioPropio`, `T.ejesRefugio`, `T.pisoRefugio`.
