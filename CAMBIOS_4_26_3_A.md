# 4.26.3 (A): el galpón visto y los interiores que faltaban

## Qué cambió
- **La gente de `galpon-encuentro`** (`src/main.js`, `efectoDuendesActo3`; no se tocó ningún guion ni `escenas-mundo.js`): con tu galponcito construido los duendes se sentaban en ronda ADENTRO de su huella, atrás del frente de tablas, y de la gente sólo asomaban los ojos. Ahora el grupo se para adelante tuyo, en el mismo punto que usa la cámara (`mundo.posicion({ frente })`, que gira si hay un sólido o agua, 4.26.2) y, si cae adentro de la huella del galponcito (+1,2 m), se lo corre afuera por el borde más cercano a vos. Sólo en las escenas `galpon-*`; las demás escenas del acto III no cambian de lugar salvo que ahora también siguen el giro de la cámara.
- **Buhardilla**: entra a `CASAS_CERRADAS` (no dibuja el exterior desde adentro). Sin cambios de geometría: la equivalencia no mostró ninguna rendija.

## Qué se midió (equivalencia de imagen de `hx\c4260\equiv.js`, Alta, verano, 72 muestras por casa)
- **Buhardilla**: 4 corridas, 288 muestras: 0, 1, 0, 0 sobre el ruido; la única (0,027 %, un grupo de píxeles sueltos contra el zócalo) no se repitió. Es ruido: entra.
- **Cabaña de tablas y piedra**: 3 corridas más: 0, 1, 0 (la que salió, 0,037 % con ruido 0,014, en una muestra distinta de las dos de la 4.26.1). Ruido: queda como está.
- **Puesto de troncos**: 6 de 72 sobre el ruido (hasta 0,54 %), siempre en las mismas muestras. No es una rendija: son hojas de pasto que asoman por el piso del puesto, que está a 0,58 m (el pasto y el terreno de la ladera pasan del piso en las esquinas). Cerrarlo con geometría en la misma malla no se puede sin subir el piso (cambia lo de afuera). Queda afuera de la regla, como hoy.

## Qué se vio (partida real, Alta)
- `pruebas/humo-4-26-3-a.cjs` (con el galponcito en pie y la Historia en el capítulo del galpón; capturas en `pruebas/salidas/humo-4-26-3-a`): en campo abierto (galponcito 7 m adelante o atrás tuyo) y mirando a la pared de la estación (galponcito al costado o atrás), 12 de 12 duendes dentro del cuadro. En la captura de campo abierto se los ve parados en la nieve delante del galponcito con el Mandamás al frente; mirando a la estación, parados sobre el andén. Antes (mismo estado) sólo se veían los ojos de uno o ninguno.
- Buhardilla, de día (14 h) y de noche (22 h), entrando y saliendo caminando (33 pasos, paso de 25 cm): la regla apaga el exterior en los 12 pasos de adentro, nunca afuera ni mirando la puerta; cuarto intacto (estantes, paredes, piso). Afuera de cerca, igual que siempre: la regla no actúa (0 cuadros apagados afuera).

## Qué no se vio
- La diferencia de imagen de afuera con la regla puesta y sacada dio 1,4 % y 0,17 % por el pasto que se mueve entre cuadros, no por la regla (afuera nunca se aplica); no se comparó con una referencia congelada.
- La escena entera con los duendes de noche cerrada en una partida jugada de punta a punta; sólo disparada con la Historia armada.

## Pruebas
`pruebas/verificar-4-26-3-a.mjs` (en `verify:pasos`): 26 comprobaciones y 9 mutaciones atrapadas. Ajustadas a propósito: `verificar-4-26-1-a` (la buhardilla entra, el puesto sigue afuera; sus mutaciones) y `verificar-4-26-0-c`. En verde: `verificar-4-26-0-b/-c`, `-4-26-1-a/-b/-c`, `-4-26-2-a`, `-4-23-0-c`, `-4-25-2-guardado`, las de la Historia del acto III (`-4-17-0-escenas-acto3`, `-historia-a`, `-pulido-c`, `-4-17-1-escenas-noche`). 0 shaders, 0 llamadas de dibujo nuevas, sin claves de guardado.
