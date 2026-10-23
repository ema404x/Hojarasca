# 4.8.1 «aro»: ya no hay naves espaciales (rama `v481-aro`, sale de `v48-integra`)

El usuario ve naves espaciales de noche en el Desafío y pidió que no estén más. Cada noche los duendes salen ahora de **un aro de hongos y
raíces en el suelo del bosque**; no se sube la versión (sigue 4.7.0 en `package.json`).

Las capturas están en `pruebas/salidas/aro-481/antes` y `.../despues` (misma herramienta, `pruebas/fotos-4-8-1-aro.cjs`, con `-Visible`), y
las de la partida de prueba en `pruebas/salidas/sin-naves-481`. Los sonidos, como `.wav`, en `pruebas/salidas/aro-481/sonidos` (no se
suben al repositorio: `pruebas/salidas/` está ignorado).

## 1. Relevamiento: qué veía el usuario (capturas «antes», a tamaño completo)

| Qué | Dónde está | Captura «antes» |
|---|---|---|
| **El platillo de cada noche**: casco gris de 9 m (×1,5), anillo, cúpula de vidrio verde, 14 luces verdes que giran, **haz tractor verde** hasta el suelo y **dos reflectores** que barren el valle; llegaba desde 260 m de altura | `mallaNave()` y `actualizarNave()` de `desafio.js` | `antes/n1-t4_5-jugador.png` (el platillo con el haz), `antes/n1-t20-jugador.png` (con los reflectores), `antes/n5-t4_5-cerca.png` (el haz desde el suelo); noches 5, 12 y 20: `antes/n{5,12,20}-*` |
| **La cápsula estrellada** (no estaba en la lista): casco gris, vidrio verde y **una columna de luz verde de 90 m**; el tutorial mandaba a «buscar la columna de luz verde que cayó del cielo» | `desafio.js` («la cápsula estrellada con la pistola de plasma») y `main.js` | (se ve en `antes/puesto-dia-lejos.png`, a lo lejos) |
| **Los restos**: casco metálico gris de paneles, costillas de metal, placas de descarga cian y **columna de luz cian de 80 m** | `desafio-eventos.js` | `antes/ruina-dia-*.png`, `antes/ruina-noche-*.png` |
| **El haz dorado de 70 m** sobre el hongo alto de cada puesto (los puestos ya eran madrigueras desde la 3.8.0) | `desafio-puestos-mundo.js` | `antes/puesto-noche-lejos.png` |
| La cueva (el nido): cúpula con cámaras **verdes** y aros **cian** | `desafio-eventos.js` | `antes/nido-*.png` |
| Textos: la mayoría ya estaba limpia desde la 3.8.0 (los «restos» ya se llaman «troncos huecos»); quedaban «los planos se ganan de los restos de las naves» (×2, `trucos-textos.js`) y el tutorial de la cápsula | | |
| El Coihue Viejo (noche final y asedio): **sin platillo** (`antes/n20-*`: es el Coihue caminando) | no se tocó | |

Los puestos de los invasores (vaina, generador) ya eran «bolsa de esporas» y «semilla dorada» dentro de una madriguera: sólo quedaba el haz.

## 2. Qué cambió

**El aro** (`src/duendes-modelo.js` → `mallaAro`, `src/desafio-aro.js` cuentas puras, `src/desafio-aro-mundo.js` mundo; `mallaNave()` sigue y arma el aro)
- Loma de tierra removida con la boca oscura en el medio, 9 raíces gruesas, tres hongos grandes con las laminillas encendidas, tres
  «faroles» altos de sombrero encendido (se ven de lejos), medianos y chicos, y hojas. Una tapa de tierra y hojas con que se cierra.
- Las fases y los tiempos son los de siempre: **llegando 4 s** (brota de abajo de la tierra con polvo, bruma dorada y el crujido de las
  raíces; antes caía 260 m), **bajando** (los duendes salen de a uno, con la cola, los señuelos y el ritmo de 4.8 ataques; sube una columna
  de luciérnagas y esporas doradas de 5 m: son halos, no un haz), **vigilando** (hongos que laten suave; sin reflectores) y **yendo 5 s**
  (se hunde, se tapa con tierra y hojas y la tapa se hunde: al esconderlo no hay salto).
- Los duendes **nacen 2,6 m bajo tierra y suben a 1,3 m/s**: tardan 2 s, igual que antes caer 16 m a 8 m/s (`TARDA_EN_SALIR`, probado). Los
  que saltan del Coihue siguen bajando como antes. Cada salida suelta polvo, un destello dorado y un ruido de tierra.
- Se pega al terreno vértice por vértice (una vez por noche) y brota hundiéndose bajo la tierra (nada escala: no flota en una ladera).
- Luz: la fija `luzNave` (misma, registrada, ninguna luz puntual nueva): **ámbar 0xffb060, intensidad 3,2, alcance 34** (antes verde, 80, 90).
- Barato: tres mallas fusionadas con los mismos materiales que el nido y las madrigueras (ningún shader nuevo: «programas nuevos 0» medido),
  un solo dibujo de puntos para todos los halos, sin sombras, con culling. Se sacó `crearMallaNave` (no la usaba nadie).

**Los otros restos**
- **Ruinas de los restos** (`mallaRuina`): tablones de corteza vieja quebrados arriba, bloques de piedra con musgo, arcos de raíz cruzando el
  pasillo, lajas, un pedestal con raíces, hongos de luz. Las placas de descarga son camas de raíz con un disco de esporas que late y un halo; la
  columna cian de 80 m es un hilo de luz dorada de 12 m; el premio es una semilla dorada. **Mismas medidas, paredes que chocan, trampas
  (daño, radio, ritmo), dormidos y premio** (probado).
- **Cofre de la pistola** (antes la cápsula): un cofre viejo entre raíces y piedras con musgo; sin hilo de luz (suelta esporas) ni sombras.
- **Puestos**: el haz de 70 m es ahora ocho esporas que suben apenas del hongo alto. Mismas vidas y mecánica.
- **Nido**: cámaras doradas y aros ámbar; los destellos de lo que se recupera (cian/verde) son dorados.
- **Textos**: «los planos se ganan en las ruinas del bosque (los troncos huecos de los duendes)» ×2; el tutorial: «Hay un cofre de los
  duendes entre las raíces: buscá el hilo de luz dorada»; README y comentarios. Las tablas de inglés no se tocaron (la frase del tutorial
  queda sin traducción hasta que se traduzca todo, como pasa con cualquier texto nuevo).
- Decisión: la prueba pedía «las ruinas del bosque», pero en el juego estas ruinas ya se llaman «troncos huecos» (guía, mapa, logros): quedaron
  los dos nombres juntos para no tener dos cosas distintas. Si se prefiere uno solo, es cambiar dos frases.

## 3. El sonido nuevo (nadie lo pudo oír acá: descripción y medidas)

`src/desafio-aro-sonido.js`, muestra por muestra con las primitivas del juego (`sonido-sintesis.js`), sin osciladores ni archivos; no toca los
archivos de sonido de ambiente. Reemplaza al zumbido (`S.zumbido`, que se dejó en `desafio-sonidos.js` para el Coihue).
- **Viento grave**: ruido pasabajos a 150-280 Hz que se abre y se cierra despacio, más el soplo de un hueco grande (resonancias a ~110 y ~175 Hz).
- **Crujido de raíces**: madera que se frota y se suelta (pulsos irregulares de 14 a 40 por segundo que hacen sonar dos resonancias entre
  150 y 520 Hz, con un deslizamiento), con algún «tac» seco de rama; tierra que se desmorona (granitos de ruido); un retumbo de 40 a 70 Hz.
- Cuatro sonidos: `brota` 4,2 s (viento que sube, retumbo, crujidos y tierra), `crujido` 2,6 s ×3 variantes (se repite cada 2,2 a 3,4 s
  mientras el aro está: antes el zumbido, cada 1,3 s), `sale` 1,8 s ×3 (un terrón que se abre y un golpe hueco de tierra, con hojas) y
  `cierra` 5,2 s (tierra que cae, hojas que se acomodan y un retumbo que se apaga).
- Medidas (`verificar-4-8-1-sin-naves.mjs` las exige): pico 0,70 (ninguna muestra pasa de ahí; 0,02 % a 0,7 % cerca del tope), RMS 0,18 a 0,26,
  sin continua, 77 a 97 % de la energía abajo de 400 Hz, variación del nivel en ventanas de 50 ms de 0,49 a 0,85 (un zumbido parejo da <0,1),
  entra y sale sin clic, se genera en 11 a 56 ms cada uno. Al reproducirlo: niveles 0,3 a 0,55 del buffer.

## 4. Rendimiento (notebook Ryzen 7 7730U: sólo vale antes/después; **falta medir en la 4600G**)

- `herramientas/medir-aro.cjs` (nuevo; semilla fija, mismo punto de bajada; 2 rondas alternando): lo que **aporta la nave o el aro** solo, el
  mismo cuadro con y sin: **nave 17-21 dibujos y ~2.000 triángulos; aro 3 dibujos y ~6.250 triángulos** (−18 dibujos, +4.300 triángulos, +0,7 %
  de los ~640.000 de la escena). Programas de shader nuevos: 0. Cuadro entero (CPU+placa, ruidoso): antes 3-10 ms, después 10-12 ms en esa
  vista (mira al bosque en vez de al cielo: no es comparable); de espaldas igual (9-10 vs 8,6 ms).
- `npm run diag:dibujo` (Desafío): 210 → 213 dibujos: +1 el cofre de la pistola (cinco mallas contra cuatro) y +1 el dibujo de puntos de los
  halos (ahora hay halos siempre a la vista cerca); el resto es ruido de los efectos.
- `herramientas/medir-duendes.cjs`: 0 duendes 9,9 → 10,1 ms (227 → 229 dibujos); 24 duendes 11,0 → 11,4 ms (252 → 248 dibujos): sin diferencia.

## 5. Pruebas

- `pruebas/verificar-4-8-1-sin-naves.mjs` (en el gate, 17.101 comprobaciones): `mallaNave` sin casco/cúpula/haz/reflectores ni nombres de nave;
  fases, tiempos y mecánica de la bajada; las cuentas del aro; el aro, la ruina y el cofre armados en una VM (mallas, triángulos, nada aditivo,
  ni gris, la huella de la ruina); el mundo del aro con un terreno de mentira (brota, se pega, laten la luz y los hongos, se cierra sin salto);
  el sonido; y ninguna cadena visible del código habla de nave, nodriza, alien, plasma, platillo, ovni, vaina ni generador (excepciones
  justificadas: «vaina de suela» del cuchillo, código de shader y de un worker).
  Rompí a propósito 16 cosas (una esfera de casco y un reflector en `mallaNave`, «nave» y «platillo» en un texto, llegando de 3 s, salir en 1 s,
  sonido saturado, parejo y agudo, un haz aditivo en el aro, el casco gris, el haz de 70 m, el vidrio verde, la luz verde de 80, el crujido
  cada 1,3 s, una luz puntual nueva): **todas fallan**.
- Ajuste mínimo de pruebas existentes: sólo etiquetas de texto de `humo-desafio-premium.cjs` («restos de naves» → «ruinas del bosque»).
  Ninguna prueba leía las líneas cambiadas, salvo `verificar-4-8-ataques.mjs` (la línea de la cola `ataques.marcarBajada(item); bajarAlien(...)`,
  que se dejó igual).
- `pruebas/humo-4-8-1-sin-naves.cjs` (una noche completa: brota a los 4 s, sale el primero a los 4,1 s, de a uno, queda acechando, se cierra
  en 4,8 s; un puesto; una ruina que se recorre hasta el plano; el cofre da la pistola y 12 cargas): todo bien.
- Partidas reales, de a una: `humo-3-0-asedio`, `humo-3-5-1-desafio`, `humo-desafio-premium` y `humo-4-8-ataques` en verde.
  `humo-4-8-noches` falla en «y vienen un 15 % más (23)» **también en `v48-integra` sin mis cambios** (mismo número, dos veces cada una): no es
  de esta rama.
- `verify:paralelo`: 272 de 273 (la prueba nueva sumó un paso); la que falla, `verificar-construccion-premium-rc6.mjs`, se corta por el tope
  de 20 s de su VM con 14 procesos a la vez y sola anda en 13 s (se ve en `npm run verify`).

## 6. Lo no verificado

- Nadie escuchó los sonidos: sólo se midieron.
- Los números de rendimiento son de la notebook (y con otra instancia de Electron del agente de ambiente andando a veces).
- El aro aparece en el punto de siempre: si cae sobre las vías o un camino, la boca se ve sobre ellos (las vías asoman unos centímetros);
  no se movió el punto para no cambiar el aterrizaje.
- La cámara de los planos «de lejos» a 75 m deja el aro chico entre los árboles (a propósito: ya no hay una nave a 54 m de altura); el aviso
  de dirección («Salen duendes desde el monte») y el mapa siguen igual.
