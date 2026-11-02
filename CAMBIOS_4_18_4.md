# Hojarasca 4.18.4 — Búsqueda de bugs: la Historia, el Desafío y la cámara

Ramas v4184-a (la Historia por dentro), v4184-b (el juego base) y v4184-c (partida real: caos y recorridos), juntadas. Informes en BUGS_4_18_4_A.md, _B.md y _C.md.

- Desafío (ALTA): si la trochita se varaba y no la escoltabas hasta la estación, al llegar el alba o al caer tiraba un error y el tren quedaba varado para siempre, sin que corriera el resto del amanecer (capullos, lugares tomados, evolución, puestos, récord). La llamada a `tren.soltar(0)` estaba vieja desde la 4.0.3.
- Historia: con la historia terminada y «Libre» elegido en la portada, la partida entraba en pausa y la bolsa del umbral y el regalito de la cosecha dejaban de funcionar para siempre; ahora no se pausa (y una partida que quedó así se retoma sola).
- Historia: la raíz del coihue dejaba pagar la deuda del trato con la otra cosa en la mochila sin cobrar nada; ahora sólo ofrece pagar si alcanza para lo que la escena cobra.
- Historia: el objetivo del arco decía «o, si talaste el coihue, llevale a Tito dos tablas» y esa alternativa nunca se cumplía; ahora sí.
- Cámara: en el último segundo de toda escena, cuando la cámara vuelve al jugador, no se le ponía el piso del terreno y al cruzar una loma pasaba por adentro del cerro (visto en partida real en carpeta-celeste, bolsa-josefina y piedras-molino). Ahora tampoco baja del terreno.
- Sin problemas en lo que se barrió: las 122 escenas (244 corridas, todas terminan, sin errores), más de 200 recorridos simulados de los 13 capítulos, los tres recorridos reales (trato, pelea y el más difícil) hasta el final, guardar y cargar con la historia terminada, 20 menús por tecla y 14 botones de la pausa, la pausa en cada tipo de escena y en la noche, unos 15000 pasos de azar en el Relax, 726 charlas, 211 planos de obras, y una corrida de 20 minutos con la memoria estable (289 a 306 MB) y 0 errores de consola.
- Verificación: npm run verify de corrido; pruebas nuevas verificar-4-18-4-a (2028 comprobaciones, 15 mutaciones), -b (11) y -c (cámara de salida, con la copia sin el arreglo); humos de partida real de C (escenas, recorridos, caos y corrida larga).

## Sin ver / pendiente
- Preguntas de diseño: con D1 = b y D2 = b la escena cobra harina y también seis tablas, pero el objetivo dice «harina o tablas» (hoy hacen falta las dos); llave-molino, canto-gemelo, lampara-eusebio y pluma-condor se dan como premio pero la mochila no los dibuja; la línea final de Nicanor («cuando salen las luces sobre el lago…») sale también con el final de la pelea, donde el valle quedó tranquilo.
- Sospechas sin confirmar: cámara metida en un sólido en escenas del refugio, del coihue grande y del galpón de la cosecha (las capturas parecen planos de detalle a propósito); ramon-sanitario no se pudo disparar a mano en los recorridos aunque sí en el barrido; una caída a 1 fps en la corrida larga, que no se reprodujo al repetir ese capítulo solo.
- Anotado sin tocar: `aplicadas` puede llegar a unas 190 de las 200 marcas que guarda `sanearHistoria`; un guardado armado a mano con «toString»: null hace tirar un TypeError; código muerto en historia-ui.js (objetos `pago` y `cuidar`); el truco `historia capitulo N` deja decisiones y escenas sin tomar.
- No se vio: los objetivos que no son escena (talar, construir, cosechar, moler, kayak de noche) en el recorrido real (se marcaron como hechos), los disparadores naturales de casi todas las escenas, el cambio de modo (Historia, Relax, Desafío) a mitad de partida, el cambio de «Resolución» desde los ajustes, el audio, modo foto a fondo, mando real y colisiones reales entre obras.
- Programas de shader: 111 al entrar; sube a 113/114 de noche en la aldea (ya anotado).
- Logros de Steam sin hacer; textos sólo en castellano.
