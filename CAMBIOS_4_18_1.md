# Hojarasca 4.18.1 — el pulido de las seis escenas que quedaron flojas en la 4.18.0

Rama `v4181-a` (sale de `main` = 4.18.0, commit ab7b46e). Sólo cámara, colocación, luz y props: ningún texto de B cambió (los datos de las escenas se tocan en planos, anclas, poses y orden de efectos).

## Lo que se hizo (escena por escena)
Capturas reales en Electron (monitor externo, Media, `-Visible`, perfil propio) en `pruebas/salidas/pulido-4-18-1/antes` y `…/despues` (hojas de contacto `hoja-<id>.png`; no van al repositorio).

| Escena | Qué estaba mal | Qué se cambió | A ojo |
|---|---|---|---|
| `papel-elsa` | Elsa aparecía en `estación + (−2; 2,4)`, o sea del otro lado del edificio respecto de donde llegás: el plano medio la miraba contra el muro y bajo el alero, a oscuras. | Aparece sobre el andén, 5,4 m delante tuyo (`FRENTE(5,4; 1,2)`): entre las vías y el edificio. | Bien: se ve a Elsa de cuerpo entero sobre el andén con la estación detrás, de día. |
| `josefina-fin` | El cartelito de chapa del coihue (D4 = c) no se leía: un plano largo con troncos y helechos, y el cartel en un ángulo fijo (1,2 rad) que no miraba hacia donde llegás. | El cartel mira hacia el refugio (`info.hacia` en `historia-objetos.js`) y es más grande (0,62 × 0,40 m, con tres renglones); un plano medio nuevo sobre el coihue, a 4,4 m y a la altura del cartel, sólo con D4 = c, y otro que vuelve a Josefina. | Bien: la chapa se ve en el tronco, con Josefina al lado. Queda en primer plano la losa blanca del prop de la raíz. |
| `pedir-perdon` | Los tres planos estaban anclados a «N pasos delante tuyo»: la cámara quedaba entre los troncos y la raíz no se distinguía. | Los tres anclados a la raíz (`{ lugar: 'molino-viejo' }`): general a 6 m desde arriba, medio a 3,4 m y detalle a 1,4 m a ras del suelo. | Bien: se ven las piedras, la losa y las puertitas al pie de los dos troncos. Quedan helechos a la izquierda. |
| `majada-fin` | Con la colocación en el Puesto Alto y el primer plano sobre el galpón de esquila a 18 m, la cámara terminaba adentro del galpón, a oscuras; el cartel de «Puesto Catrileo» (a 3 m del centro del galpón) no entraba en cuadro y aparecía después. | Colocación de frente al portón (`galpon-cartel`, de cara a afuera, a 6 m); el cartel va a un costado del portón; el plano general sobre el cartel, a 5,5 m y 2,4 m de alto, **sin despeje** (la cerca del corral frenaba la cámara a 1,3 m); el efecto del cartel pasa antes del primer plano. | Bien: de día, el portón, el cartel y el corral; Ramón en el corral. |
| `prestado-herrero` | Las estacas, a 12 m y de costado, quedaban detrás de los bancos y de la estatua de la plaza; la cámara, frenada por esos choques, se pegaba a las estacas; además Anselmo, si no vive todavía en la aldea, no aparecía. | Anselmo se arma de invitado (`INVITABLES_HIST`), con colocación de cara a él; las estacas, a 6 m y de frente; el plano es un picado de 5,5 m de alto **sin despeje**. | Bien: se ve la fila de estacas sobre la nieve de la plaza, con la estatua en el medio; las estacas se ven chicas (rayas). |
| `galpon-pelea` | La ventana con barro y bellotas es la del refugio, pero la cámara la buscaba delante tuyo, en el galpón (a 18 m): quedaba fuera de cuadro. | Un plano libre que parte de la ventana del refugio (punto nuevo `ventana-refugio`) y viaja 8 s hasta la puertita clavada en el galpón. | Bien: la ventana con el barro (oscura, de madrugada) y al final la puertita sobre su poste en el piso del galpón. |

## Lo que se miró de más
- **Herminia en su casa (`umbral-fin` con la pelea)**: la cámara estaba a 8 m del umbral del refugio, no en la aldea. Ahora cortan a la puerta de su casa (puntos nuevos `casa-herminia-puerta` y `casa-herminia-calle`, sacados de los puntos de la aldea) y el plano se ancla a la puerta. **Herminia no se ve**: la gente a más de 130 m del jugador no se dibuja y el refugio queda a 700 m de la aldea; se ve la casa con la puerta entornada y el escalón. Tampoco se corrigió la causa (queda como límite).
- **Las tres lucecitas del mirador** (`cerro-mirador`): el plano largo del cerro seguía durante toda la escena y quedaban fuera de cuadro. Un plano medio a 1,8 m las muestra; son de 5,5 cm (antes 4,5 cm, a un metro de altura no se veían).
- **Las lucecitas que rodean el galpón al amanecer**: sólo se agregó la colocación de los cuatro amaneceres (de frente al galpón de la noche, a 6 m) y las lucecitas pasaron de 5 a 8,5 cm. **No se vio el cuadro con las lucecitas** (la hoja muestra el galpón y los duendes, no los puntos).
- **La tranquera abierta** (`hojas-canelo` sin convidar): ahora se ve el poste en el plano general a 18 m (antes, nada). Postes y hoja más gruesos. La hoja casi no se distingue a esa distancia.
- Atado de canelo (`hojas-canelo`): hojas más grandes.

## Motor
- `sinDespeje: true` en un plano (`escenas.js`, `compilarPlano`): la pose sale sin `foco` y `escenas-mundo.js` no la despeja. Para planos altos o largos sobre un lugar con bancos, estatuas o cercas pegados: la bolita de la 4.17.0 se chocaba con ellos y dejaba la cámara a 1,3 m del foco (no es lo mismo que un tronco entre la cámara y el foco, que sí tiene que acercarla). Se usa en `majada-fin` (el plano general) y en `prestado-herrero` (el picado).
- Un punto de la historia con `rot` orienta la malla del prop (`historia-objetos.js`, `lugarDe`): el cartel del galpón mira hacia afuera.
- `main.js` (`puntosDeHistoria`): `galpon-cartel` (con `rot`), `galpon-afuera` (sólo da la dirección de la colocación), `ventana-refugio`, `ventana-refugio-vista`, `casa-herminia-puerta`, `casa-herminia-calle`. Declarados en `LUGARES_ACTO3`.
- `main.js`: `herrero` (Anselmo) en `INVITABLES_HIST`.
- Herramienta de la mano: `pruebas/humo-4-18-1-pulido.cjs` (el de la 4.18.0 más: `HUMO_INFO=1` imprime dónde está cada lugar; `HUMO_KFILE=<json>` saca una foto desde una cámara libre —sin tocar las escenas—; `HUMO_TODAS=1` un cuadro por línea; `HUMO_DEMORA=<s>` espera antes del cuadro; `HUMO_CONSERVAR=1` deja los cuadros sueltos).

## Shaders
0 programas nuevos (base 111): ningún material ni luz nuevos (`verificar-4-18-1-pulido.mjs` lo comprueba por texto: un solo `MeshBasicMaterial`, el de las brasas de la aldea). Medido con `humo-4-18-1-pulido.cjs` (secciones P y S): 111 al entrar, 111 con el galponcito y 111 después de mostrar y mirar de cerca los 25 props fijos, de día y de noche. En la corrida de escenas hay un **111 → 112 en `majada-fin`** después de pasar por escenas de noche (`galpon-pelea`) y volver de día al galpón de esquila; **pasa igual con los props escondidos** (`HUMO_SIN_PROPS=1`) y `majada-fin` sola se queda en 111: es el programa de más del galpón de esquila de día que ya anotó la 4.17.0 (110 → 111, y 111 → 113 según el recorrido), no de esta versión.

## Pruebas
- `pruebas/verificar-4-18-1-pulido.mjs` (en `verify:pasos`): 1725 comprobaciones, 0 fallas, 22 mutaciones atrapadas (cada una, una copia con otro nombre: no depende de la caché de ESM). Cada arreglo tiene la suya: la colocación de `majada-fin`, de `prestado-herrero` y de los amaneceres; Elsa sobre el andén; el plano cercano del cartel; los planos de `pedir-perdon` anclados a la raíz; `sinDespeje` en `majada-fin` y en el picado (y que el motor lo respete); las estacas a 6 m; el viaje de la ventana; Herminia y la cámara en su puerta; el plano cercano de las lucecitas; el cartel hacia el refugio; el punto con `rot`; los lugares nuevos; Anselmo invitado.
- Ajustadas a propósito: `verificar-4-17-0-pulido-c.mjs` (los lugares nuevos y que `herrero` es invitable) y `verificar-4-18-0-pulido-c.mjs` (la puerta de Herminia tiene otro nombre).
- En verde: `4-18-0-pulido-c` (10648), `4-17-0-pulido-c` (73230), `4-17-0-escenas-acto3` (22830), `4-16-0-escenas-acto2` (1610), `4-15-0-escenas-acto1` (742), `4-18-0-escenas-optativas` (121), `4-18-0-optativas-a` (382), `4-17-0-historia-a` (238), `4-14-0-escenas` (77), `4-17-1-escenas-noche` (46).

## Lo que sigue flojo o sin ver
- Herminia en la puerta de su casa (no se dibuja por la distancia); las lucecitas del amanecer alrededor del galpón; la tranquera abierta de cerca (sólo el poste a 18 m).
- `prestado-herrero`: las estacas se leen como rayas finas desde el picado.
- `galpon-pelea`: el barro de la ventana, de madrugada, es oscuro sobre el tronco.
- `majada-fin`: la oveja dibujada bajo el nombre del cartel no está (sólo cinco bloques oscuros que hacen de letras).
- `josefina-fin`: la losa blanca de la raíz, en primer plano, tapa un poco la parte baja.
- El caso general de la 4.17.0 sigue: las escenas se anclan al jugador (o a un lugar) y la gente más allá de 130 m no se dibuja.
