# 4.7 pantalla: la mochila con casillas, lo que se ve y se maneja

Paquete 1b de la 4.7 (rama `v47-pantalla`). El núcleo (`src/carga.js`, las cuentas y el enganche con el juego) es de la rama `v47-carga`. Acá, la pantalla. Sólo en el Relax: el Desafío queda con la mochila de siempre.

## Qué se ve

- **El panel de la mochila (I)**, en el Relax: las casillas en una grilla de 8 por fila (24 al inicio; con alforjas montado, 12 más bajo el título «Alforjas del caballo»). Cada casilla muestra el ícono, el nombre y la cuenta de la pila («7/10»); las llenas llevan un borde grueso y las vacías se ven con trazo punteado. Un contador «Casillas 17/24» (con «· llena» o «· sobrecarga» escrito) y una línea con lo que suma cada cosa («24 de la mochila + 12 de las alforjas»).
- **Las herramientas** (y lo que no ocupa casillas: cámara, caña, ramitas, hacha, pico) siguen en su sección, a la derecha («Herramientas y otras cosas»), y se ponen en la barra como siempre (clic o Enter). Las casillas con una cosa que tiene ranura también se eligen con clic, Enter o Espacio. La marca «está en la barra» va en la primera pila de cada cosa.
- **Sobrecarga** (partida vieja con 989 troncos): un aviso con ícono «!», la palabra «Sobrecarga», lo que pasa y lo que sobra de cada cosa («Troncos: 809 de más»). Las casillas muestran sólo lo que entra: no se tapa lo demás y no se pierde nada.
- **El HUD**: «Mochila 17/24» junto a la barra (a la derecha), discreto; con la mochila llena se resalta en dorado con «· llena», con sobrecarga en rojo con «!» y «· sobrecarga». Se oculta con la mochila abierta y con los prismáticos; en el modo mínimo sólo aparece cuando se llena.
- **El cartel «Mochila llena»**: `avisoMochilaLlena(texto)` (en `src/carga-pantalla.js`) lo muestra arriba del aviso de la tecla, con ícono, unos 2,6 s (sin movimiento con «reducir movimiento»).
- **Alforjas**: en Personalizar el caballo, el campo dice «Con alforjas (+12 casillas montado)».
- **Depósitos y obra**: al sacar de un depósito (aviso de la E) y en el panel de obra se suma «En la mochila: 17/24 casillas». Sin tocar la lógica de `almacen-juego.js`.

## Cómo está hecho

- `src/carga-pantalla.js` (nuevo, sin three; el DOM entra por parámetro): `vistaCasillas` (de `ocupacion` a las celdas, con la sobrecarga descontada), `partirRanuras`, los textos (`textoContador`, `textoHud`, `lineaMochila`, `textoDetalleCapacidad`), `dibujarCasillas`, `dibujarSobrecarga`, `ponerCargaHud` y `avisoMochilaLlena`.
- Costo: `ocupacion` se calcula al abrir el panel y cuando cambia la mochila (cuando la barra se redibuja, que ya sólo pasa si cambió una cuenta) o al montar y bajar del caballo. Nunca por cuadro; el HUD sólo reescribe su texto si cambia.
- Estilo: las reglas del panel están en `src/menus/sistema.css` con los tokens del sistema (espacios, tamaños de letra, `--acento`, `--fila-fondo`); el HUD y el cartel, en la plantilla. El ícono con aguada del cuaderno ahora alcanza también a las casillas (`cuaderno.css`).
- Cabe en 1536×864 con 36 casillas y sobrecarga a la vez (715 px de alto del panel como mucho, de 800 posibles); si no entrara, se desplaza adentro del panel.

## Pruebas

- `pruebas/verificar-4-7-pantalla.mjs` (en el gate): la vista a partir de `ocupacion` (con `carga.js` de verdad), sobrecarga, alforjas, Desafío, el DOM con un documento de mentira, lo enganchado en `main.js`, la plantilla y el CSS.
- `pruebas/humo-4-7-pantalla.cjs`: partida real (Relax y Desafío) con capturas en `salida-cantina/carga-pantalla47`.
- Ajustes mínimos a pruebas viejas que leen texto del código: `verificar-4-2-almacen.mjs` (la línea de la E del almacén ahora suma la línea de la mochila al sacar). `verificar-3-6-2-juego.mjs` no cambió (las casillas aceptan el ratón con una regla aparte).

## Lo que se le pide al núcleo

- Que llame a `avisoMochilaLlena(texto)` (de `carga-pantalla.js`) cuando algo no entra, además o en vez de la nota de arriba a la derecha.
- Que `lineaMochila`/`ocupacion` sigan con la forma del contrato: `{ casillas: [{ k, n, pilas, max }], usadas, libres, total, sobrecarga: { k: n } }` (con sobrecarga, `usadas` pasa del `total`: la pantalla muestra `min(usadas, total)`).
- `esCargable(k)` dice que sí a cualquier nombre menos las ramitas (también a `hacha`, `cana`…): la pantalla separa herramientas y casillas por lo que de verdad cuenta `ocupacion`, no por `esCargable`.
