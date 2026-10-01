# Hojarasca 2.8.0 — Personalización

Todo se elige en el panel **Personalizar**: F5, o el botón de la mochila, de la pausa o de
la pantalla de inicio. Lo elegido se guarda con la partida, viaja con la exportación y la
sincronía, y pasa a una partida nueva. Una partida vieja arranca con lo de siempre: nada
cambia si no tocás nada.

## Vos
- **Tu personaje y tu ropa:** piel, pelo, peinado y contextura; campera, poncho, gorro de
  lana, bufanda, guantes y botas, en colores. El poncho se destraba al tejerlo, las botas
  de goma en el almacén y tres tintes con el cuaderno. Poncho + gorro + bufanda (o
  guantes) abrigan de verdad en una noche fría sin fuego. Se ve en las manos, en tu sombra
  y en el modo foto.
- **Tu interfaz:** color del aviso, tamaño de letra (sobre el de accesibilidad), mira
  (punto, cruz, círculo o nada), brújula sí o no, y modo mínimo.
- **Tu bandera:** dos o tres colores, cuatro diseños y ocho íconos; flamea en el refugio,
  en las torres del fortín y en la pantalla de victoria.
- **Tu partida:** estación, clima, dificultad, cantidad de animales y vecinos sí o no para
  la partida nueva; se guardan como recetas con nombre.

## Tu casa
- **Refugio y casas:** paredes, puertas y techo; tus casas todas juntas o una por una.
  Adentro: alfombra, rincones, alféizar, mesa y dos cuadros con tus fotos. Afuera: faroles,
  cercos y el mástil de la bandera.
- **Fortín con estilo:** madera rústica, con pie de pirca o pintada; estandartes y fuego de
  cuatro colores. Sólo cómo se ve: la fuerza no cambia.
- **Jardín:** cinco piezas nuevas (O → Exterior): cantero, cantero redondo, maceta, cerco
  vivo y camino de piedra, con tu paleta de flores.

## Los tuyos
- **Perro:** pelaje, manchas, collar con chapita, pañuelo y nombre. Trucos que activás:
  sentarse cuando te quedás quieto, traerte un palo, avisar de noche.
- **Caballo:** siete pelajes (zaino, colorado, tostado, bayo, tordillo, moro, overo),
  montura, matra, riendas, alforjas y nombre.
- **Kayak:** color, nombre pintado en la proa y banderín.
- **Trochita:** colores de los coches y la locomotora, placa con su nombre y seis silbatos.
- **Armas y herramientas:** mangos con grabados, plumas de color en flechas y virotes,
  placa con nombre en la ballesta, cintas en la lanza; lo forjado se ve distinto. Sólo
  cómo se ve.
- **Música:** un gramófono en la mesa del refugio (E cambia el disco). Un vals de entrada y
  seis partituras escondidas por el valle.
- **Cuaderno:** tapa, elástico, tinta, y sellos, notas y fotos pegados donde quieras.

## Arreglos
- La manta flotaba en el medio del refugio, la leña que juntás quedaba bajo el piso, la
  caña atravesaba la mesa y los frascos quedaban fuera del estante: usaban un plano viejo
  del interior.

## Cómo está hecho
- `personalizacion.js` (registro puro) y `personal-todo.js`; una sección por módulo
  `personal-*.js`, puros al importarse; lo que se ve en `*-mundo.js`.
- Pruebas: `verificar-2-8-personal/casa/compas.mjs` en el gate; `humo-2-8*.cjs`.
