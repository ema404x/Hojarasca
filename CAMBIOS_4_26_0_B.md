# 4.26.0 (B) — La trochita sin la espera larga, siempre

Rama `v4260-b`, sobre `main` = 4.25.3. No se subió la versión (lo hace el cierre). 0 programas de shader nuevos, 0 texturas, 0 llamadas de dibujo nuevas, **ninguna clave de guardado nueva**.

## Qué cambió

| | |
|---|---|
| La campana del andén | En **cualquier andén** de la trochita (la Estación del Valle, la Aldea, las paradas chicas y el apeadero del Riel Sur), a 8 m o menos del centro del andén, a pie y sin mirar nada, el aviso dice **«E · Tocar la campana del andén»**. Si el tren tarda **más de 45 s**, suena la campana, la pantalla se va a negro un momento (el fundido corto de siempre, 0,9 s + 0,45 s) y la locomotora aparece a **135 m del poste**, en marcha: para en el andén en unos 20 s. Es lo mismo que hace Elsa en la Historia desde la 4.24.0 (`traerAlAnden`), ahora en manos del jugador. |
| Modos | Relax, Historia (fuera de las escenas de Elsa, ver abajo) y Desafío, salvo con un ataque encima. |
| Horarios | **No cambió ninguno.** El tren sigue su vuelta desde donde aparece, con sus paradas de 45 a 70 s, la misma velocidad y la misma frenada; el cartel del andén sigue diciendo la espera de verdad. |

## Por qué la campana (y no «esperar sentado con R»)
- Sentado, la R acelera el **reloj de la partida** (×40, o ×8 esperando una escena), pero la trochita anda con el **tiempo de verdad**: sentado en el andén se espera lo mismo. Para que la R sirviera habría que acelerar el tren, y eso cambia su marcha para todo (el que manejás, el que ves pasar, los fletes) y su horario.
- La campana ya existía en el mundo (el poste de la campana del andén en la estación de la Aldea, la campana que toca Elsa en sus dos escenas) y la jugada del fundido ya estaba probada en partida real (4.24.0 y 4.24.1). Es lo más simple y coherente: una interacción más en la tabla de la E y una regla pura.

## Que no se abuse
| Caso | Qué pasa |
|---|---|
| El tren ya viene (45 s o menos) | Suena la campana y sólo avisa «La trochita ya viene · llega en unos N segundos». No hay fundido ni se mueve nada. Tocarla de nuevo después de que vino da lo mismo: no lo vuelve a mover. |
| Parado en otro andén | **No se lo saca de su parada**: «La trochita está parada en X · sale en unos N segundos: tocá otra vez cuando arranque». |
| Entrando a otro andén (a menos de 60 m de su poste, frenando) | Tampoco: «La trochita está entrando a X». |
| Plantado en la nieve esperando a la cuadrilla | No viene (la cuadrilla manda). |
| Varado (el Desafío) | No viene. |
| Un ataque del Desafío encima | No se toca (ni suena). |
| Con el tren en el andén, arriba o manejando | No se ofrece: la E sube, o es lo del tren. |
| Sentado, a caballo o mirando algo para juntar o anotar | No se ofrece (lo de siempre le gana). |
| Viajes | La campana **no anota un viaje** (`registrar('viaje')` sigue siendo sólo al subir). No paga fletes ni mueve al jugador. |
| La Historia | Mientras la escena de Elsa de ese andén está por verse, **la soga está atada**: «La soga de la campana está atada a un clavo · «La toca la guarda.» Elsa anda por el andén de 6 a 21». No suena ni trae el tren, y la escena sale como siempre. La ida (`elsa-anden`): Estación del Valle, capítulos 1 y 2, sin un viaje hecho (en el capítulo 1 también: un viaje ahí se comía la escena del 2). La vuelta (`elsa-anden-vuelta`): Aldea, capítulo 2, con un viaje hecho (el texto dice «hacé los mandados y volvé al andén»). Vista la escena (o pasado ese capítulo), la campana es del jugador. |

## Archivos
- `src/campana-anden.js` (nuevo, reglas puras): `CAMPANA_ANDEN` (`radio` 8, `umbral` 45, `metros` 135, `frenando` 60), `campanaDeElsa`, `decidirCampana`, `ofreceCampana`, `textoCampana`.
- `src/trochita.js`: `estadoDelLlamado(parada, frenando)` (la espera, si está acá, arriba, varado, en la nieve, parado en otro andén con los segundos que le quedan, o entrando a otro). `traerAlAnden` y `esperaEnAnden` no se tocaron.
- `src/interacciones.js`: la entrada `campana-anden`, después de `casa-te` (subir al tren, la cabina, la casa de té, el mostrador, las cargas y lo de la aldea le ganan; va antes que el fuego y lo que mirás).
- `src/main.js` (quirúrgico): el import, `campanaAndenCerca()` y `tocarCampanaAnden()` después de `subirALaCabina`, y `campanaAnden`/`tocarCampanaAnden` en `ctxInteraccion`. El fundido es `fundirCorto` (el de la peña); el sonido, `sonido.campana` (la de la locomotora, la misma que en las escenas de Elsa).
- `package.json`: `verificar-4-26-0-b` en `verify:pasos`.
- `pruebas/verificar-4-26-0-b.mjs`, `pruebas/humo-4-26-0-b.cjs`, `herramientas/correr-humo-4-26-0-b.ps1`.

## Claves de guardado
**Ninguna.** La campana no guarda nada; las partidas viejas andan igual.

## Pruebas
- **`pruebas/verificar-4-26-0-b.mjs`: 109 comprobaciones y 30 mutaciones** (cada una en su proceso sobre una copia de `src/`; todas atrapadas. En la primera corrida quedó una sin atrapar —«un guardado con `constructor` cuenta como escena vista»— que en realidad no cambiaba nada con estos ids: se sacó junto con su comprobación). Cubre: las reglas puras y sus textos; `estadoDelLlamado` sobre un tren de mentira (recién salido, acá, parado en otra parada, entrando, a 104 m que todavía no frena, viniendo hacia acá, varado, nieve, arriba); el llamado entero (viene, queda a 135 m, llega en 15 a 25 s y tocar otra vez no lo mueve); que la parada siga de 45 a 70 s y la marcha igual; la tabla de la E (orden y condiciones); `campanaAndenCerca` y `tocarCampanaAnden` de `main.js` corridas con un mundo de mentira (radio, sentado, arriba, sin tren, el fundido, el sonido, la nota, «ya viene», otra parada, nieve, subirse en el fundido, una falla, que no anote un viaje, la Historia en los capítulos 1, 2 y 3 y en la Aldea, el Desafío con y sin ataque).
- Pruebas previas corridas en verde, sin tocarlas: `verificar-4-6-1-interacciones` (70 interacciones), `verificar-2-9-tren`, `verificar-3-7-3-tren`, `verificar-4-0-3-trochita`, `verificar-2-4-1`, `verificar-3-7-4-social`, `verificar-4-10-base`, `verificar-4-9-dias`, las cinco de idioma, `verificar-4-24-0-b` (38 mutaciones), `verificar-4-24-1-a` (38) y `verificar-4-24-1-b` (25). **No se ajustó ninguna prueba vieja.**
- `node armar.mjs`: en orden.

## Partida real (Electron, `pruebas/humo-4-26-0-b.cjs` vía `herramientas/correr-humo-4-26-0-b.ps1`, candado tomado sólo durante la corrida, monitor externo, perfil propio, 1366x768)
**Todo en orden** en la corrida final (programas de shader 110 → 110):
- Estación del Valle, capítulo 3 (la campana es tuya), con el tren que acaba de salir: el cartel decía **319 s**. El aviso dice «E · Tocar la campana del andén»; la E la toca, la pantalla se va a negro y vuelve, la nota dice «Tocaste la campana del andén». Al volver el cartel dice **18 s** y la trochita **para en el andén a los 26,9 s** reales de terminar el fundido, con su parada de siempre (60 s, entre 45 y 70). No anotó un viaje. Con el tren en el andén la campana ya no se ofrece (el cartel dice «el tren está en el andén · E para subir»).
- Con el tren parado en la Aldea: ni fundido ni se mueve; «La trochita está parada en Aldea de los Duendes · Sale en unos 50 segundos: tocá otra vez cuando arranque». A 120 m: «La trochita ya viene · llega en unos 17 segundos», sin fundido, y el tren sigue.
- Historia, capítulo 2, sin viaje: a las 23 (sin Elsa) la soga está atada y el tren no viene; a las 10 la escena de Elsa sale sola como siempre y queda vista; después, la campana es tuya.
- Capturas en `pruebas/salidas/humo-4-26-0-b/` (no se suben).
- Las dos primeras corridas no cuentan: la primera no arrancó (un comentario con comillas invertidas adentro del guion de la página; Electron quedó colgado hasta el tiempo límite, con el candado tomado unos 15 min); la segunda marcó dos fallas **de la prueba**, no del juego: la espera redondea a 0 medio metro antes de que el tren pare (se pasó a esperar `parado > 0`), y la E de subir pide estar junto a una puerta de coche (se mira el cartel del andén en su lugar).

## Qué no se vio a ojo
- **El Desafío** en partida real (sólo la prueba de código: anda de día y no con un ataque; varado no viene).
- **La nieve** con la cuadrilla y el tren **entrando** a otro andén en partida real (sólo la prueba de código).
- **La vuelta en la Aldea** con la soga atada (escena `elsa-anden-vuelta` por verse) en partida real; sí la ida en la estación.
- Las paradas chicas y el apeadero del Riel Sur (la regla es la misma: `paradaCerca` y 8 m del centro del andén).
- **El sonido** de la campana: se usa `sonido.campana` (la de las escenas de Elsa); no se escuchó. En la Aldea el poste de la campana **no se mueve** al tocarla (su animación es de `aldea-mecanicas-mundo.js` y sólo se dispara cuando llega el tren): no se tocó.
- Que el aviso aparezca mirando para cualquier lado dentro de los 8 m (la captura lo muestra mirando al pasto, de espaldas a la vía): es a propósito (el andén es chico), pero no se pensó un poste visible en las paradas que no tienen campana.
- Con el tren en el andén y lejos de una puerta, el aviso de la E muestra lo que haya (en la corrida, «El perro marca algo cerca»): es lo de siempre, no cambió.
