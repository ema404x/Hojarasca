# 4.25.0 · parte C — Personajes

Rama `v4250-c` (sobre `main` = 4.24.1). Del brief `BRIEF_4_25_0.md` (parte C) y del informe `AUDITORIA_4_20_0_C.md` (H4): manos con dedos, cara con más volumen y ropa con más capas de color, **como geometría chica**: ≤ +1 mil triángulos por persona, **0 llamadas de dibujo nuevas, 0 programas de shader, 0 capas de pantalla completa**, la pose sigue fusionada (una malla con piel) y los lejanos no pagan el detalle (regla de LOD y de cadencia de la 4.23.0). La plaza no podía empeorar más de 0,3 ms de CPU ni 0,5 de placa.

Capturas y mediciones crudas: `C:\Users\Andres\AppData\Local\Temp\hx\c4250\` (`ant-verano`, `ant-invierno` = la 4.24.1; `nue-verano`, `nue-invierno` = esta rama; `pares\` = antes y después lado a lado; `med-base-r<n>` y `med-nuevo-r<n>` = las 13 rondas alternadas de la plaza; `base-4241.html` y `nuevo-4250.html` = las dos versiones armadas; `js\` = el visor de geometría sin Electron).

## 0. Lo que se encontró al mirar (y que cambia el alcance)
El informe de la 4.20.0 decía «manos de bloque, cara simple». Mirando la geometría armada y las capturas de cerca, **la mayor parte de lo pedido ya existía desde la 3.7.0 y la 4.0**: la cara tiene nariz esculpida con puente, punta y aletas, párpados de almendra con pestañas y pliegue, labios con arco de cupido, orejas con borde, cejas con pelitos, el rubor y los gestos con formas de mezcla; las manos tenían cuatro dedos y pulgar. Lo que **sí era flojo, y se ve a ojo de cerca**:
- **la mano del mate** (Ramón, Rosa, Ceinwen y todos los que llevan mate): eran dos bolas de piel pegadas a la calabaza, sin dedos;
- **las manos sueltas**: una bola grande de palma con cuatro agujas finas y juntas en el medio y un pulgar de aguja (de lejos se leían como un guante de cuatro garras);
- **la nariz**: bien modelada pero con poca definición en la punta, las aletas y la fosa (de cerca se leía como una mancha de sombra);
- **el poncho** y **el puño** (una sola tela lisa de un solo color), el gorro de lana.

## 1. Qué cambió (`src/gente-cuerpo.js`)

### a) La mano que sostiene el mate (`MANO_MATE_4_25`)
Los cuatro dedos le dan la vuelta **por delante de la calabaza** (cada uno un arco de 80 a 106 grados alrededor de su eje, uno sobre otro, a la altura de la panza, siguiendo el perfil del torno del mate) y el **pulgar da la vuelta por atrás, arriba**. La palma queda como estaba (una bola al costado de la calabaza, pieza de siempre). Piezas finas: de lejos queda la palma y el mate. Es lo que más se nota en las capturas (`pares\verano-p-ramon-cara.png`, el recorte ampliado en `js\par-ramon-mate.png`).

### b) La mano suelta (`MANO_4_25`)
- **Palma**: un torno achatado de 9 lados (más ancho en los nudillos que en la muñeca) en lugar de una bola; pieza de siempre (se dibuja de lejos): 144 triángulos contra 108.
- **Cuatro dedos** que nacen **a lo ancho de toda la palma** (antes eran cuatro agujas juntas en el medio), cada uno con **tres falanges** (el largo de cada una y cuánto gira), el índice menos curvado y el meñique más, el medio el más largo y el meñique el más corto; 72 triángulos cada uno (6 tramos × 6 lados); **la uña pintada en la yema** (color por vértice, 0 triángulos).
- **El pulgar** con su base carnosa sobre la palma y dos falanges hacia adelante.
- Dedos y pulgar son **piezas finas** (lejos no se dibujan). Con guantes, la mano es de lana como antes; las marcas del oficio (brea, pintura) siguen pintando también los dedos nuevos.

### c) La nariz (`NARIZ_4_25`) y la cara
Se probó **una pieza de nariz aparte** (dorso, punta y dos aletas apoyados sobre la superficie esculpida): **se sacó**. En las capturas del juego (`pares` de Ramón y Elsa, versión intermedia) se leía como un grumo pegado y más pálido que la cara, **peor que la nariz de siempre**, porque las piezas sueltas no comparten las normales de la grilla del cráneo. Quedó **en el esculpido del propio cráneo, con la misma grilla (0 triángulos de más)**: el puente, la punta y las aletas suben un poco (+15 a +45 % de cada término), se agrega la **fosa hundida bajo la punta** y las fosas pintadas se oscurecen un poco (0,40 → 0,52). La punta sobresale entre 2 y 4 mm más que antes (medido en la malla); con el tamaño de cada nariz (`cara.nariz` de `gente-ropa.js`) como siempre, así que nadie cambia de cara.
**Párpados, labios y orejas no se tocaron:** ya eran geometría con forma (ver §0); lo que se vio no justificaba gastar triángulos ahí.

### d) Más capas de color en la ropa (color por vértice, **0 triángulos**)
- **Poncho**: la esclavina (los hombros, de la costura de arriba hacia el cuello) un tono más hondo que el cuerpo, con la costura marcada, y el **cuello con el forro claro** (`#d8c49c` mezclado un 34 %).
- **Puños** de las mangas: costillas de punto (columnas alternadas de claro y oscuro).
- **Gorro de lana**: una franja clara sobre el doblez.
No cambia ningún color base de nadie (sólo se suman capas sobre el color de cada uno), ni ninguna tela del atlas.

## 2. Presupuesto

**Triángulos por persona** (82 variantes: los 41 personajes, de verano y de invierno; armados en Node con el código de cada versión): **+404 a +440** (media **+435**, 3,0 % de los ~14.300 de la 4.24.1; el tope era +1000). Los que se dibujan **de lejos** (sin lo fino) van de **−140 a +72** (Ramón y Rosa bajan, porque la mano del mate pierde dos bolas que no eran finas; el resto sube lo que cuesta la palma nueva). **Mallas por persona: las mismas** (una con piel y la cara aparte; la moza, la bandeja), **huesos: 24 por persona como antes**, **0 programas de shader, 0 texturas, 0 capas de pantalla completa** (la prueba lo comprueba). En la plaza, con unas 24 personas a la vista, son ~10 mil triángulos más sobre ~1,3 millones (0,8 %; la calibración de la 4.20.0 da 0,05 ms de placa por cada 100 mil).

**Medido** (notebook, 1080p con lienzo de 1920×1081, ventana visible en el monitor externo, 13 rondas **alternadas** contra la 4.24.1 —`base`, `nuevo` y al revés en las pares—, 5 s de CPU sin lastre y 5 s de placa con lastre por encuadre; el ruido entre tandas es de ±2 ms y la PC tenía otras corridas cerca, la placa dio 29 a 33 ms contra los 25 de la 4.20.0). Diferencia nuevo − base, ronda por ronda; **la ronda 1** (la primera después de un rato quieto: la base salió en frío, 21,7 de placa) es el arranque y se cuenta aparte.

| encuadre | CPU (mediana de las 13 diferencias · mediana de la media) | placa (mediana) | rango CPU · rango placa (sin la ronda 1) |
|---|---|---|---|
| 05 plaza día | **0,00** · −0,12 | **−0,17** | −5,2 a +1,1 · −1,7 a +0,4 |
| 06 plaza ocaso | **+0,30** · +0,15 | **−0,05** | −0,8 a +1,7 · −2,5 a +1,7 |

(Ronda 1: día +3,3 CPU y +7,7 placa; ocaso +3,8 y +13,4: la base corrió fría y rápida y la nueva ya con la PC caliente; en las otras 12 rondas no pasa.) **La plaza no empeora más de lo permitido**: placa −0,2 y −0,05 (tope +0,5); CPU 0,00 de día y +0,30 al ocaso, **en el borde del tope de 0,3 pero dentro del ruido** (de las 12 rondas sin el arranque, 7 dan más y 5 dan menos o igual; media +0,22 con un error de ±0,23, o sea indistinguible de cero). **Estructuralmente no hay causa de CPU**: las mismas llamadas por persona (una malla con piel), el mismo trabajo de pose y de choque; lo único que cambia son los vértices de una malla que se sube una vez al armar a la persona. Las llamadas del cuadro varían ±17 entre rondas por cuánta gente queda a la vista (base: 184 a 206, nuevo: 190 a 206), no por esta versión. El subsistema `npc/perro` (gente): −0,38 de día y 0,00 al ocaso (medianas de las diferencias).

Tiempo de armar a una persona (Node, 82 variantes): 210 ms en la 4.24.1 y 197 ms en esta rama (la diferencia es ruido; los dedos nuevos son pocas piezas y no suman un paso de armado).

## 3. Capturas antes y después
Con `herramientas/auditoria-visual-4-20-0.cjs` y los encuadres nuevos de `herramientas/auditoria-visual-4-25-0.json` (armado por `herramientas/generar-tomas-4-25-0.cjs`: un «estudio» en un claro cerca del refugio —la gente se congela y se trae a la persona pedida, así antes y después tienen la misma luz y el mismo fondo—, de cerca, a 2,6 m y a 12 m, en verano y en invierno), de Ramón, Elsa (la guarda), Rosa (la panadera), Nahuel y Lucía (los chicos), la abuela Herminia, el jefe Ernesto, y la gente abrigada de la nieve (poncho, bufanda, gorro). Lo que se ve a ojo:
- **Ramón con el mate** (verano e invierno): la mano agarra la calabaza con los cuatro dedos por delante y el pulgar por detrás; **es la mejora clara**.
- **Caras** (Ramón, Elsa, Rosa, los chicos): la nariz queda un poco más definida (punta, aletas y fosa), sin cambiar la cara de nadie; el cuello del poncho de Ramón es un poco más claro.
- **Cuerpo a 2,6 m y a 12 m**: las manos sueltas se leen mejor que las cuatro agujas (cinco dedos con su nudillo), pero **a esa distancia son 10 a 15 píxeles**: la diferencia es chica; de lejos no hay ninguna (todo lo nuevo es pieza fina o color).
- **Invierno** (poncho, bufanda, gorro): la esclavina apenas se nota con la bufanda encima; la franja del gorro y los puños con costillas se ven de cerca.
- **El perro** no se tocó (no es parte de `gente-cuerpo.js`); en las capturas aparece igual que en la 4.24.1.

## 4. Pruebas
- **Nueva `pruebas/verificar-4-25-0-c.mjs`** (se suma a `verify:pasos`; **32 comprobaciones propias y 2.459 más sobre la gente armada, 20 mutaciones**; ~50 s): arma **a toda la gente** en una VM (sin DOM, con el three local) con el código de `gente-cuerpo.js` y compara contra la tabla de la 4.24.1 (`pruebas/datos-4-25-0-c-base.json`, medida con el código de esa versión): una malla con piel y la cara aparte por persona, de +250 a +1000 triángulos, lo que se dibuja de lejos casi sin cambio, los huesos. Mira la geometría armada **antes de fundirla** (con un gancho en el código dentro de la VM): los cuatro dedos cubren el ancho de la palma y cuelgan debajo; cada mano tiene sus cinco dedos con tres falanges y el pulgar con su base; los del mate pasan por delante de la calabaza, el pulgar queda por atrás y nadie atraviesa la calabaza; la nariz sobresale entre 1,5 y 8 mm más que en la 4.24.1; la esclavina del poncho es más oscura que el cuerpo y el forro del cuello más claro; el puño tiene costillas; el gorro tiene su franja. Y las reglas de presupuesto del archivo (0 `ShaderMaterial`, 0 destinos de dibujo, sin pasadas de pantalla completa, LF, sin exportar nombres con ñ).
- **Mutaciones de verdad** (copias del código en memoria, cada una con su VM; la copia sin tocar pasa por el mismo camino): los cuatro dedos juntos en el medio, la palma otra vez una bola, dedos derechos, el meñique tan largo como el medio, los dedos sin ser piezas finas, la mano con 14 tramos y 10 lados, sin el pulgar, sin su base carnosa, la mano del mate sin dedos, los dedos del mate a la misma altura, el pulgar del mate del mismo lado, los dedos del mate con un cuarto de vuelta, adentro de la calabaza, la nariz como en la 4.24.1, la nariz exagerada, sin las fosas, el poncho sin esclavina, el cuello sin forro, el puño liso, el gorro sin franja. **Las 20 hacen fallar su comprobación.**
- **Previas que tocan lo cambiado** (corridas una por una, 14 archivos que leen `gente-cuerpo.js`, `crearPersona` o el atlas): `verificar-3-7-0-integracion`, `3-7-0-personajes`, `3-7-2-cabezas`, `3-8-0-arreglos`, `3-8-coihue`, `3-8-duendes`, `3-9-1-pena`, `3-9-2-cantina`, `3-9-2-mejoras`, `3-9-moza`, `4-0-2-blusa`, `4-0-2-dalia`, `4-0-5-dalia`, `4-10-1-npc`: **14 de 14 en verde, sin ajustar ninguna**. No se corrió `npm run verify` completo.
- **Humo de partida real** (`pruebas/humo-partida.cjs`: 4 calidades × estaciones × climas × 16 lugares, caminar, cuaderno, guardar y recargar; monitor externo, perfil propio, candado): **0 errores de consola en las cuatro combinaciones y la partida guardada en las cuatro**; sus «fps» (de 1 a 5) son los de la ventana oculta del humo, como en la 4.24.1.

## 5. Lo que no se hizo
- **Párpados, labios y orejas**: ya eran geometría con forma; no se tocaron (ver §0).
- **Capas de color en más prendas** (chaleco, campera, delantal, pantalón: parches, vivos, cuellos con forro): sólo se hicieron el poncho, los puños y el gorro. El resto necesita más anillos de geometría para que el color no se desparrame (cada anillo cuesta 24 a 36 triángulos) y la nariz de aparte dejó claro que sin verlo a ojo prenda por prenda no conviene sumar. Quedan para quien las vea a ojo.
- **Pasos de pose con manos** (cintura, cruzados, atrás): no se vieron con las manos nuevas en el juego (ver §6).
- **Medición en la 4600G**: descartada por el usuario.

## 6. No visto a ojo
- Las manos nuevas **en las poses quietas** (manos a la cintura, cruzadas, detrás, en el delantal) y caminando: los dedos son 1 cm más largos que las agujas de antes y no se miró si alguno asoma por la ropa en esas poses. Se miró de pie, de frente y de costado.
- Los chicos (`aldea-nene`, `aldea-nena`) y las pobladoras con delantal de cerca en la aldea: se capturaron en el claro (no en su lugar): la luz de la aldea y la cantina no se miró.
- **Calidades Media y Baja** y lluvia/otoño: las capturas son de Alta, verano e invierno.
- La mano del jugador en primera persona (`manoPrimeraPersona`) no se tocó.

## Claves de guardado
Ninguna.

## Herramientas (no entran al gate)
`herramientas/generar-tomas-4-25-0.cjs` y `herramientas/auditoria-visual-4-25-0.json` (54 encuadres: el estudio de cada personaje, el de la plaza para medir, la gente de la plaza). La herramienta de capturas es la de la 4.20.0 sin cambios; se corrió con `herramientas/correr-auditoria-4-23-0.ps1` (que toma y suelta el candado por corrida). El visor de geometría sin Electron (rasterizador mínimo en Node) quedó en `hx\c4250\js` (no entra al repositorio).

## Efectos que cruzan a otras zonas
Ninguno hacia A ni B (nada de Historia, economía, guardado, mapa ni tren). Sólo `src/gente-cuerpo.js`, `package.json` (la prueba en `verify:pasos`), la prueba y sus datos, y las dos herramientas.
