# Hojarasca 4.6.1 — mantenimiento: una sola lista para la E y el aviso, y pruebas más firmes

Rama `v461-mantenimiento` (sale de `main` = 4.6.0). No cambia nada que se vea en el juego salvo los arreglos chicos
de abajo (diferencias que ya existían entre la E y el aviso): misma conducta, menos fragilidad.

## 1. La tecla E y el aviso salen de una sola tabla

Hasta la 4.6.0 la prioridad de cada interacción estaba escrita dos veces en `main.js`: la cadena de `if` de la tecla E
(unas 140 líneas) y la del aviso («E · Anotar helecho», unas 150 líneas), con un comentario que pedía tenerlas en el
mismo orden. Ahora:

- **`src/interacciones.js`** (reglas puras, sin three ni DOM): `INTERACCIONES`, **63 entradas en orden** (lo que hace
  la E y lo que dice el aviso), y `OTRAS_TECLAS`, **12 entradas** (F, H, Y, B, T, G y los «·» que sólo informan).
  Cada entrada tiene `cuando` (si aplica), `aviso` (el texto) y `hacer` (la E); `corta` (el aviso queda vacío del
  todo: charla, paneles, cable) y `sigue` (sin texto, el aviso sigue buscando, como antes con la obra que trabaja, el
  lote de la aldea y el capullo del Desafío). `hacerConE(c)` y `avisoDe(c)` recorren la misma lista.
- **`main.js`**: `ctxInteraccion`, el contexto que la tabla consulta (getters y funciones del juego, armado una vez), con
  `accionInteraccion` / `cercaInteraccion` (la E mira fresco; el aviso, lo buscado a 10 Hz en los `cache…`, como
  antes), `limpiarInteraccion`, `textoVecinoAviso`, `avisoTrenInteraccion` / `usarTrenInteraccion` y `usarObjetivo`.
  La tecla E queda en 4 líneas (`hacerConE(ctxInteraccion)`) y el aviso en una (`avisoDe(ctxInteraccion)`) más las
  marcas del HUD de los paneles. `main.js`: 11.173 → 11.096 líneas.
- Una interacción nueva es **una entrada** en la tabla, en su lugar.

### Inventario (el orden de la tabla)
Primero lo que corta: 1 cable · 2 charla · 3–12 paneles abiertos (almacén, feria, cargas, banco, local, carta de la
cantina, carta del té, recetas, taller del tren, fiestas; la E los cierra) · 13 tablón abierto.
Después: 14 urgente (bajar del sulky, patear) · 15 vecino (hablar / ordenar en la base) · 16 empleo · 17 cita (sentarte a
la mesa) · 18 rincones · 19 huevos · 20 jaula del tren · 21 puente colgante · 22 bajarte del caballo · 23 mostrador ·
24 subir al caballo · 25 feria · 26 puesto de cargas · 27 puestos de ruta · 28 cantero · 29 gallinero · 30 telar ·
31 obra que trabaja · 32 lote de la aldea · 33 tablón · 34 lo de cada lugar de la aldea · 35 granja · 36 taller del tren ·
37 fiestas · 38 cantina / casa de té sentado · 39 peña · 40 oveja · 41 recursos de zona · 42 acopio · 43 capullo o zanja
(Desafío) · 44 puerta · 45 dejar el rastro · 46 pedir rastro · 47 duende tallado · 48 arriba del tren · 49 cabina ·
50 trochita · 51 casa de té de la estación · 52 bajar del velero · 53 bajar del kayak · 54 subir al kayak · 55 velero o
tirolesa · 56 bitácora · 57 dormir en la carpa · 58 dormir en tu obra · 59 fuego (dormir o cocinar) · 60 tendal ·
61 huellas · 62 semilla · 63 lo que mirás (juntar, anotar, sentarte…).
Otras teclas: · Ceinwen · · marca del perro · G cocinar · F antorcha · F tu fogón/hogar/estufa · H hacha · Y aserrar ·
B plantar · T levantar la carpa · T armar la carpa · F fogón del refugio · F fogón del puesto.

### Diferencias E / aviso que ya existían (y qué se hizo)
Se encontraron comparando las dos cadenas viejas (copiadas de la 4.6.0) contra la tabla en 300.000 estados al azar
(herramienta de la sesión, fuera del repositorio). **La E quedó idéntica** salvo el punto 1; el aviso ahora dice siempre
lo que hace la E:

1. **Arriba del tren (o en el kayak) junto al puesto de la feria**, la E abría la feria y el aviso hablaba del tren.
   Arreglado: la feria pide estar a pie, como el mostrador y el puesto de cargas (es el único cambio de la E).
2. **Con el tablón de encargos abierto**, el aviso se borraba antes de tiempo y lo de más abajo lo volvía a escribir
   («Bajarte del zaino», «H Talar», «Dormir junto al fuego»…). Ahora el tablón abierto corta todo, como los demás paneles.
3. **El «·» de Ceinwen** (casa de té de la aldea) tapaba subir al kayak, el velero, la tirolesa, la bitácora y dormir,
   que la E sí hacía. Ahora va con las otras teclas, después de todo lo de E.
4. **En el kayak o el velero sin orilla para bajar**, el aviso seguía de largo y ofrecía cosas de tierra (la bitácora,
   dormir en la carpa, el fuego) mientras la E decía «No hay orilla cerca». Ahora no ofrece nada de E (quedan las otras
   teclas y la marca del perro, como antes).
5. **Junto a un fuego, mirando un asiento**: el aviso decía «Dormir junto al fuego» aunque la E hiciera antes el empleo,
   la cita o lo urgente; y **la casa de té de la estación** tapaba en el aviso lo mismo. Ahora, el orden de la E.
6. **Arriba del tren junto a un fuego**, el aviso decía «Dormir/Cocinar» y la E bajaba del tren: ahora, lo del tren.
7. **La G de cocinar** se ofrecía en el tren y en el kayak, donde la G no hace nada: ahora no.
8. **Arriba del tren con un rastro activo mirando al perro**, la E deja el rastro (como antes) y ahora el aviso lo dice
   (antes decía lo del tren). Se dejó así: es lo que hacía la E.
9. El diario anota «el perro marcó algo» cuando el aviso del «·» se muestra (antes, también cuando el fuego o el tendal
   lo tapaban en el mismo cuadro). Misma anotación, a lo sumo un rato después.
10. Se mantuvieron a propósito: arriba del caballo y en el tren el aviso del vecino dice «Hablar con…» (no «te quiere
    decir algo»), y sin texto de la obra que trabaja o del lote, el aviso sigue con lo de abajo y la E usa la obra.

## 2. Pruebas más firmes

### Medición
- Pruebas `verificar-*.mjs` con comprobaciones de **texto exacto** sobre el código: **241 de 266** en la 4.6.0
  (5.676 comprobaciones); **165** leen `main.js` como texto (1.279 comprobaciones), y de ésas **861 buscan una condición**
  (`if`, `&&`, `?:`, comparaciones): conducta escrita como texto. En la 4.6.1: 242 de 267 (5.592), `main.js` 166
  (1.213), condiciones 817.
- Historial: **410 comprobaciones** tuvieron que cambiarse por versiones ajenas a la de la prueba. Las que más se
  rompieron: `3-6-2-juego` (14 commits ajenos; «qué paneles cuentan» 8 veces, «el reloj sentado» 6), `3-6-aldea` (13),
  `3-6-gente` (11), `3-8-4-relax` y `3-6-mundo` (9), `3-8-8-banco`, `3-7-3-taller`, `3-8-6-relax`, `3-7-5-fiestas` (7)…
  Las causas: líneas largas de `main.js` que cada sistema nuevo alarga (`panelDelHudAbierto`, `const escala = …`, el
  `try` de cada sistema en el bucle, `destinoConFiesta`), cuentas de vecinos que crecen, listas literales (poses,
  acciones) y las dos cadenas de la E y el aviso.

### Qué se hizo
- **Parte 1 (la tabla): 42 pruebas** que leían las dos cadenas ahora preguntan a la tabla con
  `pruebas/ayuda-interacciones.mjs`: `antes('a', 'b')` (el orden), `que({...})` (con un contexto falso: qué hace la E y
  qué dice el aviso), `revisarModulo` (una interacción de módulo: hace, se vuelve a buscar, el texto, ni en el tren ni en
  el kayak ni mirando algo) y `funcionDeMain` (correr una función de `main.js` con un mundo de mentira). Más la prueba
  nueva **`verificar-4-6-1-interacciones.mjs`** (20.167 comprobaciones): la E y el aviso salen de la tabla y no quedó
  ninguna cadena vieja; todo lo que la tabla le pide al juego existe en `ctxInteraccion`; escenarios (juncal con hoz
  contra helecho, pehuén en otoño, tablón contra vecino, mostrador, puestos de ruta, sentarse, tren, kayak, caballo,
  charla); y 20.000 estados al azar donde el aviso con E es siempre lo que hace la E.
- **Parte 2: 23 pruebas** reforzadas en sus comprobaciones más frágiles con `pruebas/ayuda-codigo.mjs`:
  `expresion` / `funcion` (evaluar la línea o la función de verdad con un mundo de mentira: lo que no se da vale
  `undefined`, así un sistema nuevo en la línea no rompe nada), `enUnaLinea` (las partes que importan, en cualquier
  orden) y `literal` (leer una lista como lista). Pruebas: 3-6-2-juego, 3-8-7-progreso y 3-7-5-fiestas (paneles del HUD,
  la lista del HUD, el tiempo de la gran nevada, las poses), 3-8-6-aldea (reloj sentado, silla ocupada, poses,
  Escape en la despedida, la fiesta sin apuro), 3-6-gente y 3-7-0-aldea (sin contar vecinos: todos), 3-8-4-relax (la
  cita ocupada, corriendo el juego del amor), 3-8-8-banco, 3-6-1-vecinos (R y la silla ocupada), 3-7-2-cocina y
  3-7-1-amor-mundo (`destinoConFiesta`), 4-4-empleados, 4-3-negocio y 3-5-1-caidas (el `try` del bucle), 3-6-mecanicas,
  3-7-0-personajes, 3-6-vida, 3-8-6-relax (las acciones a caballo, el temporal), 3-8-7-mundo, 3-8-6-vehiculos (las
  teclas en el sulky, con teclas y estados), 3-8-3-base, 3-8-4-desafio y 3-6-aldea (el sábado de los que llegaron desde
  la 3.9, por su lista).
- No se borró ninguna comprobación sin reemplazo.

### Cómo se comprobó que siguen atrapando
Con una herramienta de la sesión que rompe a propósito el código, corre las pruebas y lo deja como estaba:
- **Parte 1: 40 roturas** (mover una entrada de la tabla antes de otra, sacarle una condición, quitar `corta` o `sigue`,
  romper `textoVecinoAviso`, `usarTrenInteraccion`, `avisoTrenInteraccion`, el contexto, volver a una cadena propia):
  **las 40 atrapadas** por la prueba que vigila eso (en 4 casos, una de las pruebas extra que se esperaba no mira ese
  orden, pero la principal sí falla).
- **Parte 2: 33 roturas, todas atrapadas** (una por comprobación reforzada: sacar la fiesta de los paneles, que la
  charla no frene el reloj, el temporal sin lluvia, el gerente con corrimiento, el local en el Desafío, la cocina sin
  `fallaSistema`, la O del sulky, B del mando, sacar a Dalia de su lista, el jefe sin cumpleaños…), y **7 cambios
  inofensivos del tipo que antes las rompía** (un panel nuevo en la cuenta, otro sistema que frena el reloj, otra
  condición en la línea del bucle, una pose sentada nueva…): **las 7 toleradas**.

## Números
- **Gate**: `npm run verify` de corrido **268 pasos OK** (5 min 57 s; antes 267, más la prueba nueva);
  `npm run verify:paralelo` 268 OK.
- **Partidas** (notebook Ryzen 7 7730U, ocultas, en el monitor externo con el vigilante corriendo, de a una):
  humo-4-6-recursos OK, humo-4-6-gente OK, humo-4-6-puestos OK, humo-3-8-6-relax OK («TODO BIEN»), humo-3-7-4-rueda
  OK, humo-3-0-asedio OK. **humo-desafio falla** («HUD con cuenta regresiva» y «combate: UnknownVizError»): se repitió
  sola y falla igual, y **en `main` (4.6.0) armada en una carpeta temporal falla igual** → no es de esta versión (es la
  captura de la ventana oculta en esta PC: `capturePage` da UnknownVizError).
- **Costo por cuadro del aviso** (misma PC, la cadena vieja contra la tabla con el mismo mundo de mentira, mediana de
  3 vueltas de 200.000 llamadas; herramienta de la sesión): nada cerca 29 → 2.814 ns; mirando una planta 76 → 2.161;
  cantero y puerta 228 → 992; a caballo 333 → 638; en el tren 283 → 1.602; junto al fuego 321 → 2.643; con un vecino
  246 → 471; sólo otras teclas 446 → 2.970. Es decir, **hasta ~3 µs por cuadro** (0,003 ms de 16,7: el 0,02 %). No se
  arman objetos ni textos nuevos por cuadro: la tabla, sus funciones y el contexto se arman una vez; el aviso sigue
  creando un solo `{ tecla, texto }` como antes, y las funciones del juego que se consultan son las mismas que antes
  (con lo buscado a 10 Hz). La diferencia es el recorrido por funciones en vez de `if` en línea. Dibujos: sin cambios
  (no se tocó nada visual; no se corrió `diag:dibujo`).

## No verificado
- La medición en la Ryzen 5 4600G (falta; en la notebook sólo vale el antes/después de arriba).
- Las diferencias 1–8 se encontraron con estados de mentira; no se reprodujeron en una partida real (son rincones raros:
  el tren junto al puesto de la feria, el tablón abierto a caballo, el kayak sin orilla al lado de un fuego…).
- humo-trucos y humo-4-2-pico no se corrieron (fallas viejas conocidas).
