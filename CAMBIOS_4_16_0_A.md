# Hojarasca 4.16.0 (agente A) — Historia nueva: la mecánica del acto II (capítulos 5 a 8)

Rama `v4160-a`, sobre `main` = 4.15.0. No se subió la versión. B escribe sólo `src/historia-escenas-acto2.js` y `src/historia-texto-acto2.js`
(en esta rama hay dos HUECOS con esos nombres para que arme; **al juntar se queda el de B**).

## IDS DE ESCENA DEL ACTO II (contrato con B)
Los ids son los que dispara `src/historia-disparadores-acto2.js`. Una escena que no está escrita se da por vista (la historia nunca se traba).
Cómo se dispara cada una (el jugador ya está donde ocurre; las anclas de la escena son `jugador`, como en el acto I):

| Cap. | Id | Cómo sale | Qué cambia la mecánica sola |
|---|---|---|---|
| 5 La rueda | `piedras-molino` | auto, a menos de 14 m de las piedras del molino viejo (raíz del coihue grande), 7–20 h | tema `ema:piedras` |
| | `zaino-ramon` | tras `piedras-molino`: E sobre Ramón, o llegar al Puesto Alto | **entrega el zaino** (`cosas.caballo`), `prestado.zaino` |
| | `tito-coihue` | tras `piedras-molino`, con el molino de agua terminado y a menos de 30 m del coihue. **D2**: la elección se llama `coihue` y sus opciones llevan `decision:coihue:a|b|c` | — |
| | `tobias-cantera` | D2 = c: E sobre Tobías con 10 piedras en la mochila | gasta 10 piedras, `acompanante = tobias` |
| | `rueda-gira` | cuando D2 está cumplida (aserradero hecho…), cerca del molino | — |
| 6 Lo que se pierde | `perdidas-ercilia`, `perdidas-rosa` | E sobre Ercilia / sobre Rosa (`panadera`) | temas `ercilia:perdidas`, `panadera:perdidas` |
| | `devuelve-dedal`, `devuelve-pipa`, `devuelve-cuchara` | E sobre Ercilia / Belisario / Rosa con el objeto levantado | entrega marcada (la nota sale aunque la escena no esté) |
| | `luces-lago` | E sobre Nicanor | tema `nicanor:luces` |
| | `el-que-vuela` | cerca del faro (≤ 60 m) 23–1 h, tras `luces-lago`; no empieza arriba del kayak: sale al bajar | — |
| | `guardia-molino` | sentado a menos de 22 m de la raíz del coihue (o el tocón), 0:30–2:30 h, tras `luces-lago` (con la espera sentado el reloj corre ×8) | — |
| | `raiz-ramon` | a menos de 10 m de la raíz de la ladera de Ramón, 5:30–10 h, tras `guardia-molino` (siguiendo las huellas) | — |
| 7 La cosecha | `primera-molienda` | 10 medidas molidas desde que empezó el capítulo, cerca del molino propio. **D3**: elección `molienda`, efectos `decision:molienda:a|b|c` (y `ramal:4` en a, `ramal:2` en c, que da la escena) | — |
| | `minga-vecinos` | algo cocinado desde que empezó el capítulo, en la plaza de la aldea, 9–17 h | — |
| | `galpon-ronda` | al amanecer (5:30–11 h) del día siguiente a `minga-vecinos`, cerca de tu galponcito (**PUNTO MEDIO**; el cuaderno queda en el pozo, E para agarrarlo) | — |
| | `fiado-ercilia` | D3 = b (6 harinas) o c (3): E sobre Ercilia con la harina | gasta la harina, entrega marcada |
| | `harina-raiz` | D3 = c: E en la raíz con 1 harina | gasta 1 harina, `duendes.convidado +1` |
| 8 El cuaderno | `libreta-ercilia` | E sobre Ercilia | tema `ercilia:cuaderno` |
| | `cuaderno-josefina` | E sobre Josefina (`ema`) | tema `ema:cuaderno` |
| | `los-del-cerro` | E sobre Belisario | tema `belisario:cerro` |
| | `secreto-ramon` | E sobre Ramón, 17–20 h, con lazo de Ramón ≥ 0 | tema `ramon:ceniza` |
| | `fogon-leyenda` | en la plaza, 20:30–23:30 h, tras `libreta-ercilia` y `cuaderno-josefina`. **D4**: elección `cuaderno`, efectos `decision:cuaderno:a|b|c` | — |

Optativas del guion (`trigo-abuelo`, `tablas-tito`, `masa-sola`, `foto-sofia`, `fermin-habla`, `veta-que-vuelve`, `mulas-belisario`,
`herminia-noventa`): sin disparador en esta versión (ver «Lo que no se hizo»).

## Efectos y claves nuevas (se suman a la convención del acto I)
- Condición «presente» `{ quien }` (`siPresente('rosa')`, con `no: true` para «todavía no llegó»): esa persona vive en la aldea (Rosa es la panadera). La usa la escena `bolsa-alero` para ofrecer la opción de Rosa sólo si está.
- Efecto `quitar:<cosa>:<n>` (gasta harina, piedras…) y `prestado:<id>` (anota lo prestado: `zaino`, `tobias`…). `acompanante` acepta también `tobias`.
- Lo demás del acto II se escribe con los efectos de siempre (`decision:coihue|molienda|cuaderno:<a|b|c>`, `lazo:`, `ramal:`, `raro:`, `objeto:`, `entrega:`, `dar:`, `mundo:`, `duende:`, `optativa:`, `hablado:`).
