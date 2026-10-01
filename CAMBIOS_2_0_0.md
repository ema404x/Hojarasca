# Hojarasca 2.0.0 — Veinte mejoras

Diez para el Relax y diez para el Desafío. Todas por código, como el resto del juego:
sin sonidos ni imágenes de afuera.

## Relax

1. **Sentarse y esperar.** Los animales tímidos no se persiguen: se esperan. Cuanto más
   tiempo quieto —más rápido sentado o agachado—, menos te ven y menos te oyen. El pudú
   y el huemul se acercan solos a mirar, a una distancia prudente (7–11 m), y el juego
   lo avisa la primera vez: «Un pudú se acerca». Un temblor de un cuadro no rompe la
   paciencia; caminar un tercio de segundo, sí. (`percepcion.js`)
2. **Escuchar con atención.** Agachado (C) y quieto, el bosque baja, el oído llega de 38
   a 95 metros y el juego escribe qué canta y de qué lado: «Se oye un chucao, lejos,
   hacia el oeste». El chucao más cercano sin anotar canta antes. No pide tecla nueva:
   todas las letras ya estaban usadas. (`oido.js`)
3. **El perro como guía.** Huele a 55 m y va hacia lo que todavía no anotaste, al paso
   para que lo sigas; si te quedás atrás, te espera ladrando; cerca, se queda duro
   señalando. (`perro-guia.js`)
4. **Encargos de temporada.** Terminada la historia del valle, Ema, Nicanor, Don Ramón y
   Elsa piden cosas que sólo se pueden hacer en su estación: renovales en verano,
   truchas en el lago helado, leña y fotos de las lengas coloradas en otoño, la vuelta
   de la trochita en la nieve. Cuentan lo nuevo desde que aceptás, no lo de antes.
   (`encargos-temporada.js`) De paso: los encargos de Elsa decían que eran de Nicanor.
5. **La huerta.** Un cantero nuevo (O → Exterior). Se siembra con frutillas o calafates
   que juntaste, crece sólo mientras tiene agua (la lluvia riega), no se muere si te
   olvidás, y rinde cuatro o cinco por cada una sembrada. (`huerta.js`)
6. **La escarcha.** La niebla de la mañana ya estaba desde la RC18; lo nuevo es la
   helada: se forma de madrugada en las noches despejadas y calmas de otoño e invierno,
   blanquea el pasto abierto y las puntas de las matas, cruje al pisarla (y los
   animales la oyen), se derrite a media mañana, y el diario la anota. (`escarcha.js`)
7. **La lluvia sobre el techo.** Cada gota es un golpe del motor de impactos, con el
   material del techo: la chapa repiquetea aguda, las tablas tamborilean sordo, la lona
   de la carpa suena al lado de la oreja. Dos materiales nuevos (chapa y lona). Los
   pasos sobre madera también son golpes de verdad: la tabla y el hueco de abajo.
   (`techo-lluvia.js`, `impactos.js`)
8. **Adentro suena a adentro.** Cinco espacios —bosque, alero, carpa, adentro, cueva—,
   cada uno con cuánto viento, cuánta lluvia y cuántos agudos deja pasar. Con rachas,
   adentro cruje un tirante y en la carpa flamea la lona.
9. **El cielo cambia.** La luna tiene fases (un ciclo cada ocho días) y se dibuja como se
   ve desde el sur: creciendo es una C, con la luz a la izquierda. Con luna nueva la
   noche es más oscura y aparece la Vía Láctea. En verano, una noche de cada seis llueven
   estrellas desde el norte, como las Gemínidas vistas desde la Patagonia. La luna llena
   y la lluvia de estrellas se anotan en el cuaderno. (`cielo-noche.js`)
10. **El cuaderno como lámina.** «Guardar como lámina» arma una hoja de 2400×1600 como
    las de los naturalistas: papel, las fotos del álbum pegadas con cinta, dieciséis
    especímenes dibujados a tinta y aguada con su nombre científico, la última página
    del diario y el sello. (`lamina.js`, `lamina-dibujo.js`)

## Desafío

1. **Los ojos reflejan la linterna.** Como los de un zorro en la ruta: dos puntos que se
   prenden en la oscuridad cuando el haz los toca, hasta 1,6 veces más lejos de lo que
   alumbra la linterna. Sólo si te mira: el reflejo vuelve hacia la luz.
2. **El acecho.** Rastreadores y saltadores ya no vienen derecho. Si los mirás, se frenan,
   rodean a unos veinte metros o se esconden detrás de un árbol, asomados. Si les das la
   espalda, cargan, y se oyen los pasos que se acercan.
3. **El perro avisa.** Gruñe, duro y mirando para ese lado, hacia el invasor que todavía
   no ves; cuando ya está cerca, ladra. Lo que ya tenés a la vista no te lo marca.
4. **El asedio.** Si te encerrás, no te rompen la pared de una: primero la tantean
   —arañan, prueban la puerta— y recién después golpean. El bruto no tantea.
5. **Se apagan las luces.** Una noche especial nueva: las antorchas tiemblan y se apagan
   de a una, sin que se vea quién. Las tres especiales de siempre salen con la misma
   frecuencia que antes.
6. **Sonidos escritos con dirección.** «[gruñido lejos · noroeste]», «[respiración encima
   · detrás tuyo]». Lo repetido se cuenta en vez de apilarse. Viene prendido; se apaga en
   Ajustes → Accesibilidad.
7. **La mezcla se agacha.** Cuando algo chilla al lado, el bosque y la música bajan de
   golpe y vuelven despacio, para que el grito se escuche entero.
8. **El bestiario.** Una pestaña nueva en el cuaderno del Desafío: cada invasor que ves de
   cerca queda anotado; peleando se aprende cómo se mueve, y al tercero abatido, su punto
   débil.
9. **Las noches después.** Con el nido caído el Desafío termina, como siempre. Pero la
   pantalla final tiene ahora un botón: «Seguir peleando: las noches después». Son cinco
   noches de invasores mutados —venas de otro color, más vida, más daño, más rápidos, y
   se curan si los dejás respirar—. Es optativo: el que elige quedarse en el valle no se
   entera.
10. **La vibración del mando.** Un golpe fuerte en las manos cuando te pegan, un
    cosquilleo cuando algo chilla cerca, el paso del jefe, los derrumbes. Se apaga en
    Ajustes.

## Arreglos que salieron en el camino

- **El invasor fantasma.** De noche, en las fotos de prueba, los invasores salían
  blancos. No era la placa de video: era el perro. Cada mordida —un poquito de daño en
  cada cuadro— prendía el destello entero, y el invasor quedaba blanco todo el rato que
  lo estaban mordiendo (los pozos con estacas hacían lo mismo). Ahora el destello va con
  el tamaño del golpe.
- **El bestiario tapaba la campana.** En la primera versión cada ficha nueva daba su
  aviso, y en medio de una oleada se ven cuatro invasores en un segundo: los cuatro
  avisos empujaban afuera el de la campana (la pila de avisos es de cuatro). Lo encontró
  la partida real del Desafío premium. Ahora el bestiario da un solo aviso cada veinte
  segundos, con todo lo que se anotó en el medio.
- **Traducción de los huecos.** El traductor al inglés ahora también traduce lo que cae
  en el hueco de un molde: «Se oye {0}, {1}, hacia el {2}.» sale entero en inglés si cada
  pedazo está en el diccionario. Sólo usa moldes con palabras propias, para que uno como
  «{0} {1}» no se trague todo.

## Lo que no cambió y conviene saber

- **La brújula y el sol no coinciden** (esto viene de antes): según la brújula, el sol
  sale por el oeste y cruza el cielo del sur. Todo lo nuevo sigue a la brújula. Quedó
  anotado como tarea aparte porque tocar el sol cambia toda la luz del juego.

## Verificación

- `npm run verify`: todo en verde, con dos pruebas nuevas (`verificar-relax-2.mjs`,
  `verificar-desafio-2.mjs`) y la de idioma ampliada.
- Partidas reales en Electron: `humo-relax-2.cjs` (las diez del Relax) y
  `humo-desafio-2.cjs` (las diez del Desafío), más la suite de siempre.
- Escuchado y mirado por mí en archivos: los WAV de la lluvia sobre chapa, tablas y lona,
  los crujidos, los pasos; las fotos de la luna en tres fases y de una estrella fugaz; la
  lámina de prueba.
- **No verificado:** la vibración en un mando de verdad (no hay mando en esta máquina: se
  prueba que el juego decide el pulso y llama a la API), y los cuadros por segundo en una
  placa de video real.
