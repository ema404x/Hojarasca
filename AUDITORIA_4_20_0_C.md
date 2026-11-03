# Auditoría 4.20.0 — parte C: visual, capturas y presupuesto de ms

Rama `v4200-c` (sobre `main` = 4.19.0). No cambia el juego: sólo trae la herramienta de medición `herramientas/auditoria-visual-4-20-0.cjs` (+ `.json` con los 35 encuadres fijos). Insumo del salto gráfico semirrealista, **sólo arte, 0 programas de shader nuevos**.

Capturas: `C:\Users\Andres\AppData\Local\Temp\hx\c4200\` (`ensayo1` y `ensayo2` = verano y noche en 1280x720; `fotos` = nieve, otoño, lluvia y el personaje lejano; `todo.json` = todas las mediciones juntas). Mediciones crudas: `verano-a` a `verano-e`, `invierno`, `otono`, `lluvia`, `cpu`.

## 0. Cómo se midió (y por qué los números no son «fps»)
- PC: **notebook** (Ryzen 7 7730U, placa integrada Radeon), ventana visible en el monitor externo de 60 Hz, perfil propio, candado tomado y soltado en cada corrida. **No** se midió en la 4600G (el usuario lo descartó). Las dos integradas son de la misma familia, pero estos ms son de la notebook: sirven por proporción.
- Se usó el **bucle real del juego** (`requestAnimationFrame`, sin límite de cuadros) con la cámara fija: CPU = lo que dura el cuadro del juego; **placa** = el cronómetro de la placa que ya trae el juego (`__gpuMs`, cubre `dibujar()` entero: sombras, escena y postproceso). Costo del cuadro = el mayor de los dos, como en el juego.
- Dos trampas que se encontraron y se corrigieron (la herramienta ya las evita):
  1. `gl.finish()` **no espera siempre a la placa**: el mismo cuadro daba 2 ms o 20 ms. No sirve para medir.
  2. La placa **baja el reloj cuando le sobra tiempo** dentro de los 16,7 ms: el mismo cuadro daba 9 ms o 15,7 ms según la racha, y la capa que se saca «no ahorraba nada». Solución: un **lastre** (dibujar la escena dos veces más, fuera del cronómetro, antes de cada cuadro) que mantiene la placa al 100 % y con el reloj arriba. Con lastre los ciclos repetidos dan lo mismo (±0,2 ms). La CPU se mide **sin** lastre (con lastre se infla).
- Los ms de la placa se tomaron con un lienzo interno de **1920x1081** (la ventana de 1280x720 con escala 1,5: lo que dibuja una ventana de 1080p). A 1280x721 («resolución 1») la placa cuesta ~55 % de eso (ver §2).
- Con la herramienta instalada las capturas salen negras (una vez instalado el bucle medido); por eso las imágenes se sacaron en corridas aparte, sin medir (`AUD_MEDIR=0`).

## 1. Ms por captura (verano salvo que diga otra estación)
CPU = ms de CPU del cuadro, sin lastre (con `*` = tomado en la corrida de 1080p sin lastre). Placa = ms de la placa a 1920x1081 con el reloj fijo. «Escena» = llamadas y triángulos del cuadro sin la pasada de sombras; «sombras» = lo que suma esa pasada cuando se rehace.

| captura | CPU ms | placa ms | llamadas | triángulos (escena) | sombras (llamadas / triángulos) |
|---|---|---|---|---|---|
| 01 paisaje mirador día | 7,6 | 14,7 | 174 | 1200 mil | +161 / +278 mil |
| 02 bosque día | 7,1 | 14,1 | 179 | 1202 mil | +169 / +268 mil |
| 03 bosque noche | 4,8* | 13,5 | 193 | 1223 mil | +148 / +275 mil |
| 04 refugio día | 5,2* | 15,7 | 216 | 1201 mil | +245 / +366 mil |
| 05 **plaza día** | **15,3** | 25,4 | 206 | 1311 mil | +273 / +570 mil |
| 06 plaza ocaso | **16,8** | 26,0 | 210 | 1415 mil | +295 / +672 mil |
| 07 aldea noche | 11,9 | 22,4 | 301 | 1477 mil | +268 / +573 mil |
| 08 calle de la Loma, tarde | 13,6 | 25,0 | 190 | 1239 mil | +289 / +732 mil |
| 09 interior casa de té | 11,9 | 29,1 | 178 | 1238 mil | +288 / +706 mil |
| 10 interior cantina noche | 13,0 | 23,4 | 317 | 1206 mil | +203 / +310 mil |
| 11 personaje de cerca (Fermín) | 5,1* | 18,9 | 215 | 1249 mil | +223 / +310 mil |
| 12 personaje de lejos (Fermín, 12 m) | 5,7* | 19,8 | 244 | 1295 mil | +233 / +341 mil |
| 13 personaje en interior (panadería) | 12,1 | 30,4 | 137 | 1225 mil | +287 / +704 mil |
| 14 lago, tarde | 4,7 | 12,9 | 136 | 1004 mil | +134 / +182 mil |
| 15 cielo al ocaso (hacia el sol) | 4,6* | 14,8 | 138 | 1038 mil | +145 / +235 mil |
| 16 cielo de noche | 7,0 | 14,6 | 129 | 1213 mil | +213 / +362 mil |
| 17 casas del jugador, día | 5,5* | 16,1 | 229 | 1263 mil | +220 / +345 mil |
| 18 casas del jugador, noche | 5,5* | 16,1 | 236 | 1259 mil | +200 / +335 mil |
| 19 madera (casilla) | 5,2* | 16,5 | 214 | 1195 mil | +212 / +332 mil |
| 20 piedra (cabaña de piedra) | 5,4* | 17,9 | 221 | 1273 mil | +221 / +356 mil |
| 21 suelo con pasto, a 1,5 m | 3,9* | 10,3 | 93 | 1188 mil | +238 / +373 mil |
| 22 suelo de la plaza | 8,7 | 11,5 | 97 | 1159 mil | +276 / +641 mil |
| 23 estación | 4,6* | 17,9 | 185 | 1202 mil | +166 / +292 mil |
| 24 molino y tulipanes, tarde | 8,2* | 16,5 | 177 | 1319 mil | +206 / +323 mil |
| 25 lago, amanecer | 5,2* | 12,9 | 146 | 1043 mil | +210 / +273 mil |
| 31 nieve: valle | 6,5 | 12,4 | 176 | 1223 mil | +164 / +265 mil |
| 32 nieve: bosque | 7,8 | 13,5 | 177 | 1216 mil | +180 / +291 mil |
| 33 nieve: plaza | 15,2 | 21,2 | 183 | 1301 mil | +279 / +579 mil |
| 34 nieve: casas | 8,1 | 14,7 | 210 | 1262 mil | +218 / +346 mil |
| 35 nieve: personaje | 8,4 | 17,1 | 187 | 1247 mil | +217 / +309 mil |
| 41 otoño: valle | 8,3 | 15,3 | 180 | 1222 mil | +161 / +280 mil |
| 42 otoño: bosque | 7,7 | 14,7 | 182 | 1218 mil | +180 / +291 mil |
| 43 otoño: plaza | 15,6 | 25,6 | 202 | 1300 mil | +273 / +576 mil |
| 44 otoño: casas | 8,7 | 16,1 | 239 | 1266 mil | +221 / +347 mil |
| 51 lluvia: valle | 7,7 | 15,6 | 169 | 1199 mil | +161 / +278 mil |
| 52 lluvia: bosque | 7,5 | 14,8 | 186 | 1203 mil | +169 / +268 mil |
| 53 lluvia: plaza | 14,2 | 25,9 | 182 | 1298 mil | +245 / +556 mil |

Lectura rápida:
- **Campo abierto:** CPU 4 a 8 ms, placa 13 a 16 ms a 1080p (8 a 9 ms a 720p). Sobra CPU; la placa es lo justo.
- **Aldea (plaza, calle, interiores con gente):** **CPU 12 a 17 ms** y placa 22 a 30 ms a 1080p. Esto es el «~15 de 16,7» de `CLAUDE.md`: **es la CPU de la plaza** (15,3 ms de día, 16,8 al ocaso). A 720p la placa de la plaza baja a 13,9 ms (menos que la CPU).
- Los **triángulos son casi siempre 1,0 a 1,5 millones** sea lo que sea: 534 mil son el pasto (3 llamadas, siempre), 115 mil el terreno y el resto vegetación instanciada.
- **Programas de shader:** 105 al entrar al juego (la base declarada es 111; con las escenas de la Historia suben). La herramienta, al sacar capas, compila programas de más (hasta 202): no cuenta para el juego y se dice acá para que nadie lo lea como un aumento.

## 2. Presupuesto: cuánto cuesta cada cosa (1080p, placa con reloj fijo; ms que se **ahorran** al sacarla)
Medido sacando de a una capa, 5 ciclos alternados por capa (los ciclos coinciden ±0,3 ms).

| capa | mirador | bosque | lago | aldea noche | plaza día |
|---|---|---|---|---|---|
| cuadro completo (placa) | 15,4 | 14,7 | 13,7 | 22,4 | 25,3 |
| sin terreno (+ terreno de la aldea) | 3,7 | 3,7 | 4,0 | **8,4** | **8,9** |
| sin lo instanciado (pasto, flores, matas, piedras, árboles chicos) | 5,8 | 5,2 | 1,4 | 4,6 | 6,8 |
| sin árboles ni sotobosque ni impostores | 1,8 | 1,1 | 0,8 | 1,4 | 0,7 |
| sin pasto | 0,9 | 1,3 | 0,9 | 0,9 | 0,7 |
| sin el domo del cielo | 0,9 | 0,9 | 1,1 | 0,6 | 0,2 |
| sin sombras (mapa fijo) | 0,5 | 0,4 | 0,4 | 1,2 | 1,5 |
| rehacer las sombras en cada cuadro | 0 | -0,2 | +0,1 | 0 | 0 |
| sin postproceso | -1,0 | -1,3 | -0,1 | -2,1 | -2,2 |
| resolución 1280x721 (en vez de 1920x1081) | -6,5 | -6,4 | -6,3 | -9,7 | -11,4 |

Calibración (bosque y plaza; suma de cosas de prueba delante de la cámara):

| se suma | placa (bosque) | placa (plaza) | CPU |
|---|---|---|---|
| +100 mil triángulos chicos en pantalla | +0,04 ms | +0,06 | sin cambio |
| +400 mil triángulos chicos | +0,22 | +0,24 | sin cambio |
| +300 llamadas de dibujo (cubitos) | +0,1 | +0,14 | **+3,4 ms** en el bosque, +1,8 ms en la plaza (6 a 11 µs por llamada) |
| +1 capa de pantalla completa, material del mundo | **+0,82** | +0,90 | sin cambio |
| +1 capa de pantalla completa **con textura** de 512 (con mipmaps) | +0,86 | +1,02 | sin cambio |
| +3 capas con textura | +2,66 | +3,11 | +0,7 |

Conclusiones del presupuesto (con número):
1. **Geometría: casi gratis en la placa** (100 mil triángulos ≈ 0,05 ms) **y cuesta en la CPU sólo por llamada** (6 a 11 µs cada una). Los 1,2 millones de triángulos de hoy no son el problema.
2. **Texturas: casi gratis** (una muestra más por píxel de toda la pantalla ≈ +0,05 ms). **El costo está por píxel y por capa**: una capa de pantalla completa cuesta 0,8 a 0,9 ms; el cuadro entero equivale a unas 17 de esas capas.
3. Lo caro es el **terreno (3,7 ms en campo, 8,4 a 8,9 ms en la aldea)** y lo **instanciado (5 a 7 ms)**. Ambos son por píxel (el terreno cubre media pantalla; el pasto se superpone). Subir la resolución de 720p a 1080p suma 6,3 a 11,4 ms: es por píxel.
4. **Sombras fijas: 0,4 a 1,5 ms; rehacerlas: ~0 en placa.** El mapa de sombras ya no es el problema (la 4.12.3 lo dejó bien).
5. El postproceso **ahorra** 1 a 2 ms frente a dibujar directo con suavizado de bordes del lienzo: no tocarlo.
6. **CPU: la aldea no tiene margen.** Sumar llamadas ahí empuja la plaza por encima de 16,7 ms (ya está en 15,3 a 16,8). En campo hay ~9 ms libres: unas 300 llamadas más cabrían.
7. Dónde se va la CPU de la plaza (perfilador del juego, p. 05): dibujo (envío) 7,0 ms, **gente y perro 6,0 ms**, fauna 1,0 ms. En el bosque: dibujo 3,8, gente 0,2. **El costo de CPU de la aldea es la gente** (varía de 2,2 a 6,0 ms según cuántos hay a la vista).

## 3. Hallazgos por las cuatro prioridades (ordenados por impacto)

### H1. Materiales y texturas: las superficies no tienen detalle propio (impacto alto, costo bajo)
- **Evidencia:** de 58 texturas en memoria, unas 45 son carteles (512x128); lo único de entorno son las manchas del prado (512), la estepa (513), las hojas (1024 y 640) y el mapa de alturas. Madera, piedra y suelo van sólo con color por vértice. El código lo dice (`materiales.js`, 3.2: «se sacaron las texturas de detalle»). Se ve en: `21-material-suelo-pasto` (el suelo es un verde liso con las hojas de pasto encima), `19-material-madera-casilla` (la pared de la casilla es un panel marrón liso, mientras que la casa vecina tiene tablas), `22-material-suelo-plaza` (las sombras de contacto se ven como polígonos facetados de borde duro sobre el pasto), `20-material-piedra-cabana` (zócalo gris liso).
- **Lo que ya está bien:** la **arquitectura de la aldea** (`08`, `09`, `13`): tablas de verdad en la geometría, zócalos, marcos, faroles; la chimenea de piedra de la casa de té (`09`) está hecha con bloques de geometría.
- **Propuesta sólo arte:** (a) detalle **en la geometría fusionada** de cada obra: tablas con relieve real (0,5 a 1 cm de resalto), juntas, nudos y piedra en bloques, variación de color por vértice (más clara en aristas y en lo que da al sol, más oscura en juntas). Cada obra fusionada ≤ +3 mil triángulos y **0 llamadas nuevas** → ≈ 0,02 ms de placa por edificio. (b) Suelo: variación de color por vértice y piedritas/hojarasca instanciadas dispersas (ya hay hojarasca; sumar variedad sin sumar capas). (c) Si se quisiera una textura de detalle sobre los materiales del mundo, **hay que comprobar antes** que la combinación (material con color por vértice + textura) ya exista en la base de programas: si crea un programa nuevo, rompe «0 shaders nuevos»; decidir con el usuario. Por eso (a) y (b) van primero.
- **Costo estimado:** triángulos casi gratis; riesgo = llamadas (mantener la fusión). Presupuesto: ≤ +400 mil triángulos en toda la escena = +0,2 ms de placa.

### H2. Luz y atmósfera: ya es lo más fuerte; lo flojo es la noche de exterior y la lluvia (impacto alto, costo ≈ 0 ms)
- **Evidencia a favor:** ocaso con rayos y niebla por altura (`15`, `14`, `06`), cielo nocturno con luna, estrellas y constelaciones (`16`), interiores con luz cálida y farol (`09`, `10`), agua con reflejo del ocaso (`14`, `25`).
- **Flojo:** (1) las **casas del jugador de noche** (`18`) son una silueta negra: sólo se ven luciérnagas y el contorno de los árboles; sin ventanas encendidas ni luz de luna sobre los techos. (2) `03` bosque de noche: casi todo negro con luciérnagas muy grandes (halos del tamaño de una cabeza). (3) **Lluvia (`52`, `51`, `53`)**: casi igual a «despejado» (cielo apenas más gris; colores sin apagar; no se ve cortina ni mojado). (4) Plaza de día (`05`): luz plana, casi sin contraste entre sol y sombra del follaje.
- **Propuesta sólo arte/valores:** paleta de la luna más azul-plateada y ambiente nocturno un escalón más alto (valores de `cielo.js`, sin programas nuevos); luces de ventana (color emisivo por vértice, como ya hacen las ventanas de la aldea) en las obras del jugador; achicar y apagar los halos de luciérnaga; lluvia: bajar saturación y subir el mojado con los valores existentes (`uMojado`, `uLluvia`, niebla). Costo de placa: 0 (son uniformes y colores).

### H3. Paisaje y vegetación: base muy buena; los puntos débiles son el suelo bajo el pasto y las copas medianas (impacto medio)
- **Evidencia a favor:** `01`, `02`, `04`, `24` (tulipanes), `42` (otoño: naranjas y amarillos bien repartidos) y `31` (copas con nieve) se ven como el estilo pintado que se quiere.
- **Flojo:** (1) el suelo entre las matas es liso (`01`, `21`): con luz plana parece un fondo; (2) las **copas** de los árboles medianos tienen contorno en escalera (dientes cuadrados) a media distancia (`01` derecha, `42`); (3) los árboles lejanos son impostores parejos (`01` fondo) y no cambian de color con la estación tanto como los cercanos; (4) pasto uniforme de un solo ancho y verde en el piso (`21`).
- **Presupuesto:** lo instanciado cuesta 5 a 7 ms de placa **por píxel** (no por triángulo): **no sumar capas ni más densidad de pasto**; sí cambiar forma y color. Propuesta: copas con contorno redondeado (más triángulos por copa: +100 mil en todo el valle = +0,05 ms), dos o tres anchos de hoja y variedad de verdes por mata, y sotobosque con más especies pero **menos cantidad** (el sotobosque cuesta 0,7 a 1,8 ms: hay que cambiar cantidad por variedad, no sumar).
- **Nieve:** buena (`31`, `33`): copas cargadas, pasto asomando, plaza blanca. Flojo: el suelo es un blanco liso sin huellas visibles y la sombra del suelo no tiene color azulado.

### H4. Personajes y edificios (impacto alto para la Historia; **limitado por la CPU**)
- **Evidencia:** personajes de cerca (`11`, `13`, `10`): el cuerpo y la ropa se leen bien (delantal, boina, vestido); manos y cara son simples (cara con nariz y ojos pintados, manos de bloque); a 12 m (`12`) se ve sólo la silueta. Cuestan **6 a 13 mil triángulos cada uno** (2 a 3 llamadas) y, en la plaza, **6,0 ms de CPU** entre gente y perro.
- **Edificios:** la aldea está muy por encima de las obras del jugador, del puesto y de la cabaña de piedra (`17`, `19`, `20` contra `08`): son volúmenes con techo y poco más (sin aleros ni marcos marcados en las paredes), con el panel liso de la casilla.
- **Propuesta:** (a) **primero ahorrar CPU de la gente** (fusionar partes del cuerpo y bajar la frecuencia de la pose lejana, tal como ya se hace con la gente a más de cierta distancia) antes de darles más detalle; sin eso, cada detalle de personaje cuesta CPU en la plaza, que ya está en el límite; (b) manos con dedos y cara con volumen de nariz, párpados y labios como **geometría chica** (+1 mil triángulos por persona, +0 llamadas, +0,05 ms de placa); (c) llevar las obras del jugador al nivel de la aldea con el método de H1.

### H5. Aldea e interiores a 1080p: la placa pasa de 22 ms (impacto medio; **ya hoy**)
- **Evidencia:** 05, 06, 08, 09, 13 dan 25 a 30 ms de placa a 1080p con 1,2 a 1,4 millones de triángulos; 09 y 13 (interiores) dan 29 y 30 ms aunque sean espacios chicos: el terreno y el pasto de afuera se dibujan igual por dentro (en 09 siguen saliendo el pasto, 224 mil triángulos instanciados, el terreno y el sotobosque).
- **Propuesta (valores, no shader):** al estar dentro de un edificio de la aldea, **no dibujar** el pasto, el terreno de la aldea fuera del edificio ni lo instanciado lejano: es una optimización del juego (no de arte); se anota acá porque cualquier salto gráfico en interiores depende de ella. Estimación con las capas medidas: −8 a −10 ms de placa en interiores.

## 4. Orden y tramos de versión sugeridos
1. **4.21.0 — Luz y atmósfera** (valores y colores; 0 ms; lo más visible por lo que cuesta): noche de exterior, ventanas de las obras, luciérnagas, lluvia, contraste de la plaza.
2. **4.22.0 — Edificios y materiales** (geometría fusionada con detalle, color por vértice): obras del jugador, puesto, cabaña de piedra, casilla; ≤ +400 mil triángulos en total, 0 llamadas nuevas. Medir plaza (CPU 15,3 y placa 25,4 no deben empeorar más de 0,5 ms).
3. **4.23.0 — Interiores y CPU de la gente** (no dibujar el exterior desde adentro; fusionar y espaciar la pose de la gente): libera CPU y placa para lo que sigue.
4. **4.24.0 — Paisaje y vegetación** (copas, verdes, sotobosque por variedad; suelo con variedad de color): sin sumar capas de pasto.
5. **4.25.0 — Personajes** (manos, caras, ropa con más capas de color): sólo después de 4.23.0, y midiendo cada paso en la plaza.
6. Después, recién, la pregunta de las texturas de detalle sobre los materiales (si la base de programas lo permite sin crear uno nuevo).

**Lo que no entra en el presupuesto, con el número:** subir la densidad del pasto o del sotobosque, o agregar capas de vegetación en la aldea (lo instanciado ya cuesta 5 a 7 ms de placa y el terreno 8 a 9 ms en la plaza); **cualquier cosa nueva por pantalla completa** (niebla de suelo, nubes bajas, vidrio, viñeta) cuesta ~0,85 ms cada una; **más llamadas de dibujo en la plaza** (la CPU está en 15,3 a 16,8 ms; 100 llamadas = +0,6 a +1,1 ms). Un fondo «semirrealista» con más detalle pasa por geometría y color, no por capas.

## 5. Lo que no se pudo ver o medir
- **La 4600G y el monitor de 120 Hz** (decisión del usuario): todo es de la notebook, a 60 Hz. Los ms de placa a 1080p parecen altos para la plaza (25 ms) frente al «~15 de 16,7» del `CLAUDE.md`: coinciden con la **CPU** (15,3 ms), no con la placa a 1080p; si el usuario juega a 720p o menos de escala, la placa de la plaza da ~14 ms.
- Calidad Media y Baja (se midió sólo Alta), Desafío y la noche de los duendes (a ojo y por números no se miró), tormenta con rayos, caminata en movimiento (los tirones; para eso está `medir-caminata.cjs`), kayak, velero, trochita en marcha.
- Interiores: sólo la casa de té, la cantina y la panadería. No se miraron la carpintería, la herrería, la escuela, el refugio por dentro ni las casas del jugador por dentro.
- Capturas **no revisadas a tamaño completo** en este informe: `32`, `34`, `35`, `41`, `43`, `44`, `51`, `53`; sólo se midieron.
- Memoria de la placa (no se midió) y tiempos de carga.
- Los rayos de sol y el brillo no se separaron de «postproceso»; no hay forma de apagarlos de a uno sin tocar el juego.

## 6. Herramientas y archivos
- `herramientas/auditoria-visual-4-20-0.cjs` y `herramientas/auditoria-visual-4-20-0.json` (encuadres). Se lanza siempre por `herramientas\lanzar-electron.ps1 -Visible` con perfil propio y el candado de Electron. Variables: `AUD_GRUPO` (verano, invierno, otono, lluvia), `AUD_SOLO`, `AUD_MEDIR=0` (sólo capturas), `AUD_ESCALA`, `AUD_LASTRE`, `AUD_CAPAS=0`. No entra al gate.
- Corridas: verano (5 lotes), invierno, otoño, lluvia, subsistemas de CPU; cada una de 2 a 7 minutos, con el candado soltado entre una y otra.
