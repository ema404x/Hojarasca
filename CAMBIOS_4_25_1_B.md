# 4.25.1 (B) — traspasos en las cinemáticas

Parte B del brief «Bugs de las cinemáticas»: gente o cámara que atraviesa paredes, árboles, rocas o muebles durante las escenas de la Historia. Rama `v4251-b`, desde main = 4.25.0.

## Qué se reprodujo

Con una auditoría automática en la partida real (`herramientas/auditoria-4-25-1-b-traspasos.cjs`, Electron, mundo real y colisiones reales): corre las 126 escenas con el director de verdad, de dos maneras (se la lee entera con Enter, y se la saltea con Esc apenas empieza) y, con los perfiles «trato» y «pelea», 378 corridas. Por dentro mira: cada lugar donde una escena PONE a alguien (`aparecer`, `teletransportar` —también el que hace el director al saltar o al trabarse una caminata—) y cada meta de caminata, contra los sólidos del juego y el agua; en cada cuadro, a cada persona en escena (adentro de un sólido, cruzando una pared de un cuadro al otro, bajo el suelo, flotando, sentada con el cuerpo pegado a algo, sobre otra o sobre el jugador), al jugador y a la cámara.

Antes del arreglo (378 corridas, 66 con hallazgos), reproducido:

| Qué | Dónde | Causa |
|---|---|---|
| Elsa (la guarda) metida en la pared del fondo del andén | `estacion-llegada` | el guion la pone a `dx: 3, dz: 2` de la estación y ahí cae a 2 cm de la pared |
| Graciela, igual | `molienda-fletes` | idem (`dx: 2.5, dz: 1.5`) |
| Fermín metido en la pared del galpón | las cuatro `amanecer-*` | su lugar final cae en la pared |
| Josefina y Tobías metidos en la roca de la pirca | `piedras-molino`, `tobias-pirca` | sus metas caen adentro del círculo de la roca |
| La abuela en el tablón de la plaza | `fogon-leyenda` | idem |
| La cámara dirigida adentro del tronco del coihue, de una pared del galpón, de un tablón, de la casa de Ercilia | 13 escenas: `piedras-molino`, `coihue-talado`, `fiesta-nieve`, `ese-no-josefina`, `majada-fermin`, `pluma-umbral`, `galpon-golpe`, `galpon-sin-golpear`, `galpon-encuentro`, `galpon-pelea`, `llave-79`, `amanecer-pelea-ganada`, `amanecer-pelea-perdida` | el barrido de la cámara arranca a 1,3 m del foco: lo que está pegado al foco no se veía |

Con la caminata, el choque ya sacaba al personaje del sólido de a poco (y por eso no llegaba nunca: se frenaba contra el borde), pero `aparecer` y `teletransportar` lo dejaban metido: el director teletransporta a la meta cada vez que se saltea la escena con Esc, cuando se pasa el límite de tiempo de una caminata y cuando termina. Por eso el caso más común (saltear con Esc) dejaba a la persona adentro del sólido para siempre (hasta que la rutina la movía).

No se reprodujeron (la auditoría no los vio en ninguna de las 378 corridas): gente en el agua, bajo el suelo o flotando, una persona sobre otra o sobre el jugador, el jugador adentro de un sólido, una persona que cruce una pared de un cuadro al otro caminando, sentados con el cuerpo en la mesa o el banco (con la sola excepción de Ramón en su cama, que es a propósito).

## Qué se arregló (`src/escenas-mundo.js`, sólo ahí)

1. **`despejarPuesto(x, z, y)`**: el lugar donde alguien se para se saca de los sólidos con el mismo choque de la gente (radio 0,22: sólo si de verdad se solapa) y, si queda en el agua o todavía solapado, se busca el lugar libre más cercano en anillos de 0,4 m hasta 4 m. Lo usa `ubicar` (o sea `aparecer` y `teletransportar`, incluido el del director al saltar o trabarse) y la meta de `caminar` (así la caminata llega en vez de empujar contra el borde). Una altura pedida bien por encima del piso (Fermín sobre el techo del galpón) se respeta: arriba no hay con qué chocar. Un lugar libre queda exactamente donde se pidió; la altura del pie se recalcula con el lugar donde quedó.
2. **La lente de la cámara dirigida** (`despejarCamara`): después de todo el cálculo, si la lente cae adentro de un sólido se la saca por el costado con el mismo choque (radio 0,25). Es una consulta al choque por cuadro de escena (no suma dibujos ni programas de shader).

Los guiones no se tocaron: el despeje es general, así que cubre también escenas futuras y los lugares que no se miraron.

## Después del arreglo

- Auditoría real, mismas 378 corridas con la herramienta ya completa: **cero** gente adentro de un sólido, cero lentes adentro, cero cruces de pared, cero hundidos o flotando. Quedan sólo los avisos informativos: «la meta pedida cae adentro» (los lugares de los guiones que se corrigen solos: 9 escenas), «ruta recta bloqueada» y «sentado apretado» (Ramón en su cama).
- Probada la fusión con la rama A (v4251-a, que cambia `caminar`, `soltar` y las caminatas lentas en el mismo archivo): el merge de `escenas-mundo.js` sale solo; con las dos ramas las 126 escenas dejan a todos afuera de los sólidos y no queda ninguna caminata lenta (las cuatro de la rama sola —`ramon-tranquera`, `majada-fermin`, `ese-no-josefina`, `mulas-belisario`, que se frenaban contra algo— las resuelve A).
- Prueba `pruebas/verificar-4-25-1-b.mjs`: 31 comprobaciones sobre las colisiones de verdad (círculo, pared fina, tablón bajo, agua, techo, meta de caminata, lente pegada a un tronco y a una pared, lente libre sin mover, el director al saltar la escena) y **11 mutaciones** (cada una en su proceso sobre una copia de `src/`; todas atrapadas). La mutación «la lente puede quedar adentro» exigió que la prueba use un foco a menos de 1,3 m (si no, el barrido viejo ya la salvaba).
- Se ajustó a propósito una prueba vieja: `pruebas/verificar-4-18-0-pulido-c.mjs` (la mutación «la altura pedida no se respeta» buscaba la línea de `ubicar` que ahora usa `alto`).
- Previas que tocan el archivo, en verde: `verificar-4-14-0-escenas`, `4-17-0-pulido-c`, `4-17-1-escenas-noche`, `4-18-0-pulido-c`, `4-18-1-pulido`, `4-18-4-c`, `4-19-0-c`, `4-24-1-b`.

## Lo que no se hizo / no se vio

- **No se vio a ojo** el cambio de la lente en el hallazgo exacto (las capturas antes/después de `galpon-golpe` y `fiesta-nieve` a los cuadros que pedí cayeron en otro plano de la escena; la de `estacion-llegada` muestra a Elsa un poco más adelante de la pared, sin diferencia que moleste). Los 13 lugares de cámara están medidos por números, no mirados.
- Dónde queda ahora Elsa en `estacion-llegada` y Graciela en `molienda-fletes` (el lugar libre más cercano a su lugar pedido, tras la pared del fondo del andén): no se miró la composición de cada plano; con `dx/dz` el lugar es el que pidió el guion corrido unos 0,3 m.
- Veinte escenas no arrancaban en el primer intento del barrido por estado del banco de pruebas (una escena anterior encadenada o la partida recién cargada); se resolvió en la herramienta (reintento y, si hace falta, forzar) y se corrieron todas.
- Escenas que dependen de dónde esté parado el jugador al dispararse: se las ancla con `COLOCACION_ESCENA` como el barrido de la 4.18.4; no se probó cada posible posición de partida.
- Las caminatas «lentas» (frenadas contra algo) son de la parte A; esta parte sólo vigila que nadie quede adentro de un sólido.

## Herramientas y claves

- `herramientas/auditoria-4-25-1-b-traspasos.cjs` (Electron; candado; `TRASP_MODO`, `TRASP_PERFIL`, `TRASP_SOLO`, `TRASP_DESDE/HASTA`, `HTML=<otro index.html>`, `TRASP_FOTO=id:cuadro` para una captura).
- Claves nuevas de guardado: **ninguna**. Programas de shader: sin cambios (0 nuevos).
- Archivos: `src/escenas-mundo.js`, `pruebas/verificar-4-25-1-b.mjs`, `pruebas/verificar-4-18-0-pulido-c.mjs` (una mutación), `herramientas/auditoria-4-25-1-b-traspasos.cjs`, `package.json` (la prueba en `verify:pasos`), este documento.
