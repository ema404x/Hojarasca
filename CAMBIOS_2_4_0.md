# Hojarasca 2.4.0 — Las estructuras

Sobre la 2.3. Doce cosas para lo que construís: cuatro que mejoran lo que ya había y ocho
piezas nuevas. Todo generado por código, como siempre.

## Lo que ya tenías, mejor

1. **La casa abriga.** Hasta ahora la helada de la 2.3 sólo miraba si dormías a menos de
   siete metros de un fuego: dormir en tu casa sin fuego era igual que dormir en el pasto.
   Ahora cuenta la casa que armaste (`abrigo.js`, con el estado de habitación que
   `construccion.js` ya calculaba):
   - con la estufa o el hogar prendidos, el calor llega por los ambientes conectados y
     dormís calentito aunque el fuego esté en otro cuarto;
   - una casa cerrada y techada sin fuego te deja fresco, no helado; con la manta, bien;
   - la carpa queda en el medio.
2. **El confort se nota.** Una buena noche en una casa con confort 6 o más (catre,
   alfombra, farol, estufa…) te deja *descansado*: tres horas caminando un 8 % más rápido
   (cuatro y media con catre y confort 8). Es el espejo del entumecido de la 2.3. El
   diario lo anota.
3. **Tu casa se ve viva.** Con la estufa o el hogar prendidos sale humo de *tu* chimenea
   (el mismo humo que el refugio y las cabañas). De noche, las ventanas de las paredes que
   tienen el farol o el fuego adentro se ven encendidas desde afuera: una sola malla
   instanciada para todas, que se rehace cada dos segundos (`casa-viva.js`,
   `ventanas-mundo.js`).
4. **Teñir.** Con los planos abiertos (O), **T** al lado de una pared, un piso o un techo
   tuyo terminado lo tiñe: calafate (3 frutos, violeta), ocre (1 piedra), cal (2 piedras,
   blanco) o de vuelta a la madera natural. Si no te alcanza para uno, pasa al siguiente.
   El tinte corre los colores de la pieza hacia el nuevo sin perder las vetas, y se guarda
   con la obra (`tintes.js`). Fuera de los planos, T sigue armando la carpa.

## Piezas nuevas

5. **Galería con alero** (Exterior; 4 troncos, 6 tablas). Cuatro postes y un techo a una
   agua. Va *encima* de lo que ya armaste: abajo no llueve. El tendal que está abajo seca
   con lluvia, la leña que llevás no se moja, y la lluvia suena a techo.
6. **Pared con hogar de piedra** (Refugios; 12 piedras, 4 tablas, 1 tronco). Encaja como
   cualquier pared modular. Se prende con F, calienta la casa como la estufa (confort +2)
   y echa humo por su chimenea, arriba del techo.
7. **Horno de barro** (Trabajo; 8 piedras, 1 tronco). Con un tronco y E hornea **pan
   casero** (dos medidas de harina → 3 panes) o **empanadas** (harina, un huevo y una papa
   → 4), eligiendo lo que tengas menos. Se guardan en la mochila y la feria tiene tres
   ofertas nuevas que los compran (yerba, tablas y troncos, lana).
8. **Invernadero de nylon** (Trabajo; 4 troncos, 6 tablas). Arcos de madera con nylon, que
   van encima de los canteros. En el Relax, en invierno, cada día hiela: lo sembrado
   afuera se atrasa un día (el calafate, que es de acá, aguanta). Lo que está bajo el
   invernadero sigue creciendo. La helada sólo corre cuando el día cambia jugando, nunca
   al cargar una partida.
9. **Embarcadero** (Exterior; 8 tablas, 4 troncos). El arranque en la orilla y la punta
   sobre el agua honda del lago (si lo ponés al revés te pide que lo gires con R). Las
   tablas se caminan, desde la punta se pesca, y el kayak queda amarrado al costado; si
   te lo llevaste lejos, E en las tablas lo trae.
10. **Buzón** (Exterior, sólo Relax; 2 tablas, 1 tronco). Con buzón, las cartas del tren te
    las dejan en casa: E lo abre y la carta se lee ahí, igual que con Ercilia (que también
    te las sigue dando). Los pedidos de fotos se mandan desde el buzón.
11. **Bebedero y corral propio** (Exterior, sólo Relax; 2 troncos, 2 piedras). Un bebedero
    con cuatro tramos de cerco alrededor (a menos de 7 m) es un corral: Don Ramón te trae
    dos ovejas. Pastan adentro, se esquilan con la misma tijera y el vellón les vuelve a
    crecer como a las del galpón. Si mudás el bebedero, se mudan (`corral.js`).
12. **Adarve** (Defensa, sólo Desafío; 4 troncos, 6 tablas). Una pasarela a dos metros con
    su escalera, para ponerla detrás de la empalizada y tirar por encima. No se puede
    poner donde el pie de la escalera quedaría colgando.

## Arreglos que aparecieron en el camino

- **La escalera de la torre de vigía no se podía subir.** Nadie la había subido
  caminando: la prueba ponía al jugador arriba de un salto. El cuerpo (35 cm de radio)
  tocaba el peldaño siguiente, que le hacía de techo, y el borde del piso de arriba
  también. Ahora los peldaños son abiertos (`sinTecho`), aceptan un paso de hasta 60 cm,
  la escalera es más ancha hacia afuera y el hueco de la baranda cubre todo el último
  peldaño. La prueba nueva la sube de verdad y pasa a la plataforma.
- La física declarativa de las piezas (`fisica(h)`) puede pasar banderas a una
  plataforma (`h.plataforma(..., { sinTecho: true })`).
- Las recetas que piden más de una medida de harina decían «2 harina del almacén»: ahora
  «2 medidas de harina del almacén».

## Inglés

Tanda Q (`src/idioma-en-q.js`): las piezas, los avisos, las notas, el diario, la guía, el
horno, la feria y el buzón. El aviso de la carta que llega al buzón se arma, para cada
carta, a partir del de Ercilia que ya estaba. Revisado que la tanda no pise ninguna
traducción anterior. Prueba nueva: `verificar-idioma-2-4.mjs`.

## Verificación

- `npm run verify`: 102 pasos, todos en verde. Nuevos: `verificar-2-4.mjs` (la lógica de
  las doce y, con Three en una vm, las obras de verdad: el embarcadero en una orilla, las
  plataformas del adarve, lo que cubre la galería, el tinte en los colores) y
  `verificar-idioma-2-4.mjs`. Ajustadas: la prueba que funda cada plano en tierra plana y
  seca salta el embarcadero (que no va ahí), la del correo acepta el buzón, y la de la
  feria sabe dar pan y empanadas.
- Partidas reales en Electron: nueva `humo-2-4.cjs` (36 comprobaciones con teclas de
  verdad): teñir con O y T, prender la estufa con F y ver el humo y la ventana de noche,
  hornear con E, leer una carta en el buzón, el tendal abajo de la galería, la helada con
  y sin invernadero, el embarcadero en una orilla real con el kayak, el corral y la
  esquila de una oveja propia, que todo se guarde, y en el Desafío subir caminando el
  adarve y la torre de vigía.
- Las 24 partidas reales, todas en verde. La de la 1.11 que cambia en la feria ahora
  también lleva pan y empanadas (las ofertas nuevas pueden tocar ese día).
