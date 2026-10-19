# 4.2: almacenaje con tope, huerta, granja y exteriores

Rama `v42-almacen` (sale de `v42-pico` = 4.0.5 + pico y picapedrero + costo en pesos de las piezas). No se subió la versión, no se hizo push ni merge. Dos partes: (1) una familia de depósitos con **tope de capacidad que se amplía pagando pesos**, integrada con el acopio, y (2) doce piezas de huerta, granja y exteriores. Todo sólo en el Relax. Sin inglés (el usuario lo decide al final) y sin mando.

## Parte 1: almacenaje con tope

### Las cinco piezas (O → Trabajo)

| Pieza | Guarda | Tope por nivel | Construir | Ampliar (pesos + materiales) |
|---|---|---|---|---|
| **Pila de piedra** | piedra | 30 | 6 piedras, 1 tronco (sin pesos) | no se amplía |
| **Depósito de piedra techado** | piedra | 60 · 100 · 160 | 8 tablas, 4 troncos, 10 piedras + **$3.000** | $2.000 (6 tablas, 8 piedras) y $4.000 (10 tablas, 14 piedras, 3 troncos) |
| **Barraca de materiales** | troncos, tablas, piedra y lana (el tope vale **por cada uno**) | 40 · 70 · 110 · 160 | 28 tablas, 12 troncos, 12 piedras + **$12.000** | $3.500 (12 tablas, 4 troncos), $6.500 (16 tablas, 6 troncos, 8 piedras) y $11.000 (24 tablas, 8 troncos, 12 piedras, 4 lana) |
| **Silo y granero** | cosecha: habas, papas, frutillas y calafates (tope **de todo junto**) | 60 · 120 · 200 | 24 tablas, 10 troncos, 14 piedras + **$9.000** | $3.000 (10 tablas, 4 troncos) y $5.500 (16 tablas, 6 troncos, 6 piedras) |
| **Herramientero** | hacha, pico, tijera, mosca, farol y botas (ganchos) | 4 · 6 ganchos | 6 tablas, 2 troncos, 1 piedra + **$1.200** | $900 (4 tablas, 1 tronco) |

Los precios siguen `PRECIOS_CONSTRUCCION.md` (redondos a $50, entre 1 y 4 veces el valor de los materiales, dentro de «mueble bueno» o «lujo»; la pila no lleva pesos porque es barata). Las ampliaciones suben de precio en cada paso.

### Cómo se usa

- **E** junto al depósito: guarda lo que llevás hasta el tope («Guardaste en la barraca · Troncos 40/40 · Tablas 12/40…»); lo que no entra se queda en la mochila. Sin nada a mano, **E saca todo**. El cartel de la E dice qué va a hacer y el tope: «Guardar en el depósito (Piedra 18/60)», «Sacar del depósito (Piedra 60/60)», «Barraca de materiales llena (…) · Mayús + E para ampliar».
- **Mayús + E** amplía, **en dos pasos**: la primera vez dice qué sube y cuánto cuesta («Sube el tope de 60 a 100 · cuesta 6 tablas, 8 piedras y $2.000. Mayús + E otra vez para confirmar») y **no cobra**; la segunda (entre 0,6 y 12 segundos después, sobre el mismo depósito) cobra y amplía. Sin plata o sin materiales avisa y no hace nada. En el máximo lo dice.
- **Pagar construyendo**: mientras estés a menos de 18 m de un depósito de materiales (el mismo radio del acopio), lo que construís se paga **primero del acopio, después de los depósitos (el más cercano primero) y por último de la mochila**. Vale para todo lo que ya usaba `conMateriales` (obras, ahumadero, horno, telar…); el panel de construcción suma «en depósitos t/t/p» y los avisos de «Faltan…» cuentan lo guardado cerca.
- **Desarmar** (Mayús + Supr), el viento y el desalojo de obras devuelven lo guardado a la mochila (o a lo juntado, la cosecha) por el mismo camino que ya devolvía la leñera, el tendal o la colmena (`devolverContenido`), y la nota lo dice. Al desmontar con Mayús + Supr vuelve además **la mitad de los pesos y de los materiales de las ampliaciones** que hiciste.
- **Se ve**: la pila de piedra, los cajones del depósito, las pilas de la barraca (troncos, tablas, piedra, lana) y los costales y el medidor del silo crecen en cuatro pasos a medida que se llenan; cada ampliación cambia la obra: el depósito arma un cajón más, la barraca suma estantes y un altillo con su escalera, el silo gana un tramo de altura (y un zuncho), el herramientero un tablero con dos ganchos más. La malla se rehace sólo cuando cambia el paso o el nivel, no por cuadro.

### El acopio de siempre

**Decisión mía, hay que mirarla:** el acopio también tiene tope desde ahora, **40 de cada material** (si no, la familia nueva no tendría sentido: un cajón sin tope le gana a todo). Lo que una partida vieja ya tenía de más **se queda** (no se recorta, no se pierde nada); sólo no entra más. Al llenarse avisa y manda al depósito. No toqué su ficha (su traducción al inglés está pegada a ese texto): el tope se ve en la nota al guardar («Hay 40/5/10 (tope 40 de cada uno)»).

### Decisiones de diseño

1. **La ampliación NO es una etapa de la obra.** Probé el camino «etapas de la construcción» en el código: una obra sólo «funciona» cuando están hechas **todas** sus etapas (`datos.etapas >= plano.etapas.length`, en más de 30 lugares: física, funciones, cubiertas, E…), así que un depósito de cuatro etapas no se podría usar hasta ampliarlo del todo. En cambio el nivel vive en `datos.almacen.n` y **la ampliación usa la maquinaria de pesos por etapa** de `obra-pesos.js`: cada almacén registra sus precios con el id `ampliar-<plano>` (`registrarPrecios`), y se cobra con `puedePagarEtapa`/`pagarEtapa` (libro de la billetera: «Ampliación: barraca de materiales»), con el aviso de «te faltan $X. El banco te puede prestar» y con el reintegro de la mitad al desmontar (`reintegroAlDesmontar`). Sin economía (el Desafío, una partida sin `economia`) no cobra, igual que el resto; los depósitos son `soloRelax`.
2. **Cada depósito guarda lo suyo** (`datos.almacen`), no un solo pozo común como el acopio. Por eso al desarmar **cualquiera** vuelve lo suyo (no hace falta que sea el último: `vaciarUltimoAcopio` sigue igual para el acopio) y mover un depósito con Mayús + Y se lleva lo guardado (razonado: el contenido es parte de los datos de la obra; no lo probé moviendo).
3. La piedra de una ampliación sale del mismo depósito si hace falta (se paga igual que cualquier obra): ampliar un depósito lleno usando su propia piedra es válido.
4. **El silo guarda la cosecha pero nada la consume desde ahí**: la cocina, el trueque y el mercado leen `progreso.entradas`, así que lo del silo se saca con E para usarlo. No quise tocar los muchos lugares que leen entradas (sería mecánica nueva y riesgo alto). Si querés que la cosecha del silo cuente sola, es un pedido aparte.
5. **El herramientero es decorativo con función de guardar**: «colgar» muestra las herramientas que tenés en los ganchos (hacha, pico, tijera, mosca, farol, botas) pero **siguen a mano** (si se sacaran de la mochila, no se podría talar ni picar). El tope son los ganchos: 4, y 6 con la ampliación.
6. El piso de la barraca (0,35 m) y del depósito (0,30 m) está levantado y se sube con un escalón (física de plataforma): con el piso a ras el pasto alto tapaba todo lo guardado (se vio en la primera captura).
7. Campo nuevo de plano `radioE` (alcance de la E desde el centro, para lo grande: barraca 3,4 m, depósito 2,9, silo 2,8): `obraQueTrabajaCerca` ahora lo respeta; para el resto no cambia nada.
8. `devolverContenido` llama a `almacenJuego` con un `typeof`: varias pruebas viejas (3-5-1, 3-6-2, 3-8-3, 3-8-6, 3-8-7) cortan esa función de `main.js` y la corren sola; así siguen pasando sin tocarlas.

### Guardado

Campo nuevo `datos.almacen = { n, g }` en cada obra de almacenaje (nivel y lo guardado por clave), sólo en las obras que lo usan; `guardado.js` lo sanea (nivel que existe, sólo las claves que ese almacén guarda, enteros positivos; **lo guardado no se recorta al tope**; una obra de antes no lo trae y no se le inventa uno; uno roto se descarta). Partidas viejas: intactas.

## Parte 2: huerta, granja y exteriores (doce piezas, sin mecánica nueva)

Archivo propio `src/planos-exteriores.js`, un import y un `PIEZAS.push` en `construccion.js`. Categorías que ya existían (nada nuevo, `PLANOS_POR_PAGINA` intacto). Todas `soloRelax`, sólo tipo 0 y 4, sin luces, y todas con su física (menos el camino, que se pisa). Triángulos (con lo guardado al máximo, en los depósitos): pila 428, depósito 672, barraca 892, herramientero 492, silo 476; las otras entre 224 y 768.

| Pieza | Categoría | Materiales | Pesos | Qué es |
|---|---|---|---|---|
| Huerta en terrazas | Exterior | 20 piedras, 4 tablas, 2 troncos | $3.000 | tres terrazas de piedra seca con tierra, hileras de verdura y escalera (de adorno: se siembra en los canteros) |
| Establo para el caballo | Trabajo | 26 tablas, 10 troncos, 4 piedras | $6.000 | tres paredes, techo a una agua, pesebre con heno, balde, pacas y herradura |
| Corral grande | Trabajo | 14 troncos, 6 tablas | $3.000 | 6 × 5 m de postes y tres varas, tranquera abierta, bebedero y pasto |
| Cobertizo de heno | Trabajo | 6 troncos, 10 tablas | $2.000 | techo sobre cuatro postes con pacas apiladas y una horquilla |
| Palomar | Exterior | 10 tablas, 3 troncos | $1.500 | casita con seis nichos sobre un poste con riostras y tres palomas |
| Aljibe de piedra | Exterior | 18 piedras, 3 tablas | $2.500 | tanque redondo de piedra con tapa, canaleta, canilla y balde |
| Pozo con balde | Exterior | 12 piedras, 3 tablas, 2 troncos | $2.000 | brocal de piedra, bastidor con manivela, techito y balde |
| Tranquera | Exterior | 4 troncos, 4 tablas | $1.000 | dos postes con la hoja abierta a medias; se encadena con el cerco |
| Portón con arco | Exterior | 16 piedras, 6 troncos, 6 tablas | $4.000 | dos pilares de piedra, arco de madera, farol y dos hojas abiertas |
| Puente de piedra | Exterior | 36 piedras, 2 tablas | $5.000 | un ojo de arco, tablero a 1,05 m con tres escalones de piedra a cada lado y parapetos |
| Pirca de campo | Exterior | 14 piedras | — | tramo de muro de piedra seca; se encadena |
| Camino empedrado | Exterior | 12 piedras | — | tramo de calle de canto rodado con cordones; se encadena y se pisa |

Seis consumen piedra (el pico), más la pila y el depósito. No se duplicó nada de lo que había: invernadero, bebedero, mirador, pasarela, embarcadero, gallinero, tambo, chiquero, paridera, colmena, vivero, cerco, seto, senda de piedra y los pozos y muros de la defensa (del Desafío); la prueba lo mira por id y por nombre. Las piezas «comunes» que se encadenan (pirca, camino) no llevan pesos, como el cerco.

## Archivos

Nuevos: `src/almacen.js` (la lógica pura: topes, ampliaciones, resumen, saneo; registra los precios de ampliación), `src/almacen-juego.js` (E, Mayús + E, pago desde los depósitos, devolución), `src/planos-almacen.js` (las cinco piezas), `src/planos-exteriores.js` (las doce), `pruebas/verificar-4-2-almacen.mjs`, `pruebas/humo-4-2-almacen.cjs`, este informe.

**Compartidos (los que pisan a otros bloques):**
- `src/construccion.js`: dos imports de una línea, `PIEZAS.push(...PIEZAS_ALMACEN, ...PIEZAS_EXTERIORES)` junto al de lujo, y `rehacer` en el objeto que devuelve `crearConstruccion`.
- `src/main.js`: el import, `almacenJuego` (junto al acopio), `materialesVisibles`/`conMateriales`/`usarAcopio` (depósitos y tope), `devolverContenido`, la rama de Mayús + Supr, `avisoObra24`/`usarObra24`, `OBRAS_QUE_TRABAJAN`, `obraQueTrabajaCerca` (`radioE`), la tecla E (Mayús + E) y la línea del panel de construcción. Todo con comentario `// 4.2`.
- `src/guardado.js`: el import y una línea en `sanearObras`.
- `package.json`: la prueba nueva en `verify:pasos` (con `sumar-prueba.cjs`).

## Pruebas y verificación

- **Verificado** (`pruebas/verificar-4-2-almacen.mjs`, 624 comprobaciones en Node): topes por nivel y guardar hasta el tope en los cinco, resumen, ampliaciones y su precio en el registro de pesos (cobro, libro, aviso, reintegro, Desafío y partida sin economía), saneo y guardado (con partida vieja), el módulo del juego con un mundo de mentira (alcance de 18 m medido, avisos y notas, pagar del más cercano primero, devolver una sola vez, ampliar en dos pasos con el tiempo de por medio, la confirmación que no pasa a otro depósito), las 17 piezas (existen, precio dentro de la escala y entre 1 y 4 veces los materiales, geometría sana con el depósito al máximo y lleno, sólo tipo 0 y 4, presupuesto de triángulos, dentro de lo que dicen medir, física sana, sin duplicar nada) y el cableado de `main.js`/`construccion.js`/`guardado.js`.
- **Verificado en el juego real** (`pruebas/humo-4-2-almacen.cjs`, Electron con las teclas de verdad, partida del Relax): el menú muestra precio y capacidad; la pila guarda 30 y avisa llena; el depósito guarda 60, Mayús + E muestra el precio sin cobrar y la segunda lo cobra ($2.000 y $4.000, libro, 6 tablas y 8 piedras), el tope sube a 100 y 160, el máximo avisa, sin plata y sin materiales avisan y no hacen nada; **un pozo se construye con la mochila sin piedra y la paga el depósito** (160 → 148) y a 60 m su piedra no cuenta; la barraca guarda cada material hasta su tope, se amplía tres veces, el guardado lleva el nivel y lo guardado, **al desarmarla vuelve todo a la mochila y la mitad de los pesos de las ampliaciones**; el silo toma 60 de cosecha de lo juntado y E saca todo; el herramientero cuelga cuatro herramientas que siguen a mano y la ampliación suma dos ganchos; el acopio guarda 40 y deja 30 en la mochila; las doce piezas se construyen cobrando lo que dicen; el camino se pisa, el piso de la barraca y el puente se suben y se cruzan.
- **`npm run verify` completo, UNA vez y de corrido: «verify: 247 pasos OK»** (incluye la prueba nueva, que quedó en el gate con `sumar-prueba.cjs`).
- **Capturas** (tamaño completo, mirándolas una por una): `C:\Users\Andres\Documents\Hojarasca\salida-cantina\almacen\` — `01` menú de la barraca, `02` pila llena, `03` depósito lleno, `04`/`05` depósito ampliado poco y lleno, `07`/`08` barraca nivel 0 y nivel 3 llena, `09`/`10` silo lleno y ampliado, `11`/`12` herramientero con 4 y 6 ganchos, `20` a `31` las doce piezas.
- **Lo que las capturas hicieron corregir**: con el piso a ras el pasto tapaba todo lo guardado (se levantó el piso), las maderas se veían casi negras (se aclararon), el herramientero tenía herramientas negras sobre madera oscura, el medidor del silo no mostraba el grano, el puente de piedra no se leía como puente (se rehízo con arco visible y escalones), y varios avisos decían «de el depósito» o «llena» para un masculino.

**No verificado:** recargar de verdad el juego desde el disco con un depósito lleno (sí se probó que el guardado serializa nivel y contenido, y el saneo en Node); caminar por dentro de la barraca con el altillo (el altillo es sólo visual y está bajo el dintel, no se probó la cabeza contra el techo con el nivel 3); que el cuerpo choque contra cada pieza nueva (sólo se miró la física en Node; sí se probó en el juego que el camino se pisa y que el piso de la barraca y el puente se suben y se cruzan: piso a 0,36 m, tablero del puente a 1,05 m y escalones a 0,63 y 0,24 m); fluidez en la Ryzen 5 4600G (razonado: no hay nada nuevo por cuadro; `cerca()` es una consulta espacial chica por llamada (con el índice de obras); se llama desde el panel de construcción, al construir y, estando junto a un ahumadero o un telar, una vez por cuadro por su aviso (ahí `materialesVisibles` ya hacía la cuenta del acopio); las mallas se rehacen sólo al guardar, sacar o ampliar); el balance de los topes y los precios (razonado con la escala, no jugado a lo largo de días); el sonido (se usa `juntar`, el de siempre).

## Lo que no quedó

- La cosecha del silo no se consume sola desde ahí (decisión 4).
- No se tocó la guía (F1) ni el cuaderno: sus textos están pegados a las traducciones al inglés; las notas nuevas están sólo en castellano (inglés al final, como pidió el usuario).
- Sin mando.
- El tope del acopio (40) es decisión mía: si preferís que siga sin tope, es una línea (`TOPE_ACOPIO` en `almacen.js`, y `usarAcopio` en `main.js`).
- Las piezas de la parte 2 no tienen uso (son de adorno y de límite): no hay mecánica de establo, palomar, aljibe ni pozo, como se pidió.
