# Hojarasca 3.8.9 — Lo que dejó la auditoría de la entrega

El usuario jugó el paquete de la 3.8.8 y dijo que no estaba el banco, ni lo de la casa de té, ni «todo lo demás». Se hizo una auditoría
independiente: cuatro auditores de sólo lectura (el paquete, cada pedido contra el código, las pruebas y la documentación, y los huecos
posibles) y, para cada hallazgo, otro agente que intentó refutarlo (16 verificaciones: 14 confirmadas —una sólo en parte— y 2 refutadas).

**Lo que estaba bien:** el paquete estaba íntegro (las 13 partes unen el mismo zip, el `index.html` salía idéntico al rearmarlo desde
`src/`, el instalador, el portable, el depot de Steam y el código fuente llevaban el mismo juego) y los pedidos estaban hechos,
conectados y probados. El banco y la casa de té no los puede esconder ninguna caché ni partida vieja. Lo que sí había eran huecos de
alcance, de guía y de documentación; esto es lo que se arregló.

## El juego no llevaba al banco
Nada en el juego nombraba el Banco del Pueblo ni decía cómo llegar (sólo lo decía el `LEEME`). Ahora:
- **Pista al llegar a la aldea** (`p-banco`, una vez, sólo en el Relax): dónde está (al este de la plaza), qué hace Amadeo y el horario.
- **Rótulo en el mapa** (`aldeaMundo.lugarBanco()`).
- **Guía (F1), «Vivir en el bosque»:** dos entradas nuevas, «Los pesos» y «El Banco del Pueblo».
- **Cartel con el horario** en la pared, junto a la puerta del banco (`8:30 a 12:30 y 14:30 a 18`).
- **Aviso en la portada** sobre dónde están la aldea y los pesos (en la noche de los duendes no hay: es del Relax).

## El horario del gerente
El `LEEME` decía 8:30 a 12:30 y 14:30 a 18, pero el juego le aplicaba el corrimiento de cada vecino (−20 min) y atendía de 8:10 a 12:10 y de
14:10 a 17:40; con el salón abierto, los sábados se iba a las 15:55. Ahora el gerente va con el reloj del banco (`HORARIO_BANCO` en
`aldea.js`) y el sábado con baile cierra a las 16 (antes de ir a arreglarse). La prueba recorre el día entero, de cinco en cinco minutos.

## Las banderas que faltaban
Se había pedido «todas las banderas»; quedaban fuera las de `bandera-viento.js`. Ahora flamean con el viento y el clima, y se orientan
al viento: **tu bandera** del refugio y las **banderitas de las torres de vigía**, las **dos banderas celeste y blanca de la locomotora**
(paños sueltos que se ven con los banderines del taller; antes eran una ola fija dentro de la malla) y los **banderines de los postes de
largada**. `orientarBandera` ahora toma el giro del padre en el mundo (el mástil del refugio cuelga de un grupo girado) y hay
`quitarBandera` para las que se arman y se desarman. Tu bandera y la locomotora se miraron en el juego real; los postes de largada y las banderitas de las torres (Desafío) sólo se probaron en Node. **Siguen como estaban** (son banderines, no banderas):
el del kayak y el del velero (ya se mueven con la velocidad), los banderines de las fiestas y de la guirnalda del taller, y el estandarte
del fortín del Desafío.

## Que se distinga un paquete nuevo de uno viejo
La versión no cambiaba aunque cambiara el juego, y con un Hojarasca viejo abierto, abrir el instalado nuevo mostraba el viejo (el bloqueo
de instancia única). Ahora:
- La versión es la **3.8.9**.
- **Huella del build** (`armar.mjs`): ocho letras del contenido completo del juego (sin fecha: el mismo código da la misma huella). Se ve en
  la portada («Hojarasca · 3.8.9 · build xxxxxxxx») y en el comentario del `index.html`. El `LEEME` del zip dice cuál es la de ese zip.
- Si ya hay otro Hojarasca abierto, la segunda copia **avisa** (en español e inglés) en vez de cerrarse sola, y dice cómo cerrar el viejo.
- Si un edificio de la aldea no se arma, queda en el registro de caídas (antes sólo en la consola, que el juego empaquetado no tiene).

## Guiones de Playwright fuera de la suite
`humo-economia.cjs` y `humo-revision.cjs` usaban Playwright, no Electron, y la suite de partidas reales los habría marcado como fallas en
cualquier PC. Pasaron a `herramientas/partida-real-economia.cjs` y `herramientas/recorrido-revision.cjs`, con el aviso. El recorrido
sumó tomas de las banderas nuevas y del cartel del banco.

## Pruebas nuevas
- `pruebas/verificar-3-8-9-auditoria.mjs` (en el gate): el listón del taller (ahora con una función pura, `tramosDeListon`, que además
  arregla que el último tramo quedaba corto), el jornal sin horas, el préstamo vencido «sin embargo» (después de 195 días de atraso no se
  perdió nada), la versión y la huella (se vuelve a calcular desde el `index.html`), el aviso de la segunda copia, los guiones de
  Playwright, la pista, el mapa y la guía.
- `verificar-3-8-8-banco.mjs` (horario minuto a minuto y el cartel) y `verificar-3-8-8-banderas.mjs` (las banderas nuevas).

## Lo que la auditoría propuso y no se hizo
- **Inglés** de la economía: faltan las charlas largas de los vecinos sobre plata, el puesto de cargas, parte de la billetera y el libro de
  cuentas (los motivos «Compra: …», «Venta: …», «Mandado cumplido»…) y no hay una prueba que lo cubra. Lo pidió el usuario: **se salteó por
  ahora**.
- Un «Novedades de esta versión» al abrir una partida guardada con un build nuevo.
- Dar fuego y luz al hogar y a la guirnalda de los muebles, y asientos a la mecedora y la hamaca.
- Un puesto propio visible en la feria (hoy sólo existe en la solapa «Mi puesto» del mostrador).
- Firmar los ejecutables y ponerles el ícono y la ficha propios (hoy dicen «Electron» en Propiedades).

## Lo que se refutó
- «El modo Desafío guardado esconde la aldea y el banco»: es el diseño (la economía es sólo del Relax); lo que se agregó es el aviso en la
  portada.
- «Dos instalaciones»: el instalador desinstala la versión anterior esté donde esté (mismo `appId`).
