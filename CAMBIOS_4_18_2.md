# Hojarasca 4.18.2 — Historia: lazo para los vecinos que no lo tenían

Ramas v4182-a (mecánica) y v4182-b (guiones y textos), juntadas. Detalle en CAMBIOS_4_18_2_B.md y en los commits de A.

- Rosa, Tobías, Tito, Belisario, Herminia, Nicanor y Sofía tienen lazo de verdad, como Don Ramón, Josefina, Ercilia, Elsa, Fermín y Graciela: se guarda (las partidas viejas cargan con los siete en cero), se ve en la guía con el oficio y una frase, y la tarjeta de decisión los nombra en palabras cuando una opción los mueve. Nunca se muestran números.
- Hasta ahora las escenas ya escribían esos lazos (unos 50) pero el juego los descartaba en silencio; ahora cuentan, una sola vez por escena.
- El final suma una línea por vecino con lazo alto (Rosa, Tito, Tobías, Herminia y Nicanor desde la casa; Belisario y Sofía desde la confianza) y una línea tirante para Tito si dejaste el coihue en pie.
- Charla de después: cada vecino dice algo nuevo según su lazo (una vez cada línea); Tito, además, una tirante.
- Optativa nueva de Sofía, «La foto del valle» (La luz de las cinco), capítulos 7 y 8, en el tablón «De paso»: esperar la luz da más lazo que apurarla. Sin premios de objetos ni plata.
- Los encargos de Nicanor suman +1 de lazo, como los de los demás con arco.
- No cambió: los acompañantes, los aliados de la noche ni lo que hacen los seis lazos de siempre.
- Verificación: npm run verify de corrido; pruebas nuevas de A (513 comprobaciones, 39 mutaciones) y de B (190, 100 mutaciones de datos y 25 de código); humo de partida real con una escena de cada vecino.

## Sin ver / pendiente
- A ojo no se vieron: la cámara de foto-valle en el estudio, que Sofía esté adentro al empezar, ni el paso de hora a las cinco; tampoco la guía abierta con los siete (sólo su contenido).
- Con los siete en la casa el final suma siete párrafos y la tarjeta queda larga, con scroll.
- Belisario y Sofía llegan como máximo a lazo 2 con las escenas de hoy (sus líneas de final piden 2); Tito es el único que puede quedar tirante.
- «D5 A sin costo» no hace nada; visitar a Ramón y la torta de Herminia no gastan nada.
- Herminia en la puerta de su casa no se dibuja de lejos; las lucecitas del amanecer del galpón sin ver; las estacas del herrero se leen como rayas finas.
- Programas de shader 111 en esta versión; de noche en la aldea suben a 113/114 (también en el Relax libre): revisar en la 4600G.
- Logros de Steam sin hacer; textos sólo en castellano.
