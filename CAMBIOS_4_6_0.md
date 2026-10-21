# Hojarasca 4.6.0 — que todo el mapa tenga valor (paquete 1a)

Rama `v46-integra` (sobre la 4.5.1 sin carreras y la auditoría del mapa). Plan: `PLAN_MAPA_VALOR.md` («Decisiones tras
la auditoría»); datos: `AUDITORIA_MAPA_VALOR.md`. Hecho por tres equipos en paralelo y juntado acá; el detalle de cada
parte está en `CAMBIOS_4_6_PUESTOS.md`, `CAMBIOS_4_6_RECURSOS.md` y `CAMBIOS_4_6_GENTE.md`.

## Qué trae
- **Cuatro puestos de ruta abandonados que se reparan** (`puestos-ruta*.js`): Puesto de la Cantera, del Paso, de la
  Estepa y del Riel Sur, en coordenadas fijas. Tres etapas de $3.000 (10 tablas y 10 piedras en total); reparado da
  catre para dormir, fogón (F), depósito (reglas de la barraca, 40 de cada material) y mostrador con precios propios y
  caja de $5.000 que se repone $700 por día. **El Riel Sur es además la quinta parada de la trochita.**
- **Recursos de zona** (`recursos-zona*.js`) y cinco materiales nuevos (`junco`, `hierbas`, `arcilla`, `cuero`,
  `piedra-cantera`): veta de la cantera (6 piedras de cantera cada 2 días, con el pico de cantero, frente de roca nuevo),
  juncal (3 por día) y hierbas (2 por día) del mallín con la hoz, barranca de arcilla de la desembocadura (4 cada 2
  días, con la pala) y los 8 pehuenes del mirador que vuelven a dar 6 piñones cada otoño.
- **Herramientas de zona** (una sola lista, `HERRAMIENTAS_ZONA`): hoz de junco $900 (Josefina), pala de arcilla $1.100
  (Nicanor), cuchillo de cuero $1.000 (Fermín) y **pico de cantero** $4.000 con picapedrero nivel 3 (Tobías). El pico
  común pasa a llamarse **«Pico»**.
- **Tablón de encargos en la plaza** (`tablon*.js`): 3 a la vista por día, 1 entrega por día, 2 días de plazo, pagan
  ×1,5 / ×2 / ×2,5 según la distancia ($750–2.200; ~$1.650 por día simulado).
- **Gente del campo** (`gente-campo*.js`): Fermín Catrileo (pastor, galpón de esquila: lana y cuero), Belisario
  (arriero, junto al Puesto del Paso), Tobías Hughes (cantero, en la cantera), y **Nicanor y Josefina con pedidos y
  tiendita** («Pedidos y compras» en la rueda de charla).

## Decisiones de la junta
- Ids, nombres, precios y requisito de las herramientas salen de `recursos-zona.js`; la tiendita de la gente los lee de
  ahí y `darHerramientaDeZona` llama a `darHerramienta`. Fermín vende «cuchillo de cuero» (no «esquiladora»).
- Pico de cantero en **picapedrero nivel 3** (confirmado por el usuario).
- Con los valores de comercio de los materiales nuevos, el **cuero de Fermín sube a $750** y la **piedra de cantera de
  Tobías a $650**, para que no convenga comprarlos y revenderlos en un puesto; el encargo más barato del tablón queda en
  $750 (antes $700).
- Belisario y Tobías usan las posiciones de `PUESTOS_RUTA` (B y A).
- Las tres pruebas nuevas en el gate: `verificar-4-6-recursos`, `verificar-4-6-gente`, `verificar-4-6-puestos`.

## Verificación
- `npm run verify` de corrido sobre la rama juntada: **264 pasos OK** (4.5.1: 261 + 3).
- Pruebas nuevas: recursos 373 (367 + 6 del arreglo de abajo), gente 1615, puestos 451 comprobaciones OK.
- Partidas reales: ver «Partidas reales» abajo.
- **Con los arreglos pedidos por el usuario** (abajo): `npm run verify` de corrido → **267 pasos OK** (264 + `verificar-4-6-0-rocas`,
  `-mate` y `-detalles`). Una corrida intermedia falló en `verificar-3-6-2-juego` (mira tal cual la línea de main.js del vecino
  «de frente»): se puso el tablón antes de `lugarTapaVecino(…)` en esa línea, sin cambiar lo que hace.

## Pendiente
- Medir fps en la Ryzen 5 4600G con todo lo nuevo (`npm run medir:caminata`).
- Sin ver: calidades baja y muy baja, noche, invierno y lluvia; un día jugado a mano con el tablón y los puestos.
- El cuaderno sigue diciendo «cuatro paradas».

## Partidas reales
Corridas de a una, ocultas, con `herramientas\lanzar-electron.ps1` (perfil `%TEMP%\hx\perfil46`), después de `node armar.mjs`.

| Partida | Resultado |
|---|---|
| `humo-4-6-recursos` (primera vez que se corre) | Antes del arreglo: **8 fallas** (abajo). Después: **OK**, todas sus comprobaciones (cantera, mallín, barranca, se repone, pehuén en otoño, guardar y recargar) |
| `humo-4-6-gente` | **OK** (tablón, Fermín, Belisario, Tobías, Nicanor, Josefina y el guardado) |
| `humo-4-6-puestos` | **OK**, 0 errores de consola (los cuatro puestos, tres etapas, catre, depósito, fogón, mostrador, la trochita en el Riel Sur, recargar) |
| `humo-4-5-1-sin-carreras` | **OK**, 0 errores de consola |
| `humo-trucos` | 113 OK y la falla conocida de la 4.5.0/4.5.1: después de «Escape devuelve a la pausa», un script que tira en la página (igual que antes, no es de la 4.6) |
| `humo-4-2-pico` | 48 OK y 2 fallas **de antes**: «forjado: pico…» y «el libro anota "Pico forjado"» (desde la 4.4.2 el herrero ofrece primero el afilado y la prueba no se actualizó). Comparado con la 4.5.1 armada aparte: las mismas 48 OK y las mismas 2 fallas. La primera corrida dio además 3 fallas que **eran de la 4.6** (ver abajo) y una de tiempo («el aviso dice "Golpe 1 de 6"», pasó en las dos corridas siguientes) |
| `humo-2-9-vela` | **OK** (42) |
| `humo-3-8-6-relax` | **TODO BIEN** (19) |

### Lo que se arregló
- **La E y el aviso en los recursos de zona** (`main.js`, `recursos-zona-mundo.js`). Causa: los recursos de zona van en la lista de
  la E y del aviso con `!objetivo`, y `objetivo` (lo que mirás: `objetos.buscar`) incluye «Anotar» la planta o el árbol que todavía
  no está en el cuaderno. En el juncal, mirando al agua, el helecho de la orilla era el objetivo («Anotar helecho») y al pie del
  pehuén, el tronco («Anotar pehuén»): E anotaba en vez de cortar o juntar. De ahí las 8 fallas: +3 juncos, que vuelva al otro día,
  que quede al ras, +3 más, los piñones, y lo guardado y lo recargado (era consecuencia: no había juncos; verificado, después del
  arreglo pasan sin tocar la prueba). Arreglo, en un solo lugar para la E y el aviso (los dos miran `objetivo`): la acción de
  `recursosZona.accion` trae `gana`, y si el objetivo es «Anotar» una planta o un árbol y el recurso gana, el objetivo se anula.
  Gana: **en un punto (veta, juncal, hierbas, arcilla), si tenés su herramienta** (fuiste a trabajarlo; si todavía no volvió, el aviso
  dice cuándo); **en un pehuén, si tiene piñones para dar**. Sin la herramienta o fuera del otoño, «Anotar» gana como siempre, y en
  el resto del valle nada cambia (sólo se mira cuando estás en el radio de un punto o al pie de un pehuén). Además, **juntar los
  piñones anota el pehuén** en el cuaderno (si no, apenas juntabas volvía «Anotar pehuén» y tapaba «ya dio sus piñones»). Seis
  comprobaciones nuevas en `verificar-4-6-recursos`.
- **Dos pruebas con un carácter de retroceso donde iba `\b`** (de la 4.6): `humo-4-2-pico.cjs` (`/Pico\b/` en la lista del almacén
  y en la mochila: fallaban aunque el texto estaba bien) y `verificar-4-6-gente.mjs` (`/\b[Dd]e el\b/`: pasaba sin probar nada; con
  `\b` de verdad sigue OK).
- Gate después de todo: **264 pasos OK**.

### Capturas (vistas a tamaño completo)
- Cantera: el frente de roca y la piedra labrada al pie se apoyan; la cámara de la prueba queda muy pegada al frente (casi toda la
  pantalla es roca). En la de Tobías se ven **rocas flotando en la ladera de atrás** (el bug viejo de `vegetacion.js`: arreglado después, ver «Arreglos pedidos por el usuario»).
- Mallín: el juncal y las hierbas, bien; **crecido y «al ras» casi no se distinguen** a esa distancia entre el pasto alto y el helecho (arreglado después).
- Barranca de arcilla: la tierra y los panes en la orilla, nada flotando.
- Pehuén: la cámara queda contra el tronco (no se ve el árbol); bien la nota «Nuevo en el cuaderno: Pehuén» y «+6 piñones».
- Tablón: bien apoyado; **un farol de la plaza queda pegado detrás**, y de cerca su cabeza asoma justo encima del techito del tablón (arreglado después).
- Fermín, Belisario, Tobías, Nicanor y Josefina con los pies en el suelo.
- Puestos: los cuatro reparados se apoyan (B, en la ladera, sobre su zócalo de piedra); en el de la Cantera, **un árbol grande
  parece salir del techo visto de frente** (arreglado después).

### Otro hallazgo (de antes)
- `src/vecindad-social.js` (`INVITA_TEXTO.mate`) tenía un retroceso en lugar de `\b` (`/<retroceso>mate/i`), ya en la 4.5.1:
  **arreglado** (ver «Arreglos pedidos por el usuario»).

## Arreglos pedidos por el usuario
Después de cerrar la 4.6.0 (264 pasos), cinco cosas que pidió el usuario. Cada una con su prueba de Node en el gate.

### 1. Rocas flotando en las laderas de todo el valle (`vegetacion.js`, `bichos.js`)
- **Causa:** las rocas del sotobosque y las de los grupos del paisaje se ponían derechas, a la altura del suelo en su centro
  menos 0,2 (o 0,16) × escala. En pendiente el suelo cae bajo la huella y el lado de abajo de la roca quedaba en el aire (en las
  laderas de los bordes del valle, con pendiente de 1,2 a 1,9, el borde de abajo a 2 m y una panza de hasta 5 m).
- **Arreglo** (`colocarRoca`): sin tocar cuántas son ni dónde están en planta, ni los números al azar que se sacan (el bosque
  sale igual: las pruebas del bosque y la huella del terreno siguen idénticas), cada roca se **acuesta con el plano del suelo
  bajo su huella** (así queda sobre la ladera como en lo llano) y **se hunde lo necesario**: donde el suelo real cae por debajo
  de ese plano bajo su cintura (el borde), y donde la panza que sobresale de una ladera muy empinada quedaría a más de 0,5 m
  del suelo. En lo llano no cambia nada. Se descartó el arreglo de una línea propuesto (hundir por el mínimo de 8 puntos): en
  las laderas fuertes enterraba las piedras hasta dejarlas como manchas verdes (se probó y se vio en capturas: el valle se
  quedaba casi sin rocas).
- La **lagartija** se sube ahora arriba de la piedra de verdad (`ref.arriba`): con «suelo + 0,35» quedaba en el aire sobre
  las rocas hundidas.
- **Números** (medidos en Node con el valle armado, exacto: líneas verticales cada 10 cm contra los triángulos de cada roca):

  | Calidad | Rocas | Antes: con un lado del borde en el aire > 25 cm (peor) | Después (peor) | Antes: aire bajo alguna parte > 25 cm (peor) | Después: panza más alta |
  |---|---|---|---|---|---|
  | media | 665 | **417** (1,96 m) | **0** (0,17 m) | 557 (5,09 m) | 0,63 m |
  | alta | 640 | 384 (1,75 m) | 0 (0,15 m) | 528 (4,65 m) | 0,65 m |
  | baja | 639 | 409 (1,69 m) | 1 (0,33 m) | 563 (4,54 m) | 0,53 m |
  | muy baja | 661 | 433 (1,85 m) | 0 (0,17 m) | 581 (5,31 m) | 0,59 m |

  Ninguna queda enterrada del todo (la que menos asoma, 15 cm); en lo llano asoman como antes (mediana ~0,56 m). Rincón de
  la cantera (60 m alrededor de la veta), media: 15 de 19 con aire debajo antes, 0 después. (El análisis de
  `CAMBIOS_4_6_RECURSOS.md`, 487 de 665 y la peor a 3,85 m, usaba otra cuenta; con la de acá el «antes» da 417 / 557.)
- Las rocas que se pican con el pico (pedreros, 4.2) siguen igual: el choque es en planta (no cambia) y `humo-4-2-pico` da sus
  48 OK de siempre. Carga: la cuenta suma ~20–40 ms en Node.
- Prueba nueva: `verificar-4-6-0-rocas.mjs` (14 comprobaciones; media y baja).
- **Lo que cambia a la vista:** en las laderas empinadas las rocas quedan acostadas y más metidas en el suelo (se ve el lomo
  con musgo, no la panza oscura); de lejos las laderas se ven con menos manchas oscuras.

### 2. El mate en las invitaciones (`vecindad-social.js`)
- **Causa:** `INVITA_TEXTO.mate` tenía un carácter de retroceso (código 8) en lugar de `\b`; nunca encontraba «mate».
- **Qué cambia en el juego:** cuando un vecino viene a invitarte (la iniciativa), si su frase propia de invitación nombra algo
  que se puede hacer ahora, la dice 6 de cada 10 veces y te invita a eso. **22 vecinos** tienen frase propia y todas son de mate
  («¿Un mate?»): antes ninguno la decía (siempre una genérica, a cualquier cosa); ahora la dicen y la invitación es al mate.
- **Arreglo:** `/\bmate/i` (verificado el byte: barra invertida y «b»; ningún carácter de control en `src/` ni `pruebas/`).
- Prueba nueva: `verificar-4-6-0-mate.mjs` (7 comprobaciones: la expresión, «tomate» no, los 22 dicen su frase; con el
  código de antes falla).

### 3. Detalles visuales
- **a. El árbol que salía del techo del Puesto de la Cantera** (`puestos-ruta-mundo.js`, `main.js`). Era un coihue grande
  (escala 1,25) a 11 m detrás, en calidad media. Ya existía el mecanismo (`veg.despejar`, el claro de 7,5 m de cada puesto);
  se suma un **claro sólo de árboles detrás de cada puesto** (centro a 6 m por la espalda, radio 6,5: hasta 12,5 m), sin tocar
  matas ni pasto. Los árboles no se mueven ni se borran del bosque (las pruebas del bosque siguen igual). Saca, además, dos o
  tres troncos de atrás del Puesto del Paso; el de la Estepa y el del Riel Sur no tienen árboles cerca.
- **b. El farol pegado detrás del tablón** (`tablon-mundo.js`, `main.js`). El tablón se corrió de lx −5,4 a **−2,4** por el
  frente de la plaza (sigue entre el lote y la vereda de la calle de la Vía): el farol más cercano queda a 3,3 m, al costado,
  no detrás del techito. En el lugar nuevo, el jefe de estación (al pie de la soga del mástil, 2 m detrás) se comía la E
  («Hablar con Ernesto Llancafil»; `humo-4-6-gente` fallaba): **delante del tablón, la E es del tablón** (como en el mostrador o
  la cantina: al vecino hay que mirarlo de frente). Con eso `humo-4-6-gente` pasa (dos veces).
- **c. El juncal y las hierbas del mallín** (`recursos-zona-mundo.js`, `main.js`). Crecido: juncos de 1,4 a 2,4 m (antes 1 a
  1,7), más gruesos, verde junco oscuro y con más espigas pardas; las hierbas, más grandes y con flores más grandes. Al ras:
  tocones color paja y ocho manchones de rastrojo claro en el suelo; las hierbas cortadas, chatas y pálidas. Y los dos tienen
  su **propio claro** (sin helechos de sotobosque ni pasto alto encima). Menos geometría que antes: 2.624 triángulos en todo lo
  de zona (antes 3.048; los tallos van sin tapa de abajo). Los números al azar son los mismos.
- Prueba nueva: `verificar-4-6-0-detalles.mjs` (25 comprobaciones: el claro de atrás en media y alta, el tablón lejos de los
  faroles y la E, el juncal alto/bajo y su color, la geometría).

### Capturas antes/después (vistas a tamaño completo; fuera del repo)
- **Laderas** (calidad media): la de atrás de la cantera (desde (−395, −300) y desde (−422, −300)) y la del borde este de la
  estepa (desde (425, 124)). Antes: las rocas oscuras flotando sobre la ladera. Después: apoyadas, acostadas con la pendiente,
  el lomo con musgo. De lejos se notan menos (es lo que se ve; se probó hundir más y el valle quedaba sin rocas).
- **Puestos** de frente, media y alta: en la Cantera ya no hay tronco saliendo del techo; en el Paso salió el tronco que
  quedaba justo detrás (quedan los del bosque, más lejos).
- **Tablón** de cerca (al atardecer, con los faroles prendidos), de lejos y de costado: antes la cabeza del farol asomaba sobre
  el techito; después los faroles quedan al costado. De costado (desde adelante a la derecha) todavía se ve algún farol del
  sendero por encima, más atrás: es la perspectiva.
- **Juncal** crecido y al ras, de cerca (2,6 m de alto) y de lejos: antes no se distinguían; después, crecido es un manchón de
  juncos altos y oscuros y al ras un rastrojo claro.

### Partidas reales (ocultas, de a una, perfil `%TEMP%\hx\perfil46`)
| Partida | Resultado |
|---|---|
| `humo-4-6-recursos` | 4 corridas: 2 OK y 2 con una falla de tiempo cada una («y ese pehuén ya dio este otoño»; otra vez «la veta vuelve en 2 días», con el aviso tapado por «El perro marca algo cerca»). **Con la 4.6.0 de antes de estos arreglos pasa lo mismo** (2 corridas: una con esas dos fallas, otra OK): no es de esto |
| `humo-4-6-gente` | Primero **falló** (el jefe de estación se comía la E del tablón en el lugar nuevo); arreglado: **OK** dos veces |
| `humo-4-6-puestos` | **OK** (59), 0 errores de consola |
| `humo-4-2-pico` | 48 OK y las 2 fallas viejas conocidas («forjado: pico…» y «el libro anota "Pico forjado"»); ninguna otra |
| `humo-3-7-4-rueda` (la vida social, con la iniciativa) | **OK** (53) |

### Sin verificar
- fps en la 4600G con las rocas nuevas (la cuenta es sólo al cargar; lo que se dibuja es lo mismo).
- Las laderas en baja y muy baja sólo medidas en Node, no vistas; las invitaciones al mate, sólo en Node (la partida de la rueda
  no fuerza una invitación de mate).
- Un día jugado a mano con el tablón en el lugar nuevo (la gente que camina por el frente de la plaza).
