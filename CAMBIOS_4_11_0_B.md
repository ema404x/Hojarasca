# 4.11.0 (rama `v4110-b`) — modo Desafío: «Otra vuelta» conserva todo; órdenes y refuerzos

Decisiones del usuario en `DECISIONES_DISENO_4_10.md` (3 «Otra vuelta», 15 «Órdenes y refuerzos del giro»). La versión no se subió
(sigue 4.10.4 en `package.json`). Comentarios en el código con `4.11.0:`.

## 1. «Otra vuelta» se lleva todo (E2)

`src/desafio-vuelta-nueva.js` (nuevo; `nuevaVuelta` salió de `desafio-vuelta.js`, que lo importa `desafio-reglas.js` para el multiplicador de
cada vuelta, y ahora necesita las reglas del guardián, el bestiario y las partidas: de otro modo el empaquetador detecta un ciclo de módulos).

| Qué | Viaja | Cómo |
|---|---|---|
| Armas, mejoras, planos, pistola | sí (ya viajaban) | `SE_LLEVA`, `planos`, `pistolaEncontrada` |
| Habilidades del guardián: niveles y puntos sin gastar | sí | `sanearHabilidades`; **`noche` vuelve a 0** |
| Bestiario (vistos, abatidos, lados) | sí, entero | `sanearBestiario`; los estudios y el +5 % siguen |
| Trofeos ganados (`crece.trofeos`) | sí | el resto de `crece` no (ver abajo) |
| Modo, ventajas y reglas elegidas | sí | `metaDePartida` con esos datos |
| Bonos | se **rehacen** | `bonos` desde cero; origen `habilidad` desde los niveles; `ventaja` al dar el arranque; `trofeo` cuando hay tablero en pie; `defensa` desde las obras |
| Noche, base, defensas, recursos, aldea del día, pedidos, órdenes, puestos, vecinos sumados, perro curtido | no | como siempre, de cero |

Decisiones mías (puntos finos que el usuario no detalló):
- **`habilidades.noche` a 0.** Es «la última noche que dio punto»; si viajara (por ejemplo 24), la vuelta 2 no daría un solo punto hasta pasar la
  noche 25. Los puntos sin gastar y los niveles sí viajan.
- **La `meta` de la vuelta es nueva** con las mismas ventajas, reglas y modo: número de partida propio (`id`), `aplicado: false` (el arranque de
  las ventajas —tablas, flechas, miel, trampa, ayuda de Anselmo, bonos de personaje— se vuelve a dar porque la partida empieza de cero),
  `semillaDada: false`, `limpias`, `lugaresCaidos` y `final` en cero. **No cobra semillas del Coihue otra vez** (la elección ya está pagada).
  La vuelta cobra su propia semilla al terminar, como cualquier partida nueva (con las mismas reglas de siempre: tres noches o más).
- **Trofeos y tablero.** Viajan los trofeos ganados. El tablero es una obra de la base y la base se reinicia: queda guardado hasta que armes
  otro (como ya pasaba al desarmarlo vos), y entonces vuelve su bono. Si el usuario quería que el tablero mismo empiece armado, hay que
  decidirlo (es una obra y no un dato; lo anoto en lo no resuelto). `crece.vistos` (lo «ya mirado») se limpia para que un trofeo que
  se hubiera perdido se pueda volver a ganar; no se duplica nada porque `ganarTrofeo` ignora los que ya están. El perro curtido (`crece.perro`)
  es de la partida: arranca sin curtir.
- **Sin pasar otra vez por «Nueva partida».** Antes, la vuelta nueva abría la pantalla de modo/ventajas/reglas (el jugador podía elegir
  de nuevo, y cobrar semillas). Ahora `btn-entrar` la saltea cuando `desafio.vuelta > 0` y da el arranque de las ventajas con
  `metaJuego.aplicarInicio()` (una sola vez: `aplicado`). Avisa con una nota («Vuelta 2: seguís con lo tuyo»).
- **Aviso de «Otra vuelta»** actualizado: dice que se llevan las habilidades, el bestiario, los trofeos y las reglas. Cambió el texto español
  de `main.js`; **la clave inglesa vieja de `idioma-en-r.js` queda sin uso y hay que retraducir al final** (como pide el usuario: no se escribió inglés).
- Salud inicial de la vuelta: con los bonos puestos (`saludMaximaConBonos`), no 100 (una habilidad de salud no empezaba «entera»).
- Una partida vieja (campaña de antes de la 4.10, sin habilidades, bestiario, trofeos ni `meta`) que llega al final y empieza otra vuelta:
  sin habilidades, sin bestiario, sin trofeos y campaña normal sin ventajas ni reglas. Datos rotos se limpian por los saneadores de siempre.
  Una partida de la vuelta 2 guardada con esta versión carga con todo (los saneadores ya conocían cada campo).

## 2. Órdenes y refuerzos (C11 / B11c)

- **C11, órdenes a los vecinos: ya persistían.** Lo comprobé en el código: `d.ordenes` y `d.puestosAliados` se escriben sólo cuando el jugador
  ordena (E), con el cuerno de guardia (`llamar`) o con la campana (`alarma`), se guardan en la partida y se limpian al abrir
  (`sanearOrdenes`, `sanearPuestosAliados`); nada las reinicia al anochecer ni al amanecer (`amanecer`, `limpiar` de los vecinos,
  `reiniciarNoche` no las tocan). La premisa «hoy se reinician cada noche» no se cumple, así que **no cambié el juego**: dejé una prueba que lo fija
  (sobreviven a guardar y abrir; una partida vieja carga limpia con la orden de siempre; un control que recorre `src/` y falla si cualquier archivo
  fuera de los módulos de órdenes y el saneo las reinicia; con mutaciones que lo comprueban).
  Lo único que sí las pisa a propósito es tocar la campana: todos los presentes pasan a «puesto».
- **B11c, refuerzos del giro en la noche silenciosa: los refuerzos siguen la noche.** La lectura que hice: en una noche silenciosa
  (puros tiradores) los refuerzos del giro «Llegan refuerzos» bajaban de la lista común (rastreadores, brutos…) y rompían la noche; el usuario eligió
  que «persista» el carácter de la noche. `refuerzosDeLaNoche(tipos, especial)` (en `desafio-reglas.js`): con la silenciosa, los refuerzos son
  tiradores, de la misma cantidad y sin curandero ni enjambre; las otras noches no cambian. Vale para el giro y para los refuerzos de las 1:30.
  **Si el usuario quería otra cosa** (por ejemplo, dejar los refuerzos como están), se saca con dos líneas de `desafio.js` y la prueba lo dice.

## Pruebas
- `pruebas/verificar-4-11-0-desafio-b.mjs` (en el gate): 142 comprobaciones; la vuelta con una campaña ganada completa (habilidades, bestiario,
  trofeos, meta, bonos de cada origen, salud), con una partida vieja, con datos rotos, en cadena (vuelta 3), guardando y abriendo por
  `guardado.js`; el cableado de `main.js` y `desafio.js`; los refuerzos; las órdenes. **Mutación a propósito de cada regla** (15 mutaciones de
  `nuevaVuelta` en un archivo temporal y de los módulos y el texto del juego): la comprobación de esa regla tiene que fallar, y falla. Contra el código
  de antes falla en la primera comprobación.
- `pruebas/humo-4-11-0-vuelta.cjs` (partida real en Electron, fuera del gate como los otros `humo-*`): ver «Verificación».
- Ajustadas lo mínimo (describían lo cambiado a propósito): `verificar-vuelta` y `verificar-3-8-3-combate` (importan `nuevaVuelta` del módulo nuevo),
  `verificar-4-10-partidas` (la línea de `btn-entrar` que abre «Nueva partida» ahora trae `!(progreso.desafio?.vuelta > 0)`) y
  `verificar-4-8-noches` (el mundo de mentira de `revisarGiro` trae las dos funciones nuevas).

## Verificación
- **Gate:** `npm run verify` de corrido: **297 pasos OK** (296 de antes más `verificar-4-11-0-desafio-b.mjs`). `npm run verify:paralelo` también en verde.
- **Partida real nueva** `pruebas/humo-4-11-0-vuelta.cjs` (Electron, perfil propio, `-Visible`, TODO OK): campaña elegida en «Nueva partida»
  (Carcaj lleno, Buen estado, Sin emplastos), 5 noches aguantadas (5 puntos; se gastan 4 en Pulso firme 2 y Corazón de coihue 1), 5 rastreadores
  abatidos de verdad (estudio del bestiario), tablero de trofeos y mandamás de la noche 5 (casco colgado, +5 de salud), nido abajo y «Otra vuelta»
  contestando el cuadro del juego con el botón. En la vuelta 2: no vuelve a pedir ventajas; día 1, sin base; HUD «Vuelta 2»; habilidades y el punto
  sin gastar; bestiario con sus estudios; trofeo guardado; reglas con su efecto y número de partida nuevo; arranque dado una sola vez (20 flechas);
  bonos `habilidad` y `ventaja` sin `trofeo` ni `defensa`; salud 125; la noche 1 da su punto; un tablero nuevo cuelga el casco y vuelve a 130;
  guardar y abrir deja todo igual. Capturas (a tamaño completo): aviso de «Otra vuelta», cuaderno «Guardián» y «Bestiario» de la vuelta 2, HUD, tablero.
- **Otras partidas reales** (de a una, perfil propio): `humo-4-9-dias` y `humo-3-5-1-desafio` en verde. `humo-4-9-aliados` y `humo-4-10-1-guardado`
  fallaron una vez (un viejo que llegó a 7,3 m en vez de 7,4; un error de `enTren` al abrir) y **pasaron 2 de 2 al repetirlas**: de tiempo, no del
  cambio (y `humo-4-10-1-guardado` también falla a veces en la rama de antes: «10 de 12»). Fallas que **ya estaban en la rama de antes** (comprobado
  armando `main` aparte y corriéndolas igual): `humo-4-10-partidas` (espera ×1,55 con Manos llenas + Noches más largas, que desde la 4.10.1 son
  incompatibles: da ×1,35) y `humo-1-10-desafio` (el HUD vacío justo después de entrar y un `UnknownVizError` al sacar la captura sin ventana
  visible). Todas las demás comprobaciones de esas dos pasan, incluida la de la otra vuelta.

## Lo que no pude verificar / queda abierto
- El **tablero** de la vuelta 2: viaja el dato y el tablero que se arma de nuevo lo cuelga y da su bono (probado en partida real); si el usuario
  quería que el tablero mismo (la obra) viaje, es otra decisión.
- La **retraducción** del aviso de «Otra vuelta» y de la nota «Vuelta 2: seguís con lo tuyo» (claves nuevas en castellano, sin inglés).
- La campaña se dio por terminada en la partida real fijando `victoria` y el nido caído (como lo hacen los otros humos): no se jugaron las 24
  noches enteras. «Partida corta» no ofrece «Otra vuelta» (no tiene nido; `puedeOtraVuelta` no cambió).
- B11c: la lectura de «refuerzos persisten» es mía (ver arriba).
