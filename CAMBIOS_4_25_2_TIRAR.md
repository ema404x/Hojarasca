# 4.25.2 · Tirar casi todo con V (y juntarlo con E)

Rama `tirar-4-25-2` (sobre `main` = 4.25.1). Pedido del usuario: poder tirar todo lo de la mochila menos lo de la Historia y lo que no es una cosa, que quede en el piso, que se vea, que se junte con E igual que salió y que se guarde con la partida.

## 1. Qué se puede tirar (Relax)
Todo lo que está en la barra y es una cosa del mundo:
- **Lo juntado del suelo** (ramita, piñón, calafate, frutilla, pluma, canto): como antes, **de a uno con su forma de siempre** (`objetos.soltar`, `progreso.soltados`).
- **Materiales**: troncos, tablas, piedra, lana, cristales, junco, hierbas, arcilla, cuero, piedra de cantera.
- **Comida y productos**: lo de la cocina, la granja, la huerta, el horno, el ahumadero, la colmena, el almacén (harina, yerba, azúcar…), semillas, plantines, ponchos, fardos, conservas.
- **Herramientas**: hacha, pico, farol, carpa (si está desarmada), grabador, tijera, mosca, las herramientas de zona (hoz, pala, cuchillo…), **la caña y la linterna**.

V tira **una unidad**; **Mayús + V** tira la pila entera de esa casilla (sumado a la guía de teclas: «Mayús + V»). Lo que no es del suelo (y con Mayús, también lo del suelo) cae en un **bulto**.

## 2. Qué NO se tira, y por qué (la nota lo dice)
- **Lo de la Historia** (llave del molino viejo, canto blanco gemelo, lámpara de Eusebio, pluma de cóndor): «Es de la Historia: lo vas a necesitar más adelante». Un capítulo no se puede trabar por haberlo dejado tirado. Tampoco puede aparecer en el suelo desde una partida editada (el saneado lo descarta).
- **La cámara**: «Es la de tus fotos (P)». Decidido como herramienta del juego (P, el modo foto, el álbum, los concursos), no como objeto del valle. Ver preguntas abiertas.
- **La carpa armada**: «Desarmala primero (T)».
- **Lo que no es una cosa**: los pesos, las entradas del cuaderno, los planos, las grabaciones, lo cocinado anotado (no están en la barra; tirar el grabador deja las grabaciones en el cuaderno).
- **En la noche de los duendes (Desafío)**: sólo lo juntado del suelo, como antes («Solo lo que juntaste del suelo»). Allá hay munición, derrota que quita cosas y cofre del alba: tirar materiales o armas para salvarlos de la derrota rompería las reglas de la noche. (Mayús + V con lo del suelo sí arma un bulto: es lo mismo que tirarlo de a uno.)

## 3. Los frenos
Los de antes (en el tren, en el kayak, nadando, agua adelante, sin lugar) más: **colgado del cable, dormido, durante una escena**, fuera del valle y **con una pared entre vos y el lugar** (el bulto no queda del otro lado de una pared). La altura es la del piso donde estás (`alturaDePie`: en el refugio o un muelle queda sobre las tablas, no enterrado).

## 4. Cómo se ve
Una malla instanciada por forma, con lugar fijo para el tope (no crece nunca), sin sombra propia (sólo la recibe), y **sólo se dibuja la forma que tiene algún bulto a menos de 90 m**: sin bultos cerca, cero dibujos nuevos.
- Tronco suelto (con las caras de corte claras), tres tablas cruzadas, unas piedras, un haz de leña atado (ramitas con Mayús).
- **Herramientas** (y la caña y la linterna): envueltas en un paño atado con tiento, con el cabo asomando.
- **Todo lo demás**: un atado de arpillera con el cuello atado. Un montón grande se ve un poco más grande (hasta una vez y media).
Colores de la paleta del valle, material del bosque (tipo 4, no cambia con la estación). No se tocó el sistema de sombras ni el terreno.

## 5. Juntar (E) y la economía
La E (por la tabla de interacciones de siempre: es un `objetivo` de `objetos.buscar`) dice «Juntar troncos (3)», «Juntar hacha de mano». Devuelve **exactamente lo mismo**: la misma cantidad a las mismas casas (materiales, la entrada del cuaderno —que nunca se borra: sólo baja su cantidad—, los contadores de `cosas`, las ramitas), y la herramienta con **su valor tal cual** (ninguna herramienta tiene desgaste hoy; si un día lo tiene, viaja en la carga).
- **No duplica**: una herramienta no se junta si ya tenés otra igual (compraste otra): queda en el suelo. La caña o la linterna, sólo si te faltan.
- **No pierde**: con la mochila llena entra lo que cabe (el límite de la 4.7) y el resto queda en el bulto; las ramitas respetan su tope de doce. Si el valle está lleno de bultos, lo que ibas a tirar vuelve a la mochila.
- Juntar un bulto **no cuenta como juntar del valle** (no suma a los frutos de Inés ni anota nada nuevo en el cuaderno).
- Sin la caña o la linterna, Q y L dicen que la dejaste en el suelo. Tirar la caña la saca de la mano; tirar la luz la apaga. Si tirás el farol, vuelve a la barra la linterna (la tenías debajo).

## 6. Tope y fusión
**48 bultos** en todo el valle (`TOPE_BULTOS`). Un bulto de lo mismo a menos de **1,6 m** se suma al que ya está (V seguido en el mismo lugar arma un solo montón). Las herramientas no se suman (cada una es una). Con el tope lleno: «Ya hay muchas cosas tiradas · Juntá alguna antes de dejar otra» (y no se pierde nada).

## 7. Cómo se guarda
- `progreso.bultos`: `[{ x, y, z, rot, carga }]`, con `carga` = `{ id, nombre, n, partes: { ramitas?, material?, entrada?, cosa? } }` (lo que se cuenta), `{ id, nombre, n: 1, clave, valor }` (herramienta única) o `{ id, nombre, n: 1, base: true }` (caña o linterna).
- `progreso.dejadas`: `{ cana?: true, linterna?: true }` (lo que la barra no muestra mientras está en el suelo).
- `guardado.js` los sanea al cargar (`sanearBultos`, `sanearDejadas` de `tirar.js`): **una partida vieja sin los campos carga sin bultos y con todo encima**; lo roto, lo fuera del valle, lo de la Historia y lo que pase del tope se descarta. `objetos.js` los vuelve a sanear al armar el mundo.
- Tirar y juntar guardan en el acto (la mochila y el bulto van en el mismo guardado: no hay un instante con las dos cosas o ninguna).

## 8. Archivos
- **Nuevo `src/tirar.js`** (puro): qué se tira (`motivoParaNoTirar`), sacar y devolver (`sacarDeMochila`, `devolverAMochila`), el suelo (`ponerBulto`, `textoBulto`, `modeloDe`), el saneado y `dejada`.
- `src/objetos.js`: las seis formas, las mallas, `tirarBulto`, la E sobre los bultos, `ponerLugar`.
- `src/main.js`: `soltarRanura` (localizado ahí), el import, `objetos.ponerLugar`, la V con Mayús, Q y L sin caña/linterna, dos líneas en `usarObjetivo`.
- `src/mochila.js`: la caña y la linterna salen de la barra si están en el suelo.
- `src/guardado.js`: el saneado. `src/plantilla.html`: la línea de Mayús + V.

## 9. Pruebas
**Nueva `pruebas/verificar-4-25-2-tirar.mjs`** (en `verify:pasos`, antes del build reproducible): qué se tira y qué no (con su motivo), ida y vuelta exacta de cada casa, la caña, la mochila llena, las ramitas, **una partida al azar de 4000 pasos que comprueba en cada paso que no se duplica ni se pierde nada**, la fusión y el tope, el saneado, el guardado de verdad (con un localStorage de mentira) y la barra; `soltarRanura` y `usarObjetivo` de `main.js` corridos con un mundo de mentira (cada freno, el bulto, la vuelta atrás). **15 mutaciones de `tirar.js`** (copias `src/tirar.mutN.js`, borradas al terminar) y **6 de `main.js`** (en memoria): todas atrapadas.
Pruebas viejas: ninguna hubo que tocar.

## 10. No verificado / preguntas abiertas
- **No se corrió Electron** (por pedido): las formas no se vieron a ojo; la E sobre el bulto y el dibujo sólo están probados por texto y por la lógica pura. Falta una partida real que tire, guarde, cargue y junte.
- **La cámara** quedó sin poder tirarse. ¿Querés que también se pueda (habría que frenar P, el modo foto y los concursos sin ella)?
- **El farol**: tirarlo deja a mano la linterna de antes (el juego modela el farol como un reemplazo). ¿Está bien, o el farol tirado tendría que dejarte a oscuras?
- **Desafío**: ¿se quiere tirar algo más que lo del suelo en la noche (por ejemplo materiales), sabiendo que permitiría esquivar lo que quita la derrota?
- Los bultos no se mueven ni se los lleva nadie (ni el agua ni los vecinos). ¿Hace falta que un bulto olvidado desaparezca con el tiempo? Hoy queda para siempre (con el tope de 48).
- Un bulto tirado en un piso alto (balcón, torre) queda sobre ese piso; tirado desde el borde hacia afuera, queda en el suelo de abajo.
