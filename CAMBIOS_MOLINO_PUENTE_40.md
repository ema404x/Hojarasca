# 4.0 — El molino, su campo de tulipanes, su arroyo y el puente (17-10-2026, rama `molino-puente-40`)

Pedido del usuario: mejorar el molino y el puente que ya existen para que se parezcan a las dos referencias (molino de piedra y madera con
campo de tulipanes, arroyo con cascadita, cercos; puente de madera con herrajes negros, estribos de piedra y faroles) y agregar eso al mapa.
Sin contenido aparte: es el molino, su arroyo, su puente y su campo. Rama sacada de `v392-mejoras` (no se tocó ni ella ni `main`; sin push).
Capturas antes/después: `Documents\Hojarasca\trabajo\molino40\antes\` y `...\despues\` (se sacan con `pruebas/fotos-molino-40.cjs`).

## Qué cambió y dónde queda
**El molino de viento (el de siempre, en `estructuras.js`):** base de piedra apilada a la vista (7 hiladas de sillares de tamaños y tonos
distintos, con el vano de la puerta libre); cuerpo de tablas de madera (antes encalado) con tres zunchos de hierro; techo de tejuelas sobre la
cúpula y el aro de la capucha; aspas de listones (marco y listones cada 22 cm, con aire entre uno y otro) en lugar del paño liso. La pared,
la puerta, la escalera y la física son las de siempre.

**El puente (el de troncos sobre el río, en `estructuras.js`):** vigas de tablón a los costados con herrajes negros atornillados, postes
cuadrados con placa de hierro, tres listones de baranda, estribos de piedra apilada sobre la orilla del agua y dos faroles en postes altos.
Todo es visual: la plataforma y los segmentos de baranda de física no cambiaron (probado caminando de punta a punta).

**Lo que se agrega junto al molino (módulos nuevos `molino-paisaje-plano.js` —puro, con prueba— y `molino-paisaje.js`):**
- **Campo de tulipanes** en seis franjas (rojo, naranja, amarillo, rosa, rojo y amarillo/naranja, con algunos blancos) en el llano al sur del
  molino, entre el sendero y el arroyo. 1926 plantas instanciadas (5 mallas, una por color, ~30 triángulos cada planta), con `materialVegetal`:
  hoja tipo 2 y flor tipo 3, así que se tiñen en otoño y en invierno el campo queda pelado como el resto de las flores.
- **Cercos de madera** (postes cada ~2 m y dos travesaños que siguen el terreno) alrededor del campo, con un portón de ~4 m al frente.
- **Arroyo del molino con su cascadita:** nace de un manantial de rocas al oeste, corre 20 m por el borde de la terraza entre rocas (con muro de piedra
  seca donde la orilla queda baja), cae por una caída de rocas con espuma y baja la loma hacia el este hasta perderse entre juncos. Son dos
  cintas de agua (agua y espuma) que siguen el terreno, con textura pintada que corre; no se excavó nada.
- **Casa con galería** al oeste del molino, de cara al campo: zócalo de piedra, paredes de tablas, techo de tejuelas, chimenea de piedra,
  galería con postes, baranda de listones y escalerita, dos faroles colgados, un tonel con zunchos y un macetero de flores. Es de adorno por
  dentro (no se entra) pero sólida por fuera.
- **Calidad:** los tulipanes escalan con `calidad.densidad` (alta 100 %, media 82 %, baja 58 %, muy baja 45 %; es un prefijo de un orden fijo, así
  que raleá parejo) y también en vivo con la autocalidad; a más de 170 m el campo se oculta.
- **Sorteo del valle intacto:** nada de esto usa el azar del sorteo (`rng`), así que ninguna otra obra se movió; el terreno no se tocó. Lo único
  que cambia en el mundo es que se despejan árboles, matas y pasto de la huella nueva (`veg.despejar` y el pelado de la máscara del pasto) y que
  la casa, el campo y el arroyo entran en la lista de `edificios` (frutillas y plumas no aparecen adentro).

## Costo medido (esta PC, alta, aldea completa, 200 cuadros; `herramientas/medir-vistas.cjs` con vistas nuevas; el mismo día; 2 corridas antes y 2 después alternadas)
| vista | antes p50 (c1 / c2) | después p50 (c1 / c2) | antes p95 | después p95 |
|---|---|---|---|---|
| molino-campo-dia | 4,4 / 4,2 | 4,3 / 4,5 | 6,7 / 6,0 | 9,0 / 9,2 |
| molino-campo-tarde | 3,9 / 4,3 | 4,3 / 4,1 | 5,5 / 7,0 | 7,8 / 8,4 |
| molino-lejos-tarde | 4,4 / 5,2 | 4,6 / 4,7 | 5,4 / 7,6 | 8,4 / 7,7 |
| puente-dia | 4,1 / 4,0 | 3,7 / 3,7 | 11,3 / 11,3 | 11,8 / 11,6 |
| aldea-plaza-dia (control, sin cambios) | 15,0 / 14,9 | 15,0 / 14,9 | 16,1 / 15,6 | 16,4 / 16,8 |
| refugio-dia (control, sin cambios) | 6,4 / 5,6 | 4,5 / 4,9 | 9,6 / 9,1 | 7,6 / 6,7 |
Triángulos por cuadro en las vistas del molino: +12 % (1,16 M → 1,30 M, de los cuales ~0,06 M son tulipanes); dibujos: de −5 a +24 según la vista (la nueva obra suma 5 de tulipanes, 1 de
obras y 2 de agua; en la vista del puente el molino queda a la vista a 60 m y se suman a los del puente). Conclusión: **p50 sin cambio medible (±3 %, dentro del ruido; el control de la plaza quedó idéntico)**; el **p95 sube ~2 ms**
en las vistas del molino (de 5-7 a 8-9 ms, muy lejos del límite de 16,7). Sospecha: los cuadros en que se rehacen las sombras, ahora con la casa y los
cercos entre los que tiran sombra (no se tocó el sistema de sombras); si molesta, se quita la sombra de la casa (`malla.castShadow` en `molino-paisaje.js`).
**Falta medir en la 4600G**: acá las vistas del molino son baratas (4 ms) y el costo se mide en décimas.

## Pruebas
- `pruebas/verificar-4-0-molino.mjs` (enganchada al gate): ids y eñes, franjas y surcos, siembra fija y dentro del campo, calidad (prefijo ralo,
  más densidad nunca da menos plantas), cercos con portón, arroyo de oeste a este con la caída, casa que no pisa el molino/campo/sendero,
  `materialVegetal` con tipos 0/2/3/4, sin Vector4 ni OctahedronGeometry, sin `rng`, sin guardado, sin textos en inglés, física del puente intacta.
- `pruebas/humo-4-0-molino.cjs` (Electron, manual): el puente se cruza de punta a punta por arriba del tablero, la puerta del molino se sigue
  entrando, la casa y el cerco frenan, el portón deja pasar, 0 errores en consola.
- Gate: `npm run verify` (ver `RELEASE_STATUS.md`). Lo que el molino hace (aserradero y molienda del molino de agua) no se tocó: es otra obra
  (`molino-agua`), construible por el jugador; el «Molino de Viento» sólo tiene la escalera, el balcón y las muelas de adorno.

## Límites (honestos)
- **Parecido a las referencias: ~60-65 %.** Estilo pintado de HushWood, no realista. Los tulipanes, el campo en franjas, el cerco, la casa y el
  puente se leen claro; el agua es una cinta pintada (sin reflejo ni profundidad) y las rocas son icosaedros facetados; la cascada es chica (el
  terreno no se puede excavar) y no cae en vertical; faltan los álamos altos, las montañas con nieve del fondo cambian con el valle, y los techos de
  tejuelas se ven más oscuros que los de la referencia.
- Los faroles del puente y de la galería **no se encienden de noche** (el vidrio es color claro, sin emisivo ni halo): si te gusta, se pueden
  enganchar al sistema de halos de la aldea (`aldea-noche-luz.js`).
- Visto desde el sur (abajo de la terraza) el muro de piedra seca que sostiene el arroyo es alto y oscuro (la terraza cae ~1,5 m ahí).
- La tierra entre franjas es el pasto pelado del suelo (verde oscuro), no tierra marrón como en la referencia.
- El agua del arroyo no tiene física ni se nada (es una cinta sobre el terreno); la casa no se entra.
- Otras obras del valle que se sortean cerca del molino no se movieron; si el sorteo con otra semilla las pusiera sobre el campo no hay chequeo
  (sólo entran como zonas de `edificios` para frutillas y plumas).
- No se probó en la 4600G ni con mando, ni de noche ni en invierno con capturas (sólo por código: las flores se cierran con el invierno).

## Decisiones tomadas sin consultar
1. El «puente existente» es el de troncos del río (y no el puentecito del camino de la aldea); el molino es el de viento (el de agua es una obra
   del jugador y no tiene sitio fijo).
2. El arroyo es una obra propia junto al molino (el río real queda a ~45 m y ~9 m más abajo): no se tocó el terreno ni el río.
3. La casa es de adorno por fuera (sólida, con galería) y sin interior, para no sumar un lugar nuevo ni un interior que mantener.
4. El cuerpo del molino pasó de encalado a madera (la referencia lo muestra de madera): cambia mucho su silueta de lejos.
5. Los estribos del puente se apoyan en la orilla del agua (no en los extremos del tablero, que ya están al nivel de la orilla).
6. Los tulipanes se cierran en invierno (comportamiento común de las flores del juego) y los tallos se vuelven rojizos en otoño (tipo 2).
