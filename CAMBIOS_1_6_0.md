# 1.6.0 — Diez mejoras

Plan aprobado de diez puntos. Lo que cambió, en orden.

## 1. La tala como se merece
El árbol ya no desaparece: cada hachazo lo hace temblar y, al tercero, **se viene abajo
hacia el lado contrario al tuyo** (1,7 s de caída, rebote al tocar el suelo, crujido de
fibra y golpe seco). Queda el **tocón** en el suelo. Mientras se mueve, ese árbol se dibuja
como una malla propia de una sola instancia y la del chunk se apaga: no hace falta
recompactar el LOD cercano en cada cuadro (`src/vegetacion.js`, `talar`, `sacudir`,
`actualizarCaidas`).

## 2. El bosque vuelve a crecer
Cada árbol talado queda anotado en la partida (índice y día). Con los días el tocón
rebrota: **a los 2 días un brote, a los 4 un renoval, a los 6 un árbol joven y a los 9 el
árbol entero**, con su choque y su madera de vuelta. Plantar un renoval al lado (B) le saca
3 días. En la pausa se ve cuántos tocones están rebrotando. Módulo puro `src/bosque.js`.

## 3. Acopio de materiales
Pieza nueva (O → Trabajo, 2 troncos y 2 tablas). **E** guarda todo lo que llevás encima; con
las manos vacías, lo saca. Mientras estés a menos de 18 m, **lo que construís se paga solo
del acopio** (primero la pila, después la mochila), y el panel de obra muestra las dos
cuentas. Se terminó el ir y venir con el monte a cuestas.

## 4. Mapa vivo y brújula con rumbo
En el mapa (M): **un clic pone una chinche**, otro clic encima hace que la brújula te lleve
hasta ella (con la distancia, y una flecha si quedó atrás), y el clic derecho la saca. Hasta
12 chinches, con nombre. El mapa marca además, solo, la caja del alba, la cápsula y el
galpón. Módulo puro `src/chinches.js`.

## 5. Relax con rumbo
- **Primer día guiado**: seis pasos que se tildan solos (ramitas, fuego, anotar, talar,
  aserrar, marcar el refugio) y que se pueden apagar en los ajustes. Al terminar deja
  ramitas y tablas.
- **Seis encargos nuevos** de los vecinos, con recompensa: madera para el invierno, el banco
  primero, dejar de cargar todo, devolver lo que sacaste, tu propio mapa y la picada de la
  tarde. Todos con su entrada en el cuaderno.

## 6. Invasores nuevos y un jefe
- **Saltador** (desde la noche 3): chico, rapidísimo y de poca vida. No rompe: **salta** la
  empalizada, la pirca y las estacas de un arco, y te aparece adentro de la base. No pasa la
  empalizada reforzada, el muro almenado ni el portón.
- **Escupidor** (desde la noche 6): lento, se planta a 9 m y **escupe ácido con arco**. El
  ácido hace 26 a las defensas en el impacto y salpica alrededor.
- **Jefe de nido** (noches 5, 10, 15 y 20, uno solo): 900 de vida base, el doble de alto que
  el bruto, 130 de daño a las obras, inmune a boleadoras y a las antorchas. Se da vuelta muy
  lento a propósito: **los sacos de la espalda son su punto débil y reciben el doble de
  daño**. Al caer suelta entre 14 y 20 cristales. Su barra de vida aparece grande arriba.
- El jefe ocupa el lugar de un invasor común, así que la cantidad por noche no cambió, y las
  noches de jefe no pueden ser además noches especiales.
- El foso y el pozo lo frenan poco: es demasiado pesado para clavarse (25% del daño).

## 7. Defensas con más juego
- **Foso con estacas**: se pone delante del paso, no frena pero lastima al que lo cruza, y
  se gasta con el uso.
- **Portón con tranca**: la mejora del portón, con marco de pirca y una tranca gruesa;
  aguanta el doble y se sigue abriendo con E.
- **Parte de la base (N)**: qué defensas tenés, cuál está más rota, a qué distancia, y un
  consejo concreto antes de que caiga la noche. Módulo puro `src/base-estado.js`.

## 8. Mando y accesibilidad
- **Joystick** (Gamepad API): sticks para caminar y mirar con zona muerta y curva de
  respuesta, A salta, X interactúa, R2 ataca, L2 bloquea, cruceta para mochila/taller/planos/mapa.
  El mando aprieta las mismas teclas que ya entiende el juego, y avisa al conectarse.
- **Teclas propias**: panel para remapear 21 acciones (Esc y F1 quedan fijas), con rechazo de
  duplicados; la tecla vieja deja de hacer lo que hacía.
- **Tamaño de letra** (normal, grande, enorme), **paletas para daltonismo** (protanopía,
  deuteranopía, tritanopía) y **subtítulos** de los avisos.

## 9. Varias partidas guardadas
Tres partidas por modo, cada una con su día, su hora, su resumen y una **miniatura** de
dónde quedaste. La primera conserva las claves de siempre, así que nada de lo guardado antes
se pierde. Se cambian desde la portada o la pausa; borrar una no toca las otras.

## 10. Calidad automática
El juego mide los cuadros por segundo reales (media móvil y el 5% peor, que es lo que se
siente como tirón) y **sube o baja un escalón de calidad solo**, avisando por pantalla: baja
si no llega a 45 sostenidos, sube si le sobran 80, con tiempo de gracia, sin oscilar y como
máximo tres bajadas por partida. Lo que se puede acomodar sin rehacer el mundo (distancias
de dibujo, detalle, niebla) se aplica en el momento. Se apaga desde los ajustes.

## Pruebas
`npm run verify` (62 pasos, incluye los módulos nuevos: bosque, partidas, autocalidad, mando,
chinches, relax, base) y partidas reales en Electron: `humo-desafio`, `humo-desafio-premium`,
`humo-partida`, `humo-partidas`, `humo-autocalidad`, `humo-accesibilidad`, `humo-1-6`.
