# Hojarasca 4.4.3 · Vender de vuelta un negocio comprado y sumar plata a una sociedad ya hecha (rama `v443-venta`)

Sale de `v442-integra` (4.4.2). Sólo Relax, sin mando, sin inglés, sin teclas con Mayús. **La versión no se subió** (sigue 4.4.2).

## Cómo se juega

### Vender de vuelta
- **Dónde**: en la charla con el dueño de origen, «Hacer juntos» → **«Hablar de su negocio»** → **«Venderle la panadería de vuelta»** (cada local con su nombre). Si el negocio es tuyo, esa opción está siempre en el submenú, junto a «Cómo viene el negocio» y «Retirar la caja». Se descubre además por: la guía (F1, «Vender el negocio y sumar plata»), la página «Negocios y sociedades» del cuaderno (debajo de cada negocio tuyo dice «Para venderlo de vuelta, hablá con X: hoy te darían $… por el negocio y $… de la caja») y Amadeo (en «Hablar de negocios» recuerda que para vender hay que hablar con el dueño de siempre).
- **La propuesta**: el vecino contesta con su voz y, debajo, el cálculo a la vista: lo que pagaste y hace cuántos días, el porcentaje y de dónde sale (base, días, amistad, ajuste del trato, descuido), los topes (50 % y 85 %), la caja que cobrás aparte, el total, y la advertencia de recompra. Opciones: **«Venderlo: cobrás $X»** y «Pensarlo». Nada se mueve hasta cerrar.
- **Al cerrar**: se cobra la caja del negocio (motivo «Caja de … al venderlo»), se cobra el negocio («Vendiste …»), se cierra la sociedad si hubiera una, el negocio deja de ser tuyo, el cartel «de [apodo]» desaparece, el vecino retoma su rutina (si se había ido a la plaza, vuelve a su local) y el local queda como antes de comprarlo. Aviso en el HUD, el vecino cierra con sus líneas, queda en el historial del cuaderno.
- **Recomprar**: se puede cuando quieras, con la reacción de siempre; si lo vendiste hace **menos de 30 días de juego**, el vecino pide un **10 % más** (la charla lo dice y hasta qué día; el cuaderno también). Al recomprarlo, el recargo se borra.

### Sumar plata a una sociedad
- **Dónde**: siendo socio, la charla pasa a decir **«Hablar de la sociedad»** (antes seguía diciendo «de su negocio») y el submenú trae **«Sumar plata a la sociedad»** (entre «Cómo viene la sociedad» y «Avisar que me retiro»).
- **La propuesta**: texto con lo que tenés puesto, el total que se puede poner (40 % del precio), cuánto podés sumar, tu porcentaje y lo que rinde por día, a qué precio te lo cuenta (amigo o compadre), y cómo se devuelve lo nuevo. Tres montos: un tercio, dos tercios o todo lo que falta; cada opción dice **«del X % al Y %»**. Después, la voz del vecino, el aviso del HUD («Sumaste plata a tu sociedad en …»), y el cálculo de cómo quedó tu parte.
- **Se niega** (y lo dice con su voz): si ya pusiste el máximo (40 % del precio), si la amistad bajó de los puntos que hicieron falta para entrar (la charla dice cuántos faltan), si avisaste que te retirás (primero «Seguir de socio»), si es de apego fuerte y no le escuchaste nada de su historia, o si no te alcanza la plata.

## Reglas

### Precio de venta (`fraccionVenta`, `reaccionVenta`, `evaluarVenta`, `vender`)
`precio = pagado × fracción`, redondeado a $50. `pagado` es lo que costó el negocio (incluye el crédito de socio si venías de socio).

| Parte | Valor |
|---|---|
| Base | 55 % |
| Días que lo tuviste | +0,25 puntos por día, hasta 60 días (+15) |
| Amistad | hasta +15: lineal entre 50 y 180 puntos (con menos de 50, nada) |
| Ajuste del trato | **ofendido** (lo vendés en menos de 7 días): −5; **regatea** (menos de 50 puntos): −5; **emocionado** (se había ido y vuelve a su local, o apego fuerte con 95 puntos o más): +3; si no, 0 |
| Descuido | hasta −15: (días sin atención ÷ días que lo tuviste) × 12 + (ganancia perdida por caja llena ÷ lo que rindió + lo perdido) × 10 |
| Tope | **siempre entre el 50 y el 85 %** |

La reacción cambia el texto y la amistad: ofendido −2 (le dolió), acepta +1, emocionado +2, regatea 0. Nunca se niega a comprar (si no, el negocio sería una trampa).

«Descuido» se mide con la historia del negocio (campo nuevo `mala`: días de gestión por debajo de 100 %, y lo `perdido` que ya existía), **no** con la visita de este momento, porque hablar con el vecino para vender ya cuenta como «pasar a verlo».

### Aporte adicional (`reaccionAporteExtra`, `sumarAporte`)
- Total puesto en la sociedad: máximo el **40 %** del precio (igual que el primer aporte máximo). Lo mínimo que se suma: el 5 % del precio (o lo que falte).
- Lo que sube tu porcentaje: **aporte ÷ precio × 100 × factor de la amistad de hoy** (amigo 0,9, compadre 1: el mismo criterio que el aporte original), **sumado** a tu porcentaje; tope 45 % (en la práctica 40, porque el factor nunca pasa de 1). Aditivo y no recalculado sobre el total, para que si la amistad bajó a «amigo» no te quite lo que ya tenías por «compadre».
- Lo nuevo rinde **desde el día siguiente**: se guarda el porcentaje de antes (`previo`) y rige hasta el día del aporte (igual que el primer aporte, que no cobra el día en que entrás).

### Retiro con aporte adicional (`devolucionDe`)
**Cada aporte cuenta sus propios días** con la tabla de siempre (60 % antes de 6 días, 80 % antes de 18, 92 % antes de 36, 100 % después): el original desde que entraste, cada adicional desde el día que lo hiciste. Criterio simple y justo: lo que sumaste ayer no vuelve entero sólo porque la sociedad es vieja (si no, sería una manija: sumás, avisás y cobrás todo). Vale igual para el aviso de retiro (que dice cuánto vuelve), el cuaderno, el retiro efectivo y el crédito si pasás de socio a comprador.

## Equilibrio (`herramientas/simulador-compra.mjs`, secciones 6 y 7)

- **Comprar y vender de inmediato siempre pierde**: de todas las combinaciones (8 negocios × amistad de 30 a 200 × 0 a 120 días de tenencia) el precio de venta queda entre el **50,0 % y el 85,0 %** de lo pagado. **El mismo día devuelve como máximo el 65 %** (pérdida de al menos el 35 %; con 100 puntos, 56 %: panadería $84.000 → $46.850).
- Ejemplos a 100 puntos de amistad (panadería, $84.000 pagados): vendida a los 7 días $52.500 (63 %), a los 30 $55.650 (66 %), a los 60 $61.800 (74 %). Almacén ($178.500): a los 60 días $136.700 (77 %). Los de apego fuerte, con su +3 de emoción, rinden un poco más.
- **Cobrando la caja cada 5 días**, el neto de comprar y tener y vender: **negativo (pérdida) hasta casi los 30 días**, **apenas positivo a los 30 (+$2.000 a +$8.000)**, +$47.000 a +$90.000 a los 60 y +$84.000 a +$164.000 a los 90 (todo lo cobrado menos lo pagado). **Quedarse con el negocio rinde mucho más que girar**: la prueba compara 5 ciclos de comprar-vender-recomprar contra quedarse, y gana quedarse. No hay manija de plata y el pago de 64–84 días de la 4.4 no se toca (no cambió ninguna cifra de compra, ganancia, caja ni sociedad).
- **Sin visitar** (el descuido): el mismo negocio vendido a los 60 días deja −$20.000 (panadería) a −$52.000 (cantina) de neto, porque rinde 70 % y la caja se llena, y el precio de venta baja hasta 15 puntos.
- **Aporte adicional**: entrando con el mínimo (10 %) y sumando hasta el 40 % (compadre) el aporte total se paga en **64 a 84 días**, igual que la sociedad original (no es más rentable ni menos); p. ej. almacén $17.000 + $51.000: 40 %, $840 por día. Con tramos: $17.000 el día 1 y $34.000 el día 41, si te retirás el 43 te devuelven $37.400 de $51.000 (el primero al 100 %, el segundo al 60 %); el día 60, $48.280; el día 100, todo.
- Un sólo cambio de comportamiento de la 4.4: la recompra pronto cuesta 10 % más (sólo aplica si vendiste antes).

## Decisiones mías (a revisar)

1. **Se vende siempre al dueño original** (decisión por defecto). No hay subasta ni otros compradores.
2. **El vecino nunca se niega a comprar**: sólo ajusta el precio. Una venta rechazada dejaría un negocio imposible de soltar.
3. **Base 55 %**, no 50 %: así el ajuste de −5 (ofendido, regatea) se ve y el piso del 50 % sigue siendo el de la especificación.
4. **Descuido por historia (`mala`, `perdido`)** y no por la visita del momento (ver arriba). Campo nuevo `mala` (entero).
5. **Quien trabajaba en tu local propio** y es el vecino al que le vendés su negocio: se lo **libera con aviso** («Volvió a su negocio») **sin el −6 de amistad** de un despido (no es un despido). Hoy el único vínculo entre los dos sistemas es el vecino mismo (la 4.4.2 impide contratar a quien ya atiende un negocio que le compraste, así que sólo pasa si lo habías contratado **antes** de comprarle el negocio). Si tu local propio no está abierto en ese momento no hay a quién despedir y no se libera (queda como estaba).
6. **Aporte adicional aditivo** (no recalculado sobre el total) y **tramos por aporte** para el retiro. Alternativa más simple: tratar todo como un solo aporte con la fecha del último; se descartó porque castiga al viejo.
7. **No hay límite de cantidad de aportes adicionales** más que el 40 % y un mínimo del 5 % del precio (se guardan hasta 8 tramos).
8. **El cartel no es interactivo**: se vende por la charla (el diseño por defecto del pedido). Hacerlo interactivo implica un hook nuevo en la tecla E del mundo.
9. «Hablar de su negocio» pasa a decir «Hablar de la sociedad» cuando sos socio y no dueño.
10. Textos nuevos para los cinco vecinos menos fuertes (Rosa, Anselmo, Aurelio, Elvira, Guido) más cortos que los de Ercilia, Ceinwen y Lucrecia, como en la 4.4. Lucrecia no tiene líneas de venta según el romance (sólo las generales).

## Guardado

Campos nuevos, todos con valor por defecto (una partida de la 4.4.2 carga igual y se sanea):
- `negociosVecinos.vendidos` (`{}`: `{ dia, monto, pagado }` por negocio vendido; sólo sirve para el recargo de 30 días),
- `negociosVecinos.total.vendido` (0),
- `negociosVecinos.comprados[id].mala` (0),
- `negociosVecinos.socios[id].extras` (`[]`: `{ dia, monto }`; nunca suman más que el aporte) y `.previo` (`null`: `{ dia, pct }`).

Sin `NaN` ni negativos (la prueba lo barre), topes: aporte total ≤ 40 % del precio, porcentaje ≤ 45, hasta 8 tramos. El Desafío no trae nada de esto (`progresoNuevo().negociosVecinos === undefined`, y las funciones nuevas devuelven `ok: false`).

## Archivos

Nuevos: `pruebas/verificar-4-4-3-venta.mjs` (en el gate), `pruebas/humo-4-4-3-venta.cjs` (partida real, fuera del gate), este informe.
Tocados (propios del tema): `src/negocios-vecinos.js` (reglas), `src/negocios-vecinos-voces.js` (`VOCES_VENTA`, `VOCES_APORTE`), `src/negocios-vecinos-juego.js` (menús, cálculo, avisos, cuaderno), `herramientas/simulador-compra.mjs` (secciones 6 y 7), `src/guia.js` (una entrada).
**Compartidos tocados (poco):** `src/main.js` (un parámetro, `liberarEmpleado`, con aislamiento), `src/empleados-negocio-juego.js` (`liberar`, y un parámetro en `hacerDespedir`), `package.json` (la prueba en `verify:pasos`). **No** se tocaron `guardado.js` (el saneado vive en `sanearNegociosVecinos`), `aldea.js` ni `vecindad-juego.js` (la regla `^negocios` ya servía).
Pruebas viejas ajustadas (lo mínimo): `verificar-4-4-compra.mjs` (dos listas de opciones del submenú: ahora traen «Venderle … de vuelta» y «Sumar plata a la sociedad»).

## Verificación

- **Verificado en Node**: `pruebas/verificar-4-4-3-venta.mjs` (2.742 comprobaciones, en el gate): el precio de venta en todo el barrido (negocio × amistad × días × descuido) queda entre 50 y 85 % y se alcanzan los dos extremos; sube con días y amistad y baja con el descuido; las cuatro reacciones; vender (billetera exacta, caja y negocio por `economia`, sociedad cerrada, cartera reordenada, techo de la billetera, Desafío); comprar y vender de inmediato siempre pierde (hasta 65 % el mismo día, nunca más del 85 %); la recompra con 10 % más hasta los 30 días justos; el ciclo comprar-vender-recomprar rinde menos que quedarse; el cartel de turnos del empleo (4.3) vuelve a fichar tras vender; el aporte adicional (montos, porcentaje aditivo, el día del aporte al porcentaje de antes, tope del 40 %, negativa por tope / amistad / retiro avisado / falta de plata, tramos del retiro, crédito al pasar de socio a dueño); el guardado (partida de la 4.4.2, valores rotos, ida y vuelta por la partida, Desafío); las voces de los 8 vecinos sin textos rotos; el juego con un contexto de mentira (menús, cálculo, avisos, cuaderno, gerente, Desafío); lo enganchado.
- **Verificado en Electron, partida real oculta** (`pruebas/humo-4-4-3-venta.cjs`, teclas de verdad por la rueda): TODO BIEN, 46 comprobaciones. Comprar la panadería (Rosa se va a la plaza, cartel «de Bruno»), 21 días sin pasar, venderla (cálculo a la vista, billetera exacta, cartel desaparecido, Rosa de vuelta en su local a las 14), recomprar con el 10 % más; Ercilia se emociona con el almacén; Elvira: socia, «Hablar de la sociedad», «Sumar plata a la sociedad» (tres montos, aceptación, tope, negativa), Ercilia no recibe más plata con la amistad baja, retiro con aportes por tramos ($36.520 de $44.000, igual al cálculo), cuaderno, guía, guardar y recargar. Un solo Electron, oculto, cerrado y verificado al terminar. Capturas a tamaño completo, miradas por mí, en `C:\Users\Andres\Documents\Hojarasca\salida-cantina\venta\` (01 a 17).
- **`npm run verify`** completo, una vez al final: **260 pasos OK** (los 259 de antes más la nueva).
- **Razonado, no verificado**: fps en la 4600G (nada nuevo por cuadro; todo corre por eventos y en el reloj de un segundo que ya existía); el tono de los textos nuevos; liberar a un empleado real de tu local propio al vender (la rama de `liberar` en `empleados-negocio-juego.js` sólo se cubrió con su enganche y con la prueba de `main.js`; la partida real no contrató a nadie antes de comprar); Lucrecia con romance real al vender.

## Lo que NO quedó

- **El cartel «de [apodo]» no se puede usar para vender** (se vende por la charla, como pedía el diseño por defecto).
- **Líneas de venta de Lucrecia según el romance** (novios, comprometidos, casados, separados): usa las generales.
- **Liberar al empleado con el local propio cerrado o movido** (no hay a quién despedir): queda como estaba.
- **Vender a un tercero**, vender una **parte** del negocio, o **vender la sociedad** a otro: no.
- Sonido propio de la venta (usa el mismo «anotar» que la compra).
- Probar el fps en la 4600G (nada nuevo por cuadro: razonado).
