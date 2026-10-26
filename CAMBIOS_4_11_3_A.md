# 4.11.3 (A): guardado, proceso, empaquetado y ruta del Coihue

Rama `v4113-a` (sale de `main` = 4.11.1). No sube la versión. Cuatro cosas de las decisiones del usuario (`DECISIONES_DISENO_4_10.md`: 13, 14, 28 y 29).

## Lo hecho

### 1. Versión de la partida: sólo lectura (E3, decisión 13)
Una versión vieja del juego que abre una partida guardada con una versión **más nueva** ya no la pisa.
- `src/main.js`: `versionDeLaPartida` (la versión con que venía, que no se borra al mostrar el aviso) y `partidaSoloLectura()` (= `versionMasNueva(versionDeLaPartida, versionDelJuego())`).
- `guardar()` corta al principio si es de sólo lectura: ni el autoguardado, ni el guardado manual (botón, `Esc`), ni el de cerrar o ocultar la ventana (`beforeunload`, `visibilitychange`) llegan a `guardarProgreso`. Por eso tampoco se toca la copia de respaldo (`-backup`) ni las miniaturas. Avisa a la pantalla con `hojarasca:guardado` `{ ok: false, soloLectura: true }`.
- `copiarASync()` no arma ni manda nada a la carpeta sincronizada en sólo lectura.
- El aviso es **persistente**: un párrafo en la portada (`#aviso-solo-lectura`), una marca fija en pantalla (`#marca-solo-lectura`: «Sólo lectura: no se guarda») y la nota de entrada de siempre (con el texto cambiado). El estado de guardado de la pausa dice «Sólo lectura: la partida es de una versión más nueva y no se guarda.» en vez de «No se pudo guardar. Revisá el espacio».
- Partidas sin versión, o con la misma o una menor, siguen como hoy (se guardan y pasan a la versión de ahora). El formato de guardado y la sincronía no cambian.

### 2. Guardado seguro (M8, decisión 28)
- `sincronia-main.cjs`, `escribirSync`: si falla el `rename`, **no** se escribe directo sobre la copia buena: se tira el temporal, se registra el error y se devuelve `false`. Queda la copia anterior.
- `src/main.js`, `copiarASync`: un `false` ya no da la copia por hecha (`copiadoEnSync = 0`), así que el **próximo guardado reintenta** (sin la espera de 10 minutos). El aviso discreto («No se pudo copiar la partida a la carpeta sincronizada») sale recién al **tercer fallo seguido**; un éxito vuelve a contar de cero. Si la partida pasa del tope de la carpeta (>= 60 MB de texto) todo sigue como antes: aviso enseguida y 10 minutos de espera (reintentar no sirve).

### 3. Ruta del Coihue repartida en cuadros (H2-3, decisión 14)
(El «A* de los duendes» es el cálculo de la ruta del Coihue Viejo, `rutaDelCoihue`, que se rehace al caer cada noche del asedio.)
- `src/desafio-camino.js`: la búsqueda pasó a un generador interno (`buscarRuta`) que cede el paso cuando gastó su presupuesto (una unidad = una celda mirada con `libre` o un nodo abierto). `rutaDelCoihue` la corre entera de una vez (misma firma y mismo resultado de siempre) y el nuevo `crearBusquedaRuta(...).avanzar(unidades)` la reparte. **Es el mismo código**: la ruta sale idéntica.
- `src/desafio-asedio-mundo.js`: `alEmpezarNoche` ya no calcula nada; deja un cálculo pendiente (`empezarReplan`) y `actualizar` avanza `PRESUPUESTO_RUTA = 350` unidades por cuadro (`avanzarReplan`) con los mismos tres intentos de holgura, en el mismo orden, y la recta si ninguno encuentra. Cuando termina, se aplica (`c.ruta`, `c.largo`, `c.d = 0`).
  - Mientras la ruta está pendiente el Coihue **espera quieto** (no camina por la ruta vieja). La noche arranca a la media hora de juego y la ruta tarda unos cuadros, así que no se pierde nada de la caminata.
  - Si la noche termina con la ruta pendiente (dormir), `albaCamino` la termina de una vez.
  - Si se acaba el asedio o cambia el camino, el cálculo pendiente se descarta.
  - Para las pruebas: `asedio.rutaPendiente` y `asedio.terminarRuta()`.
- **Sin tocar**: la ruta de cuando se planta el Coihue (`crearCamino`, una sola vez por partida) sigue calculándose de una vez; la parte (b) del informe (compartir las distancias por celda entre los tres intentos) no se hizo: el usuario pidió repartir, y repartir ya baja el tirón al tamaño del presupuesto.

### 4. Empaquetado (M11, decisión 29)
- `herramientas/empaquetar-ayuda.ps1` (nuevo, con BOM): `Invoke-CierreHojarasca`. Con un `Hojarasca.exe` abierto: `-Forzar` lo cierra sin preguntar; con consola interactiva **pregunta** (s/N) y, si no, cancela; **sin consola interactiva** (entrada redirigida o `-NonInteractive`) **no mata nada** y falla con un aviso claro. `-EnSeco` decide y no cierra nada.
- `herramientas/empaquetar.ps1`: usa lo anterior (ya no hay un `Stop-Process -Force` suelto); parámetros nuevos `-Forzar`, `-EnSeco` (decide, avisa y sale sin armar nada) y `-NombreProceso` (para probar con un proceso de mentira).
- `herramientas/empaquetar.sh`: lo mismo (`--forzar`, `--en-seco`, variable `NOMBRE_PROCESO`; pregunta con `read` si hay terminal) y **verifica el `index.html` del asar** (sha256 contra el que se probó) igual que el `.ps1`, antes de armar el paquete.
- `.claude/skills/hojarasca-cerrar-version/SKILL.md`: una línea con lo nuevo (un agente sin consola no cierra el `Hojarasca.exe`: avisar al usuario, o `-Forzar` sólo si lo pidió).

## Decisiones propias (el usuario no estaba)
- Sólo lectura **no** bloquea las acciones explícitas y confirmadas del jugador (Empezar de nuevo, Otra vuelta, Otra corrida, importar o borrar una partida): son una orden suya sobre esa ranura. Si se quiere bloquearlas también, es un cambio aparte.
- Las **opciones** del juego (volumen, calidad, ranura...) se siguen guardando en sólo lectura: son otra clave y no pisan la partida.
- El aviso de sólo lectura no tiene botón para «guardar igual»: no hay forma de saltearlo (era lo pedido).
- Presupuesto de 350 unidades por cuadro: con la base despejada la ruta entra en 1 a 3 cuadros; con la base cercada, en unos 11. Se puede subir o bajar con la constante.
- Textos nuevos sólo en castellano (el inglés se traduce al final, como siempre): «Esta partida es de una versión más nueva...», «Sólo lectura: no se guarda», «Sólo lectura: la partida es de una versión más nueva y no se guarda.», y el cambio de la nota de entrada.
- El aviso de fallo de la copia sincronizada conserva su texto («Puede ser que pese demasiado...»), aunque ahora también sale por un `rename` que falló tres veces.

## Pruebas
- Nueva: `pruebas/verificar-4-11-3-proceso.mjs`, en el gate (`node herramientas/sumar-prueba.cjs . verificar-4-11-3-proceso.mjs`). Falla contra el código de antes (no existe `partidaSoloLectura`) y pasa ahora: 617 comprobaciones y **26 mutaciones** a propósito (cada regla rota hace fallar la prueba): sólo lectura (guardar, copia sincronizada, aviso, regla al revés, plantilla), M8 (escritura directa, temporal suelto, copia dada por hecha, aviso al primer fallo, espera de 10 minutos, cuenta que no reinicia), ruta (opciones ignoradas, nunca cede, presupuesto no respetado, vuelve a calcular de una vez, camina con la ruta vieja, el alba no termina, holguras en otro orden) y empaquetado (mata sin consola, ignora la respuesta, `-Forzar` no cierra, `-EnSeco` cierra, el `.ps1` y el `.sh` vuelven a matar sin preguntar, el `.sh` sin verificar el asar). La ruta repartida se compara con la de una vez en 5 escenarios x 3 holguras x 4 presupuestos (1, 7, 250, 1000), incluso cuando no hay camino. El empaquetado se prueba con un proceso de mentira (una copia de `node.exe` con un nombre propio): nunca toca un `Hojarasca.exe` de verdad ni arma nada.
- Ajustadas lo mínimo (decían cosas que cambiaron a propósito): `verificar-3-8-3-base.mjs` (la ventana de texto que mira `guardar` pasó de 4000 a 5000 caracteres: el corte de sólo lectura sumó líneas) y `verificar-4-10-2-regresiones.mjs` (el entorno de `avisarVersionMasNueva` ahora lleva `partidaSoloLectura`, `versionDeLaPartida`, `$` y `T_`).
- Partida real nueva: `pruebas/humo-4-11-3-proceso.cjs` (33 comprobaciones): guardado normal; partida con `versionJuego: "4.99.0"` (la portada avisa, marca fija, nota de entrada, se puede jugar, guardado manual, de cierre y de ocultar no la pisan —ni la copia de respaldo—, vuelve a abrir igual); partidas de versión vieja (0.1.0) y sin versión se guardan y pasan a la de ahora; asedio del Desafío con la ruta repartida: igual a la de una vez, el Coihue espera quieto, el alba la termina y una noche entera camina lo que corresponde.

## Medición de la ruta (antes / después)
Notebook (Ryzen 7 7730U), Electron oculto, calidad muy baja, `performance.now` (resolución de 0,1 ms), 7 repeticiones por vuelta, vueltas alternadas antes (4.11.1) / después. **Mismas rutas** en las dos versiones (76,5 m y 3 puntos con la base despejada; 76,0 m con la base cercada).

| | antes (de una vez) | después (350 por cuadro) |
|---|---|---|
| base despejada, comienzo de la noche | 1,6 a 2,1 ms en un cuadro | 0,0 ms; la ruta sale en 1 cuadro de 0,6 ms |
| base cercada (162 empalizadas, la recta al final), comienzo de la noche | 13,0 a 13,9 ms en un cuadro | 0,0 ms; repartida en 11 cuadros de 0,6 a 0,8 ms (total 4,8 a 6,0 ms) |

Con una primera versión de 1000 unidades por cuadro: 1,3 a 1,6 ms y 2,2 a 4,0 ms por cuadro (4 cuadros con la base cercada); se bajó a 350 para que ningún cuadro pase de ~1 ms. Los ms de la notebook no son los de la 4600G.

## Verificación
- `npm run verify` de corrido (después del último cambio de código): **301 pasos OK**, con `verificar-4-11-3-proceso` dentro. Durante el trabajo, `npm run verify:paralelo` también en verde.
- Partidas reales (Electron oculto, perfil propio, de a una): `humo-4-11-3-proceso` (33/33), `humo-guardado-roto` (todo en verde), `humo-partidas` (todo en verde), `humo-3-0-asedio` (todo en verde). `humo-4-10-1-guardado` falló **una vez** en su último paso (`Cannot set properties of undefined (setting 'enTren')`, en el código de la trochita al recargar, nada que ver con lo cambiado) y pasó 2 de 2 al repetirla: es de tiempo, pero se dice igual.

## Lo no verificado
- **La 4600G**: los ms de la ruta son de la notebook (sólo sirven para comparar antes/después). Falta medir en la 4600G: `powershell -NoProfile -ExecutionPolicy Bypass -File herramientas\lanzar-electron.ps1 -Script pruebas\humo-4-11-3-proceso.cjs -Espera 600 -Perfil <carpeta>` con `HUMO_PARTES=ruta HUMO_REPETIR=7` (y `HUMO_INDEX=<index.html de la 4.11.1>` para el «antes»).
- **La carpeta sincronizada de verdad** (con un programa de sincronización que tenga el archivo tomado): el `rename` que falla se prueba con un `fs.renameSync` falso; la regla de sólo lectura de la copia, con el código de `copiarASync` en Node. No se probó con Dropbox, OneDrive o Syncthing reales.
- **El empaquetado completo** no se ejecutó (lo corre el usuario); sólo `-EnSeco`, con un proceso de mentira. La pregunta interactiva (`Read-Host` / `read`) se prueba inyectando la respuesta, no con una persona delante.
- **La marca fija** («Sólo lectura: no se guarda») no se miró en una captura: se comprobó que existe, tiene texto y ancho; falta verla (posición arriba al centro, `z-index` 5) con el HUD y las notas.
- Los textos nuevos están sin traducir al inglés.
