# Hojarasca 4.18.3 — Historia: tres cosas que no hacían nada, ahora hacen

Rama `v4183-a` (un solo agente), sobre la 4.18.2. Lo que las notas de la 4.18.0 a la 4.18.2 dejaban anotado como «no hace nada»: **D5 A sin costo**, **visitar a Ramón** y **la torta de Herminia**.

## Qué se hizo

### 1. D5 A sin costo (la majada de Ramón)
Qué hacía antes: la escena de la tranquera (`fermin-tranquera`) toma la decisión con `decision:majada:a|b|c` y la escena de la llegada (`majada-fermin`, D5 = a) siempre le restaba 1 a Ramón y le sumaba 3 a Fermín; el epílogo (`majada-fin`, rama A) le suma 3 a Ramón. Es decir, la opción A siempre costaba, y la optativa «Fermín quiere hablar» (`fermin-mulas`, +1 a Fermín) no destrababa nada. (Las notas de la 4.18.0 decían que A «ya no tiene costo»: no era así.)

Ahora, como dice el guion:
- **Con el lazo de Fermín en +2 o más al decidir**, A no le cuesta nada a Ramón (la escena de la llegada no le resta el uno). El epílogo no cambia: sigue sumándole 3.
- **Con el lazo de Fermín por debajo de +2**, A le baja uno a Ramón, y el epílogo lo levanta, como antes.
- B y C no cambian (ni sus lazos ni sus escenas).
- Se mira el lazo **al decidir**, no al llegar: la escena de la llegada le suma 3 a Fermín, así que mirarlo ahí lo habría hecho valer siempre. Al decidir A se anota un tema (`fermin:majada-confia`) si Fermín confiaba; si la decisión cambia (gana la última acción) y vuelve a ser A, se mira de nuevo; repetir A no vuelve a mirar. Una partida vieja con A ya decidida y sin esa marca sigue cobrando, como antes (nada de lo ganado se toca).
- Cómo está hecho: condición nueva de escena **`majada-sin-costo`** (registrada en `registrarEfectosHistoria`, en la convención del acto III: `CONDICIONES_ACTO3` y `CONDICIONES_BOOLEANAS` de `historia-escenas-acto3-util.js`). `majada-fermin` cobra con `con(efecto('lazo:ramon:-1'), no(siMajadaSinCosto()))`. La marca la deja `alDecidirMajada` (`historia.js`), que llaman el efecto `decision:majada:a|b|c` y la tarjeta de respaldo (`tomarDecision`).
- **En palabras, sin números:** la escena de la tranquera dice, antes de la pregunta, «Fermín ya no te mira con reserva: sabés que no se la lleva para irse. Si la lleva él, Ramón lo va a entender.» o «Fermín todavía te mira con reserva. Si la lleva él, a Ramón le va a doler, aunque después se le pase.»; la tarjeta de decisión de respaldo (`DEFINICION_DECISIONES.majada`, opción A, nueva propiedad `palabras(estado)`) dice lo mismo en el detalle de la opción, junto a lo que ya decía. El tablón de «Fermín quiere hablar» y la guía del capítulo 7 avisan (sin spoilers de números) que hablarle sirve para lo de la majada.

### 2. Visitar a Ramón (capítulo 9) pide algo rico
- Para que se dispare la visita (E sobre Ramón en el puesto sanitario) hay que llevar **algo rico**: un puñado de piñones, una trucha ahumada, un pan casero, empanadas, miel, un frasco de dulce de frutilla o de leche, mermelada, o un plato de la cocina (chocolate caliente, locro, curanto, asado, cordero). La lista y el orden están en `src/historia-regalos.js` (`PARA_RAMON`): se gasta el primero de la lista que tengas, de lo más barato a lo más valioso, para no regalar un asado teniendo piñones.
- Sin eso, la E sobre Ramón sigue siendo la charla de siempre (el disparador no se cumple). Nunca se traba nada: no es objetivo de capítulo, y si cuando la escena se aplica ya no hay nada, no se gasta nada y la optativa igual queda hecha.
- La escena **gasta uno** (un puñado de 3 si es de piñones: un solo piñón de regalo sería ridículo; son los 3 que pide el piñón tostado) y se avisa en pantalla («Le llevaste una trucha ahumada a Ramón · Dice que es un soborno y lo acepta»). Se gasta una sola vez: el efecto de la escena corre una vez por escena (`h.aplicadas`), así que no se repite si la escena se vuelve a ver ni si se guarda y se recarga. Las partidas con la visita ya vista (y aplicada) no gastan nada.

### 3. Herminia y los noventa (capítulo 8) pide lo dulce de la torta
- **No existe una «torta» en el inventario**: la torta frita (`cocina.js`) se come al fuego y no queda guardada; la torta negra galesa se come en la casa de té. Agregar una receta de torta al horno era cambiar el sistema de cocina (y una prueba de la 3.7.2 cuenta las recetas), fuera de esta versión. Por eso **la torta se arma con lo dulce que sí se guarda**: un frasco de dulce de leche, de mermelada (de cualquier fruta), de dulce de frutilla o de miel (`PARA_LA_TORTA`). Pan, empanadas, harina, trucha o piñones no valen.
- Se cambió el texto de la escena (`herminia-noventa`): «¿Algo dulce para la torta? ¿Para mí?» (antes «¿Una torta? ¿Para mí?»), y el resumen. Si algún día hay una torta de verdad, va primera de `PARA_LA_TORTA`.
- Igual que con Ramón: sin algo dulce no se dispara (la E sobre Herminia es la charla de siempre); se gasta uno una sola vez; aviso en pantalla («Le llevaste un frasco de dulce de leche a Herminia · Para la torta de los noventa»); nunca traba nada.

### Para las tres
- El tablón «De paso» y la guía dicen qué llevar: las `ofrecida` de `historia-texto-optativas.js` y los textos de los capítulos 8 y 9 (`historia-texto-acto2.js`, `-acto3.js`); y el tablón suma el avance de la mecánica: «te falta algo rico para llevarle: …» / «llevale una trucha ahumada al puesto sanitario (E sobre él)», y lo mismo con la torta (`avance` de `historia-optativas.js`, con `regaloRamon` y `regaloTorta` en el estado).
- El pan casero del horno (lo juntado) no lo veía el estado (sólo miraba las cosas, donde queda el pan de Rosa): ahora el pan cuenta de los dos lados y se gasta primero lo juntado (`cuentaDe` y `gastarRegalo`). Arregla de paso «el pan para Fermín» (4.18.0) y las paces con pan (4.17.0), que no encontraban el pan del horno.
- Nada de esto se sabe de memoria en `main.js`: `gastarCosaHistoria` delega en `gastarRegalo` (`historia-regalos.js`, puro).

## Archivos
Nuevos: `src/historia-regalos.js`, `pruebas/verificar-4-18-3-gastos.mjs`, `pruebas/humo-4-18-3-gastos.cjs`.
Tocados: `src/historia.js` (estado, D5, tarjeta), `historia-escenas-efectos.js` (condición y decisión), `historia-escenas-acto3-util.js` (convención), `historia-escenas-acto3-c9.js` (la tranquera y la llegada), `historia-escenas-acto2-c8.js` (Herminia), `historia-disparadores-acto2.js` y `-acto3.js` (cuándo se dispara), `historia-disparadores-optativas.js` (los efectos que gastan), `historia-optativas.js` (el avance del tablón), `historia-ui.js` (cuánto hay, el aviso, la tarjeta), `main.js` (gastar), los tres textos, `package.json` (verify:pasos), `pruebas/verificar-4-17-0-escenas-acto3.mjs` (la condición nueva se documenta acá) y `pruebas/humo-4-18-0-optativas.cjs` (la visita y los noventa ahora piden el objeto).

## Condiciones nuevas (convención de escenas)
- `majada-sin-costo {}`: cuando decidiste la majada, el lazo de Fermín era +2 o más: que la lleve Fermín no le cuesta nada con Ramón.

## Pruebas
- `pruebas/verificar-4-18-3-gastos.mjs`: ver el informe; corre las escenas con el director real y los efectos reales; mutaciones de verdad (cada una en un proceso aparte, sobre una copia de `src/`).
- `pruebas/humo-4-18-3-gastos.cjs`: partida real (Electron, monitor externo).
- Las pruebas de la Historia de la 4.15 a la 4.18.2 que se tocaron, en verde.

## Sin ver / pendiente
(ver el informe de la corrida)
