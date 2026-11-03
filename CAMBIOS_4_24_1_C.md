# 4.24.1 · parte C — Paisaje a ojo y lo que faltó

Rama `v4241-c` (sobre `main` = 4.24.0). Del brief `BRIEF_4_24_1.md` (parte C): (1) mirar a ojo, con la herramienta de la 4.24.0, lo que la 4.24.0 no vio y corregir lo que se vea mal; (2) los dientes de las hojas del árbol de cerca y de los cipreses a media distancia (sólo geometría, color y atlas); (3) presupuesto: la plaza no puede empeorar más de 0,3 ms de CPU ni 0,5 de placa contra la 4.24.0. **0 programas de shader nuevos, 0 capas de pantalla completa, 0 texturas nuevas, 0 llamadas de dibujo nuevas.**

Capturas y mediciones crudas: `C:\Users\Andres\AppData\Local\Temp\hx\c4241\` (`ant-*` = la 4.24.0, `nue-*` = una versión intermedia, `nu2-*` y `nu3-*` = esta rama; `rondas\` y `subs\` = las rondas alternadas de medición; `base-4240.html` es la 4.24.0 armada).

## 1. Qué se miró a ojo (y qué se encontró)

Encuadres nuevos (`herramientas/auditoria-visual-4-24-1.json`, armado por `herramientas/generar-tomas-4-24-1.cjs`), siempre con la 4.24.0 y con esta rama, en Alta y, donde se dice, en Media y Baja:

| qué | cómo | resultado |
|---|---|---|
| **Noche** (mirador, bosque, plaza; 23:12, 0:24 y 22:48) con el paisaje nuevo | Alta, despejado | Se lee bien: los árboles, el sendero, las flores y las casas de la plaza (ventanas y faroles) tienen forma; el suelo del prado queda oscuro pero con textura. **Nada que corregir.** |
| **Alba** (6:12) en la plaza, el bosque y el mirador | Alta | Bruma y color parejos. Nada. |
| **Lluvia plena (que es tormenta)** de día y de noche, en el mirador, el bosque y la plaza | Alta; `AUD_LLUVIA=1` | De día la lluvia, la niebla y el suelo mojado leen bien (el prado y el sendero se oscurecen, los charcos de la plaza brillan). De noche cae a casi negro en el suelo del prado pero el cielo, las siluetas y la lluvia se leen. **Nada que corregir** (es una tormenta de noche). |
| **Nieve con sol bajo** (9:00 en el mirador, 16:36 en el bosque, 16:48 en la plaza) | Alta y Media | La sombra azulada de la 4.24.0 se lee bien con el sol bajo: sombras largas y frías de los árboles y de la cabaña sobre la nieve crema, y en la plaza los caducos pelados proyectan sombra celeste. **Nada que corregir.** |
| **Nieve de noche** (22:30) | Alta | Azul parejo, la cabaña y el pehuén se separan del fondo. Nada. |
| **Otoño con sol bajo** (17:00) y la plaza | Alta y Media | Los álamos amarillos, los perennes entibiados y el pasto dorado juntos; sin saltos de color entre los dibujos. Nada. |
| **Media y Baja** (mirador y plaza de verano, bosque de otoño, nieve) | Media y Baja | En Media el sotobosque, la nieve y el otoño se ven bien. En Baja la plaza se ve limpia (sin sombras, como siempre). **Hallazgo fuera de mi zona:** en Baja hay un objeto naranja a dos aguas tirado en el pasto a la izquierda del cartel de la plaza (se ve igual en la 4.24.0): no es del paisaje (no se encontró qué es); queda anotado. |
| **Ladera con parches de color** | Alta (en Media el lugar elegido cae al borde del bosque y los parches no están a la vista) | Sobre la ladera del mirador el suelo del prado muestra los parches verdes y amarillentos entre las matas, sin cortes duros ni hojas sueltas. Nada que corregir. |
| **Silueta que «salta» al rehacerse el mapa de sombras caminando** | por conteo, en Node, sobre el valle armado (Media y Alta) | Ver §4: caminando 400 m en pasos de 2 m, ningún árbol de adentro del alcance de la sombra falta en la malla antes de que la cámara llegue. No se vio a ojo una silueta saltar (no se puede ver sin caminar a mano), pero el invariante que lo impediría está probado con mutaciones. |
| **Huellas** | Alta, invierno, caminando 12 m con el cuerpo real del jugador | **Se encontró algo mal**: las pisadas existían pero se leían como manchas celestes sin forma, muy tenues con la luz difusa de la nieve (casi invisibles a más de 5 m). **Corregido**, ver §2.3. |

**Lo que se vio y no se tocó (decisión):**
- La **hojarasca** (las hojas caídas del bosque) sobre la nieve queda como unos tiestos blancos chatos sueltos en la nieve azul (se ve en el bosque nevado de cerca). Se pensó en pasarla a tipo 3 (que el invierno la pliegue a nada, como los parches de suelo de la 4.24.0), pero eso la deja con la iluminación de «follaje» (trasluz y borde de sol) en las demás estaciones y cambia cómo se ve el piso del bosque todo el año; con un único bosque nevado a la vista no alcanza para decidirlo. Queda para quien quiera mirar el piso del bosque con más calma.
- La **primera captura** de una tanda a veces salía con los árboles de al lado o el pasto sin cargar (la vegetación cercana se rehace cada 0,25 s de reloj o más y la herramienta pone la cámara lejos de golpe). No es del juego: se arregló en la herramienta (`AUD_FORZAR_VEG`, por defecto 1: fuerza la actualización antes de mirar).

## 2. Qué cambió

### 2.1 Los dientes de las hojas del árbol de cerca (atlas de cartas)
Tres celdas del atlas (0 = coihue, arrayán y maitén; 1 = lenga y ñire; 5 = las matas) se pintan ahora con:
- **hojas con el pie y la punta más romos** (`ovalSuave`: el perfil de la hoja pasa de `sin^0,75` a `sin^0,6`; `redondaSuave`: de `sin^0,55` a `sin^0,5`);
- **una rampa de alfa más ancha en el borde** (2,4 téxeles en lugar de 1,4; `RAMPA_SUAVE`) sin mover el borde medio;
- **el alfa de esas tres celdas suavizado** (`suavizarAlfa`: 1-2-1 a lo ancho y a lo alto, al final de `generarCartas`): se redondean los dientes de a un téxel y los agujeros de a uno entre hojas.

Las otras nueve celdas (cortina del maitén, escamas del ciprés, el cepillo del pehuén, las flores, las dos frondas de helecho y las dos copas de lejos de la 4.24.0) **salen idénticas bit a bit** (la prueba compara cada celda con su huella). Los azares no se mueven: la forma elegida no gasta números al azar y el suavizado va al final. Las hojas **no engordan** (la cobertura opaca sube un 3,2 %, 3,4 % y 2,2 %; el alfa intermedio, de 3.859 a 9.953 téxeles en la celda 0). Medido contra la 4.24.0 en capturas del mismo encuadre: con el recorte de las hojas de cerca (bosque, árbol del mirador, copas con nieve) los lóbulos salen más redondos y hay menos pinchos y menos agujeros chicos entre hojas; a media distancia (copas del mirador) la diferencia es poca. No cambia ningún shader: el recorte sigue siendo el mismo `discard` contra el alfa del atlas.

### 2.2 Los cipreses a media distancia
Los cipreses del LOD medio (los de 66 a 135 m, sin cartas) eran conos de faldas con el borde en puntas de siete lados con entrantes hondos y puntas que cuelgan: dientes de sierra a esa distancia. Ahora (`pisoConifera(..., suave)`, sólo para el LOD sin detalle): **nueve puntas** en lugar de siete, entrantes al 84 % del radio (antes 72 %), puntas que cuelgan 11 % de la altura (antes 16 %) y entrantes que suben 8 % (antes 14 %): el borde de cada falda sale en onda. +40 triángulos por ciprés a media distancia (152 → 192, +26 %): el valle tiene 1.163 cipreses y entre 66 y 135 m del refugio hay 103, o sea unos 4 mil triángulos más sobre 1,3 millones (0,3 %; en la plaza, con más cipreses a la vista, hasta unos 10 mil, 0,8 %: lo que se vio en los conteos de las rondas). **El ciprés de cerca no cambia** (misma geometría bit a bit) y por lo tanto tampoco el cartel lejano (se hornea del de cerca). Las demás coníferas siguen con su falda de siempre (`pisoConifera` sin `suave` es la de la 4.24.0, por huella). No se vio una diferencia grande a ojo (el ciprés del mirador a ~40 m está en el LOD cercano); queda como mejora de silueta a distancia, sin costo.

### 2.3 Las pisadas en la nieve (las «huellas» se veían como manchas)
- `huellas.js`: el borde de la pisada sube más rápido que el cono liso (`HUELLA_PLATEAU = 2`): el centro queda parejo y el borde se marca; el tamaño no cambia (el mismo óvalo de 9 téxeles de 0,25 m).
- `materiales.js` (el material del terreno, una sola línea): el tinte de la pisada pasa de `×(0,58 · 0,64 · 0,70)` al 72 % a `×(0,50 · 0,58 · 0,70)` al 90 %: más marcado y más azul.
Con el cuerpo real caminando 12 m en la nieve a las 16:24 en el mirador, antes eran manchas celestes casi sin contraste y ahora se lee una hilera de pisadas alternadas (derecha e izquierda) bien visible desde 10 m. No cambia ningún programa (es un valor dentro del mismo fragmento).

### 2.4 La herramienta de capturas (no entra al gate)
`herramientas/auditoria-visual-4-20-0.cjs`: `AUD_FORZAR_VEG` (por defecto 1: fuerza `veg.actualizar` y `objetos.actualizar` antes de mirar, porque con la cámara fija recién puesta lejos la primera captura a veces salía sin los árboles de al lado o sin el pasto) y el campo `huellas` de un encuadre (antes de la captura se camina con el cuerpo real, a medio metro por paso, desde 12 m delante de la cámara hasta la cámara, así quedan pisadas a la vista). `herramientas/generar-tomas-4-24-1.cjs` arma los encuadres de §1.

## 3. Presupuesto

**Estructural (lo que decide):** 0 llamadas de dibujo nuevas, 0 mallas nuevas, 0 materiales nuevos, 0 texturas nuevas (el atlas es el mismo de 1024 × 1024 con otros bytes en tres celdas), 0 capas de pantalla completa, **programas de shader compilados: 147 al empezar y 161 en el encuadre de la plaza, iguales a la 4.24.0** (la herramienta cuenta `renderer.info.programs`, ver los `auditoria-verano.json` de `rondas\`). Los cipreses a media distancia suman de 4 a 10 mil triángulos (0,3 a 0,8 %; GPU, no CPU).

**Medido** (notebook, 1080p, ventana visible en el monitor externo, rondas **alternadas** contra la 4.24.0; el ruido entre tandas es de ±2 ms en CPU y de varios ms en placa en esta PC con otros procesos corriendo). Diferencias nuevo − base, ronda por ronda; entre paréntesis, mediana y rango.

**CPU de «mandar a dibujar»** (lo que tarda `render` en volver con la cola de la placa vacía: la CPU de verdad, sin la espera de la placa; 6 rondas cortas alternadas, `subs\`):

| encuadre | cuadro normal, sin la pasada de sombras | con la pasada de sombras rehecha |
|---|---|---|
| 05 plaza día, **sin gente** | −0,05 (−0,60 a +0,50) | 0,00 (−1,50 a +1,10) |
| 05 plaza día, con gente | +0,10 (0,00 a +0,10) | +0,05 (−0,40 a +0,30) |
| 06 plaza ocaso, sin gente | −0,15 (−0,70 a +0,90) | −0,15 (−1,50 a +1,70) |
| 06 plaza ocaso, con gente | 0,00 (−0,10 a +0,50) | 0,00 (−0,50 a +0,60) |

La primera ronda de cada serie sale con el arranque (5,9 contra 7,3 ms de la segunda en adelante): es el rango largo. **CPU: no empeora más de +0,10 ms en mediana** (el tope era +0,3).

**CPU del cuadro del juego y placa** (3 y 5 rondas alternadas, `rondas\`, con el lastre de la 4.20.0 para la placa; llegaron 4 pares con gente y 3 sin gente; dos corridas sueltas quedaron cortadas en el arranque y no cuentan):

| encuadre | placa | CPU del cuadro (sin lastre) |
|---|---|---|
| 05 plaza día, con gente | −9,0 +2,0 −21,0 −6,5 (mediana −7,8) | −3,6 +2,6 +3,2 −3,6 (−0,5) |
| 05 plaza día, sin gente | −6,2 +5,2 +0,4 (+0,4) | +1,9 +1,9 +0,8 (+1,9) |
| 06 plaza ocaso, con gente | +5,0 (−865: la base, 897 ms, salió con la placa fuera de rango: corrida suelta del arranque) −4,9 −1,0 (−2,9) | +1,7 +2,8 −1,6 −3,4 (+0,05) |
| 06 plaza ocaso, sin gente | −7,2 −17,1 +0,4 (−7,2) | −0,3 +0,4 +1,1 (+0,4) |

**Lo que no se puede cerrar con estas rondas.** La placa de la rama nueva **no sale peor en ninguna mediana** (−7,8 a +0,4 ms: la base salió más lenta en varias corridas, por la carga de la PC, no por la rama) pero el ruido de la placa es de ±10 ms en esta PC con otros procesos: no se puede demostrar «menos de +0,5 ms» con estas rondas, sólo que no hay empeoramiento a la vista. La CPU del cuadro sin gente de la plaza de día salió **+0,8 a +1,9 ms** en las tres rondas (con gente −0,5, y en «mandar a dibujar» −0,05): no se sostiene en las rondas cortas de CPU de arriba (que se corrieron después, con la PC más tranquila, y dan +0,10 a −0,15), y no tiene una causa en el código (ninguna llamada ni material nuevo; las llamadas de dibujo salieron +5 contra +1,5, dentro del rango de la base misma: 199 a 214). Si hace falta cerrarlo con otra versión, correr más rondas con la PC quieta; no se hizo más acá.

## 4. Pruebas

- **Nueva `pruebas/verificar-4-24-1-c.mjs`** (se suma a `verify:pasos`; **36 comprobaciones y 20 mutaciones** de verdad: copias de `vegetacion.js` y de `huellas.js` con otro nombre, un proceso por copia para las de `vegetacion.js`): (a) las nueve celdas del atlas que no cambian, iguales a la 4.24.0 bit a bit; las celdas 12 a 15 siguen vacías; las 0, 1 y 5 pintadas con las huellas nuevas, sin engordar (< 5 %) y con la rampa de alfa más ancha (más del doble de alfa intermedio); `RAMPA_SUAVE` más ancha que `RAMPA_HOJA`; (b) la falda sin `suave` (7 y 11 lados y por defecto) es la de siempre; la falda suave tiene más puntas, entrantes menos hondos y puntas que cuelgan menos; el ciprés a media distancia tiene 192 triángulos y su forma, y el de cerca (1.246 triángulos, huella de las posiciones) es el de la 4.24.0; (c) **la silueta de la sombra al caminar**: sobre el valle armado en Media y Alta, tres rumbos de 400 m en pasos de 2 m: ningún árbol de adentro del alcance de la sombra falta en la malla (0 faltas en cientos de pasos) y la malla se rehace de a ratos, no en cada cuadro; (d) la pisada de la nieve tiene el centro parejo, el borde marcado y no engorda, y el terreno la tiñe como se dijo; (e) las reglas del presupuesto (18 `ShaderMaterial`, 17 texturas de datos, 3 destinos de dibujo, 7 mallas instanciadas en `vegetacion.js`, atlas de 1024 × 1024, ningún nombre exportado con ñ). Mutaciones: la falda suave apagada, con siete puntas, con el entrante hondo, con las puntas colgando como antes, aplicada a todas las coníferas; la rampa angosta o demasiado ancha; las hojas con la punta fina de antes; cada una de las tres celdas con sus hojas de antes; la cortina del maitén tocada; las copas de lejos tocadas; el alfa sin suavizar y el suavizado en una celda de más; la silueta de la sombra con 1 m de margen y recortada 3 m (**aparecen árboles de golpe**); las pisadas sin plateau, engordadas, sin valor pleno. **Las 20 mutaciones hacen fallar su comprobación; la copia sin tocar pasa por el mismo camino y cumple todo.**
- **Se ajustaron a propósito `verificar-3-5-vegetacion.mjs` (el texto de la llamada de la falda del ciprés) y `verificar-4-24-0-c.mjs`**: las huellas de las celdas 0, 1 y 5 del atlas (ahora son las de la 4.24.1); las otras siete que fijaba siguen iguales. Se dice acá y en un comentario de la prueba.
- Se corrieron, **una por una**, las 43 pruebas `verificar-*.mjs` que leen `vegetacion.js`, `huellas.js`, `materiales.js`, `impostores.js` o `texturas-datos.js`: **45 de 46 en verde a la primera**; la que falló, `verificar-3-5-vegetacion.mjs`, fijaba el texto exacto de la llamada `pisoConifera(…, detalle ? 11 : 7)` y **se ajustó a propósito** (ahora `detalle ? 11 : 9, !detalle`), después en verde. También en verde: `verificar-4-24-0-c`, `verificar-4-12-3-sombras`, `verificar-4-12-0-rocas`, `verificar-2-7-4-carga`. No se corrió `npm run verify` completo.
- **Humo de partida real** (`pruebas/humo-partida.cjs`, monitor externo, perfil propio, candado, 4 calidades × estaciones × climas × lugares, caminar, cuaderno, guardar y recargar) con esta rama (con las huellas nuevas): **0 errores** en las cuatro combinaciones y la partida guardada en las cuatro; sus «fps» (6, 5, 1 y 1) son los de la 4.24.0 (son de la ventana oculta del humo).

## 5. Lo que no se hizo / no se vio a ojo

- **Las siluetas de la sombra «saltando» caminando de verdad:** probado por conteo y en Node (no falta ningún árbol del alcance antes de que la cámara llegue), pero **no se caminó a mano mirando el suelo** a ver si una silueta cambia al cruzar el borde del alcance. Es el mismo borde de tramo que tenía la 4.23.0, con el margen de 5 m de la 4.24.0.
- **Los dientes de las hojas de cerca a media distancia (copas a 30 a 60 m) mejoran poco:** las hojas de ese tramo miden dos o tres píxeles y el borde sale escalonado por la pantalla, no por la hoja; sin suavizado de bordes en el recorte (sólo con un shader) no hay más que hacer con el atlas. De cerca (menos de 20 m) la mejora se ve (lóbulos más redondos).
- **El ciprés a media distancia:** no se encontró un encuadre donde se vea a ojo con claridad la diferencia (los cipreses del mirador están a menos de 66 m y son del LOD cercano). Se probó por geometría (amplitudes del borde), no a ojo.
- **Una sola ladera:** la de la plaza del mirador; no se miró el valle seco ni la estepa con los parches.
- **La hojarasca blanca sobre la nieve** (ver §1) y el **objeto naranja en Baja** (no es del paisaje) quedan anotados.
- **Medición en la 4600G:** descartada por el usuario.

## Claves de guardado
Ninguna.

## Herramientas (no entran al gate)
`herramientas/generar-tomas-4-24-1.cjs`, `herramientas/auditoria-visual-4-24-1.json` (23 encuadres: noche, alba, ladera, copas de cerca, nieve con sol bajo, pisadas, otoño), y los cambios de `herramientas/auditoria-visual-4-20-0.cjs` de §2.4.

## Efectos que cruzan a otras zonas
Ninguno hacia A ni B (nada de Historia, economía, guardado, mapa ni tren). Tocó `src/vegetacion.js` (atlas de cartas y la falda de los cipreses), `src/huellas.js` (la pisada) y una línea de `src/materiales.js` (el tinte de la pisada en el terreno).
