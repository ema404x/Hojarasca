# Zona D · Guardado y partidas viejas, Desafío, rendimiento/robustez, teclas/paneles y pruebas (4.4.1, rama v44-integra)

Revisor de sólo lectura. No toqué el repo (`C:\Users\Andres\Documents\Hojarasca\trabajo\t44-integra`). Todos mis scripts están en `C:\Users\Andres\Documents\Hojarasca\trabajo\bugs44\`
(Node: `fuzz1.mjs`, `fuzz2.mjs`, `fuzz3.mjs`, `bench.mjs`, `crece.mjs`, `guardar-1hz.mjs`, `foto3.mjs`, `foto-empleados2.mjs`, `secuencia.mjs`, `desafio-planos.mjs`, `planos.mjs`, `paquete.mjs`;
Electron oculto con perfil temporal y `al-monitor.cjs`: `runtime1.cjs`, `runtime2.cjs`, `runtime3.cjs`). Un solo Electron mío a la vez; los cerré todos (`Get-Process electron` = 0 al terminar).

Convención: **[V-Node]** = lo demostré ejecutando el módulo real en Node; **[V-Electron]** = lo demostré en el juego real (index.html 4.4.1, oculto); **[Razonado]** = sólo leído/deducido.

Resultado corto: **0 ALTAS, 3 MEDIAS, 7 BAJAS** (más una lista de lo que probé y NO falló). El guardado en sí está muy sólido; lo que encontré está en el cableado de main.js, en la tecla E y en lo que el gate no mira.

---

## MEDIA

### D1 · Correr (Mayús) + E secuestra la E junto a depósitos y al local: la segunda E **paga una ampliación** sin querer — [V-Electron]
- `src/main.js` ~3178-3181 (manejador de la E). Hay dos ramas "Mayús + E" **antes** del resto de la E:
  - `e.shiftKey && … almacenJuego.esAlmacen(o.plano.id)` → `almacenJuego.ampliar(o)` (barraca, silo, depósito, pila, herramientero);
  - `e.shiftKey && … negocioJuego.esLocal(o.plano.id)` → `negocioJuego.usar(o, true)` (abre el panel en vez de atender).
- **Mayús es la tecla de correr** (`src/jugador.js:252`, `estado.corriendo = teclas.has('ShiftLeft') || …`). Quien llega corriendo a la barraca y toca E para guardar no guarda: le sale "Sube el tope de 40 a 70 · cuesta 12 tablas, 4 troncos y $3.500. Mayús + E otra vez para confirmar". Si vuelve a tocar E (todavía corriendo / con Mayús apretada) entre 0,6 y 12 s después (`MIN_CONFIRMAR/MAX_CONFIRMAR`, `almacen-juego.js`), **lo paga y lo hace**.
- Reproducción (corrida, `runtime3.cjs`): barraca terminada a 3 m, $20.000 y 30 tablas en la mochila, `KeyE` con `shiftKey:true`, 900 ms, otra vez.
  Resultado real: 1.ª E → solo el aviso de precio (pesos 20000); 2.ª E → "Ampliaste la barraca": **pesos 20000 → 16500, tablas 30 → 18**; en ningún momento guardó nada. Sin Mayús, la E guarda como siempre.
- Lo mismo con el local propio: corriendo + E con un cliente esperando abre el panel en vez de despacharlo.
- Corrección sugerida: no usar Mayús para esto (otra tecla propia, o exigir `!js.corriendo`/estar quieto, o confirmar con el cuadro de preguntas del juego `dialogos.confirmar`, que ya existe, en vez de "la misma tecla otra vez"). Como mínimo: si `js.corriendo`, tratar la E como E normal.

### D2 · El acopio de 40 se coló al Desafío (y el aviso manda a un depósito que ahí no existe) — [V-Node + leído]
- `src/main.js` `usarAcopio()` ~5003-5017: el tope `TOPE_ACOPIO = 40` por material (`almacen.js:24`) vale en **los dos modos**. Los depósitos que lo compensan (`pila-piedra`, `deposito-piedra`, `barraca`, `silo`, `herramientero`) son `soloRelax: true` (`planos-almacen.js:21`).
- Demostración (`desafio-planos.mjs`): los cinco `soloRelax=true`; el único plano que "guarda algo" y se puede construir en el Desafío es `acopio`.
- Por qué importa en el Desafío: al caer se pierde todo el cristal y el 30 % de tronco/tabla/piedra **de la mochila** (`caerEnDesafio`, main.js ~4360-4377); el acopio es el único lugar a salvo, y `CLAVES_MATERIAL` incluye `cristal`. Ahora tiene techo de 40 de cada uno y sin alternativa.
- Y el texto: cuando está lleno dice "El acopio está lleno · Guarda hasta 40 de cada material. **Un depósito (O → Trabajo) guarda más y se amplía**" (main.js:5015). En el Desafío ese depósito no aparece en el menú de obra.
- Corrección sugerida: `TOPE_ACOPIO` sólo en el Relax (`desafio ? Infinity : TOPE_ACOPIO`) o, si es a propósito, cambiar el mensaje en el Desafío. Pregunta de diseño abajo.

### D3 · `guardar()` casi cada segundo (y el cartel "✓ Guardado" fijo) con empleados contratados y el jugador lejos — [V-Node (módulo real) + costo medido en Electron]
- `src/empleados-negocio-juego.js:225`:
  `if (E.sim.n % 5 === 0 && !presente && hayPendiente(E)) ctx.guardar?.();`
  Está dentro del paso de 1 s (`CADA = 1`). La idea era "guardar cada 5 ventas simuladas", pero `E.sim.n` **sólo cambia cuando se simula una venta**: si queda parado en un múltiplo de 5 (el 0 incluido: local sin stock, cerrado por deuda, de noche, caja llena) y hay algo pendiente (un sueldo ya pagado alcanza), guarda **una vez por segundo hasta que volvés al local**.
- Medido con el juego del módulo y un contexto de mentira (`guardar-1hz.mjs`, 3 días de juego con el jugador lejos): local con stock → **346** guardados; local sin stock (nunca surtido o agotado) → **2.928** guardados, con `sim.n = 0`.
- Efectos: (a) el HUD "✓ Guardado" (`plantilla.html:1219-1230`, dura 1,3 s por guardado) queda prendido todo el rato; (b) un `guardarProgreso` completo por segundo (sanear + stringify + escribir + releer y parsear, `guardado.js:708-739`); en el Electron real medí **1,7 ms con la partida vacía y 3,4 ms con 1.500 obras** (`runtime1.cjs`): no mata cuadros, pero es un micro-tirón de 2-4 ms por segundo justo en el síntoma "tirón al caminar" que están cazando, y desgasta el disco/localStorage; (c) el respaldo (`CLAVE_BACKUP`) pasa a tener segundos de antigüedad, o sea ya no protege de nada.
- Corrección sugerida: guardar cuando `E.sim.n - ultimoN >= 5` (acordarse de `ultimoN`), o directamente no guardar acá y dejar el autoguardado de 20 s.
- Nota: es el único `% N === 0` ligado a `guardar`/`nota` en los `*-juego.js` (lo busqué).

---

## BAJA

### D4 · El aviso de la E sigue diciendo otra cosa con el panel del local abierto — [V-Electron]
- `src/main.js` ~10403 pone `aviso = null` con `negocioJuego.panelAbierto()`, pero más abajo vuelven a escribirlo (tren, fuego, tendal, huellas, hacha…). El "reseteo final" de la línea **10461** (`if (enElAlmacen || enLaFeria || enLasCargas() || cocinaJuego?.panelAbierto() || tallerTren?.panelAbierto()) aviso = null;`) se escribió en la 3.8.3 y **no incluye** los paneles posteriores: banco (3.8.8), fiestas, carta de la cantina / casa de té (3.9), panel del local (4.3).
- Reproducción (`runtime2.cjs`): local armado, fogata prendida de noche, panel abierto con `usar(o,true)`: `__avisoYa()` → "Dormir junto al fuego" y el DOM muestra "E Dormir junto al fuego"; pero la E (main.js:3189) cierra el panel.
- Corrección: agregar `negocioJuego?.panelAbierto() || cantinaJuego?.panelAbierto() || teJuego?.panelAbierto() || fiestasJuego?.panelAbierto() || enElBanco()` a esa línea (o mejor: una sola función `panelDelHudAbierto()` ya existe, main.js:8890, y la usa el resto).

### D5 · Las ramas Mayús+E no miran si hay otro panel abierto — [Razonado]
- main.js:3179/3181: sólo comprueban `!enElAlmacen`. Con la feria, las cargas, el banco, la cocina, el taller, las fiestas o la carta de la cantina abiertos, estar cerca de un depósito/local y tocar Mayús+E abre el panel del local o muestra/paga la ampliación **encima** (dos paneles a la vez). La E normal sí cierra el panel primero (3.8.3). Corrección: poner esas dos ramas después del bloque que cierra paneles, o con `!panelDelHudAbierto()`.

### D6 · `fallaSistema` calla al jugador y las llamadas "aisladas" no lo son todas — [Razonado]
- `src/main.js:10681`: un sistema que falla en cada cuadro (por ejemplo `empleo`, `empleados-negocio`, `negocios-vecinos`: sueldos, ventas, cobros) se anota **una vez** en consola y en el log de caídas, y listo; nada le avisa al jugador (a diferencia de los errores sueltos de la plantilla, `registrarError`, que sí muestran "Hojarasca encontró un problema"). `veces` se cuenta pero nada lo lee fuera del modo debug.
- Con 64 claves distintas (`nombre|mensaje`) deja de anotar **hasta lo nuevo**: un mensaje con números cambiantes llena el tope y el siguiente fallo real queda mudo.
- No todo está en `try/catch`: el bloque de avisos del cuadro llama sin protección a `empleoJuego.accion(js)` (~10300), `cantinaJuego.accion(js)`, `negocioJuego.aviso(o)`/`almacenJuego.aviso(o)` (vía `avisoObraQueTrabaja`) y `empleoJuego?.tapaVecino(js)`; y el manejador de la E llama a `empleoJuego.accion(js)` (3208) en **cada** E. Una excepción ahí corta el resto del cuadro (cae al `dibujar(luzUltimaFoto…)` de `bucle`) o deja muerta la E en todo el mundo. Hoy no encontré una entrada que las haga tirar (sanean bien), así que es robustez, no un bug vivo.
- Sugerencia: envolver esas llamadas como las de `actualizar`; contar `veces` y avisar una vez al jugador si un sistema de dinero cae.

### D7 · Modo foto (F2): los empleados cobran y venden con la hora del deslizador — [V-Node]
- main.js:10119-10121 y 10141: `negocioJuego`, `empleadosNegocioJuego` y `negociosVecinosJuego` corren aunque `foto.activo`; `empleoJuego`, `cocinaJuego`, `tallerTren` y `fiestasJuego` sí están protegidos con `!foto.activo` (comentario del 3.8.3/4.0.3 justo arriba).
- `foto3.mjs`: llevar la hora a las 21 con el deslizador paga **el sueldo de hoy ya** (`pagadoDia` 4→5, $2.000 de la caja) y, si estás lejos, simula las ventas del día; al salir del modo foto la hora vuelve a las 8 y `sim.ultima` se reajusta (`avanzarEmpleados`, `if (E.sim.ultima > abs) E.sim.ultima = abs`). No es plata gratis (el stock se consume de verdad) pero adelanta pagos y ventas; es la misma clase de cosa que el 3.8.3 arregló para cocina/taller.
- Corrección: `&& !foto.activo` en esas tres líneas.

### D8 · `usarModoGuardado` no reinicia `ultimaSecuencia`: la secuencia de una partida se filtra a otra — [V-Node]
- `src/guardado.js:98-111` reinicia `ultimoSello` pero no `ultimaSecuencia` (línea 200). `escribirPartida` (importar / traer de la carpeta sincronizada a otra ranura) llama `usarModoGuardado` y `guardarProgreso` calcula `max(ultimaSecuencia, …) + 1`.
- `secuencia.mjs`: partida 1 jugada con 500 guardados; importo una partida con `secuencia: 7` en la ranura 2 → queda con **501** (debería ser 8). Sólo afecta el desempate de `compararCopia` (`sincronia.js`: `sr > sl`), o sea poco, pero el campo está para eso. Corrección: `ultimaSecuencia = 0` en `usarModoGuardado` (como `ultimoSello`).

### D9 · Lo que el gate NO mira (y por qué el verde no dice mucho del juego corriendo) — [Verificado leyendo `package.json` y las herramientas]
- Los 256 pasos de `verify:pasos` son **todos Node**: ninguno lanza Electron (`/electron|humo/` no aparece en ningún paso). Las 100+ partidas reales `humo-*.cjs` (incluidas `humo-4-2-*`, `humo-4-3-*`, `humo-4-4-*`, `humo-4-4-1-gastos`) corren a mano y no están en el gate. Es decir: que `main.js` arme los sistemas, que cada E haga lo que dice el aviso, que cargue una partida a mitad de turno… el gate lo "verifica" mirando texto.
- **186 de los 255** `pruebas/verificar-*.mjs` leen `src/main.js` como texto. Un `includes('…')` da verde aunque el trozo esté en un comentario o en código muerto, y se rompe con cualquier retoque de espacios. Ejemplo de blindaje flojo: `verificar-3-7-5-rincones.mjs:407` mira 14.000 caracteres desde `case 'KeyE': {`; el caso mide hoy 13.563 (margen de 437 caracteres hasta el próximo `case`) y la sonda más lejana está en 9.011: la prueba aguanta unos 5.000 caracteres más de E, no más.
- Dependencias del reloj en pruebas de Node: `verificar-4-4-empleados.mjs:350` (`Date.now() - t0 < 500`), `verificar-3-5-4-caos.mjs:81` (`< 1000`), `verificar-2-2.mjs:102` (`< 5000`), `verificar-3-6-2-visual.mjs:57-58` (`< 0,1 ms` y `< 3 ms`; medí 0,0132 y 0,43: margen 7×). Si corren en paralelo con carga pueden dar rojo sin que nada esté roto. Versiones fijas en pruebas: ya no encontré (los `version ===` viejos desaparecieron).
- `herramientas/caos-guardados.cjs` (líneas ~33-45): la lista `AGREGADOS` con la que fabrica "partidas viejas" termina en la 3.6. No genera en el juego real partidas "de la 3.8.9 / 4.0.4 / 4.2" (sin `economia`, `negocios`, `empleo`, `negocioPropio`, `empleadosNegocio`, `negociosVecinos`, `picoEntregado`…); eso sólo se prueba en Node con `sanearProgreso` (que sí lo hace bien, ver abajo). Además su partida base es una Relax recién empezada: los módulos nuevos están vacíos, así que el "romper por dentro" no toca turnos, estantes, empleados ni compras.
- `herramientas/soak-memoria.cjs` / `soak-largo.cjs`: la actividad `paneles` abre mochila, personalizar, cuaderno, mapa, pausa, taller del Desafío y el almacén de Ercilia (línea ~167); **nada** de lo nuevo (panel del local, empleados, compra de negocios, billetera, depósitos, empleo, cantina, casa de té). El gate de memoria de sesiones largas no cubre 4.2-4.4. (Lo que sí probé a mano: abrir/cerrar el panel del local 300 veces no hace crecer el DOM: 1.084 nodos antes y después; `runtime2.cjs`.)

### D10 · Cosméticos menores del local — [Razonado]
- `src/negocio-propio-juego.js:183`: `const queArmar = est.abierto && …` debería usar `abiertoDeVerdad(est)`; con el local cerrado por deuda igual arma las figuras de clientes (que no llegan).
- `src/gramola.js:130-136`: `programar()` se llama antes de crear `G.timer`; si se detiene sola en esa primera llamada, queda un `setInterval` que en el primer tick se apaga solo (no se acumula, sólo es un timer de más por un instante).

---

## Lo que probé y NO falló (para que no se repita)
- **Saneo del guardado, fuzz [V-Node]**: ~4.000 + 8.000 + 6.000 mutaciones (`fuzz2.mjs`, `fuzz3.mjs`: partida Relax y Desafío, tipos cruzados, NaN, ±Infinity, ±1e308, `__proto__`, cadenas de 20.000 caracteres, claves borradas, nodos y hojas de `economia`, `empleo`, `negocioPropio`(+`fin`), `empleadosNegocio`, `negociosVecinos`, `cantina`, `casaTe`, `obras[].almacen`, `negocios`): **0 excepciones, 0 `null` al cargar, 0 no-idempotentes, 0 números no finitos o negativos donde no corresponde, sin contaminación de prototipos, tamaño estable.** Partida llena de las secciones nuevas: 29 KB.
- **Crecimiento [V-Node]** (`crece.mjs`, 400 días con negocio, empleado, compras y billetera): el guardado pasa de 18,9 KB (día 10) a 24,1 KB (día 100) y 24,5 KB (día 400): topes (`LIBRO_MAX 120`, `historial 24`, `fin.dias 8`) funcionan.
- **Costo de guardar [V-Node/Electron]**: Node 4,4 ms (0 obras) → 27,7 ms (5.000 obras, 433 KB); Electron 1,7 ms → 3,4 ms (1.500 obras, 108 KB).
- **Desafío [V-Electron]** (`runtime1.cjs`): partida nueva en el Desafío, 40 cuadros + teclas W, E, Mayús+E, I, Tab, H, G, O, J, M, K, Esc: `fallas = []`, consola limpia; arranca con `hacha:1, pico:1, picoEntregado:true` y **ninguna** clave de economía/negocios/empleo/aldea/granja/huevos/rincones/fiestas en `progreso`. En el guardado, `sanearProgreso` deja todas esas claves `undefined` en modo Desafío (verificado en las dos direcciones). Los planos con funciones de depósito/local/oficios propios son `soloRelax` (`planos.mjs`; sólo `pared-piedra` y `techo-teja` llevan pesos sin ser `soloRelax`, y sin economía cuestan 0 como dice el diseño). `nuevaVuelta` conserva el pico (viene de `progresoNuevo`). Los enganches de main.js a lo nuevo (`negocioJuego`, `empleadosNegocioJuego`, `almacenJuego`, `negociosVecinosJuego`, `empleoJuego`, cantina, peña…) están todos detrás de `!desafio`/`esDesafio` o de que el creador no se arme.
- **Partida vieja (pico)**: `picoEntregado` ausente + hacha sin pico → un pico, una vez, con `picoAviso`; con el flag en `true` no vuelve a darlo (código; los tests de Node lo cubren).
- **Orden de la E vs. aviso** para empleo, rincones, huevos, mostrador, caballo, feria, cargas, cantero/gallinero/telar, obras que trabajan, aldea, mecánicas, granja, taller, fiestas, cantina/casa de té, peña, oveja, acopio: mismo orden en `case 'KeyE'` y en el bloque de avisos (sólo desalineado lo de D4).
- **Sincronía / recuperación / fotos / importar**: sin hallazgos. `sincronia-main.cjs` valida nombres con regex fija y escribe por temporal + rename; `recuperacion-main.cjs` y `ventana-main.cjs` guardan en suspensión/cierre de sesión; `importarTexto` pone `reiniciandoPartida` antes de `location.reload()` y `guardar()` lo respeta; `leerPaquete` nunca tira (firma, tope de 64 MB). Un álbum realista (~60 miniaturas de 320×180) empaqueta en ~70 ms (`paquete.mjs`); sólo un álbum de cientos de fotos pasaría de 1 s, pero `progreso.desafios` está acotado por el catálogo.
- **Memoria/listeners**: `negocios-vecinos-mundo` libera mapa y material al quitar un cartel; los paneles rehacen su DOM con `innerHTML = ''` (sin listeners globales acumulados); `gramola` y `dialogo` limpian sus intervalos; el único `setInterval` global de main.js es el de 5 s del refresco. `cola-presupuesto.js` está sin conectar (documentado en `CAMBIOS_4_3_1_TIRON.md`), así que no hay riesgo hoy.
- **Ids del DOM**: sin duplicados en `plantilla.html`; todos los `$('…')`/`getElementById` de `src/` existen.

## Preguntas de diseño
1. **Mayús+E**: ¿se mantiene como atajo de ampliar depósitos y abrir el panel del local? Mayús es "correr". ¿Preferís otra tecla, que sólo valga quieto, o que la ampliación se confirme con el cuadro de preguntas?
2. **Acopio de 40 en el Desafío** (D2): ¿era la intención? Si sí, el mensaje tiene que dejar de hablar de depósitos ahí. Si no, tope sólo para el Relax.
3. **Errores de sistemas** (D6): ¿querés que el juego le diga al jugador cuando un sistema de dinero (empleo, negocio, empleados, compra) deja de andar, o seguir en silencio con registro en el log como hasta ahora?
4. **Empleados con el deslizador del modo foto** (D7): ¿que no corran en modo foto, como cocina/taller/fiestas/empleo?
5. **Guardado de empleados** (D3): ¿alcanza con el autoguardado de 20 s mientras estás lejos, o querés conservar el "cada 5 ventas"?

## Qué NO alcancé a revisar
- No corrí `npm run verify` (ni ninguna `humo-*`); tampoco el soak largo ni `medir-caminata` (no tiene sentido en la notebook, y está pensado para la 4600G).
- `reloj` (hora de tu reloj) combinado con dormir y empleados: lo leí (el día sube al dormir antes de medianoche y la hora real vuelve atrás), pero no lo simulé; sospecho que se simulan dos veces las horas de venta de un día (consume stock real, así que no es plata gratis), sin verificar.
- Un día completo jugado a mano con todo lo nuevo, la peña/truco, la cocina y el romance en el Relax con partida cargada (`caos-guardados.cjs` completo con partidas pobladas del 4.4).
- `planificador antitirones`: cinco consumidores "secundarios" (aldea-gente, amor-mundo, fiestas-mundo, negocio-propio, empleados-negocio) se reparten 3 cupos por cuadro; no medí si alguno puede quedar sin cupo mucho rato bajo carga.
- `obraQueTrabajaCerca()` recorre todas las obras en cada aviso (cada ~0,1 s al caminar): con 2.000+ piezas no medí el costo real (por el tipo de cuenta no me parece grave).
- Efectos sobre Steam/logros (`logros-relax.js` son globales y se revisan cada 3 s) y `fotos-main.cjs` bajo concurrencia real.

## Resumen
Encontré 10 hallazgos: **0 ALTAS, 3 MEDIAS, 7 BAJAS**, y confirmé por ejecución 6 de ellos (D1, D2, D3, D4, D7 y D8; D9 lo verifiqué leyendo `package.json` y las herramientas). Las tres más graves:
1. **D1 · Mayús (correr) + E** se come la E junto a depósitos y al local, y la segunda E **paga** la ampliación (verificado: −$3.500 y −12 tablas sin guardar nada).
2. **D2 · El acopio de 40 vale en el Desafío**, donde es el único lugar a salvo de la derrota y no existen los depósitos; además el aviso manda a construir uno.
3. **D3 · `guardar()` ~1 por segundo** con empleados contratados y el jugador lejos (`empleados-negocio-juego.js:225`, módulo de `% 5` sobre un contador que no avanza): el "✓ Guardado" queda fijo y suma un micro-tirón de 2-4 ms por segundo.

El guardado y los saneadores de la 3.9 a la 4.4 aguantaron todo lo que les tiré; el hueco está en lo que el gate (todo Node, casi todo texto de `main.js`) no puede ver.
