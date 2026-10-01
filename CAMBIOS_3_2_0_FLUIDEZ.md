# Hojarasca 3.2.0 — Fluidez (ritmo parejo, F3 y menos tirones)

Misma regla que la 2.7.3/2.7.4: la imagen no cambia. Las 25 capturas deterministas (media,
de día y de noche, con obras, estación y tren) dan diferencia 0 píxel por píxel contra la
foto de la 3.2 tomada antes de empezar.

## Ritmo parejo según el monitor (como RAGE)

- **Nuevo límite de cuadros «Auto (según tu monitor)», de fábrica.** Dibuja un cuadro cada
  k refrescos, siempre la misma cantidad: 144 Hz → 72 (o 144 si la máquina da), 120 Hz → 60
  (o 120), 60 Hz → 60, 165 Hz → 82,5. Antes, 60 sobre 144 Hz alternaba cuadros de 2 y 3
  refrescos, y hasta en 120 Hz el reloj del límite mezclaba cuadros de 1, 2 y 3 refrescos
  (medido: 20 a 48% de los cuadros cambiaban de largo respecto del anterior).
- El refresco se mide con los sellos de `requestAnimationFrame` toda la partida, y Electron
  avisa el del monitor donde está la ventana (se le vuelve a preguntar cada 5 s).
- k se ajusta solo con histéresis: sube si tres de cada cuatro cuadros ya usan el 95% del
  tiempo (se mide la CPU y, con `EXT_disjoint_timer_query`, la placa); baja si el 90% entra con
  mucho margen varios segundos seguidos; cada vez que una bajada no aguanta, la próxima espera
  el doble (3, 6, 12… hasta 192 s). Tirones sueltos o en racha no bajan el ritmo.
- La simulación avanza con el sello del cuadro (cae en el vsync) y, con el ritmo parejo, con
  un número entero de refrescos: sin temblor de décimas de ms, y el reloj del juego no
  adelanta ni atrasa (lo que se aparta se devuelve de a poco).
- 30, 60, 120 y Sin límite siguen. Un número que divide justo al refresco (60 en 60/120 Hz,
  120 en 240 Hz) también cuenta vsyncs enteros; uno que no (60 en 144 Hz) queda como antes.
- **Migración:** quien tenía el 60 de fábrica pasa a Auto. Los ajustes ahora llevan
  `versionAjustes: 2`, así que un 60 elegido a mano desde esta versión se respeta.

## F3

Gráfico de los últimos 240 tiempos de cuadro (línea del objetivo y del doble), 1% peor de
verdad (promedio del 1% de cuadros más largos), tirones (> 2× el objetivo), el ritmo
(«auto: 144 Hz ÷ 2 = 72 parejos»), costo del cuadro y de la placa, y el perfil por
subsistema. F3 no es de ninguna acción de fábrica; si el jugador se la da a una, es de ésa.

## Menos tirones al caminar

Three metía la cantidad de luces del cuadro en la clave del programa de todos los
materiales, también de los que no usan luces (básicos, los de profundidad de las sombras,
shaders sin `lights`): cada edificio con luces que aparecía recompilaba esos programas en
medio del dibujo. `armar.mjs` ahora les pone 0 (su shader no las lee). Recorrido
determinista por el valle: compilaciones en medio del dibujo 102 → 9, tiempo trabado por
ellas 12,9 s → 3,4 s; programas al cargar 108 → 80. El runtime de three queda intacto.

## Arreglos

- `package.json` tenía la descripción con el encoding roto (verificar-bughunt-1-6-1 fallaba).

## Queda para la 3.3

- Los tirones que quedan (200–450 ms en una Radeon integrada) son programas con luces:
  cada combinación de luces a la vista pide ~15–35 programas de ~250 ms cada uno en ANGLE
  D3D11. Arreglarlo de raíz es fijar la cantidad de luces, que mueve ±1 algunos píxeles
  (2.7.4): lo tiene que decidir el usuario (o ir dentro del modo fluido).
- Fusionar estáticos por chunk y material, culling por chunk, sacar ocultos del recorrido.
- Web Workers para la IA de fauna (hoy cuesta < 0,5 ms por cuadro: no es la prioridad).
- Modo fluido (resolución dinámica).

Prueba nueva: `pruebas/verificar-3-2-fluidez.mjs` (en `verify`).
