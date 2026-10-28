# 4.13.0 (agente A) · Duendes en la Historia: presencia, encuentro y armas (EN CURSO)

Rama `v4130-a` (sale de `main` = 4.12.3). No se subió la versión.

## Estado al pausar

### Hecho (commiteado)
- `src/historia-duendes.js` (ya en origin): infraestructura para B y para la presencia. `crearDuendesHistoria(ctx)` con `paraCompilar`, `asegurar`, `aparecer(tipo, opts)` (duende suelto: `mirar`, `irA`, `huir`, `saludar`, `reir`, `esconder`, `quitar`), `actualizar(dt)`, `limpiar`, `reir`, `prepararVoz`; helpers `hayHistoria`, `reirDuende` (voz con `sonido.relax` apagado sólo durante la llamada), `prepararVozDuende`. Duendes reciclados (cada uno ocupa una fila de la textura de huesos). Probado a mano en Node con el three local (aparece, mira, huye, desaparece).
- `src/historia.js`: esquema `progreso.historia.duendes` = `{ trato: null|'trato'|'pelea', vistos, regalos, armas: {arco, honda}, noche: 'ninguna'|'pendiente'|'ganada'|'perdida', final: null|'trato'|'pelea', intentos }`, con `duendesNuevos`, `sanearDuendes` (default seguro; `sanearHistoria` lo llama), `duendesDe`, `hacerTrato`, `ganarArma`, `revisarNoche` (pasa a `pendiente` con trato + las dos armas), `armaPorPedir`, `hayPresencia` (capítulos lago y molino). `estadoHistoria` suma `trato` y `armas`.
- Capítulo 5 (lago): línea de intro de misterio, objetivo `duendes` (del momento) y `momento` `duendes-galpon` con `lugar: 'galpon'`. Capítulo 7 (invierno): intro, objetivo `armas` (meta 2, 5 objetivos en total) y `momento` `arco-josefina`.
- `src/eventos-valle.js`: eventos `duendes-galpon` (comida / señal = trato; espantar = pelea), `arco-josefina`, `honda-ramon` (sólo Historia: `soloHistoria`, nunca salen al azar) y seguimientos `s-honda-ramon`, `s-arco-otra-vez`, `s-honda-otra-vez`; efectos nuevos `duendes` y `arma` (documentados, SIN implementar todavía en `eventos-valle-ui.js`).

### Falta (próximos pasos)
1. `eventos-valle-ui.js`: casos `duendes` (llama `hacerTrato`) y `arma` (llama `ganarArma`), avisar a main para el epílogo.
2. `historia-ui.js`: puerta `lugar` del momento (cerca del galpón `T.lugares.galpon` y de noche, 18 a 3 h), `revisarNoche` y `armaPorPedir` en `revisarAhora`; `alActivarHistoria`.
3. `src/historia-presencia.js` (NUEVO): siluetas al anochecer, risa lejana de noche, luciérnagas raras (halos), regalitos con trato, escena del galpón y su epílogo.
4. `main.js`: crear `duendesHist` y la presencia, `paraCompilar()` antes de la compilación de la carga, `actualizar(dt)` junto a `valle.actualizar`.
5. Pruebas: `verificar-4-13-0-historia-a.mjs` (con mutaciones), sumarla con `herramientas/sumar-prueba.cjs`, humo `humo-4-13-0-historia-a.cjs`, y ajustar `verificar-3-1-historia.mjs` (objetivos por capítulo hasta 5 por el capítulo 7; eventos hasta 14) y las pruebas de basura/trucos si hace falta. Gate `npm run verify`, partida real y capturas (con el candado `hx\electron.lock`).

### Notas
- No se corrió Electron ni el gate en esta tanda.
- Decisión propia: las armas se consiguen con tarjetas de los vecinos (materiales: arco 4 tablas + 1 tronco; honda 5 piedras + 4 ramitas), no con una tecla E nueva, para no tocar la tabla de interacciones.
- Pendiente de decir al coordinador: `historia-presencia.js` y `main.js` son los puntos de choque con B.
