# Hojarasca 4.18.1 — Historia: las seis escenas flojas, arregladas

Rama v4181-a (cámara, colocación y props de seis escenas de la Historia). Detalle en CAMBIOS_4_18_1.md.

- papel-elsa: Elsa aparece sobre el andén, de frente, y no del otro lado del edificio.
- josefina-fin: el cartelito del coihue mira hacia el refugio, es más grande y tiene un plano cercano para leerlo.
- pedir-perdon: los tres planos se anclan a la raíz del molino viejo (antes, a «N pasos delante tuyo» entre los troncos).
- majada-fin: de frente al portón del galpón de esquila, con el cartel de Puesto Catrileo ya puesto en el primer plano.
- prestado-herrero: Anselmo aparece aunque todavía no viva en la aldea; las estacas a 6 m y de frente, vistas en picado.
- galpon-pelea: la cámara parte de la ventana con barro (la del refugio) y viaja hasta la puertita clavada en el galpón.
- De paso: plano cercano para las tres lucecitas del mirador; colocación de los cuatro amaneceres en el galpón; tranquera abierta más gruesa; la pelea en umbral-fin corta a la puerta de la casa de Herminia.
- Motor: un plano puede llevar sinDespeje: true (la cámara no se despeja contra bancos, estatuas o cercas pegados al lugar); un punto con rot orienta el prop.
- Verificación: npm run verify de corrido; prueba nueva verificar-4-18-1-pulido (1725 comprobaciones, 22 mutaciones); mirado en Electron real, antes y después.

## Sin ver / pendiente
- Herminia en la puerta de su casa no se dibuja: la gente a más de 130 m del jugador no se dibuja y el refugio queda a 700 m de la aldea; se ve la casa con la puerta entornada.
- Las lucecitas del amanecer alrededor del galpón no se vieron a ojo; la hoja de la tranquera abierta casi no se distingue a 18 m.
- prestado-herrero: las estacas se leen como rayas finas desde el picado; galpon-pelea: el barro de la ventana es oscuro de madrugada; majada-fin: la oveja bajo el nombre del cartel no está.
- Sin ver a ojo: las escenas nuevas de B, el frasco, Fermín en el techo en la noche jugable, la pareja con una partida de amor real.
- Rosa, Tobías, Tito, Belisario, Herminia, Nicanor y Sofía siguen sin lazo en la historia; «D5 A sin costo» no hace nada; visitar a Ramón y la torta de Herminia no gastan nada.
- Programas de shader: 111 al entrar y con el galponcito; 111 a 112 en majada-fin tras escenas de noche (el programa del galpón de esquila de día, ya anotado en la 4.17.0). Revisar en la 4600G.
- Logros de Steam sin hacer; textos sólo en castellano.
