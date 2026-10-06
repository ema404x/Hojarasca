# Hojarasca 3.7.3 — La trochita

Se hizo en la PC de escritorio, con el diseño que el usuario aprobó: el prototipo `proto-tren`, inspirado en La Trochita de Esquel.

## El tren (sólo Relax; el Desafío sigue con el de siempre)
- **La Baldwin «La Hojarasca»** con su ténder de leña.
  - Al principio sale la locomotora vieja, con dos coches de segunda.
  - Lo que mejorás en el taller aparece en el tren: farol, quitanieves, arenero, banderines, pintura y nombre.
- **Manejo:**
  - La caldera da más tirón y más velocidad por nivel, y el freno frena más.
  - Sin arenero, las ruedas patinan con lluvia o helada.
  - Hay silbatos a elegir, incluido uno de pájaro; suenan con Espacio en la cabina.
  - El farol alumbra la vía de noche y sigue las curvas.
- **Nieve:** sin quitanieves, el tren se planta hasta que pasa la cuadrilla con palas. Con quitanieves, abre la vía solo. La gran nevada de la 3.7.5 va a usar `taparVia`.
- **Vagones que se usan:**
  - **Pasajeros con salamandra:** te saca el entumecimiento; viajan vecinos que charlan.
  - **Comedor:** cocinás en viaje (la cocina de la 3.7.2) y tomás mate.
  - **Carga:** más fletes.
  - **Para el caballo:** tu caballo viaja y baja con vos.
  - **Mirador:** las fotos de animales salen desde más lejos.
  - **Dormitorio:** dormís en la cucheta andando.
- **Composición:** ténder más 4 vagones como máximo. El tren para con el primer coche frente al andén y te subís por cualquier coche de pasajeros.
- **Rendimiento:** el tren completo son 7 dibujos (el viejo, unos 63). Los interiores, el caballo y los vecinos se apagan a más de 45 m.

## El taller ferroviario
- **El galpón:** frente a la estación de la aldea, con desvío, agujas y palanca. Al principio está viejo y a medio usar; se arregla con la primera mejora.
- **Adentro:** foso, banco con morsa, fragua, yunque, ruedas y aparejo.
- **Las mejoras:** 19 en total. Caldera y freno van de 1 a 3, más farol, quitanieves, arenero, banderines, silbatos y los 6 vagones.
  - Piden tablas, troncos y piedras, que podés llevar de a poco.
  - Las piezas de hierro las forja Anselmo.
  - Se hace una mejora por vez.
- **Panel:** con E en el galpón, para mejoras, pintura, nombre, silbato y composición. Anda con teclado, clic y mando, y avisa en el calendario.
- **Martín Sepúlveda:** maquinista retirado y vecino nuevo. Vive en el cuarto del taller y trabaja con Ernesto, con poses propias. Cuenta muchas historias de La Trochita real.

## Pruebas
- Gate 157/157, con `verificar-3-7-3-tren` y `verificar-3-7-3-taller`.
- Partidas reales en verde: tren, taller, 2.9 tren, aldea (3.6 y 3.7.0), vida, mecánicas, relax-2, desafío y rendimiento.

## Queda para después
- El foso no muestra la pieza que se arma.
- El terraplén del desvío es una losa lisa.
- Los vecinos que viajan son los del día de la carga.
- Todo lo nuevo está sólo en castellano.
- En esta PC, `al-monitor.cjs` puede colgar Electron.
