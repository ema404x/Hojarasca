# 4.3 · El negocio propio

Rama `v43-negocio` (sale de `v42-integra`, 4.2.0). Sólo Relax. La versión **no se subió** (sigue 4.2.0): la sube quien junte las ramas.

## Qué es

Un **local propio en el valle**: lo construís con pesos y materiales (O → Trabajo), lo surtís con lo que producís y juntás, fijás los precios, lo abrís y **atendés vos a cada cliente con E**. Si no estás cerca, no se vende. Dos tipos en esta primera versión:

| Local | Pesos | Materiales | Vende |
|---|---|---|---|
| Almacén de campo | $28.000 | 40 tablas, 12 troncos, 10 piedras | huevos, harina, papas, pan casero, miel, dulce, calafate seco, llao llao seco, trucha ahumada, ponchos, lana, leña, tablas, piedra (14) |
| Panadería y cafetería | $36.000 | 44 tablas, 12 troncos, 24 piedras | pan casero, empanadas, miel, dulce, calafate seco, huevos, harina (7) |

Se pone donde quieras (cerca de tu refugio o de la aldea): es una obra más, con las mismas reglas que los edificios de oficio de la 4.2 (precio por etapa, desmontar devuelve la mitad de los pesos).

## Cómo funciona

- **Primer uso**: E junto al local abre el **panel** (estantes, precios, caja, fama). **Mayús + E** lo abre siempre, aunque haya un cliente esperando.
- **Estantes con stock real**: «Surtir con todo lo que llevás», `+lote`, `Llenar`, `Sacar`. Sale de la mochila (y, si es material, también del acopio y los depósitos cercanos, como al construir). Tope por cosa: 6 lotes del mercado (18 panes, 36 huevos, 6 ponchos…). **Se ve en el local**: cada cosa tiene su lugar en los estantes o en el piso y aparece con 1, 2 o 3 «pasos» de llenura.
- **Tres precios por producto** (barato ×0,98, normal ×1,15, caro ×1,40 del precio de plaza de `comercio.js`) y botones «todo barato / normal / caro». Barato trae más gente y más fama; caro, menos gente y más ganancia por cliente.
- **Abierto / cerrado**: botón del panel. El cartel se pone verde y el toldo sube; cerrado, cartel rojo y toldo caído. Sólo sale a comprar la gente de 8 a 21 h.
- **Clientes**: llegan solos (a ritmo de horas de juego) sólo con el local abierto, con algo en los estantes, **vos a menos de 35 m**, de 8 a 21 h y con la caja con lugar. Hasta **tres a la vez**. Cada uno sale de unos metros al frente, **camina hasta el mostrador**, queda esperando (60 s ± 20 %) y **pide** (1 a 3 cosas, de sus gustos). E junto al mostrador (con el cliente enfrente o no) despacha al primero que ya llegó. Los clientes **no se pueden charlar** (salen de la búsqueda del «vecino» de `main.js`: una línea): la E siempre es del local. El aviso dice «Atender: 2 panes caseros y 1 frasco de miel».
- **Perfiles** (`PERFILES` en `negocio-propio.js`): vecina, merendera, hachero, constructor, tejedora y viajero de la trochita, cada uno con gustos, horas del día y sensibilidad al precio (el viajero casi no mira el precio; la vecina, mucho). Sólo vienen los que encuentran algo para comprar en ese tipo de local (a la panadería no va el constructor).
- **Reputación (fama, 0 a 100, arranca en 25)**: sube con buena atención —atender rápido (≤15 s vale más que ≤35 s, y más que lento), tener todo lo que piden, precios baratos— y con los días buenos (≥3 atendidos y ninguno perdido: +0,2). Baja si te falta lo que piden (−0,5 por cosa), si se van sin comprar o si **dejás a alguien sin atender** (−1,5). Sube cada vez más despacio a medida que sos conocido. Trae más gente (de ×0,7 a ×1,4) y se anuncia al cambiar de nivel («Con clientela», «De confianza», «El mejor del valle»).
- **Caja con tope** ($12.000): lo que cobrás entra a la caja del local; con la caja llena no llegan clientes y no se atiende hasta retirarla (botón del panel → billetera, queda en el libro como «Ventas de tu local»).
- **Desarmar el local** (Mayús + Supr): la mercadería y la plata de la caja vuelven a vos; la fama se queda.
- **Guardado**: `progreso.negocioPropio` (tipo, abierto, stock, precios, fama, caja, cuentas de hoy y totales). Las partidas viejas no lo traen y arrancan con el negocio sin abrir (nada más se toca). En el Desafío no existe.

## Equilibrio (números del simulador `herramientas/simulador-negocio-propio.mjs`)

Jugador que atiende en 4 a 14 s y surte cada mañana con lo que produce. «Ganancia» = lo que ganás de más que vendiendo lo mismo al mercado (plaza menos el 12 % del puesto). Referencia: ~$3.200/día de jornales.

| Almacén | clientes/día | ventas/día | ganancia/día |
|---|---|---|---|
| surtido bueno (los edificios de la 4.2 andando), precios normales | 6,6 | $6.900 | **$1.600** |
| ídem, precios baratos | 8,9 | $7.700 | $820 (y la fama sube más rápido) |
| ídem, precios caros | 2,8 | $3.500 | $1.320 |
| surtido chico (huerta y recolección), normales | 4,6 | $2.000 | **$480** |
| sólo pan y huevos | 2,6 | $360 | $90 (y la fama cae a 0) |

Panadería con surtido bueno: ~$1.400/día; chico: ~$560. El almacén se paga solo (los $28.000) en unos **18 días** (1,5 años del juego); la panadería, en unos 26. Atender lento (30 a 55 s) baja a ~$1.260 y pierde clientes; la lluvia, a ~$1.060.

Por qué no rompe la economía: lo que se vende ya lo producís (no hay plata de la nada); la ganancia extra es ~25-30 % sobre lo que pagaría el mercado, cuesta estar presente (nada pasa solo), el precio normal queda a 1,15 del de plaza (menos de 1,45× siempre, lo comprueba la prueba) y **los edificios de oficio de la 4.2 no quedan obsoletos: son los que llenan los estantes** (con un surtido chico se gana tres veces menos). La tienda de campo sigue siendo la opción «sin estar», con 4 lotes por día; el local es la opción «activa».

## Decisiones mías (para revisar)

1. **Un local por partida**: el estado vive en `progreso.negocioPropio`, no en la obra. Si construís un segundo, queda de adorno («Ya tenés otro local») y sólo atiende el primero.
2. **Clientes anónimos por perfil, no vecinos con nombre**: los vecinos de la aldea siguen en sus horarios (`aldea.js` no se tocó); los clientes son tres figuras que se reusan (vecina, hachero, viajero) con el cuerpo de las claves de los visitantes del tren y ropa propia. Los «gustos de los vecinos» están en los perfiles.
3. **Quesos y cerveza no se venden**: no son bienes de la mochila (la quesería y la cervecería pagan pesos directo). Quedan para cuando se conviertan en bienes. Tampoco hay quesos ni cerveza en la panadería/cafetería.
4. **Precios en tres niveles** (no deslizador).
5. **Horario**: abierto/cerrado manual; la gente sale de 8 a 21 h. No hay horario configurable más fino.
6. **Un cliente que llega a la hora de cerrar la caja llena**: no se atiende hasta retirar la plata (no se pierde nada).
7. **La fama no baja sola por el paso de los días** (sólo por mala atención): decisión conservadora.
8. Los clientes no hablan (sólo el aviso y la nota con lo que piden): no se agregó voz ni charla.

## Enganches previstos para la parte de empleados / sociedad (no implementados)

- `avanzarCola(cola, est, tipo, dt, dtHoras, env)` recibe `env.presente`: un empleado detrás del mostrador sólo tendría que ponerlo en verdadero (y llamar a `despachar` por él) para que el local venda sin vos.
- `despachar(est, cliente)` no sabe quién atiende; la ganancia puede repartirse después sobre `est.caja` y `est.total`.
- `TIPOS`/`PERFILES` en `negocio-propio.js` son tablas: sumar un tipo de local = una entrada, su plano y (si hace falta) un perfil.

## Archivos

Nuevos: `src/negocio-propio.js` (reglas puras), `src/negocio-propio-juego.js` (E, panel, clientes y figuras), `src/planos-negocio.js` (los dos locales), `pruebas/verificar-4-3-negocio.mjs`, `pruebas/humo-4-3-negocio.cjs`, `herramientas/simulador-negocio-propio.mjs`, este informe.

**Compartidos tocados (con poco):** `src/main.js` (import, creación aislada, 12 líneas de enganche: obras que trabajan, aviso y E, Mayús + E, panel con E/Escape/HUD, hablar con el cliente, bucle con `fallaSistema`, desarmado), `src/construccion.js` (import + `PIEZAS.push`), `src/guardado.js` (el campo con valor por defecto y saneado), `src/plantilla.html` (la sección del panel y su estilo), `package.json` (la prueba en `verify`, con `sumar-prueba`). `aldea.js` no se tocó.

## Verificación y pruebas tocadas

- Se tocó UNA prueba vieja, lo mínimo: `pruebas/verificar-3-6-2-juego.mjs` lee la línea exacta de `panelDelHudAbierto` en `main.js`; ahora esa línea también cuenta el panel de tu local (`|| !!negocioJuego?.panelAbierto()`). Las demás pruebas que leen líneas de `main.js` (almacén, gente, amor, órdenes) quedaron como estaban: mis enganches van en líneas nuevas.
- Trampa del armado de un solo archivo (`armar.mjs`): sólo conoce el primer nombre de `export const A = 1, B = 2;`. Lo encontró la partida real (el panel decía «de 8 a undefined h»); ahora hay una prueba que lo impide en los tres archivos nuevos.

- Verificado: `verificar-4-3-negocio.mjs` (reglas, planos, demanda, cola, caja, guardado, equilibrio, cableado) y la partida real en Electron (ver abajo).
- Razonado, no medido: el costo en la 4600G (nada nuevo por cuadro: la cola corre cada 0,25 s, tres figuras dormidas cuando no se usan, geometría de los locales entre ~700 y ~1.500 triángulos con los estantes llenos, sin luces nuevas).

## Resultado

- `npm run verify` completo y de corrido: **251 pasos OK** (los 250 de la 4.2.0 más `verificar-4-3-negocio.mjs`, 1.891 comprobaciones).
- Partida real en Electron (`pruebas/humo-4-3-negocio.cjs`, capturas en `C:\Users\Andres\Documents\Hojarasca\salida-cantina\negocio\`): menú con precios, sin plata no se construye, construir, panel, surtir, precios, abrir, tres clientes caminando al mostrador, atender con E, el que no se atiende se cansa y baja la fama, retirar la caja, cerrar, clientes que llegan solos con el reloj corriendo, alejarse, guardar y recargar, desarmar (todo vuelve) y la panadería. El último recorrido completo pasó todo salvo la panadería (un descuido de la prueba tras recargar, ya arreglado); la panadería se repitió sola (`HUMO_SOLO=panaderia`) con la geometría final y pasó.
- No quedó ningún Electron abierto.

## Lo que NO quedó

- Empleados, compra de un negocio existente y sociedad con un vecino (otra parte; los enganches están arriba).
- Quesos y cerveza como mercadería; más tipos de local (carnicería, herrería…).
- Voz o charla de los clientes; clientes con nombre propio de los vecinos de la aldea.
- Medir fps en la 4600G (no se midió: sólo se razonó que no hay nada nuevo por cuadro).
- Oír el sonido de la venta y del pedido (usan los sonidos de siempre, `juntar` y `anotar`; no se escucharon a oído).
