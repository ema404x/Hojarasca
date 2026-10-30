# Hojarasca 4.18.0 — Historia: subtramas optativas

Ramas v4180-a (mecánica de optativas), v4180-b (guiones) y v4180-c (mundo y pulido), juntadas. Detalle en CAMBIOS_4_18_0_A.md, _B.md y _C.md.

- Las 28 optativas del guion son jugables de punta a punta: registro (src/historia-optativas.js) con quién la ofrece, cómo se cumple, hasta cuándo sigue abierta y su premio; nunca traban el capítulo. El tablón suma «De paso (si querés)» y la guía «Lo que hiciste de paso».
- Escenas nuevas: el frasco de 1987 y su entrega a Rosa, la oveja de Ramón (la Porfiada), el pan para Fermín, el mirador y el faro con Graciela, juntar las ovejas desparramadas; 22 charlas de después y seis entradas del cuaderno de lo raro.
- Premios reales: pan de Rosa tres mañanas, ramal +2 por la vuelta, diez cantos, +15 flechas para la noche, $900 por las tablas de Tito, cinta del concurso, vellones por las ovejas; los encargos de los vecinos con arco suman lazo.
- Disparadores que faltaban: cumpleaños (si no hay fiesta, en el almacén de Ercilia), plumas del gallinero, abrir el galpón sin golpear (repetible), la costumbre del trato (bolsa del umbral y regalito).
- Arreglo: la charla de historia de los vecinos (de los tres actos) no se mostraba en ningún lado; ahora sale con la E, una vez cada línea. La bolsa del umbral se puede usar con la historia terminada.
- Mundo: 32 marcas mundo: del acto III se dibujan; Ramón sentado con manta junto a la estufa; Fermín en el techo del galpón (escena y noche); faroles de la loma y lucecitas de las raíces; frasco en la estantería del refugio; colocación de 16 escenas del acto III; umbral-fin con la pelea ya no cuenta la puertita del trato ni pone a Herminia en el refugio.
- Verificación: npm run verify de corrido; pruebas nuevas de A (368), B (121, 72 mutaciones de verdad) y C (10648); humos de optativas (las 28 hechas al menos una vez) y de pulido en orden tras juntar.

## Sin ver / pendiente
- Seis escenas siguen flojas a ojo: papel-elsa (cámara tras una pared), josefina-fin (helechos tapan el cartel), pedir-perdon (la raíz no se distingue), majada-fin (oscura), prestado-herrero (estacas tapadas), galpon-pelea (ventana fuera de cuadro).
- Sin ver a ojo: las escenas nuevas de B en el juego, el frasco, Fermín en el techo en la noche jugable, la pareja con una partida de amor real, las lucecitas al amanecer.
- Rosa, Tobías, Tito, Belisario, Herminia, Nicanor y Sofía siguen sin lazo en la historia (sus lazo: se ignoran); «D5 A sin costo» no hace nada; visitar a Ramón y la torta de Herminia no gastan nada.
- Programas de shader 111 a 113/114 de noche en la aldea y al construir el galponcito: también en el Relax libre, no por las optativas; revisar en la 4600G.
- Logros de Steam sin hacer; textos sólo en castellano.
