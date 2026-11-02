# Hojarasca 4.19.0 — parte C: mundo y pulido, a ojo

Rama `v4190-c` (sale de `main` = 4.18.4). Zona C: la gente de las escenas, el pase a ojo de las escenas que nunca se vieron en el juego, el pulido conocido y las sospechas de cámara de la 4.18.4. Todo mirado en Electron real (monitor externo, perfil propio, candado compartido soltado entre corrida y corrida), con capturas antes y después. No toca la Historia por dentro (`historia.js`, disparadores, efectos, `main.js`): los enganches con A no hacen falta (ver el tablero).

## 1. La gente de una escena se dibuja aunque esté lejos (a más de 130 m)
- **Causa:** `gente.js` apaga a todo el que está a más de 130 m del jugador (`g.g.visible = … d < (g.soloCerca || 130)`). El director de escenas captura a los personajes pero no los exentaba: Herminia en la puerta de su casa (`umbral-fin` con la pelea, con vos en el refugio a 643 m) no salía en cuadro.
- **Arreglo:** `escenas-mundo.js` (`capturar`) le pone a cada personaje capturado `enEscena = true` y `soltar` se la saca (se guarda y se restaura como las otras marcas); `gente.js` dibuja al que la tiene a la distancia que sea y le calcula la pose en cada cuadro (sin la marca, lejos, la pose sigue espaciada, como siempre). Son tres condiciones; nada nuevo en el mapa de sombras ni en los materiales.
- **Antes / después en partida real** (`humo-4-19-0-c.cjs`, sección G, `umbral-fin` con la pelea): Herminia a 643 m del jugador, **0 de 288 muestras dibujada antes, 287 de 287 después**; al terminar la escena vuelve a su estado (ya no está en la lista de gente: la arma `invitadoDeHistoria` y la quita `quitarInvitadosHistoria`). Captura: `g-herminia-2.png` y `g-herminia-3.png` (Herminia en el umbral, de frente, con la puerta entornada).
- **Costo:** dibujar a Herminia lejos suma **2 llamadas de dibujo y ~13 mil triángulos** a un cuadro de 335 llamadas y 843 mil triángulos (medido en el mismo cuadro con la marca puesta y sacada; los milisegundos no sirven: la PC la comparten otros procesos y salían 13,7 contra 17,3 ms en el orden equivocado). 0 programas de shader nuevos: mismas transiciones de programas (111 → 112 → 113/114) en la versión de antes y en esta con las mismas escenas.

## 2. Pase a ojo (hojas de contacto antes/después)
Herramienta: `pruebas/humo-4-19-0-c.cjs` (la de la 4.18.1 con la lista ampliada: sección V, una hoja de 6 cuadros por escena). Corridas en lotes de 10 a 15 minutos. **75 hojas** (una por escena o variante; antes) en la versión de la 4.18.4:
- las 26 escenas de las optativas de los actos I a III (las dos de B de esta versión no están en esta rama; faltan además `elvira-cuerda` y `plumas-gallinero`, que no se pudieron poner en el lugar sin un poblador),
- las de la noche (`noche-espera`, `noche-entre-1/2`, `noche-tras-ganar/perder`, los cuatro amaneceres), las del acto III de B (capítulos 9 a 13) y las del final,
- el frasco de la repisa, Fermín en el techo (en la noche jugable, sección F), la pareja con el amor prendido y las lucecitas del amanecer.
**Arreglado** (hojas en `…\Temp\hx\c4190\antes` y `…\despues`):
- `foto-sofia`, `trigo-abuelo`, `herminia-noventa`, `frasco-rosa`, `tito-arco` y `flechas-de-mas`: el plano «de la mano» dejaba un torso sin cabeza o las piernas; ahora la cámara va más atrás y a la altura del pecho (se ve a la persona con lo que tiene en la mano).
- `frasco-repisa`: la cámara miraba una pared lisa (el plano caía a 0,9 m y el frasco estaba a 2,3 m): colocación nueva (a 0,9 m de la estantería, mirándola) y el plano aprieta sobre el frasco, que ahora se ve junto a los otros frascos.
- `pareja-noche-antes`: colocación nueva (de frente al umbral, a 7 m); antes la cámara quedaba pegada al muro de un costado.
- **La pareja no aparecía** si todavía no estaba en la lista de gente (vive lejos, está dormida…): `capturar` le pedía a `armarYa` armar a «pareja» en vez de a la persona de verdad (`parejaClave()`). Ahora se la arma con su clave. Visto con el amor prendido: aparece en `pareja-noche-antes` y en los amaneceres.
- `mulas-belisario`: la cámara quedaba pegada al lomo de una mula; más atrás, más alta y de costado.
- `majada-fin`: ver 3.
**Sin cambios, vistos y en orden:** `ramon-cama`, `papel-elsa`, `mesa-guerra`, `noche-espera` (Fermín arriba del galpón, los faroles de la loma y las veinte lucecitas ámbar), los amaneceres (la ronda de lucecitas ámbar alrededor del galpón se ve), las noches entre olas, `te-graciela`, `vuelta-mirador`, `pan-fermin`, `foto-valle`, `galpon-golpe`/`sin-golpear`, `anselmo-puntas`, `prestado-*`, `carpeta-celeste`, `fiesta-nieve`, `josefina-fin`, `costumbre-*`.
**Quedan flojas** (no se tocó): `veta-vuelve` (la cantera de noche es casi un cuadro negro: Tobías es una silueta y no se ve el farol bajo; hace falta un farol con brillo y un `mundo:` nuevo, que es de A), `oveja-ramon` y `cumple-nevada` (la cámara queda pegada a los pilotes del puesto y al marco de la puerta del almacén según dónde estés parado al disparar), `vuelta-faro` (el plano de apertura queda metido bajo el faro desde el punto de partida del humo), `juntar-ovejas` (el plano mira nieve y un montón de troncos), `llave-79` (el cajón trabado no entra en cuadro), `carpeta-celeste` (cámara contra el muro de la estación), el picado de `umbral-fin` (el suelo se ve celeste liso a 6,5 m de alto).

## 3. Pulido conocido
- **Estacas del herrero** (`prestado-herrero`): seis de 11 cm de radio, de hierro viejo con la punta oxidada y piedras al pie; y el plano baja de 5,5 a 3,2 m de alto (de frente se ven «los dientes del peine»; desde arriba eran manchas).
- **Barro y bellotas de la ventana** (`galpon-pelea`): barro claro (`#8a6a47` en vez de `#4a3726`) y bellotas más grandes y más claras; se ven contra los troncos oscuros de madrugada.
- **La oveja bajo el nombre del cartel** (`majada-fin`): la tabla es más alta y lleva una oveja dibujada a pincel (vellón, cabeza, sonrisa y cuatro patas); el plano se acerca (4,4 m) y sube sobre el cerco del corral.
- **La hoja de la tranquera abierta**: más gruesa y alta, de madera clara contra la nieve y con el poste de la punta blanqueado; a 14 m ya se la distingue (antes era una raya oscura).

## 4. Las dos sospechas de cámara de la 4.18.4 (S-1): **no son bugs**
Con `pruebas/humo-4-19-0-c-camara.cjs` (el barrido de la 4.18.4 con capturas en el cuadro de cada tramo, con un cuadro de 0 ms antes para que no salgan con retraso) se fotografiaron los tramos de `galpon-golpe`, `galpon-sin-golpear`, `galpon-encuentro`, `pluma-umbral`, `piedras-molino` y `coihue-talado`:
- **Galpón y refugio:** en ese barrido el galponcito no estaba levantado, así que `galpon-noche` caía junto al refugio y la cámara quedaba contra el alero o la pared (en `pluma-umbral` está en el pasto, sin tocar nada). Con el galponcito levantado (como en el juego, y en la sección V) las escenas del galpón miran el galpón desde afuera o desde adentro a propósito. `galpon-ronda` no marcó nada esta vez.
- **Coihue grande:** la bolita de 22 cm de `col.resolver` roza el tronco (de varios metros de radio) en los planos de bosque; las capturas muestran la cámara junto al tronco, sin ver a través de nada.
No se tocó la cámara.

## 5. Para A y para la junta
- `ramon-sanitario` (punto 5 de A): no es un bug del disparador; es una escena **sin guion** (`ESCENAS_SIN_GUION_ACTO3`), por eso `disparar` dice que no está registrada (tablero).
- Archivos tocados: `src/escenas-mundo.js` (`enEscena`, la pareja), `src/gente.js` (dos condiciones), `src/historia-colocacion.js` (dos entradas: `frasco-repisa`, `pareja-noche-antes`), `src/historia-objetos.js` (estacas, cartel con oveja, barro, tranquera), y la cámara de seis escenas de datos (`historia-escenas-acto2-c5/c6/c8.js`, `acto3-c11/c11b/c13.js`, `historia-escenas-optativas.js`: sólo parámetros de plano).
- Ajustadas a propósito: `verificar-4-17-0-pulido-c.mjs` (la colocación puede ser de una optativa), `verificar-4-18-1-pulido.mjs` (picado de 3,2 m y no de 5,5; la tranquera más gruesa).

## Pruebas
- `pruebas/verificar-4-19-0-c.mjs` (en `verify:pasos`): 57 comprobaciones, 12 mutaciones atrapadas (copias con otro nombre): la marca `enEscena` (capturar/soltar), `gente.js` (4: dibujo, distancia, pose, trochita), la pareja con su clave, el frasco y la pareja colocados, y los cuatro props. Falla con el código de la 4.18.4 (28 fallas) y pasa con el de ahora.
- Previas en verde: `verificar-4-14-0-escenas`, `4-15-0-escenas-acto1`, `4-16-0-escenas-acto2`, `4-17-0-escenas-acto3` (22924), `4-18-0-escenas-optativas`, `4-17-0-pulido-c` (73374), `4-18-0-pulido-c` (10648), `4-18-1-pulido` (1725), `4-17-1-escenas-noche`, `4-18-4-a`, `4-18-4-b`, `4-18-4-c`, `4-18-2-lazos-*`, `4-18-0-optativas-a`, `3-6-gente`, `4-11-2-gente`, `verificar-release`, `build-reproducible`. No se corrió `npm run verify` completo (lo hace la junta).
- Partida real: `pruebas/humo-4-19-0-c.cjs` (V escenas, G gente lejana, P props, F Fermín en el techo; `HUMO_SOLO`, `HUMO_ESC`, `HUMO_PROP`, `HUMO_TODAS`, `HTML=` para el «antes») y `pruebas/humo-4-19-0-c-camara.cjs`. No entran al gate.

## No se vio a ojo
- Las dos escenas nuevas de B (`ultimo-cruce`, `del-otro-lado`): no están en esta rama; hay que mirarlas después de juntar.
- Una partida de amor real de punta a punta: la pareja se vio con el amor prendido a mano (`P.amor`) y el vecino como invitado, no como habitante de la aldea con su rutina.
- Fermín en el techo se vio de noche con el galponcito levantado y la noche arrancada a mano; no la noche entera jugada.
- El audio, el mando, `elvira-cuerda` y `plumas-gallinero` (no se pudo poner a la gente en su lugar), y las escenas de los actos I y II que no son optativas (se vieron en la 4.17.0).
- Programas de shader: sin cambios (111 al entrar; 112 a 114 con las escenas de gente, igual que antes).
