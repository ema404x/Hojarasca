# 4.10.3 · ajustes, partidas y sonido (zonas P y Q)

Rama `bugs-4-10-3-ajustes-sonido`, desde `origin/main` (4.10.2). Sin subir la versión, sin push, sin tocar `main`. Parte de los informes `trabajo\bugs5\zona-P.md` (12 hallazgos) y `zona-Q.md` (13). Eran revisiones de lectura: cada hallazgo se volvió a confirmar leyendo el código (los de sonido, además, con el AudioContext de mentira de `pruebas/ayuda-audio-falso.mjs`, copiado de los arneses del revisor). Esta ronda se hizo **sin Electron y sin el gate completo** (la PC estaba ocupada): sólo pruebas sueltas de Node. Lo que hay que oír o mirar está en «Para escuchar/mirar en Electron».

## Estado de cada hallazgo

### Zona P (personalización, ajustes y partidas)

| # | Estado | Qué se hizo |
|---|---|---|
| P1 | **Arreglado** (el enganche, probado por texto) | `ctxDesafio.fotoActiva` también vale `true` con `banco.activa`: el Desafío no revisa el horario durante el banco (el tramo «Noche», 22,3, ya no hace salir una oleada ni gasta la noche). Se agregó una línea aparte y no se tocó la existente (una prueba vieja fija su texto). |
| P2 | **Arreglado y probado** | `actualizarTiempo` con «Hora de tu reloj» no pisa `progreso.horas` mientras el banco está activo (cada tramo se mide a su hora). Además el banco guarda `progreso.dia` al empezar y lo devuelve al terminar (con el reloj de juego, un tramo de noche podía cruzar la medianoche). Probado ejecutando `actualizarTiempo` con una PC de mentira que marca las 08:00. |
| P3 | **Arreglado y probado** | `intentoVigente` (en `recuperacion-main.cjs`, pura): lo que `graficos.json` guardó **por caídas** (`porCaidas`) vence a los 7 días (se mide con la fecha del archivo, así que los archivos viejos también). Lo que se guardó porque el 3D no arrancaba (sin `porCaidas`) **no vence**: ahí no hay otra forma. La protección real (dos caídas en 5 minutos, otro `use-angle`) queda intacta y se vuelve a escribir, con fecha nueva, si vuelve a pasar. |
| P4 | **No tocado (pregunta)** | Recetas y ropa viajan sólo con «Empezar de nuevo» de la misma ranura; una ranura vacía arranca de fábrica. Cambiarlo es de diseño (¿lo personal es del jugador o de cada partida?). Ver preguntas. |
| P5 | **Arreglado y probado** | `calidadPideReinicio()`: pide reiniciar si la calidad elegida no es la de arranque **o** no es la que corre ahora. Tras «Bajar», volver a elegir la de arranque muestra el cartel y «Volver a la portada» recarga. |
| P6 | **Parcial** | Al bajar la calidad en vivo («Bajar» o pérdida del contexto 3D) ahora baja también la **resolución** (`pixelRatio`, 1,5 en Alta y 1 en Media), que es lo que más pesa en una placa integrada; se usa `acomodarEscalaPantalla`, que ya existía y respeta el modo fluido. **No tocado:** el posproceso con bloom, los rayos, el agua nueva y la niebla espesa (se arman al crear el mundo; apagarlos en vivo se ve distinto: ver preguntas). |
| P7 | **Arreglado y probado** | `marcarSi(grupo, valor)` en `personal-campos.js`: el botón de color de «Collar», «Pañuelo», «Alforjas», «Color de las cintas» y «Elástico» enciende el «Sí» del interruptor sin redibujar el panel. |
| P8 | **Arreglado** (probado por texto) | `registrarError` (plantilla): pasados los 200 mensajes distintos manda como mucho 100 más por sesión (antes, uno por ocurrencia). `escribirCrash` (`main.cjs`): al pasar 1 MB el registro se guarda como `hojarasca-crash.log.1` (pisando el anterior) y empieza otro. |
| P9 | **Arreglado y probado** | `acotar` (sólo ajustes): `null`, `""`, `true`/`false` y `[]` valen el de fábrica, no el mínimo (`volumen: null` ya no arranca mudo). El 0 de verdad y los topes se respetan. |
| P10 | **Arreglado y probado** | `reemplazarProgreso(nueva)` en `guardado.js`: escribe la partida nueva con el almacén ya liberado de la vieja y **recién después** borra las fotos; si no cupo, **devuelve** principal, copia y miniatura y avisa («No pude empezar de nuevo / otra vuelta / otra corrida: la que tenías sigue como estaba»). Lo usan «Empezar de nuevo», «Otra vuelta» y «Otra corrida». Probado con un `localStorage` de mentira al que no le cabe la partida nueva: el almacén queda idéntico. |
| P11 | **Arreglado y probado** | `explorado` (los 4096 ceros) queda `[]` en las partidas nuevas y se suelta al guardar una vieja. Nadie lo lee; la clave se conserva. Son unos 8 KB menos por copia. |
| P12 | **Arreglado** (probado por texto) | El aviso «Partida recuperada» se recuerda en `sessionStorage` (por ranura) y sobrevive a la recarga de la portada (cambiar calidad, idioma o modo); se borra al mostrarse. |

### Zona Q (sonido)

| # | Estado | Qué se hizo |
|---|---|---|
| Q1 | **Arreglado y probado** | La reverberación sigue la perilla de su bus: `envioReverb` (efectos) sigue «Efectos» y un `envioReverbMusica` nuevo sigue «Música» (y `setMusica`). La frase del Relax, el tocadiscos y el baile, la música del Desafío, las fiestas, la peña y la cantina mandan al envío de la música; la lluvia del techo (ambiente) va directo a las salas, con su 0,5, para que «Efectos» no se la baje. Con todo al máximo los niveles son **idénticos** a los de antes (0,5 y 0,5). Probado sobre el grafo: con Música o Efectos en 0, la ganancia de cada camino a `master` es exactamente 0; con 0,5, la mitad. |
| Q2 | **Arreglado y probado** | La cantina (`sonar`, ejecutada tal cual), `seguirMelodia` (baile y tocadiscos, con el contexto de mentira) y las fiestas (por texto) descartan las notas atrasadas más de 0,25 s, como la gramola. Probado: tras 12 y 30 s de pausa no arranca un racimo. |
| Q3 | **Arreglado y probado** | `fijarMezcla(true)` al final de `iniciar()`: los buses nacen con la mezcla del jugador (y «Solo el bosque» nace sin música). |
| Q4 | **No tocado (pregunta)** | El texto dice «Viento, agua, pájaros y lluvia» pero los pájaros salen por Efectos. Cambiar el texto obliga a tocar la traducción (regla del inglés) y cambiar el ruteo cambia cómo suena la mezcla de quien ya la afinó. Ver preguntas. |
| Q5 | **No tocado (pregunta)** | Los pájaros adentro de una casa suenan sin atenuar: es de diseño de mezcla. |
| Q6 | **Arreglado y probado** | `setMezcla` sin `hora` (los botones de Ajustes en la pausa) usa la última que se le pasó, no 1. |
| Q7 | **No tocado (pregunta)** | La gramola ignora «Solo el bosque» y sale por Efectos: el informe mismo dice que puede ser a propósito. |
| Q8 | **No tocado** | El «silencio raro» se consume durante una pausa: mismo desfase que Q2 pero entre `sonido` y el cronograma del Desafío; arreglarlo bien pide pasar el tiempo de pausa a `sonido`. Anotado. |
| Q9 | **No tocado** | `iniciar()` tarda 65-130 ms una vez: repartirlo en la cola cambia el orden de armado del audio; sin medirlo en Electron no lo toco. |
| Q10 | **No tocado** | Costo de `PannerNode` de 8 s en las hordas: es rendimiento, hay que medirlo; no es fuga. |
| Q11 | **Arreglado y probado** | `trabajarCola`: una receta que tira se descarta (y se saca de `pendientes`); antes se quedaba al frente y trababa la cola. |
| Q12 | **No tocado** | La radio de la madrugada: audio que llega tarde, sin forma de apagarla. Cambia el comportamiento de un huevo de pascua. |
| Q13 | **No tocado** | El aro de hongos puede sintetizar ~50 ms de golpe si la noche empieza antes de que se vacíe la cola; mismo agujero que ya estaba anotado en la ronda anterior. |

Ningún hallazgo se descartó por no confirmarse: todos los que se tocaron se leyeron completos y eran ciertos tal como los describe el informe.

## Decisiones tomadas sin consultar

1. **P3: vigencia de 7 días por la fecha del archivo**, en vez de contar arranques estables (habría que escribir en cada arranque y definir «estable»). Es lo que menos cambia: nada se desactiva, sólo vence con el tiempo.
2. **P5: se compara contra las dos calidades** (la de arranque y la que corre) en lugar de sólo la que corre: así sigue pidiendo reinicio cuando la elegida difiere de la que armó el mundo (la densidad del bosque), como antes.
3. **P6: sólo la resolución.** El resto (bloom, rayos, agua, niebla) queda; lo dice el aviso que ya existía.
4. **P10: se restaura lo anterior si no cupo**, en vez de reordenar a ciegas (la cadena de la copia de seguridad depende de arrancar de cero).
5. **P11: la clave `explorado` se conserva vacía** (no se quita del guardado), por si algún lector externo la espera.
6. **Q1: un envío de reverb por bus** (efectos y música), en vez de un volumen sobre el retorno: así «Música» en 0 no apaga la cola de los efectos ni al revés.
7. **Q2: se descarta lo atrasado** (como la gramola, 0,25 s) en vez de llamar a `callar` en la pausa: la música sigue sonando donde estaba.
8. **Q3/Q6: la mezcla por hora se recuerda en `sonido`** (`horaMezcla`); `main.js` no cambia sus llamadas.
9. **Q4/Q5/Q7: no se hace ninguno** (cambian cómo suena o cómo se usa, o tocan la traducción).

## Pruebas

Nuevas (enganchadas al gate con `sumar-prueba.cjs`):
- `pruebas/verificar-4-10-3-sonido.mjs`: ejecuta el motor real (`sonido.js`) con el contexto de mentira `pruebas/ayuda-audio-falso.mjs`: mezcla inicial (Q3), reverb por bus con Música y Efectos en 0 y en 0,5 (Q1), mezcla por hora (Q6), notas atrasadas tras la pausa en tocadiscos y cantina (Q2) y cola de síntesis (Q11). Se comprobó que falla sin los arreglos.
- `pruebas/verificar-4-10-3-ajustes.mjs` (49 comprobaciones): banco (P1, P2), vigencia de gráficos (P3), calidad (P5), interruptores (P7), ajustes en null (P9), partida nueva sin ceros (P11), `reemplazarProgreso` con cuota llena (P10), y los enganches de P6, P8 y P12.

Ajustadas (lo mínimo, porque fijaban lo cambiado a propósito):
- `verificar-musica.mjs`: la firma `setMezcla(..., hora = {})` pasó a `hora` sin valor por defecto (la expresión acepta las dos).
- `verificar-estabilidad-rc25.mjs` y `verificar-2-8-personal.mjs`: la secuencia «borrarProgreso, progresoNuevo, guardarProgreso» pasó a «progresoNuevo, reemplazarProgreso(nueva)»; mismo propósito (no reusar la posición vieja, y lo personal pasa a la partida nueva).
- `verificar-3-8-3-base.mjs`: el aviso de «Partida recuperada» se dispara con `recuperadaPendiente`.

Corridas sueltas (un Node a la vez; todas con salida 0): las 75 pruebas `verificar-*.mjs` que nombran algo de lo tocado (`main.cjs`, `recuperacion-main`, `personal-*`, ajustes, banco, `btn-nuevo`, `otraVuelta`, `explorado`, `progresoNuevo`, `registrarError`, `fotoActiva`, `ctxDesafio`…; entre ellas 2-2, 2-8-compas, 2-8-personal, 3-5-1-caidas, 3-5-4-ventana, 3-8-3-base, 3-8-6-base, 4-0-3-foto, 4-0-5-bajos, 4-10-2-interfaz, 4-10-base, 4-7-pantalla, estabilidad-rc25, guardado-rc2, sincronia, release, vuelta), más `verificar-idioma`, `-1-10`, `-1-11`, `-2-3`, `-2-4`, `verificar-musica`, `verificar-sonido`, `verificar-3-8-5-sonido`, `verificar-3-8-4-alero-sonido`, `verificar-3-7-5-fiestas`, `verificar-3-9-1-pena`, `verificar-3-9-2-cantina`, `verificar-3-6-mecanicas`, `verificar-4-8-ambiente` y las dos nuevas. La única que falló al principio fue `verificar-2-8-personal.mjs` (fijaba la secuencia vieja) y quedó en verde tras el ajuste. También `node armar.mjs` (arma bien, 430 módulos) y `herramientas/revisar-escritura.cjs` (limpio).
**No corrí** el gate completo, `verify:paralelo`, `verificar-build-reproducible` ni nada de Electron.

## Preguntas

1. **P4:** ¿las recetas y la ropa deben viajar también a una ranura vacía («Empezar acá»)? Hoy sólo viajan con «Empezar de nuevo» de la misma ranura. Si sí, lo más simple es que `irAPartida` copie `progreso.personal` a la ranura vacía.
2. **Q4:** ¿corregimos el texto («El bosque: viento, agua y lluvia» y «Efectos: pasos, hacha, golpes, pájaros y avisos») o pasamos los pájaros al bus del bosque? Con el texto hay que sumar la traducción al final; con el ruteo, quien ya afinó «Efectos» oye distinto.
3. **Q5:** ¿los pájaros adentro de una casa (puerta cerrada) deben atenuarse como el viento y la lluvia?
4. **Q7:** ¿la gramola tiene que respetar «Solo el bosque» y la perilla de Música (hoy usa Efectos)?
5. **P6:** ¿apagamos en vivo el bloom, los rayos y el agua nueva al «Bajar»? Se ve distinto y hay que mirarlo.
6. **Q12:** ¿la radio de la madrugada debería poder apagarse o descartar el audio que llega tarde?

## Para escuchar/mirar en Electron

- **Q1:** Ajustes, Música a 0, esperar una frase de guitarra o quena (55 a 170 s): no tiene que quedar ningún «fantasma» sin ataque. Lo mismo con Efectos en 0 y un hachazo o la voz de un duende a lo lejos: sin cola de sala. Con todo al máximo, que suene como siempre (los envíos valen lo mismo). La lluvia sobre el techo de la cabaña, con Efectos en 0, tiene que seguir.
- **Q3:** guardar El bosque en 0,2 y Efectos en 0,1, cerrar, abrir y hacer el primer clic: el viento, el agua y el clic de la portada ya tienen que sonar bajos desde el primer segundo.
- **Q2:** dentro de la cantina con la guitarra (o en la plaza con baile), abrir el cuaderno o el mapa unos 12 s y volver: la música sigue sin racimo de cuerdas juntas.
- **Q6:** de noche o adentro de la casa, apretar un botón de Ajustes en la pausa: el bosque no tiene que saltar al 100 %.
- **P1/P2:** Desafío a las 14:00, Pausa, Banco de pruebas: el tramo «Noche» no tiene que sacar duendes ni gastar la noche (mirar `progreso.desafio.oleadaNoche` con `?debug=1`). Con «Hora de tu reloj» y la PC antes de las 10:18, `progreso.dia` igual antes y después del banco, y el tramo «Noche» tiene que dibujarse de noche.
- **P3:** matar dos veces el proceso GPU (`taskkill` del `--type=gpu`): se guarda `graficos.json` con `porCaidas`; para ver el vencimiento, cambiar la fecha del archivo a hace más de 7 días y abrir: tiene que arrancar con los gráficos de siempre.
- **P5:** arrancar en Alta, aceptar «Bajar», volver a Ajustes y tocar «Alta»: tiene que aparecer el cartel «Se aplica al volver a la portada» y «Volver a la portada» tiene que recargar.
- **P6:** tras «Bajar» de Alta a Media la imagen tiene que verse a menor resolución y los cuadros mejorar; mirar que el lienzo no se estire ni quede en negro.
- **P7:** Personalizar, Tu perro, Tu caballo, Tus armas y Cuaderno: tocar un color de «Collar», «Alforjas», «Color de las cintas» o «Elástico» con el «Con …» en «No»: el interruptor pasa solo a «Sí».
- **P10:** «Empezar de nuevo», «Otra vuelta» y «Otra corrida» tienen que seguir funcionando igual con espacio libre (el caso sin espacio es casi imposible de provocar).
- **P12:** forzar una carga desde la copia (romper el principal de una ranura), cambiar la calidad en la portada (recarga) y entrar: tiene que salir «Partida recuperada».
