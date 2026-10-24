# CAMBIOS 4.10.3 · Geometría y render del Desafío (zonas G y V del pase 5)

Rama `bugs-4-10-3-visual-geometria` (sale de `origin/main` = 4.10.2). No se subió la versión, no se hizo push y no se tocó `main`.
Los informes eran revisiones de lectura: cada hallazgo se confirmó con los arneses (copiados a una carpeta temporal y apuntados a esta copia) antes de tocar nada.
Todo se probó en Node (valle real, terreno real, mundo llano); **nada se vio en Electron**.

## Estado de cada hallazgo

| Hallazgo | Estado | Dónde |
|---|---|---|
| G-1 fundar sobre un puesto de ruta, el andén o la veta | **Arreglado y probado** | `puestos-ruta.js` (`reservaDeRuta`), `construccion.js` (`revisarSitio`), `main.js` (`T.reservaRuta`) |
| G-2 piezas pisando edificios del valle y obras grandes tuyas | **Arreglado y probado** | `construccion.js` (`edificioDelMundoEnHuella`, regla junto a C9) |
| G-3 troncos de la esquina de la huella | **Arreglado y probado** | `construccion.js` (`nivelarSitio`) |
| G-4 piezas grandes sobre el muelle / pisos ajenos | **Arreglado y probado** | `construccion.js` (rama `pieza`) |
| G-5 Galpón de herramientas y Cobertizo rural no cubren | **Arreglado y probado** | `construccion.js` (`cubreArea: true`) |
| G-6 barraca con el frente cuesta abajo | **Arreglado y probado** | `construccion.js` (`escalonDeEntrada`) |
| G-7 muebles grandes sin choque | No tocado (pregunta) | ver preguntas |
| G-8 pasaje de 0,69 m en el torreón | No tocado (pregunta) | ver preguntas |
| G-9 Fermín no camina | No tocado | depende del sorteo del galpón; sin reproducción segura |
| G-10 mapa de lluvia al reparar el techo de un puesto | **Arreglado** (la firma); probado sólo por texto | `main.js` |
| G-11 pisos con la ladera por encima | No tocado | cosmético, ya dicho en el informe |
| V1 ruina del bosque en ladera | **Arreglado y probado** | `desafio-valle.js` (`elegirLugarRuina`), `desafio-eventos.js` |
| V2 llama del farol de Herminia 3,6 veces más grande | **Arreglado y probado** | `desafio-vecinos-piezas.js` (`titilar`), `desafio-vecinos-mundo.js` |
| V3 placas de los duendes adaptados | **Arreglado y probado** (menos dibujos medidos en Electron: pendiente) | `desafio-evolucion-mundo.js`, `desafio.js` |
| V4 (cuenta de dibujos de las placas) | Incluido en V3: de 5 mallas a 1 por duende | idem |
| V5 nidos de lugares tomados trabados | **Arreglado y probado** | `desafio-valle.js` (`lugarNidoDeZona`), `desafio-tomadas-mundo.js`, `desafio.js` |
| V6 patas del Coihue colgando en laderas | **Arreglado y probado en Node; falta mirarlo** | `desafio-coihue-formas.js` (`calzarPatasCoihue`), `desafio-asedio-mundo.js` |
| V7 suelo de las madrigueras plano | No tocado (pregunta) | ver preguntas |
| V8 huellas del Coihue se rearman enteras | No tocado | ver preguntas |
| V9 fugas chicas | **Parcial**: halos de las madrigueras retiradas y materiales de los lugares tomados. No se tocó `desarmar` del asedio ni la subida de la nave (pasan casi nunca) | `desafio-puestos-mundo.js`, `desafio-tomadas-mundo.js` |
| V10 opacidad única de la sombra larga | No tocado (pregunta) | ver preguntas |
| V11 destello congelado al limpiar los puestos | **Arreglado y probado** | `desafio-puestos-mundo.js` |
| V12, V13 (centímetros de placa y postes sin calce) | No tocados | cosmético; V13 toca el aspecto del tablero |

(El informe V numera 13; aquí V4 va junto con V3, que es la misma causa.)

## Qué se cambió, hallazgo por hallazgo

- **G-1.** Función pura `reservaDeRuta(x, z, radio, { anden, recursos })` en `puestos-ruta.js`: reserva 7,5 m alrededor de cada puesto de ruta (lo mismo que ya se despeja de árboles), 6 m alrededor del andén del Riel Sur y el radio de E + 1,5 m de cada recurso de zona (veta, juncal, hierbas, arcilla), siempre sumando el radio del plano. `main.js` define `T.reservaRuta` sólo en el Relax, junto a la creación de los puestos; `revisarSitio` la consulta para **todos** los planos, como `reservaMolino`.
- **G-2.** (a) Edificios del valle: para las piezas que ocupan el suelo (`ocupaSuelo`) y que no están sobre un piso, `revisarSitio` rechaza el sitio si algún choque del mundo (pared, cerco, mostrador; no árboles ni rocas ni cosas tuyas) tiene su centro adentro de la huella (rotada, achicada 15 cm). Se mide con los choques reales, no con una distancia a ojo, para no quitar sitios que servían. (b) Obras tuyas: una pieza en el suelo que no cubre otras (`cubreOtras`) tampoco se acepta si pisa la huella de una obra tuya grande (`ocupaSuelo`) en el suelo (antes sólo se comparaban dos con la misma marca). No se cambió lo que ocurre con el centro de la pieza *adentro* de la otra (es un mueble sobre su piso).
- **G-3.** `nivelarSitio` despeja, además del círculo desde el centro, toda la huella de las piezas grandes (`ocupaSuelo`), con círculos de 1 m en una cuadrícula de 1,4 m, sólo en los puntos que el círculo viejo no cubría. Las piezas chicas (cantero, mesa, etc.) quedan exactamente como estaban.
- **G-4.** Una pieza `ocupaSuelo` con un piso ajeno debajo (muelle, galería de un edificio del valle, andén) se rechaza con «Una construcción así necesita suelo firme: no se apoya en el piso de otro». Sobre un piso tuyo sigue igual. Esa comprobación va después de las de superposición, así los mensajes de siempre («Se superpone con otra pieza») no cambian.
- **G-5.** `cubreArea: true` en `galponcito` y `cobertizo`.
- **G-6.** La barraca entra en `escalonDeEntrada` (piso a 0,35 m, tope de 0,62 m medido a 1,7 m del centro hacia adelante). Se rechaza el sitio con ese frente («girala (R)»). En llano o con el frente cuesta arriba no cambia nada.
- **G-10.** La firma del mapa de lluvia suma la cantidad de techos de las estructuras (`est.cubiertas`), donde se agrega el techo reparado del puesto.
- **V1.** `elegirLugarRuina` (en `desafio-valle.js`, puro): mismo sorteo de siempre (120 a 250 m de la base, tierra firme, pendiente de celda ≤ 0,35) y, entre los 60 sitios, se queda con el primero cuyo desnivel bajo la huella de 3,4 × 17 m es ≤ 0,8 m; si ninguno lo cumple, el más parejo (nunca se queda sin ruina). Con el terreno real: 150 de 150 ruinas ≤ 0,8 m; el sorteo anterior pasaba el metro en 128 de 150. No se tocó la malla ni los choques.
- **V2.** `mallaFuego` devuelve `titilar(t)`, que aplica el titileo sobre la escala de armado (0,32 en el farol). El fogón conserva su escala visible (1, ver decisiones). Cada fuego tiene su propio material de brillo (`matBrillo.clone()`), así cada uno pulsa con su fase. Llama del farol medida: máx. < 0,5 m (antes 1,05 m, con la caja de vidrio de 0,24 m).
- **V3/V4.** Las cinco placas de un duende adaptado son ahora **una** malla con la geometría fundida (se arma una vez por modelo, según radio y altura, y se comparte; verificada vértice por vértice contra las cinco placas de antes: error < 1e-5). Pasa de 5 dibujos por duende adaptado a 1. Al entrar en `morir` o `irse`, las placas se esconden de inmediato (antes quedaban paradas en el aire 1,5 a 2,4 s). Siguen reusándose la malla y el borde del cuerpo como antes.
- **V5.** `lugarNidoDeZona` acepta un `preferido` opcional (sin troncos ni rocas en 1,5 m y suelo parejo, exactamente la prueba del nido común) y, entre los 40 sitios, devuelve el primero que lo cumple; si ninguno, el primero que servía. Sin `preferido` el resultado es idéntico al de antes (misma semilla, mismo sitio).
- **V6.** `calzarPatasCoihue` (en `desafio-coihue-formas.js`): después de animar al Coihue, cada pata se gira un poco más sobre su mismo eje hasta que la punta toque el suelo de abajo (bisección, 3 pasadas, tope −0,75 a +0,5 rad). El pivote en el tronco no se mueve. En llano el calce es 0. Con el terreno real (250 sitios, 6 patas, pendiente de celda ≤ 0,55): puntas a más de 1 m de su lugar, **de 747 de 1500 a 40 de 1500**.
- **V9.** Las madrigueras que salen de la lista sueltan sus halos (`soltarHalos`) y `limpiar()` de los lugares tomados libera los tres materiales de cada lugar.
- **V11.** `limpiar()` de los puestos devuelve la escala 1 a lo que estaba en el destello.

## Pruebas

Nuevas (enganchadas al gate con `herramientas/sumar-prueba.cjs`, quedaron en `package.json` antes del build reproducible):
- `pruebas/verificar-4-10-3-sitios.mjs` (G-1 a G-6): valle real con puestos y apeadero, mundo llano y terreno inclinado. Falla sin los arreglos (se comprobó para G-1, G-4 y G-6).
- `pruebas/verificar-4-10-3-visual.mjs` (V1, V2, V3, V5, V6, V9, V11 y los enganches de V9/G-10 por texto).

Ajustadas (lo mínimo): `verificar-4-10-1-desafio.mjs` y `verificar-4-9-aliados.mjs` tenían un fuego de mentira sin `titilar`; se les agregó `titilar() {}`. Nada se aflojó.

Pruebas sueltas corridas en esta copia (una por vez, todas **OK** salvo lo dicho abajo):
`verificar-4-10-3-sitios`, `verificar-4-10-3-visual`, `verificar-2-4`, `2-8-casa`, `2-9-maquinas`, `2-9-vela`, `3-6-1-juego`, `3-6-2-juego`, `3-8-7-obras`, `4-0-3-molino`, `4-10-1-desafio`, `4-10-1-mundo`, `4-10-base`, `4-4-2-construccion`, `4-6-0-detalles`, `4-6-puestos`, `4-7-carga`, `4-9-defensas`, `construccion-ingenieria-rc8`, `construccion-multinivel-rc9`, `construccion-premium-rc6`, `construccion-senior-rc7`, `construccion-ultra-rc10`, `habitat-conectado-rc12`, `habitat-premium-rc11`, `4-10-coihue`, `3-8-coihue`, `4-9-aliados`, `nido`, `3-8-3-combate`, `2-1`, `4-8-1-sin-naves`, `4-10-1-npc`, `4-10-partidas`, `2-2`, `3-3-bosque`, `4-6-0-rocas`, `4-2-oficios`, `verificar-build-reproducible`, más todas las que mencionan `puestos-ruta.js`, `recursos-zona.js`, `desafio-puestos-mundo`, `desafio-tomadas-mundo`, `desafio-duendes.js`, `desafio-valle.js` o `desafio-vecinos`. Con la primera versión de los arreglos fallaron tres, y se corrigieron: `3-8-7-obras` (el cantero ya no despeja con círculos extra), `4-4-2-construccion` (el mensaje de superposición se conservó) y `construccion-premium-rc6` (un mundo de mentira sin `col.cercanos`).
Se corrió `node armar.mjs` (4.10.2, 430 módulos). **No** se corrió `npm run verify` ni `verify:paralelo` ni se abrió Electron.

## Decisiones tomadas sin consultar

1. **G-1:** reserva de 7,5 m (la zona de despeje de árboles que ya tenían los puestos) y también para los otros recursos de zona, no sólo la veta. Se descartó dejar el hueco a ojo en cada plano.
2. **G-2:** se prefirió medir contra los choques reales del mundo y no contra un radio por edificio (que habría sacado sitios que servían). Se aplica sólo a las piezas que ocupan el suelo.
3. **G-3:** se eligió despejar toda la huella (como las casas, que ya despejan `radio + 1,5`) y no rechazar el sitio con aviso; sólo en las piezas grandes.
4. **G-4:** sólo las piezas que ocupan el suelo (`ocupaSuelo`) dejan de apoyarse en pisos ajenos. Una mesa o un cantero sobre un porche del valle siguen pudiendo.
5. **G-6:** no se usó `pendienteMax 0.25` (el informe lo sugería) porque no resuelve las pendientes de 16 a 25 %: se rechaza el sitio sólo si la entrada no se puede subir.
6. **V1:** se eligieron sitios llanos (no se tocó la malla ni los choques de la ruina).
7. **V2:** el fogón conserva la escala que se ve hoy (1), no la 1,15 con que se armaba: cambiarla agrandaría un 15 % el fuego ya visible.
8. **V3:** las placas se esconden de golpe al morir o irse (no se animan con la caída); es lo menos intrusivo.
9. **V6:** el calce es por rotación de cada pata (la raíz sigue pegada al tronco), con tope; en pendientes muy fuertes la punta puede seguir sin llegar al suelo (40 de 1500 puntas pasan el metro).
10. **V9:** sólo las fugas que se repiten cada noche o cada caída; no se tocó `desarmar` del asedio ni la subida de la nave.

## Preguntas (no se hicieron porque cambian cómo se juega o se ve)

- **G-7** (horno de la panadería, barril, mesa de quesería, etc. sin choque): ponerles choque cambia por dónde se camina dentro de los locales. ¿Lo hago?
- **G-8** (pasaje de 0,69 m en el torreón): hay que correr la mesa 10 cm al oeste (también la alfombra y el farol colgante) o achicar el radio del choque de todas las mesas de las ampliaciones. ¿Cuál preferís?
- **V7** (el suelo de las madrigueras en ladera): seguir el terreno obliga a una geometría por puesto en vez de una compartida. ¿Vale la pena el costo de memoria?
- **V8** (las huellas del Coihue se rearman enteras cada 5 m, ~7 ms medidos en Node): lo seguro es acumular geometría por rangos; es un cambio más grande. ¿Lo hago en otra versión?
- **V10** (todas las sombras largas de las antorchas con la opacidad de la más cercana): arreglarlo cambia el aspecto de la noche. ¿Lo querés?
- **V13** (postes del tablero con calce en laderas laterales): cambia el aspecto del tablero de trofeos.

## Para mirar en Electron (no verificado)

1. **V6, lo más importante:** la noche del Coihue caminando por una ladera: que las patas toquen el suelo, que la raíz no se separe del tronco, que no haya saltos al cambiar de pendiente y que las patas de cuesta arriba no se hundan raro.
2. **V3:** noche 10+ con adaptados: ¿las placas se ven igual que antes (forma, color por clase, tamaño en el enjambre)? Medir dibujos por cuadro con una oleada con nivel de adaptación 3 (debería bajar unos 4 por cada adaptado). ¿Se esconden bien al morir?
3. **V2:** noche grande con Herminia nivel 2: el farol con su llama dentro de la caja de vidrio; los cuatro fuegos con pulsos distintos.
4. **V1:** forzar una ruina (`soltarRestos()` con `?debug=1`) y mirarla de costado: debería caer en llano.
5. **V5:** que los nidos de la estación y del lago no queden con un tronco adentro.
6. **G-1 a G-4, G-6:** en el Relax, probar el fantasma de la herrería, la barraca y la casona sobre el puesto C, el andén del Riel Sur y la veta, junto al almacén y sobre el muelle: el fantasma debería ponerse rojo con el aviso.
7. **G-3:** fundar una herrería en el bosque y ver que no queda ningún tronco adentro (ni un claro demasiado grande).
8. **G-5:** con lluvia, parado dentro del galpón de herramientas y del cobertizo rural: no debería llover adentro.
9. **G-10:** reparar el techo de un puesto con lluvia y mirar si deja de llover adentro sin tener que caminar.
