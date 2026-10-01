# Hojarasca 2.6.0 — El fortín

Sobre la 2.5 (el arsenal). Dieciocho cosas para la base del Desafío: dieciséis piezas
nuevas en los planos (O → Defensa) y dos cosas que se hacen con E sobre las paredes.

## Paredes y pasos

1. **Pirca con troneras** (12 piedras, 1 tronco). Se encadena con la pirca. Por las dos
   aspilleras (entre 1 y 1,7 m) pasan tus flechas, virotes, piedras y el rayo de la
   pistola; lo de ellos no, y lo tuyo tampoco por abajo o por arriba.
2. **Puente levadizo** (4 troncos, 6 tablas, 2 piedras). Un tablero de 3,5 m con bisagra
   y manivela, para el foso. Con E lo bajás (se camina, los invasores cruzan) o lo subís
   (es una pared: tienen que romperlo). Queda como lo dejaste al guardar.
3. **Embudo de empalizada** (8 troncos). Dos alas en V abiertas hacia afuera: los que
   llegan por delante se encauzan hacia la garganta. Poné ahí una trampa o un portón.
4. **Contrafuerte de piedra** (8 piedras). Las paredes, portones y pircas a menos de
   3,2 m aguantan un 30% más, y el excavador no puede pasar por debajo de ellas.
5. **Muro de hielo** (E sobre una pirca, de día, en invierno). La pirca helada aguanta
   un 40% más y el saltador no la puede trepar, mientras siga el invierno.
6. **Tejado de lajas** (8 piedras, 4 troncos). Se pone encima de tus antorchas o de tu
   puesto: los voladores no pueden bajar a apagarlas ni a picarte mientras estés abajo.
7. **Pasarela colgante** (6 tablas, 2 troncos). Seis metros de tablas a la altura del
   adarve (2 m): une adarves y torres para moverte por arriba.

## Lo que pega

8. **Resina hirviendo** (E en el adarve o el muro almenado). De día se carga con un
   tronco (dos calderos); de noche, E la vuelca: 55 y fuego a los que están abajo.
9. **Catapulta de piedras** (6 troncos, 4 tablas, 4 piedras). Tira sola cada seis
   segundos al grupo más apretado entre 10 y 46 m (80 en el centro, radio 3,5). Se carga
   con piedras (E, hasta diez). No le tira a los voladores altos.
10. **Troncos colgantes** (5 troncos, 1 tabla). Cuando un invasor pasa por abajo, se
    suelta el tronco: 90 a todos los de alrededor y los tira. E lo vuelve a colgar.
11. **Cerco de cristal** (2 cristales, 2 troncos). Da una descarga (12) cada poco al que
    lo toca y lo frena. Cada noche gasta un cristal para cargarse.
12. **Rampa de troncos** (3 troncos, 3 tablas). E carga tres troncos, E otra vez tira de
    la palanca: ruedan cuesta abajo 26 m y aplastan (60) a los que encuentran.

## Trampas y engaños

13. **Trampa de lazo** (tronco, tabla). El primero que la pisa queda colgado cinco
    segundos, indefenso, y recibe un 30% más. Los grandes la arrancan. E la vuelve a armar.
14. **Abrojos de cristal** (un cristal, dos piedras). Van a la mitad y se lastiman; se
    gastan de a poco. De día, E los junta y devuelve lo que costaron.
15. **Señuelo** (tronco, tabla). Si vos estás lejos, los invasores a menos de 25 m van
    por él y lo atacan: ponelo delante de tus trampas.
16. **Espejo del faro** (2 cristales, 2 tablas, tronco). Con una antorcha prendida al
    lado, barre un haz: encandila (no apuntan, van a la mitad) y deja a la vista a los
    oscuros.

## Para los tuyos

17. **Puesto de tirador** (8 piedras, 2 tablas). Ema, con la orden "quedate en la base",
    se aposta acá: tira más lejos (40 m), más seguido y un 30% más fuerte.
18. **Armero** (5 tablas, 2 troncos). Con E rehace de una la munición de tus armas
    (flechas hasta 24, virotes hasta 12, boleadoras hasta 6) con lo que tengas. Al lado
    se fabrica como en un banco de trabajo.

## Cómo está hecho

- `desafio-fortin.js`: números y reglas, puro. `desafio-fortin-mundo.js`: lo que hace
  cada pieza de noche, la tecla E, el puente, el haz, la rampa, el hielo.
- `desafio.js`: `obraEnPunto` sabe de los tiros propios (troneras y lo que está en alto)
  y del puente bajado; el embudo se mide por sus alas y no por una caja.

## Arreglos que aparecieron en el camino

- **Los invasores se reciclan, y algunos volvían con lo de su vida anterior.** El
  congelado de la lanza de hielo (2.1), la mordida del perro y el foso quedaban pegados
  al invasor que se reusaba; con el arsenal de la 2.5 también el fuego, la duda del
  cuerno, el humo y el arpón. Ahora se limpia todo al bajar.
- Un invasor quieto por el arsenal (dudando por el cuerno) no sentía las trampas: ahora
  el fortín actúa igual.
- `OctahedronGeometry` no está en el three local: el cerco de cristal habría roto el juego.
- Las categorías nuevas del taller (2.5) van al final: las de siempre no cambian de lugar.

## Revisión del arsenal y del fortín

Una pasada de bugs sobre la 2.5 y la 2.6, antes de cerrar la versión.

**Arsenal (2.5)**
- El virote que atraviesa torcía su camino después del primer golpe (el tramo del
  proyectil compartía vector con el daño). Y si el primero moría del golpe, no seguía:
  ahora mata al chico y ensarta al de atrás.
- El arco tensado disparaba al soltar aunque ya hubieras cambiado de arma o abierto la
  mochila o el taller; lo mismo la ráfaga de la ballesta de repetición. Ahora se suelta
  la cuerda sin tirar y la ráfaga se corta.
- Con el escudo, el clic derecho le ganaba al disparo cargado de la pistola y al hacha
  (que tala con clic derecho). Ahora primero va el ataque alterno del arma.
- El arpón arrastraba al invasor a través de las paredes: contra una obra, se suelta.
- El arpón tenía una cadencia que no se usaba; ahora es la de la tabla.
- Cada bengala tiene su luz propia (antes al apagarse una se apagaban todas de golpe).
- La munición nueva, con el mismo tope en el taller y en el guardado (99).
- Con el mando, el botón de bloquear cambia de flecha cuando tenés el arco y el carcaj.
- Menos trabajo por cuadro: las bengalas se cuentan al actualizarlas, no una vez por
  invasor.

**Fortín (2.6)**
- Un puente levadizo roto o movido dejaba una pared (o una plataforma) invisible en su
  lugar hasta volver a abrir la partida.
- Bajo el tejado de lajas o la pasarela colgante eras inmune: los invasores de a pie no
  te pegaban y se ponían a romper el tejado. Ahora se pasa por abajo, para todos.
- El lazo y los troncos colgantes eran cajas: frenaban tus flechas contra el colgado (y
  el +30% no servía) y los invasores rompían los troncos en vez de pasar por abajo.
- El embudo metía contra la parte de afuera de sus alas a los que venían de costado:
  ahora sólo encauza a los que están dentro de la V.
- La catapulta, los troncos y la rampa ya no se gastan en los que todavía bajan de la
  nave.
- La E del puente, los abrojos y la rampa ya no le ganan a una puerta que tenés más
  cerca; el armero se ofrece sólo si puede rehacer algo.
- Los troncos de la rampa chocan con árboles y piedras, y con sus puntas.
- Unos abrojos gastados, una sola nota; el que muere colgado cae al suelo; el hielo se
  rehace si la pirca pasa a muro almenado; sin espejos no se piden las antorchas cada
  cuadro; lo que se rompe no queda en memoria.

## Verificación

- `npm run verify`: 105 pasos en verde. Nueva: `verificar-2-6.mjs`.
- Partidas reales: nueva `humo-2-6.cjs` (39 comprobaciones: cada pieza armada y puesta a
  trabajar contra invasores, la tecla E, y que el fortín vuelva igual al abrir). La de
  caos ahora usa todo el arsenal y arma piezas del fortín al azar.
