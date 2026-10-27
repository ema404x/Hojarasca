# 4.12.0 · parte A: bordes suaves (rama `v4120-a`, sale de `main` = 4.11.5)

Primera de la serie de mejoras visuales. **No se subió la versión** (sigue 4.11.5 en `package.json`), no se tocó `main`, no hay etiqueta ni zip. No se tocó vegetación, rocas ni terreno (es la parte B).

## El problema

El flag `antialias` del contexto sólo suaviza lo que se dibuja **directo a la pantalla**. En Media y Alta la escena va a un `WebGLRenderTarget` (`src/postproceso.js`) sin muestras y no había FXAA, así que el suavizado no llegaba a la imagen: techos, vallas, cables, copas contra el cielo y el pasto se veían en escalera. En Baja y Mínima (sin postproceso) la escena va directo a la pantalla con `antialias: false`.

## Qué se hizo

- **Media y Alta: FXAA dentro de la composición final** (`COMPONER`). Es la misma pasada que ya existía (color + brillo + rayos + curva + paleta + viñeta + grano): el color de la escena se lee con `escenaFx(vUv)` en vez de un `texture2D` directo. **No suma ninguna pasada, ni dibujos, ni render targets.** Cuesta 5 lecturas de textura en los píxeles sin borde y 9 en los píxeles de borde.
  - Lo plano no se toca: si el contraste local es menor que `max(0.04, 0.14·luma)` devuelve el píxel tal cual (así el texto de los carteles, los fondos lisos y las texturas finas no se emborronan; el suavizado actúa sólo en los bordes con salto de luz).
  - La luma del borde es perceptual (raíz), para que las luces fuertes (sol, brillo) no ahoguen los bordes de las sombras. El desplazamiento está acotado a ±6 texeles y el resultado se descarta si se sale del rango de luz de sus vecinos (el clásico FXAA 3 de Lottes, con las constantes ajustadas al estilo pintado).
  - Se prende con `calidad.fxaa` (`src/config.js`: `media` y `alta`), que pone un `#define HOJ_FXAA` **al crear el material**: el shader queda fijo desde la carga (ningún shader nuevo a mitad de juego).
  - `uTexel` (uniforme nuevo) sigue al tamaño del destino: se carga al crear el postproceso y se rehace en `redimensionar` (ventana, escala de pantalla y modo fluido ya llaman ahí).
- **MSAA del destino: programado pero apagado** (`calidad.msaa`, muestras del `WebGLRenderTarget`, acotadas a lo que banca la placa y sólo con WebGL2). Ninguna calidad lo usa: costó demasiado (ver mediciones). Queda como opción para una placa más fuerte.
- **Baja y Mínima quedan como estaban** (sin postproceso, `antialias: false`). Ver «Qué se evaluó y no se hizo».
- **Arreglo de paso (un programa de shader nuevo a mitad de juego, de antes):** al medir con la partida real se vio que, en Media y Alta, **un programa de shader se compilaba la primera vez que el sol entraba en el cuadro** (la pasada de los rayos; se medía igual en la 4.11.5: 100 → 101 programas al girar hacia el sol). Ahora `crearPostproceso` la compila al armarse, contra un destino lineal (la misma salida con la que se usa). Con eso, 160 cuadros de día, noche y giros ya no compilan nada.
- `main.js`: una línea de depuración (`__postproceso`, sólo con `?debug=1`) para que las pruebas lean el material y el destino. `postproceso.js` devuelve además `materialComponer`.
- Herramienta nueva `herramientas/fotos-bordes-4-12-0.cjs` (+ `.json` con los encuadres): capturas de los mismos encuadres antes y después y un contador de «escalones duros».

## Decisiones (con mediciones)

Medido en la **notebook (Ryzen 7 7730U, placa integrada Radeon 680M)** con `herramientas/medir-vistas.cjs` (200 cuadros por vista, `gl.finish()` por cuadro, sin vsync, ventana oculta en el monitor externo, perfil propio, p50 de cada corrida y mediana entre corridas, corridas alternadas A, B, A, B). Vistas: refugio de día, bosque, estación y plaza de la aldea. «Antes» = el mismo código sin `fxaa` ni `msaa` (es idéntico a `main`). **Estos ms no son los de la Ryzen 5 4600G**; sirven para comparar entre variantes en la misma máquina. La notebook tiene mucha más placa que la 4600G, y el MSAA es justo lo que más pesa en una placa integrada débil.

| Variante | Media (Δ ms por cuadro, p50) | Alta (Δ ms por cuadro, p50) |
|---|---|---|
| **FXAA** (elegida) | **+0,1 a +0,2** (refugio, bosque; 10 corridas); estación −0,7 y plaza +0,3 (3 corridas) → **~+0,15** | −0,3 a +0,2 (refugio, bosque; 10 corridas); estación −0,3, plaza −1,9 (3 corridas, ruido) → **~0** |
| MSAA 2 | +4,6 / +1,2 / +1,3 / +2,5 → **+2,4 de media** | +0,9 / +0,8 / +3,5 / −0,1 → **+1,3 de media** |
| MSAA 4 | +6,7 / +2,1 / +2,1 / +4,4 → **+3,8 de media** | +3,9 / +2,8 / +6,0 / +1,4 → **+3,5 de media** |

(El orden en las filas MSAA es refugio / bosque / estación / plaza. Los números de la placa integrada se mueven ±1 ms de una corrida a otra; por eso se repitió siete a diez veces lo del FXAA.)

- **Se eligió el FXAA en las dos calidades.** Cuesta menos de 0,3 ms por cuadro en Media (el tope era ~1 ms) y no se distingue del ruido en Alta. El MSAA, aun en 2 muestras, pasa del presupuesto de la plaza (1,5 a 2 ms de margen en la 4600G) en Media y en Alta, así que **no hace falta una variante «completa» sólo para Alta**: no hay nada más caro que valga el costo.
- **Dibujos por cuadro:** iguales (las diferencias en las tablas, 222–233 en el refugio, son de la vegetación que se acomoda, no del FXAA: el FXAA no suma ninguna llamada de dibujo; la prueba lo cuenta).
- **El `antialias` del contexto en Media y Alta** (que no servía con el postproceso) se probó apagado para ver si ahorraba algo (variante `nc` y `fxnc`, 3 corridas por vista): **no ahorra nada medible** (−0,1 a +0,1 ms). Se dejó como estaba, porque con `ajustes.post = 'apagado'` (depuración) la escena va directo a la pantalla y sí lo necesita.
- **La imagen no se emborrona** (estilo «pintado»): el FXAA no toca lo plano ni los bordes de contraste bajo. Se miraron las capturas de Media y Alta a tamaño completo: los bordes de copas, techos, vallas y cables se ven continuos y el pasto, las flores y el texto de los carteles siguen con el mismo detalle (el cartel «Lote para la cortureria» se lee igual). El texto de la interfaz es HTML encima del lienzo: el FXAA no lo alcanza.

### Cuánto bajan los bordes duros

El contador cuenta pares de píxeles vecinos que saltan más de 60 de 255 de luz (los dientes de sierra), en el lienzo, sin interfaz, 1280×721:

| Encuadre | Media antes → después | Alta antes → después |
|---|---|---|
| copas del bosque | 13.770 → 3.859 | 25.307 → 4.954 |
| copas a contraluz | 11.350 → 2.805 | 19.521 → 2.963 |
| techos del refugio | 40.699 → 7.062 | 47.054 → 7.711 |
| molino y vallas | 49.915 → 11.378 | 36.677 → 7.698 |
| molino de lejos | 20.777 → 5.578 | 20.352 → 4.265 |
| puente | 43.539 → 14.421 | 43.092 → 15.481 |
| cables de la aldea (calle de la Loma) | 17.663 → 4.039 | 19.326 → 4.551 |
| plaza de la aldea | 21.169 → 6.477 | 23.840 → 6.834 |
| estación (con carteles) | 87.501 → 27.192 | 88.133 → 24.834 |

Bajan entre 3 y 6 veces en todos los encuadres.

## Qué se evaluó y no se hizo

- **Baja y Mínima con `antialias: true` del contexto** (el «arreglo gratis» posible, porque ahí la escena va directo a la pantalla): medido en la notebook (3 corridas, refugio y plaza) no tuvo costo medible (Baja −0,15 ms, Mínima −1,8 ms de media, o sea ruido a favor). Pero **la notebook tiene mucha más placa que el mínimo para el que existen esas calidades**, y el MSAA de pantalla cuesta ancho de banda y memoria justo donde más falta hacen. **Se dejó apagado**, como pidió el usuario (sólo Media y Alta pagan de más). Si el usuario quiere probarlo, es cambiar `antialias: false` por `true` en `baja` y `muybaja` de `src/config.js`; conviene medirlo antes en la 4600G (`medir-vistas.cjs` con `CALIDAD=baja`).
- **MSAA** en Media y Alta: descartado por costo (tabla de arriba). El código queda (`calidad.msaa`), apagado y probado.
- **SMAA**: no se probó. Pide dos pasadas más y dos texturas de búsqueda (o generarlas por código), es decir pasadas y render targets nuevos, justo lo que se quería evitar; el FXAA ya entra en el presupuesto y se ve bien.

## Verificación

- **`pruebas/verificar-4-12-0-bordes.mjs`** (en el gate con `sumar-prueba.cjs`): **50 comprobaciones** con el three real y un renderer de mentira: las cuatro calidades (Media y Alta con FXAA, Baja y Mínima sin postproceso ni suavizado, ninguna con MSAA, el FXAA sólo donde hay postproceso); el material armado con y sin FXAA (un preprocesador mínimo de `#ifdef` para comprobar qué línea de la composición queda); el cuerpo del FXAA (no toca lo plano, desplazamiento acotado, rango de luz, luma perceptual, nueve lecturas como mucho); las muestras del destino (acotadas por la placa, sin WebGL2 cero); el texel inicial, con escala de pantalla 1,5 y tras redimensionar; que el FXAA no suma pasadas (5 dibujos de pantalla completa por cuadro en Media sin sol, como antes); que después de armarse el shader no cambia ni pide recompilar; que la pasada de los rayos se compila al armar contra un destino y no contra la pantalla; y el enganche de `main.js` (se arma una sola vez, sólo con `calidad.post`, se redimensiona con la ventana).
- **23 mutaciones a propósito** sobre una copia del código (Media sin FXAA, Alta sin FXAA, Baja con FXAA, Mínima con MSAA, Media con MSAA 4, Alta con MSAA 2, define que nunca o siempre se pone, color que no pasa por el FXAA, FXAA que toca lo plano / sin tope / sin rango / luma lineal / lecturas de más, destino que ignora el msaa o lo pasa de la placa o lo usa sin WebGL2, texel que no sigue a la ventana o ignora la escala, pasada propia del FXAA, recompilación en cada cuadro, rayos sin precompilar o compilados contra la pantalla): **las 23 hacen fallar la prueba**. (La primera tanda dejó pasar «el FXAA suma una pasada propia» porque comparaba con y sin FXAA con el mismo código roto; se agregó la cuenta absoluta de 5.)
- **Prueba existente tocada:** una línea de `verificar-2-7-4-luces.mjs`, que fijaba la devolución exacta de `crearPostproceso` (`return { render, redimensionar, uniforms, destino };`): ahora sólo exige el comienzo, porque la devolución suma `materialComponer`.
- **Gate:** ver el número al final de este archivo.
- **Partida real** `pruebas/humo-4-12-0-bordes.cjs` (Electron en el monitor externo, perfil propio, la placa de verdad): **25 pasos OK**, sin errores de consola ni de shaders. Para las cuatro calidades abre el juego, entra al Relax y comprueba: Media y Alta tienen postproceso con la composición armada con FXAA, destino sin muestras y texel cargado; Baja y Mínima no tienen postproceso ni FXAA; **ningún programa de shader nuevo en 160 cuadros** de día, noche (22 h), amanecer mirando al sol y giros (el humo atrapó el programa de los rayos de la 4.11.5 y por eso se precompila); el cuadro tiene imagen y el número de dibujos es normal (144 a 174).
- **Capturas** (`herramientas/fotos-bordes-4-12-0.cjs`, ventana visible en el monitor externo; en una carpeta temporal, no en el repositorio): nueve encuadres idénticos antes y después en Media y en Alta. Se miraron a tamaño completo los pares de los techos del refugio, las copas a contraluz, el molino con vallas y tulipanes, los cables y carteles de la calle de la Loma y la estación (cartel y flores). Se ve lo esperado: bordes continuos, mismo detalle, nada borroso.

## Lo que no se vio ni se midió

- **La 4600G:** no hay esa PC para medir. El costo del FXAA (~0,15 ms en Media, ~0 en Alta) es de la notebook; en una placa integrada más débil será proporcionalmente mayor (es una pasada de pantalla completa con 5 a 9 lecturas por píxel). Falta: `HTML=index.html CALIDAD=media|alta npx electron herramientas/medir-vistas.cjs --user-data-dir=<carpeta>` y `npm run medir:caminata` en la 4600G, comparando contra `main`.
- **Movimiento:** las capturas son fijas. El FXAA no tiene memoria entre cuadros (no es temporal), así que no debería titilar más que antes, pero no se miró caminando con las ramas moviéndose ni el pasto con viento.
- **De noche y con lluvia o nieve**, el interior de las casas y el modo foto: no se compararon capturas (sólo se corrió el humo de noche, que no ve imagen). Los puntos brillantes de noche (luces, faroles, estrellas) pasan por el FXAA antes del brillo; podrían verse un poco más redondos.
- **Placas de otras marcas** (NVIDIA, Intel): sólo se probó la Radeon de la notebook.
- **Ventana con otra escala de pantalla** (125 %, 150 %): se midió con la escala que tiene el monitor externo; el texel sigue a la escala por prueba, no a ojo.
- **Los puntos suspensivos y la letra pequeña de carteles lejanos:** se ve igual de legible que antes en los pocos carteles encuadrados, no se recorrieron todos.
- El inglés no se escribió (se traduce al final).

## Gate

`npm run verify` de corrido (4.11.5 tenía 305 pasos; se sumó `verificar-4-12-0-bordes`, son **306**): la primera corrida falló en el paso 106 (`verificar-2-7-4-luces`, que fijaba la devolución exacta del postproceso; ajustado a propósito, ver arriba). Con eso corrido de nuevo, **los 306 pasos se ejecutaron en orden hasta el último (build reproducible, SHA-256 73839b16…) sin ningún «FALLÓ»**. Ojo: en el registro de esa corrida no quedó impresa la línea final «verify: 306 pasos OK» (el proceso terminó sin error visible pero la línea no está); si se quiere el número cantado, repetir `npm run verify`.
