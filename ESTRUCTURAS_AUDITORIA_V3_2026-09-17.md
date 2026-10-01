# Hojarasca — Auditoría estructural v3

Esta versión integra las correcciones profundas de física y estructuras de la auditoría v3.

Principales correcciones:
- clave exacta para celdas de la grilla espacial, evitando colisiones fantasma por hash;
- resolución iterativa de esquinas y cruces de colisiones;
- plataformas circulares/anulares y huecos de escalera sincronizados entre geometría y física;
- paredes curvas, ventanas y escaleras circulares con orientación coherente;
- puente ferroviario con plataforma física alineada con el tablero visible;
- límites verticales consistentes en colisiones estructurales;
- escaleras y galerías de cabañas sincronizadas con la física;
- puertas elevadas y paredes de estaciones/construcciones acotadas correctamente;
- una sola llamada de resolución física por frame desde jugador.js.

El index.html incluido contiene el código de juego actualizado en línea y carga Three.js 0.186.0 desde UNPKG para poder abrir y probar esta versión sin depender del bundle antiguo. Si se ejecuta `npm start` después de instalar dependencias, `armar.mjs` puede regenerar el bundle totalmente local/offline con esbuild.
