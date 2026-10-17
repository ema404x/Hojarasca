# Musgo de las piedras (4.0, rama `musgo-40`, sin unir y sin push)

El prototipo anterior (`proto-40-vegetacion`) apoyaba 4 «cojines» de malla sobre cada piedra: parecían hojas de nenúfar flotando. Esta vez no hay mallas nuevas: el musgo es color de la propia roca.

## Qué cambió
- `src/vegetacion.js` (`roca`, `puntajeMusgo`, `ruido3`): con calidad media o alta (`calidad.pasto >= 40000`) la piedra se arma con 720 caras (antes 80) y abolladuras suaves (lomos y hondonadas, ya no vértices al azar: se ven redondeadas y no como un hexágono). Cada vértice lleva su puntaje de musgo en el `aTipo` (4 + 0,95 · puntaje): cara de arriba, grietas (zonas hundidas) y manchas de ruido. Abajo, piedra gris azulada oscura (`sombraAbajo`).
- `src/materiales.js` (vertex shader del material vegetal, antes de la nieve): con `aTipo > 4.01` convierte el puntaje en musgo con un umbral suave (`smoothstep`, borde que se desvanece en la piedra, sin corte), distinto en cada piedra (azar por instancia) y más alto del lado del sol, o sea menos musgo al sol y más a la sombra (en el juego el sol siempre sale por +z, así que la sombra queda hacia -z; en el hemisferio sur es el lado sur). Todo por vértice: ni una llamada de dibujo, ni una malla, ni una textura más.
- `src/geometria.js`: opción `tipoVert` del `Constructor` (el tipo por vértice).
- Calidad baja y muy baja: la piedra de siempre, byte por byte. Las posiciones de las 640 rocas no se tocan (`verificar-2-2.mjs` sigue en verde).
- `pruebas/verificar-musgo-40.mjs` (en el verify): puntaje acotado, arriba más que de costado y de costado más que abajo, ni toda verde ni toda gris, transición suave, sólo media y alta, shader con el enganche antes de la nieve. `pruebas/fotos-vegetacion-40.cjs` saca las capturas (`pagina=` para el «antes»).

## Cómo se ve (capturas a tamaño completo, verano y otoño, `Documents\Hojarasca\trabajo\musgo40\antes` y `despues`)
De cerca (1 a 3 m, piedra de bosque) **se ve claramente mejor que la piedra lisa**: pasa de una losa hexagonal gris azulada a un canto redondeado con musgo en manchas de borde irregular que se funde con la piedra, más apretado arriba y escaso de costado; de tarde, desde el lado del sol, se ve más piedra. En otoño el musgo se mantiene verde (queda bien contra las hojas ocres).

## Límites
- Las piedras son chicas (0,4 a 1,5 m): de lejos y en las vistas del valle apenas se nota (no hay una captura de valle donde la diferencia salte a la vista).
- Con las escalas no uniformes de algunas piedras el lado del sol es aproximado; el borde del musgo en el canto plano de la piedra cambia en una sola arista (salto máximo 0,56 de 0,95 en la prueba), no se percibe porque el shader lo suaviza.
- 720 caras por piedra en vez de 80: +640 triángulos por piedra a la vista; el costo en fps NO se midió (otro agente mide). Dibujos: sin cambio por construcción.
- Tronco caído: no se tocó. No logré encontrarlo ni fotografiarlo en la partida (apenas 3 troncos en el mundo, ninguno visible desde las tomas), y sin verlo no se entrega.
- La piedra comparte una sola geometría entre las 640 (se reparte la variación por el azar de instancia, escala y giro): se nota la misma forma repetida si se miran muchas juntas.
