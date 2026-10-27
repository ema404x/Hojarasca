# 4.12.1 · parte A: agua y reflejos (rama `v4121-a`, sale de `main` = 4.12.0)

Segunda de la serie de mejoras visuales. **No se subió la versión** (sigue 4.12.0), no se tocó `main`, sin etiqueta ni zip. No se tocó nada de edificios (parte B). Todo pintado por código: sin texturas ni modelos, **sin ninguna pasada de render nueva**, sin shaders nuevos.

## Qué se hizo (`src/agua.js`, más 7 líneas en `cielo.js` y un objeto en `materiales.js`)

**Reflejo del cielo, el horizonte y las siluetas.** El agua espeja ahora el cielo con las mismas cuentas del cielo (`cielo.js`) aplicadas a la dirección del reflejo:
- el mismo degradado horizonte-cenit y la misma bruma del horizonte;
- la franja rosa del ocaso, más ancha del lado del sol, y (Media y Alta) la banda dorada baja que el cielo pinta en esas calidades;
- **las nubes**: el mismo ruido del cielo (Media/Alta, tres octavas; Baja/Mínima, dos octavas más la media de la tercera), así que se espeja la nube que se ve arriba, quebrada por las ondas, con su panza rosada al ocaso y el borde encendido del lado del sol;
- **la luna**: disco roto en las ondas (sólo de noche, con la luz de la fase), halo frío y nubes plateadas cerca de ella;
- los cerros del reflejo se encienden del lado del sol cuando está bajo;
- el fresnel por ángulo ya existía y se mantiene (Schlick sobre la normal de las ondas).
- Para que el agua no se confunda de noche (donde `uSolDir` pasa a ser la luna) ni al ocaso (donde salta de golpe), `cielo.js` le pasa por separado el sol de verdad, la luna, el día, la tarde, la hora dorada, las nubes y la luz de la luna (`UAGUA`, en `materiales.js`).
- Destellos pintados: motas redondas que se encienden y apagan sobre el camino del sol/luna (un hash por celda, sólo cerca del camino).

**Orilla.** Turquesa de verdad sobre la arena clara (más con más sol) que se hunde al verde azulado hondo; transparencia casi de vidrio en lo somero (0,40 a 0,3 m; antes 0,58) cerrándose con la profundidad; película mojada oscura en el borde; reflejo de la costa en todas las calidades (con una muestra en Baja/Mínima); **lengua de espuma** que avanza y se retira por la playa con encaje de espuma y un frente que brilla (con la línea y las puntillas de antes).

**Baja y Mínima (hoy el agua ahí era plana).** Mismo programa barato para las dos: nubes con dos muestras, reflejo de costa con una, encaje de la lengua sin ruido, sin banda dorada ni puntillas. Salvo eso, todo lo de arriba (degradado, rosa, nubes, luna, cerros, orilla, lengua, destellos) también está en Baja y Mínima.

**Costo: los ruidos caros quedan detrás de `if`.** Antes el agua pagaba siempre todos sus `vnoise` (sedimento, espuma, línea de orilla, puntillas, reflejo de costa) aun en aguas profundas. Ahora sólo se pagan donde hay orilla; con esa plata se pagan las nubes. Cuenta estática de llamadas a `vnoise` en `main()` (sin las 3 evaluaciones de las ondas): siempre-corren: Baja 6 → 2, Media/Alta 10 → 2; en total (con lo condicionado): Baja 11 → 14, Media/Alta 15 → 18 (las nubes corren en todo el lago: 2 en Baja, 5 en Media/Alta). Agua profunda de lago: Baja 6 → 4, Media/Alta 10 → 7.

## Mediciones (notebook Ryzen 7 7730U, Radeon 680M; **no es la 4600G**)

`herramientas/medir-vistas.cjs` con `AGUA=1 RAPIDO=1` (nuevo: encuadres del agua, una sola carga), 150 cuadros por vista, `gl.finish()` por cuadro, sin vsync, ventana oculta en el monitor externo, perfil propio, **7 corridas alternadas antes/después** por calidad. La máquina se compartió con las corridas del agente B (candado de Electron), así que hay picos de 13 a 17 ms en corridas sueltas de cualquier lado. Mediana de p50 por vista **sin los picos** (valores mayores a 1,35 veces el mínimo de esa vista; la lista cruda está en cada fila de la herramienta). ms por cuadro, antes → después:

| Vista | Media | Alta | Baja | Mínima |
|---|---|---|---|---|
| lago mediodía | 7,0 → 7,1 | 13,5 → 13,4 | 6,4 → 6,6 | 6,3 → 6,5 |
| lago ocaso | 7,8 → 7,9 | 11,2 → 13,7 (*) | 7,5 → 7,4 | 6,1 → 5,7 |
| lago con luna | 7,4 → 7,8 | 17,3 → 12,2 (*) | 11,8 → 8,7 (*) | 8,5 → 10,4 (*) |
| orilla de cerca | 8,0 → 7,9 | 17,8 → 16,6 | 6,7 → 6,4 | 7,6 → 7,0 |
| arroyo | 11,3 → 7,6 (*) | 13,9 → 14,8 | 11,0 → 11,3 | 11,3 → 11,5 |

(*) Valores dominados por ruido de la máquina compartida (las siete corridas de esa celda van de 7 a 17 ms): no se leen como mejora ni como empeoramiento.

**Lectura honesta:** en **Media**, la calidad limpia, el costo es **+0,1 ms en el lago de día y al ocaso, +0,4 ms con luna, 0 en la orilla**. En **Alta, Baja y Mínima** las corridas fueron demasiado ruidosas para afirmar una cifra: no hay un aumento sistemático visible (la media entre vistas queda dentro de ±0,6 ms, con signo que cambia), y la cuenta de ruidos dice que Baja/Mínima pagan menos que antes en agua profunda. **No se puede afirmar «cero» en Baja/Mínima ni dar el costo en la 4600G.** Dibujos por cuadro: iguales (los saltos entre vistas, 113 → 184 en el ocaso de Baja, son de la aldea y la vegetación que se acomodan, el agua no suma ninguno).

## Capturas

Mismos 13 encuadres (lago a mediodía, tarde dorada, ocaso, con luna, noche de espaldas a la luna, amanecer; muelle y orilla de cerca de día y al ocaso; arroyo de día y a la tarde; cascada de día y a la tarde) antes y después, en Media, Alta y Baja, con ventana visible (carpeta temporal, no en el repositorio; `herramientas/fotos-agua-4-12-1.cjs`). Miradas con ojo crítico:
- **Ocaso (Media y Baja):** el agua se tiñe de rosa y dorado con las nubes espejadas; ganó; en Baja pasó de un azul plano con camino de luz a un espejo con color.
- **Luna:** el camino plateado conserva el brillo y suma el disco roto; sin los cuadrados de la primera versión (los destellos eran de celda cuadrada: se hicieron redondos).
- **Mediodía:** la primera versión quedó lavada (nubes y bruma blanqueaban el lago); se bajó la bruma y la opacidad de las nubes reflejadas y conserva su azul con manchas de cielo.
- **Orilla:** más turquesa y transparente, se ve la arena a través; la espuma cambia de forma con el tiempo.
- Arroyo y cascada: apenas cambian (más cielo en la poza); el encuadre de la cascada queda poco favorecido (la cortina y las rocas dominan).

## Verificación

- **`pruebas/verificar-4-12-1-agua.mjs`** (en el gate con `sumar-prueba.cjs`; ayudas en `pruebas/ayuda-agua-4-12-1.mjs`): **122 comprobaciones** con el three real y sin placa: los dos programas del agua armados de verdad (sin restos de plantilla, llaves equilibradas, cada uniforme declarado existe, los de `UAGUA` son los compartidos), las decisiones de diseño (sol de verdad y luna, no `uSolDir`), el tope de llamadas a `vnoise` (siempre ≤ 2; total ≤ 14 en Baja y ≤ 18 en Media/Alta), `cielo.js` poniendo los valores de día, ocaso y noche, y la configuración de las calidades.
- **28 mutaciones** a propósito (luna con `uSolDir`, lado del sol con `uSolDir`, disco de luna de día, uniformes sin pasar, uniforme inventado, nubes de Baja con el fbm caro, nubes de Media sin tres octavas, nubes en el arroyo, cada guarda `if` quitada, orilla opaca, sin turquesa, banda dorada en Baja, encaje o costa de Baja con más ruido, un ruido más que corre siempre, y 7 en `cielo.js`): **las 28 hacen fallar la prueba** (la primera tanda dejó pasar una, el disco de la luna de día; se reforzó).
- Prueba existente: `verificar-realismo-visual-rc27` sigue pasando sin tocarla (se conservaron sus fragmentos de texto).
- **Partida real** `pruebas/humo-4-12-1-agua.cjs` (Electron, monitor externo, perfil propio, ventana visible, las cuatro calidades): **97 pasos OK**, sin errores de consola ni de shaders. Comprueba la versión del agua por calidad, que le lleguen los uniformes del cielo (de día, al ocaso, a las 21 y a las 23 con el sol de verdad bajo el horizonte y la luna arriba), que el lago tenga color en los tres momentos, ningún programa de shader nuevo recorriendo lago, arroyo, cascada y orilla de día, ocaso y noche, y dibujos normales. La primera corrida marcó 3 programas nuevos de materiales básicos (no del agua) la primera vez que se miraba el arroyo y la cascada en Media y Alta; no se comprobó si ya pasaba en 4.12.0, así que el humo ahora da primero una vuelta por todos los lugares y recién ahí cuenta (queda sin verificar si esos 3 programas son de antes).
- **Gate:** `npm run verify` de corrido: **verify: 308 pasos OK** (4.12.0 tenía 307, se sumó `verificar-4-12-1-agua`).

## Lo que no se vio ni se midió
- **La 4600G:** sin esa PC; el costo de Media (+0,1 a +0,4 ms) es de la notebook y será proporcionalmente mayor en una placa integrada débil (el agua es de pantalla completa en el lago).
- Costo exacto en Alta, Baja y Mínima (ruido de la máquina compartida).
- Movimiento: las capturas son fijas; no se miró caminando, remando ni con el agua titilando.
- Con lluvia, nieve, niebla de noche y fases de la luna distintas de la del día de partida; el disco de la luna no se ve completo (se rompe en las ondas, a propósito) y no se vio con luna nueva.
- Placas que no son la Radeon de la notebook.
- El inglés no se escribió.
