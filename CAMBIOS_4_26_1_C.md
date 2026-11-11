# 4.26.1 · parte C — El andén, la mochila, los pedidos y detalles

Rama `v4261-c` (sobre `main` = 4.26.0). Lista del brief `BRIEF_4_26_1.md` (C), con sus decisiones. Material crudo (capturas y registros): `C:\Users\Andres\AppData\Local\Temp\hx\c4261\` (`humo1`…`humo3` = esta rama, `humo-base` = la 4.26.0 con el mismo humo, `n4240`/`n4260b`/`n4260c` = la búsqueda del objeto naranja).

## Qué se hizo (todo visto en la partida real)

1. **La campana**
   - **Aldea**: al tocarla, la campana de la estación se mueve (el vaivén de 3,2 s de cuando llega el tren) y suena la suya (los cuatro golpes agudos de `campanaAnden`, el sonido que ya tenía). Antes no se movía y sonaba la de la locomotora desde el medio del andén. `aldea-mecanicas-mundo.js`: `dondeCampana` (dónde cuelga) y `tocarCampana`.
   - **Las demás paradas** (la Estación del Valle, las chicas y los apeaderos): una campanita de bronce colgada de una ménsula del primer poste del alero, con la soga atada a un clavo (en los apeaderos, en un poste propio en la punta de atrás). **Fundida en la malla de la parada** (`trochita.js` `campanaDePoste`: sólo agrega piezas al constructor; 0 llamadas de dibujo, unos 200 triángulos por parada). El sonido de siempre sale de ella.
   - **El aviso de la E sale sólo mirándola a 3 m o menos** (`campana-anden.js` `mirandoLaCampana`: en el piso, a ±37° de adonde mirás). Antes salía en cualquier lugar a 8 m del centro del andén.
   - Lo que falló en el humo y se arregló: en la Aldea y en la Estación del Valle el puesto de cargas está al lado y su E le ganaba a la campana; ahora, **mirando la campana de cerca, gana la campana** (`interacciones.js`, una condición compartida por las dos entradas).
2. **Pedidos**: debajo del pedido del vecino, en la charla, la línea gris «Sólo pide lo que se consigue: lo del valle, lo de los puestos que conocés o lo que producís vos.» (`pedidos.js` `REGLA_PEDIDOS` como `pie` de los tres avisos —le falta, ya entregaste dos hoy, no tiene caja—; `aldea.js` la deja en `pies` con el número de la parte; `main.js` `mostrarCharla` la pone en `#charla-pie`, gris `#8a8478`, y el menú de la rueda la esconde). Se descartó lo del primer intento (una frase metida en el pedido).
3. **Detalles**
   - **La hojarasca con nieve**: se va tapando por manta mientras la nieve pasa de 0,15 a 0,5 (en octavos: el bloque del sotobosque se rehace pocas veces) y con nieve plena no queda ninguna (el bloque queda sin instancias: no se dibuja). Con lo que ya existe por instancia (la matriz de cada manta); el resto del año, igual. En la partida: 16 y 13 instancias en verano → 0 y 0 con nieve → 13 y 10 al volver el verano; sin los tiestos blancos.
   - **El objeto naranja junto al cartel de la plaza en Baja: era una mariposa** (la «dama pintada» del cuaderno). El color medido en la captura de la 4.24.1 (222, 130, 44) es el de sus alas (`#d9752a`): dos trapecios naranjas lisos de 9 cm que aleteaban **siempre para abajo** (de 17° a 80°); quieta en el aire y sin sombras (Baja) se leía como un techito naranja a dos aguas «tirado en el pasto». Ahora cada ala tiene su forma (la de adelante en punta, la de atrás redonda), mide 5 cm, va pintada por vértice (naranja, base parda, la punta negra con su mancha blanca), tiene las dos caras en la malla con el material de la fauna y **aletea hacia arriba (en V)**. Las mismas tres mallas por mariposa. Se buscó por descarte en tres corridas (hora, día y lo que hay alrededor del punto) hasta dar con el color y la forma.
   - **Ropa: una capa de color por vértice por prenda, 0 triángulos** (medido contra la 4.26.0 persona por persona): pantalón (las rodillas gastadas y con tierra de los que trabajan arremangados), chaleco (la espalda de forro, más oscura, en los de paño), campera (abierta: la vista de la abertura en sombra; cruzada: la orilla del cruce; cerrada sin botones: la tapeta) y delantal (el vivo de los dos costados). Del primer intento quedaron afuera el vivo de arriba del chaleco y la franja del pantalón del uniforme (eran una segunda capa; la franja además cambiaba el uniforme de Elsa y del jefe de estación).
   - **El nombre del nivel del Desafío**: «Nivel de la noche: Dura (4 de 5).», en la portada (con las perillas) y en Ajustes. Cinco escalones (Tranquila, Suave, Normal, Dura, Implacable) según cantidad × vida × daño, y «más dura que Implacable» / «más suave que Tranquila» si se pasa de una punta. Es sólo el nombre: los récords y el logro siguen mirando la dificultad elegida.

## Qué quedó afuera
- Nada de la lista.

## Decisiones
- **Sonidos**: la Aldea usa el suyo (el de cuando llega el tren); las paradas, `sonido.campana`, el que ya sonaba en la 4.26.0.
- **La campanita va también en la Estación del Valle y en los apeaderos**: con la regla de los 3 m, sin campana a la vista no habría dónde tocarla.
- **Mirarla** es el rumbo (±37°), no la altura: la campana está a la altura de la cabeza.
- **La hojarasca se esconde** (no se baja): por manta, con el azar de su lugar, sin material ni programa nuevo.
- **La mariposa** usa `MAT_FAUNA` (Lambert con color por vértice, el de toda la fauna) en lugar de un Lambert de dos caras propio; ver «Pruebas» por los programas.
- **Una capa por prenda**, como dice el brief.

## Pruebas
- **Nueva**: `pruebas/verificar-4-26-1-c.mjs` (en `verify:pasos`): 85 comprobaciones de conducta (la campana con el código de verdad de `main.js` en un mundo de mentira, la campanita en el constructor de la parada, los pedidos con `pedidos.js` y `aldea.js` de verdad, la hojarasca, el ala de la mariposa armada con three, el nivel, y la ropa armando a la gente en una VM con `gente-cuerpo.js` de verdad) y **20 mutaciones, todas atrapadas** (una copia de `src` por mutación, un proceso por copia).
- **Viejas**: RESULTADO_VIEJAS
- **Humo real** (`pruebas/humo-4-26-1-c.cjs`, con `herramientas/correr-humo-4-26-1-c.ps1`: candado y monitor externo): RESULTADO_HUMO
- `node armar.mjs` sin errores.

## Claves nuevas de guardado
Ninguna.
