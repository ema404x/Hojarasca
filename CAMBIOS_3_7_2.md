# Hojarasca 3.7.2 — La cocina

Tercera de las 5 versiones de `PLAN_3_7.md`. Sólo Relax; nada se echa a perder; sin economía nueva (trueque y
servicios). Dos equipos: la cocina (rama `v372-cocina`) y la granja (rama `v372-granja`).

## La cocina
- **Tres estaciones**, obras nuevas en O → Trabajo: **parrilla con cruz** (asador criollo: la cruz inclinada hacia el
  fuego y las brasas al costado; parrilla para los chorizos; **techito** opcional de chapa), **horno de barro** (el de
  la 2.4, rehecho) y **cocina a leña** (adentro del refugio o donde quieras). Y la **alacena**.
- **Cocinar en pasos con tiempo**: E abre las recetas; con algo al fuego, E hace el paso que sigue y el aviso dice qué
  falta. El primer paso prende el fuego y aparta todo (nada falta a mitad de camino).
- **Recetas**: asado a la cruz, cordero al asador, pan casero, empanadas, mermeladas (frambuesa, cereza, ciruela,
  manzana, pera, grosella, frutilla), dulce de leche, locro, chocolate caliente y curanto en olla. Las de antes, al
  fuego, siguen igual. De entrada se saben asado, pan y empanadas; las demás las enseña un vecino (Don Ramón el
  cordero, Gladys la mermelada, Nélida el dulce de leche, la abuela Herminia el locro, Ceinwen el chocolate, Ernesto
  el curanto) o salen "a ojo" si tenés todo.
- **Comer**: asado, cordero, locro y curanto dan 3 h de buen paso y sacan el frío; el chocolate saca el frío.
- **Ingredientes**: el almacén de Ercilia cambia azúcar, sal gruesa, cacao, maíz pisado y porotos; los vecinos,
  una vez por día, carne, leche, fruta y mariscos ("Para la cocina…" en la charla); y lo que produce la granja.
- **Lluvia**: sin techito la parrilla no prende; si se larga a mitad, se frena sin perder nada.
- **El humo del asado** se ve de lejos y trae hasta 3 vecinos con el rato libre: comen una porción (suma amistad) y
  se quedan de sobremesa. **El perro roba un chorizo** (una vez por día) y sale corriendo.
- **La alacena** muestra lo que tenés; **el recetario** va en el cuaderno (pasos, tiempos, de dónde sale cada cosa y
  quién te la enseñó).
- API para el vagón comedor de la 3.7.3: `cocinaJuego.registrarMovil(...)`.

## La granja
- **Vaca lechera** (overa negra o colorada, ubre, cencerro, ternero al pie): con un **tambo con comedero**, Don Ramón
  la cambia por 10 troncos y 6 tablas. **Se ordeña con E cada mañana** (5 a 12): 4 litros. En invierno come fardos
  del comedero (Don Ramón cambia 4 por 2 troncos). Un ternero por primavera (tope 2).
- **Corderos**: con una **paridera** junto al corral de la 2.4, las ovejas crían al empezar el año (tope 4).
- **Chanchos**: con un **chiquero**, Ayelén cambia una chancha preñada por 2 vellones y 4 huevos. Se les dan sobras
  en la batea con E; camadas de 2 a 4 lechones (tope 6).
- **Frutales**: manzano, peral, ciruelo y cerezo (plantines de Gladys), frambuesa y grosella (matas de Inés), en un
  hoyo con tutor. Florecen en primavera, dan fruta en verano y otoño (una cosecha por año, con E), hojas coloradas en
  otoño y pelados y sin fruta en invierno.
- **Carnear, sin mostrar nada**: E, E (confirma), fundido; Don Ramón se lo lleva y al otro día llega la carne.

## Módulos
Cocina: `cocina-pasos.js` (puro), `cocina-juego.js`, `cocina-mundo.js`, `planos-cocina.js`. Granja: `granja.js`
(puro), `granja-juego.js`, `granja-mundo.js`, `planos-granja.js`. Pruebas: `verificar-3-7-2-cocina.mjs` (354),
`verificar-3-7-2-granja.mjs` (234), `humo-3-7-2-cocina.cjs`, `humo-3-7-2-granja.cjs`.

## QA
- `npm run verify`: 154 de 154.
- Partidas reales: las 62 en verde (de a 4 en ~25 min: 61 a la primera; humo-desafio-premium, la nave nodriza, depende del tiempo con la PC cargada y pasó sola).

## Para confirmar con el usuario
- La fruta que no se junta se pierde al llegar el invierno; precios de la vaca, la chancha y los plantines; la
  carneada la hace siempre Don Ramón; el curanto va en olla; de entrada se saben asado, pan y empanadas; los
  invitados comen una porción cada uno.

## Queda para después
- La cara de la vaca algo cuadrada; el cordero con patas finas; el pasto alto tapa a los animales en el corral;
  el costillar en la cruz muy estilizado (el cordero se lee bien); poca luz adentro del refugio.
- El vagón comedor (3.7.3) tiene que dibujar el fuego y la olla con la API móvil.
- Inglés: todo lo nuevo sólo en castellano. Medir en la PC del usuario.
