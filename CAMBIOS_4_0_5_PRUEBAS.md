# 4.0.5 (pruebas) — pruebas de humo estables y bajos que quedaban

Rama `v405-pruebas` (sale de `ccr-0f18b396-y8d0fm` = 4.0.4 + arreglos de la 4.0.5; sin push, sin tocar `main` ni la versión). Sin textos en otro idioma.
Leyenda: **verificado** (se corrió y dio lo que dice) · **razonado** (por lectura del código, sin correrlo) · **no verificado**.

## 1. `pruebas/humo-3-7-5-fiestas.cjs`: determinista

**Causa de la inestabilidad (no era sólo dónde caía cada vecino):**

1. Las notas del juego (`#notas`) duran 5,6 s *reales*. La prueba leía su texto un rato después de provocarlas («Te sirven cordero…», «La minga terminó…», «¡Sorpresa!»); en una máquina lenta ya se habían ido. Eso explica los «falló en un lugar distinto cada vez». (Verificado: con render por software —antes de que se prohibiera en esta PC— fallaban justo esos tres renglones, y el diagnóstico de la prueba mostraba la nota ausente.)
2. El bucle del juego seguía corriendo solo (requestAnimationFrame) mientras la prueba acomodaba a la gente a mano: los vecinos caían donde caían según cuántos cuadros se alcanzaban a dibujar.
3. Esperas por reloj real (`esperar(3200)` para que «te bajen los apadrinadores», que dependen de un temporizador de la página) y bucles de cantidad fija de cuadros.

**Qué se hizo:**
- Al entrar se congela `requestAnimationFrame` (el mundo avanza sólo con los cuadros de la prueba) y `Math.random` sale de una semilla (`HUMO_SEMILLA`, 12345 por defecto).
- Un `MutationObserver` junta todas las notas que pasan (`notas()` las devuelve); cada sección las vacía.
- Las esperas pasaron a esperas por estado con tope (`hasta(cond, paso)`): comer en la mesa, el recuerdo, el baile, la monta, la minga, la sorpresa.
- `HUMO_LENTO=<n>`: la página corre n veces más lenta (emulación de CPU), para probar una PC floja sin tocar la placa.
- `npm run verify:fiestas` la corre (`electron pruebas/humo-3-7-5-fiestas.cjs`).

**Resultado (verificado, en esta PC, placa real, ventana en el monitor externo, un Electron a la vez):** 6 corridas seguidas con las semillas 12345, 1, 2, 3, 777 y 4242 → «OK humo 3.7.5 fiestas» las 6; con `HUMO_LENTO=10` → OK; antes de tocarla, con la placa real y sin carga, pasó 19 de 19 (la inestabilidad sólo aparecía con la máquina lenta, por eso se ataca la causa y no se puede dar por «arreglada» con esas 19).

**¿Al gate?** No: el gate (`verify:pasos`) sólo corre pasos de Node (ninguno lanza Electron: hace falta una ventana y WebGL) y `sumar-prueba.cjs` engancha un `node pruebas/…`. Queda corrible con `npm run verify:fiestas`, como las demás `humo-*`.

**¿Bugs propios del juego en el truco o la jineteada?** No se encontró ninguno: una mano entera de truco (con puntos), el menú, Escape, y la monta completa (aguantar con A/D, el recuerdo, que los apadrinadores bajen) pasan en todas las corridas (verificado); la lectura de `actualizarJineteada` / `terminarMonta` / `empezarTruco` no mostró fallas (razonado). La única fragilidad era de la prueba.

## 2. Bajos arreglados

| Id | Qué pasaba | Arreglo | Estado |
|---|---|---|---|
| F7 | Con la estación en «auto», al cargar la partida el paisaje arrancaba en verano y pasaba al otoño o al invierno a la vista en los primeros segundos | `estacionObjetivo()` (la misma cuenta que usaba cada cuadro) se usa también al armar el mundo | **verificado** en Electron (`humo-4-0-5-bajos.cjs`: día 10 → invierno 1 al terminar de armarse; día 1 → verano; con el código viejo la prueba da invierno 0) y en Node (la cuenta es idéntica a la de siempre en 120 casos) |
| G15 | En el banco de pruebas la rueda cambiaba de ranura, el clic derecho usaba lo que tenías en la mano y los clics bloqueaban el mouse | `banco.activa` corta la rueda, los dos clics y el bloqueo del lienzo | **verificado** en Electron (rueda y clic derecho; con el código viejo fallan) y **razonado** el clic izquierdo (Desafío) y el bloqueo del lienzo (texto en `verificar-4-0-5-bajos.mjs`) |
| E8 | «Chela y Rubén te sigue», «Llevalo…», «se vuelve», «pregunta»: el matrimonio con verbos en singular, cuando Rubén se queda en el tren y sólo baja Chela | `corto` (Chela), `genero` («Llevala/Llevalo») y `plural` en los visitantes; las notas usan el nombre corto | **verificado** (Node). El cuaderno sigue con «Chela y Rubén». No se vio en pantalla |
| F8 | El diario decía «Siguió lloviendo» siempre que el vecino anunciaba «ya para» (se comparaba con lo máximo que llovió en el día entero, incluida la lluvia que lo hizo decirlo) | Se guarda lo más y lo menos que llovió *después* del anuncio (`lluviaTrasMax/Min`) y se juzga con eso | **verificado** (Node, 4 casos). Las páginas del diario viejas, sin esos campos, se juzgan como antes |
| F9 | La lagartija que se escurre al acercarte se corría 0,6 m en x/z pero conservaba la altura de la piedra: flotaba o se hundía en la loma | La altura sale del terreno donde queda | **razonado** (una línea; texto en la prueba). No se vio en pantalla |

Pruebas nuevas: `pruebas/verificar-4-0-5-bajos.mjs` (en el gate) y `pruebas/humo-4-0-5-bajos.cjs` (Electron; no en el gate).

## 3. Lo que se dejó (y por qué)

**Ya resueltos en la 4.0.2 (la lista de pendientes de la 4.0.3 estaba vieja):** A4, A5, A6, B7, B10, B13, B14, C6, C7, D16, D17 y el festoneado de la blusa bajo el chaleco (la cadera asomaba 8 mm; arreglado en la 4.0.2 con `verificar-4-0-2-blusa.mjs`).

**Descartados por decisión ya tomada:** B8 (multiplicador de velocidad, balance), B11 (activación de usuario de Chromium; no se confirma sin Electron real), C8 (hay que pintar un lienzo por clima y estación), C9 (orden de dibujo de lo aditivo con lo transparente: toca todo lo de noche), D10, D11, D12, D13, D14, D15, D18, D19 (cada uno con su motivo en `CAMBIOS_4_0_2.md`), C10 (sombras: regla del usuario).

**Sin mando (pedido expreso: se juega con teclado y mouse):** no se tocó nada de A3, G8, G17 ni de la navegación con mando.

**Pospuestos, con motivo:**
- **La pelusa flotante del valle que «entra a los interiores»:** no se reproduce jugando. Con el jugador adentro `bajoTecho` (que mira `espacioDeAudio`, las obras y `aldeaMundo.bajoCubierta`) apaga toda la malla; lo visto fue de las capturas de `PROTO_4_0_CASA_TE.md`, que ponen la cámara adentro con el jugador afuera. Razonado, no verificado en pantalla.
- **G16 (la chinche que no se suelta):** no se confirmó. Cargar otra partida recarga la página (el estado no sobrevive); queda la duda de si la chinche debería soltarse sola al llegar (decisión de diseño).
- **G13 / G10 (la guía y las pistas con las teclas del jugador):** son textos libres con las teclas escritas; convertirlos obliga a tocar decenas de frases y sus pruebas de texto exacto.
- **G18 (tamaño mínimo de la ventana, 1024×640 en `main.cjs`):** sin el informe original no se sabe qué falla (¿pantallas chicas con escala 125 %?); es archivo compartido. Hay que verlo en una pantalla de 1366×768.
- **G19:** pasa al trabajo del idioma, que lo decide el usuario.
- **H5, H7–H11, F11 (rendimiento: soak, copia a la carpeta, fuente del Worker, mochila por cuadro, asignaciones chicas, compilación de los rayos de sol, primeros sonidos sintetizados):** sin medir en la 4600G; tocarlos sin medir va contra la regla de fluidez.
- **E4–E7, E9, F6:** sin el informe de la zona no se pudo fijar el síntoma exacto de cada uno y los que se leyeron (E6: las notas de fase de las fiestas viven en memoria y se repiten si recargás a mitad del día; E9: sólo el horario de la plaza se cubre de la lluvia) piden guardar estado nuevo o cambiar el horario de los vecinos: cambio de diseño, no un arreglo quirúrgico. F12 es una pregunta al usuario (trueno sin relámpago: ¿se quita o se conecta al fogonazo?). De F9 sólo se arregló la altura de la lagartija que huye; el resto de lo que dijera el informe no se pudo fijar.
- **I-3, II-5…II-10 (veredas con pendiente, colisiones desfasadas, muebles apilados, huellas infladas, agua de 9 puntos, cuadros colgados en el aire, desmontar la pieza del piso de arriba):** geometría y física de obras; cada uno necesita su arnés y un recorrido en el juego (costo alto para esta ronda).

## 4. Archivos tocados

- **Compartidos:** `src/main.js` (F7: `estacionObjetivo()` + arranque; G15: cuatro guardas), `package.json` (script `verify:fiestas` y el paso `verificar-4-0-5-bajos.mjs` en `verify:pasos`).
- Prueba vieja ajustada en lo mínimo (miraba el texto exacto de las guardas de G15): `pruebas/verificar-3-5-4-caos.mjs`.
- `src/aldea-vida.js`, `src/aldea-gente.js` (E8), `src/diario.js` (F8), `src/bichos.js` (F9).
- `pruebas/humo-3-7-5-fiestas.cjs`, `pruebas/verificar-4-0-5-bajos.mjs`, `pruebas/humo-4-0-5-bajos.cjs`, este documento.

## 5. No verificado

fps en la 4600G (nada de lo nuevo suma trabajo por cuadro: F7 corre una vez al armar el mundo y la cuenta de cada cuadro es la misma; G15 agrega una comparación booleana a eventos del mouse; F8 dos comparaciones por muestra del clima, sólo después de un anuncio); el aspecto en pantalla de E8 y F9; F7 con el cambio de estación a media sesión (no cambia: sólo se tocó el arranque).
