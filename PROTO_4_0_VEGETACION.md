# Prototipo 4.0 — vegetación y suelo antes/después (16-10-2026, rama `proto-40-vegetacion`)

Sin contenido nuevo ni textos. Rama sin unir y sin push. Todo lo nuevo sólo en calidad alta (`calidadConPisadas`: `pasto > 60000`); en media y baja sale exactamente lo de antes.
Capturas (valle desde el mirador y desde el prado, flores a nivel de ojos y de cerca, orilla del lago, camino y piso del bosque, piedras; verano y otoño):
`Documents\Hojarasca\trabajo\proto40\vegetacion\antes\` y `...\despues\` (se sacan con `pruebas/fotos-vegetacion-40.cjs`; los puntos se buscan por reglas, son los mismos).

## Qué cambió
- **Pasto, flores y helechos se aplastan** (`src/pisadas.js`, shaders de `pasto.js`): 20 «pisadas» en un uniforme (4 animales: perro, caballo si no vas montado y los 2 pudúes más cercanos; 16 huellas tuyas, una cada 1,2 m, que se levantan en ~7 s). El viento y el empuje del jugador ya existían y no se tocaron. Sólo se calcula a menos de 24 m de la cámara.
- **Flores:** una tercera carta por mata (más llenas), los lupinos con la espiga más honda abajo y clara en la punta, colores por manchones y un vaivén propio de cada flor (sin esperar la racha).
- **Hojarasca:** parches con más hojas de tonos variados; 36 hojas «caídas» por parche (`aTipo 2,6`, `materiales.js`) que sólo salen en otoño (el resto del año quedan bajo la tierra) y se ponen rojas, naranjas y amarillas; parches nuevos al borde de los senderos del bosque (con azar propio: no mueve ni un árbol ni una piedra; 640 rocas, las mismas).
- **Piedras con musgo:** pie más oscuro (tierra húmeda) y 4 cojines de musgo arriba; el tronco caído, 7 tiras de musgo en el lomo.

## Costo medido (esta PC, `medir-vistas.cjs`, alta, COMPLETA=1, 200 cuadros; 3 corridas antes, 2 después, el mismo día)
| vista | antes p50 / p95 | después p50 / p95 | dibujos antes→después |
|---|---|---|---|
| bosque | 5,0/6,9 · 4,9/9,3 · 5,1/6,6 | 4,9/8,7 · 4,8/8,8 | 224→219 |
| refugio-dia | 4,2/7,9 · 4,7/6,2 · 4,7/5,9 | 4,9/8,2 · 4,5/9,1 | 194→198 |
| estacion | 4,0/9,4 · 3,9/9,5 · 4,2/9,1 | 4,7/10 · 4,0/10,2 | 158→164 |
| aldea-plaza-dia | 15,2/16,3 · 15,1/17 · 15,1/16,3 | 15,9/17,5 · 16/17 | 182→189 |
Control: las tres corridas de antes entre sí varían ±0,3 ms. Conclusión: p50 sin cambio medible salvo la plaza (+5 %, en el límite) y el p95 un poco más alto (+1 a +2 ms en algunas vistas). Triángulos +2 a +4 %. Falta medir en la 4600G. Gate: `npm run verify` 207 pasos OK.

## Límites y honestidad
- **Se nota poco a simple vista.** Los cojines de musgo sí se ven (las piedras ya no son bolas grises lisas), pero son blobs grandes que a veces se pasan del borde de la roca y no tienen el detalle de un musgo real: hay que afinar tamaño y forma. Las flores más llenas y los colores por manchón son un cambio sutil. Las hojas de otoño se ven de cerca como pequeños hexágonos naranjas, no como un manto: a la altura de los ojos y de lejos casi no cuentan.
- Aplastado y vaivén son movimiento: las capturas fijas no lo muestran; hay que probarlo caminando (el perro y las huellas). No lo verifiqué con partida real larga.
- Con el jugador corriendo, las 16 huellas (~19 m) se renuevan en pocos segundos: el rastro dura lo que dura la caminata.
- No se tocó el terreno, el viento por shader ni el sistema de sombras. No hay rayos de luz ni reflejos (otro prototipo).
