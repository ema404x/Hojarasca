# Hojarasca 4.12.3 — El shader que se compilaba tarde

Sobre `main` = 4.12.2 (el quinto pase de bugs de la 4600G). Una sola cosa, chica.

## El problema
Las partidas reales (`humo-4-12-0-bordes`, `humo-4-12-1-edificios`, `humo-4-12-2-animales`) contaban un programa de shader más durante el juego (103 → 104, en Media y Alta): un tirón de un cuadro la primera vez que aparecía. `npm run verify` no lo cubre (es de placa). Se había atribuido a los animales con huesos, y el arreglo de precalentado de la 4.12.2 no lo resolvió.

## La causa
Un diagnóstico que engancha `renderBufferDirect` y anota qué objeto hace crecer la lista de programas (`herramientas/diag-programa-tardio.cjs`) mostró que era **la silueta de la sombra del jugador** (`cuerpo-jugador-sombra`, una malla de sólo `position` con un MeshBasicMaterial sin color ni profundidad): desde las sombras de la 4.12.1 (la capa de las siluetas entra al mapa de sombras), su programa de profundidad se compilaba la primera vez que se rehacía el mapa con la silueta presente. No tenía que ver con los animales.

## El arreglo
`precalentarSilueta` (`src/animales-piel.js`, llamada desde `precalentar` en `src/gente.js`, junto al precalentado de la piel): en la carga se dibuja un instante una malla igual a esa silueta (mismo material, mismo atributo, con sombra), así que el programa se compila ahí. Nada cambia en el juego.

## Verificación
- `pruebas/verificar-4-12-3-shader.mjs` (en el gate, 12 comprobaciones; sacar la llamada de `gente.js` la hace fallar).
- Partidas reales en verde: `humo-4-12-0-bordes` (25 pasos), `humo-4-12-1-edificios` (25 pasos) y `humo-4-12-2-animales`; el diagnóstico ya no encuentra ningún programa nuevo en 160 cuadros de día, noche y giros.

## Pendiente
- Lo de la 4.12.2 sin ver ni medir sigue igual (fps en la 4600G, sombras cercanas más gruesas, minimizar con audio, puente con carro).
