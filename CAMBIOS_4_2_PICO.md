# 4.2, parte 1: el pico

Para picar piedra ya no alcanza el hacha: hace falta el **pico** (la tecla sigue siendo la H). El hacha se queda con los árboles y los troncos. Rama `v42-pico` (sale de `v405-pruebas`). No se subió la versión.

## Qué cambió

- **Ítem `pico`** en `progreso.cosas` (`tienePico()` en `main.js`). `objetivoHacha()` ahora mira hacha y pico: las rocas (`roca`) se pican sólo con pico; árboles y troncos, sólo con hacha. Con sólo el pico, los troncos y los árboles no se cortan.
- **Sin pico**: H frente a una roca no da piedra y avisa «Te falta el pico» con las vías para conseguirlo (el herrero de la aldea, o el almacén, con Tab para pasar de página). El cartel de la tecla dice «Para picar piedra hace falta el pico». Sin hacha ni pico, sigue diciendo «Te falta el hacha». Con sólo el pico y nada a mano, el aviso habla de la piedra.
- **Tres maneras de conseguirlo** (conviven; si ya lo tenés, el almacén dice «ya lo tenés»):

  | Camino | Costo | Para qué |
  |---|---|---|
  | Trueque en el almacén (`pico`) | 3 cantos + 12 ramitas | el que no tiene plata: tiempo y bosque. Un 50 % más caro que el hacha (2 + 8) |
  | Forja del herrero de la aldea | 3 cantos + $300 (`pesos` por `economia.pagar`, motivo «Pico forjado») | el camino «normal»: mezcla cantos y plata |
  | Compra en el almacén (`pico-comprado`) | $1.200 fijos (`economia.pagar`, «Ercilia (almacén)») | el atajo con plata: el más caro |

  Por qué esos números: la piedra vale $100 y un pedrero da 4, así que el pico se paga solo con tres rocas; $300 son tres piedras o poco más que un pan ($200); $1.200 es 4 veces la forja, más o menos un día de comercio de una ruta buena (ver `ECONOMIA_NUMEROS.md`) y por debajo de un poncho ($2.000). Los cantos (3) son los mismos que pide el hacha del herrero y menos que el farol/reloj: accesibles. La forja lo ofrece cuando hay cantos y plata; si falta una de las dos, el herrero lo dice (con el precio) sin tapar sus otros servicios (afilar, tijera).
- **Almacén**: dos ofertas nuevas **al final** de la lista (no mueven los números de lo que ya había; quedan en la tercera página, Tab, Tab). `trueque.js`: campos nuevos `cosa` (lo que se lleva y la anotación del cuaderno) y `pesos` (precio en pesos; sólo en el Relax: en el Desafío «Ese cambio es sólo en el Relax»). La compra pasa por `pagar` (libro de la billetera) y se mira que alcance antes de cobrar.
- **Mochila y barra**: ranura «Pico de cantero» con su ícono; en el Desafío va junto al hacha en la barra. **En mano**: modelo nuevo (`enmano.js`, `pico()`: mismo cabo que el hacha —con la madera y el grabado de Personalizar— y una cabeza con una punta de cada lado; pocas piezas, se balancea como el hacha). A caballo y en el sulky tampoco se pica.
- **Cuaderno** (entrada `pico`, que se anota al conseguirlo en el almacén o al usarlo por primera vez si lo forjó el herrero, y `piedra-mat`/`hacha` actualizadas), **guía F1** (recursos, teclas, primer refugio), ayuda de teclas de la pausa, textos de planos y de la honda del Desafío («con el pico»), charla del herrero.
- **Partidas viejas**: campo nuevo `picoEntregado` (valor por defecto `true` en partidas nuevas). Al cargar una partida sin ese campo, quien tiene el hacha y no el pico recibe **un** pico (y el campo queda en `true`: no se repite nunca, aunque después lo pierda). Se le avisa al entrar: «Ahora para picar piedra hace falta el pico» / «Te dejamos uno en la mochila: H sigue siendo la tecla». Quien no tenía hacha no recibe nada (lo consigue como todos). Vale también para un Desafío guardado antes.
- **Desafío**: arranca con hacha **y** pico.

## Decisión: rocas decorativas

Las rocas `decorativo:true` (los grupos de rocas del paisaje) **se siguen pudiendo picar**, ahora con el pico, igual que las demás. Se ven iguales que las otras: dejar algunas sin poder picar sería una regla invisible para el jugador (una roca sí y otra no) y recortaría de golpe la piedra disponible. No hay cambio de comportamiento salvo la herramienta.

## Archivos

Compartidos (los toca también otra rama o son de uso general): `src/main.js`, `src/guardado.js`, `src/trueque.js`, `src/aldea.js`, `src/mochila.js`, `package.json` (sólo la prueba registrada).
Resto: `src/enmano.js`, `src/personal-armas.js`, `src/cuaderno.js`, `src/guia.js`, `src/construccion.js`, `src/desafio.js`, `src/accesibilidad.js`, `src/plantilla.html`.
Pruebas: `pruebas/verificar-4-2-pico.mjs` (nueva, en el gate), `pruebas/humo-4-2-pico.cjs` (nueva, juego real, no está en el gate), y retoques a tres viejas por las nuevas ofertas del almacén (`verificar-3-8-8-reloj.mjs`: el reloj y el almanaque ahora son los antepenúltimos; `verificar-3-7-2-cocina.mjs`: el almacén entra en tres páginas; `verificar-progresion-rc2.mjs`: la anotación del cuaderno es la de `cosa`).

Cuatro ganchos de depuración nuevos en `window.__hojarasca` (sólo con `?debug=1`): `__abrirAlmacen`, `__cerrarAlmacen`, `__textoHacha`, `__refrescarBarra`.

Textos que ya existían y cambiaron (en castellano): efecto del hacha en el almacén; cartel de la H en la guía (`H`, «Piedra», «Tu primer refugio»); ayuda de teclas de la pausa; planos («picar un pedrero con el pico»); honda del Desafío; aviso de la primera noche del Desafío; cuaderno (`piedra-mat`, `hacha`); texto de la mochila del hacha; resumen del herrero; accesibilidad («Hacha y pico: talar y picar»).

## Verificación

- **Verificado**: `verificar-4-2-pico.mjs` (72 comprobaciones: precios ordenados, herrero con sus casos, almacén, guardado y migración una sola vez, cableado, mochila/guía). `humo-4-2-pico.cjs` en el juego real (Electron, monitor externo): sin pico no se pica y avisa (y el cartel lo dice); trueque con 2 de 3 cantos no cambia, con 3 cantos y 12 ramitas sí; compra con $1.199 no, con $1.250 sí (quedan $50, el libro anota -$1.200); el herrero (charla real de la aldea) lo forja por 3 cantos y $300 y lo anota; con pico se pican 4 piedras, desaparece la roca y sube el oficio de hachero; una roca decorativa también; el hacha sigue talando; mochila y barra con el pico; el pico en la mano; partida vieja guardada sin la marca, con hacha y sin pico: al cargar recibe el pico, ve el aviso una sola vez y lo guardado ya queda marcado. Capturas en `C:\Users\Andres\Documents\Hojarasca\salida-cantina\pico\` (1 sin pico, 2a/2b almacén antes y después, 3 picada, 4 mochila, 5 y 5b en mano, 6 partida vieja).
- **Razonado, no verificado a ojo**: cómo se ve la animación del golpe con el pico (sólo dos cuadros fijos); la fluidez (no hay nada nuevo por cuadro: el modelo en mano es lazy, como el de las demás herramientas, y el resto corre sólo al apretar H o abrir el almacén).
- **No verificado**: medición de fps en la 4600G; el lado Desafío en una partida real (sólo la parte de Node: arranca con pico, y `desafio.js` no cambió salvo un texto).

## Lo que no quedó

- Una pista de la primera hora («Hace falta un pico para la piedra») cuando el jugador junta troncos y todavía no tiene pico: hoy lo dice el aviso al apretar H frente a una roca.
- Número de página y orden: las ofertas del pico están en la tercera página; si se prefiere en la primera, hay que mover dos entradas y dos pruebas viejas (los números de lo ya conocido se correrían).
