# 1.11.0 — Lo que se produce, se usa

Diez cosas de una lista de diez. La 1.10 puso al Relax a producir —verdura, lana,
huevos— más de lo que el juego sabía usar; esta tanda le da salida a todo eso, suma
compañía (visitas, el perro que rastrea, los compañeros que obedecen) y resuelve algo que
pedía el que juega en dos computadoras: que la partida lo siga sola.

## Relax

### 1. El telar
Pieza nueva, **Telar de palos** (O → Trabajo, 3 tablas y 2 troncos). Con E teje lo que
toca: **la manta** (4 vellones) si todavía no la tenés —la misma del almacén, la que deja
dormir en cualquier lado— y si no **ponchos** (3 vellones), que no se gastan: se llevan a
la feria. La lana sale de la mochila y del acopio si está cerca, como al construir.
(`src/telar.js`)

### 2. La cocina de a dos
Tres recetas que piden **dos ingredientes**: guiso de papas y habas, tortilla de papas
(huevos y papas) y torta frita (harina y un huevo). E junto al fuego cocina primero lo que
nunca cocinaste. **Harina** nueva en el almacén (se cambia todas las veces que haga
falta). Las tres suman a "La mesa completa". Las recetas salieron de `main.js` a un módulo
propio. (`src/cocina.js`)

### 3. La feria de la estación
Cada cinco días, de nueve a seis, hay **un puesto con toldo a rayas junto al andén de la
Estación del Valle**. Cuatro cambios del día —de doce posibles, distintos en cada feria y
iguales si recargás— que convierten lo que producís (verdura, huevos, vellones, ponchos) en
material, semillas, yerba, harina o alguna cosa del almacén. Cada cambio, una vez por
feria. Se elige con el número o con un clic, como el almacén. Aviso a la mañana, marca en
el mapa ese día. (`src/feria.js`, `src/feria-mundo.js`)

### 4. El gallinero
Pieza nueva, **Gallinero** (O → Trabajo, 4 tablas y 2 troncos), con cuatro gallinas que
picotean alrededor de día, se apartan si pasás corriendo y de noche se meten adentro.
Ponen cuatro huevos por día hasta llenar el nidal (diez); con E se juntan. Todas las
gallinas de todos los gallineros van en una sola malla instanciada.
(`src/gallinero.js`, `src/gallinero-mundo.js`)

### 5. Rastrear con el perro
Mirándolo de cerca, **E le pide que rastree**: olfatea, elige un rastro —primero el de un
animal de a pie que todavía no anotaste— y va adelante con la nariz al piso, esperándote
si te quedás atrás. Cuando lo encuentra lo marca como siempre. En la nieve se ven las
pisadas que sigue. E de nuevo, mirándolo, lo llama. (`src/rastreo.js`)

### 6. Visitas a tu casa
Con una **mesa de campo y dos asientos alrededor** (sillas o bancos), cada tres días a la
tarde un vecino —se turnan Don Ramón, Nicanor, Ema y Ercilia— viene caminando, se queda
junto a la mesa, charla y deja algo (yerba, troncos secos, semillas, harina). A la noche,
cuando te alejás, vuelve a su casa. (`src/visitas.js`)

### 7. Pedidos de fotos por correo
Cuatro cartas nuevas **piden una foto del álbum**: una revista de Buenos Aires (el huemul
con poca luz), el ramal para su almanaque (la trochita echando humo), Doña Amalia (el
galpón con el molino) y el naturalista (un cóndor planeando). La carta de tu hermana, que
ya pedía una foto del lago, ahora se puede contestar. Sacás la foto —sirve aunque ese
desafío ya estuviera en el álbum—, se la das a Ercilia y te paga lo que dejaron.
(`src/correo.js`)

## Desafío

### 8. Órdenes a los compañeros
Mirando a Don Ramón o a Ema, **E les cambia la orden**. Ramón: arreglá lo roto (lo de
siempre) · vení conmigo (te sigue y arregla lo que se rompa cerca tuyo) · cuidá el portón.
Ema: quedate en la base · vení conmigo (tira desde donde esté) · cuidá el portón. Siguiendo
apuran el paso y si te alejás mucho te alcanzan. La orden se guarda. (`src/desafio-ordenes.js`)

### 9. El cimiento de piedra
En el taller (K → Base), **Echar cimiento de piedra** (3 piedras) sobre la empalizada o el
portón de madera más cercano: una hilera de piedras al pie, de los dos lados, y **el
excavador ya no pasa por debajo** (se pone a romper, como los demás). Los pozos que ya
estaban abiertos hay que taparlos igual. (`src/desafio-cimiento.js`)

## Los dos modos

### 10. La partida en una carpeta sincronizada
En **Partidas guardadas**, sólo en la versión de escritorio: **Elegir carpeta…** (una de
OneDrive, Dropbox o Google Drive). El juego deja ahí una copia de la partida —el mismo
archivo que "Exportar"— cada dos minutos mientras jugás, al dormir y al cerrar. Al abrir
el juego en la otra computadora, si la copia de la carpeta es más nueva, pregunta con cuál
seguir.

Dos cuidados: **nunca pisa una copia más nueva** que la que esa computadora conoce (si
dejaste el juego abierto en una y jugaste en la otra, al cerrarla no borra lo de la otra,
y avisa), y **una copia que ya viste no se vuelve a ofrecer** aunque los relojes de las dos
máquinas no coincidan. Electron sólo escribe y lee archivos de nombre fijo adentro de
`<carpeta>/Hojarasca`. (`src/sincronia.js`, `sincronia-main.cjs`)

## Arreglos

- **El almacén no dejaba cambiar del 5.º en adelante.** Los números del 5 al 9 elegían
  casilleros de la barra aunque el almacén estuviera abierto: la yerba, las semillas, la
  tijera y la harina no se podían cambiar con el teclado (las pruebas de humo ponían las
  cosas a mano y no lo veían). Ahora los números del 1 al 9 y el clic eligen el cambio.
- **La feria corría los números** si te llevabas una cosa única (la mosca, el farol): la
  lista se recalculaba sin esa oferta y entraba otra. Lo que cambiaste hoy queda en su lugar.
- "1 ponchos", "1 huevos del gallinero": de a uno se dice en singular.

## Inglés
Tanda L (`src/idioma-en-l.js`): todo lo nuevo, con los textos armados por combinación
(ofertas de la feria, animales, remitentes, órdenes) para que no queden huecos en castellano.

## Pruebas
- Gate `npm run verify`: 94 pasos (11 nuevos: gallinero, cocina, telar, feria, rastreo,
  visitas, pedidos de fotos, órdenes, cimiento, sincronía, idioma 1.11).
- Partidas reales en Electron: `npm run verify:campo-1-11` (44 pasos, Relax: el almacén
  con las teclas, gallinero, telar, cocina, feria, perro, visita, pedido de fotos, guardado),
  `verify:desafio-1-11` (17: cimiento por el taller, excavador, órdenes con E, guardado) y
  `verify:sync` (20: el preload real y los manejadores de Electron con una carpeta temporal
  haciendo de OneDrive; las dos computadoras, el conflicto y la oferta).
