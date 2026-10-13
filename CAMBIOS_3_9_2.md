# Hojarasca 3.9.2 — Dalia y el banco del pueblo (parte hecha por esta rama, `v392-mejoras`)

La parte de la cantina y la casa de té (Parte 2 del plan) la hace otra rama (`v392-cantina`); este archivo la completa quien junte las dos.
Capturas (fuera del repositorio) en `salida-cantina\mejoras\`: `dalia-final\`, `banco-antes\`, `banco-final\` (incluye `economia-*.png` y `log.txt`).

## Parte 0 · Dalia (`gente-cuerpo.js`)
- **El tajo ya no es dentado**: antes se sacaban triángulos de la falda. Ahora la falda es un torno completo con la costura en el centro del tajo y cada columna se reparte en el arco que queda: los dos bordes del tajo son rectos y limpios, con una **cinta roja de contraste** cosida.
- **Falda en A**: ceñida a la cadera (ancha, como se pidió) y al muslo, con vuelo y pliegues suaves de la rodilla para abajo; sigue menos a las piernas (`piernas` 0,95 y `piernasX`; las otras faldas no cambian). Ya no parece un jarrón de frente ni un pantalón ancho en el tango. Busto, cadera, cintura, esqueleto y poses sin tocar.
- **Visto en el juego real** (`pruebas/fotos-dalia-391.cjs`, con una vecina normal al lado): quieta, tango, chamamé, chamamé solo, de espaldas, atrás y caminando, de frente, 3/4, perfil y espalda.
- **Flojo**: en el chamamé de 3/4, con las piernas muy abiertas, la falda todavía se abre un poco como un pantalón (mucho menos que antes).

## Parte 1 · Banco del pueblo
1. **Partida real** (`pruebas/humo-3-9-2-mejoras.cjs`, partes `partes-3-9-2-banco.cjs` y `partes-3-9-2-economia.cjs`, Electron en el monitor externo): horario del gerente (8:30–12:30 y 14:30–18, domingo no; los días de fiesta se va al predio), hablarle, mostrador (préstamo, pago, saldo, abastecimiento, casas y alquiler, puesto propio con consigna y caja), una cabaña terminada de verdad y puesta en alquiler (el alquiler entra solo), el préstamo vencido. Salió todo; lo que falló lo arreglé:
   - **Bug**: al pasar al mostrador la rueda de temas quedaba dibujada detrás del panel. Ahora la charla se cierra (`main.js`, `abrirBanco`).
   - **Bug de captura de las pruebas** (no del juego): `capturePage` iba un cuadro atrasada.
   - El gerente espera en su puesto hasta 30 minutos antes de abrir (así llega a horario: `conTiempo`); el sábado sin baile atiende hasta las 18 (con baile, hasta las 16: no se pudo armar un sábado de baile en la partida; lo cubre `verificar-3-8-9-auditoria`).
2. **El edificio**: adentro, reloj de pared de péndulo, casilleros, estantes con libros contables, balanza, campanilla, tintero, monedas, libro abierto, lámpara de banquero (el foco brilla de noche), libros y papeles en el escritorio, ficus en los rincones, perchero con sombrero y paragüero, pizarra de tasas, cuadros, calendario, felpudo y otra alfombra. Afuera, faroles de pared a los lados de la puerta (los vidrios brillan de noche), jardineras con flores, banco en la galería y tablón de avisos. **Sin luces nuevas** (las mismas 5): la lámpara de arriba del gerente alumbra todo el cuarto de noche, como la de la cantina. Triángulos 5165 afuera y 4574 adentro (antes 4509 y 2058; tope 7000 y 6000). Ventanas encendidas de noche ya andaban.
3. **Amadeo Lezcano** (`banco-voces.js`, `banco-textos.js`): el saludo del mostrador sale de tu situación (deuda en curso, por vencer, vencida, socio del pueblo, casas en alquiler, puesto, pedidos) más una segunda frase según el día de la semana, la hora, la estación y tu amistad (compadre); comenta cada operación; arriba de cada solapa del mostrador dice una línea (lo urgente primero). **Historia en seis partes** (la sucursal de Esquel que cerró, el reloj del escribano, el préstamo que nunca anotó): las tres nuevas se abren con más amistad que compadre (150, 165 y 180 puntos: `PUNTOS_HISTORIA_EXTRA`). Sobremesa de 6 a 14 y charla de 3 a 9.

## Decisiones mías
- Las partes 4 a 6 de la historia piden puntos de amistad por encima de «compadre» (único modo de que «se abran con la amistad» sin cambiar los tres niveles).
- Los textos de Amadeo van en `banco-textos.js` (sin imports) para que la prueba del inglés del gerente los pueda dejar pasar.

## Pruebas tocadas a propósito
`verificar-3-6-vecindad` (la historia de Amadeo tiene 6 partes), `verificar-3-6-aldea` (su charla puede tener hasta 9), `verificar-3-8-8-banco` (el inglés del gerente exceptúa `SIN_INGLES_392`; `abrirBanco` ahora cierra la charla), `verificar-3-9-1-pena` (versión 3.9.x). Nueva: `verificar-3-9-2-mejoras.mjs` (73 verificaciones). La prueba del inglés del gerente sigue exigiendo inglés de todo lo viejo; lo nuevo queda exceptuado en una lista.

## Textos nuevos SIN inglés (a pedido del usuario)
Todo `src/banco-textos.js` (3 partes de historia, 8 de sobremesa, 6 de charla) y todo `src/banco-voces.js` (saludos, frases de día, hora y estación, comentarios de cada operación y de cada solapa). No hay `idioma-en-*` nuevos.

## Archivos compartidos tocados (para juntar con `v392-cantina`)
`src/main.js` (una línea: `abrirBanco`), `src/aldea.js` (import + charla de `gerente`), `src/aldea-gente.js` (import + saludo del gerente), `src/vecindad.js` (`PUNTOS_HISTORIA_EXTRA` y `historiaDe`), `src/vecindad-voces.js` (historia y sobremesa del gerente), `src/aldea-arquitectura.js` (`bancoDetalle` y la lámpara del banco), `src/gente-cuerpo.js` (falda de Dalia; `capa` con un gancho `antes`), `package.json`/`package-lock.json` (3.9.2 y el paso nuevo de `verify:pasos`), y las pruebas listadas arriba.

## Pendiente / no hecho
- Parte 2 (casa de té, ambiente, carta, Lucrecia y Dalia más vivas): otra rama.
- No medí cuadros por segundo en la Ryzen 5 4600G (razonado: sin luces nuevas, 1500 triángulos más adentro, un material y un dibujo más de cada).
- El inglés de lo nuevo.
- Un sábado con baile y el gerente cerrando a las 16 no se vio en la partida.
