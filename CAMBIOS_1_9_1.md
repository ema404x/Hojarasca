# 1.9.1 — Calidad y optimización

## Antes que nada: la medición estaba rota

`medir-rendimiento.cjs` medía **desde donde hubiera quedado el jugador al cargar**, y
dónde queda depende de cuántos cuadros alcanzó a correr la máquina mientras arrancaba.
Dos corridas del mismo código daban **471 y 841 llamadas de dibujo**. Con eso no se
puede optimizar nada: cualquier mejora queda tapada por el ruido y cualquier empeora-
miento pasa desapercibido.

Ahora la cámara se planta en un lugar fijo —a 26 metros del refugio, mirándolo, a las
nueve de la noche—, así que dos builds distintos miran exactamente lo mismo. Corridas
repetidas dan el mismo número al triángulo. Esto es lo primero que había que arreglar
y es lo que hace que el resto de esta versión sea verificable.

## 1. Sacar de encima el repaso de matrices

Antes de dibujar, Three recorre la escena entera actualizando la posición de cada
objeto. El valle tiene **6.103 objetos**, y **3.923 son pedazos de vegetación
instanciada** que viven en el origen y no se mueven nunca: lo que cambia son las
matrices de sus instancias, no su transformación.

Marcarlos como lo que son saca a los 3.923 del recorrido:

| | antes | ahora |
|---|---|---|
| repaso de matrices por cuadro | **1,219 ms** | **0,468 ms** |
| llamadas de dibujo | 409 | 409 |
| triángulos | 791.680 | 791.680 |

**Tres cuartos de milisegundo por cuadro**, gratis, dibujando exactamente lo mismo. A
sesenta cuadros por segundo es el 4,5% del presupuesto de un cuadro.

## 2. Juntar lo que no se mueve

Dibujar cuesta por objeto, no por triángulo. Un poste de corral son doce triángulos
—nada— pero es una llamada de dibujo entera, igual que el galpón de ocho mil. El galpón
tenía **dieciocho postes sueltos**: dieciocho llamadas para 216 triángulos. El patrón se
repetía en casi todas las estructuras.

`src/fusion.js` junta las mallas hermanas que comparten material en una sola. No es una
optimización a ciegas: una malla se fusiona **sólo** si no tiene nombre (las que lo
tienen se buscan desde el juego), no tiene hijos ni datos propios, no está instanciada,
comparte la *misma instancia* de material con otra hermana —no el mismo color: la misma
instancia, porque el juego le cambia el color al material para prender las ventanas de
noche y eso tiene que seguir funcionando— y tiene las mismas banderas de sombra.

Corre antes de que se cuelguen las puertas y los postigos, así que las hojas que giran
no entran nunca.

**28 llamadas menos al armar el valle**, y desde el punto de medición fijo: 457 → 446
con invasores, 421 → 410 sin ellos, **con el mismo triángulo exacto** (1.023.360).

## 3. Lo que se probó de esto

`pruebas/humo-rendimiento.cjs`, partida real. Doce comprobaciones, y tres de ellas
existen porque la prueba encontró cosas:

- Fusiona diez cajas del mismo material en una, **sin perder un triángulo** (144 → 144)
  y **dejando cada caja donde estaba** (19 m de ancho después de fusionar cinco cajas
  repartidas). Esto último es la comprobación que importa: una fusión que amontone todo
  en el origen daría el mismo conteo de triángulos y rompería el valle entero.
- La malla con nombre y la que tiene datos propios **no se tocan**.
- Los 3.893 pedazos de vegetación están fuera del repaso, y el repaso tarda menos de
  0,9 ms sobre 6.103 objetos.
- Desde el refugio salen menos de 520 llamadas y menos de 1.300.000 triángulos.

Y la auditoría de geometría headless cambió de criterio: contaba **mallas** (pedía 90 y
ahora hay 71, porque están fusionadas) y ahora cuenta **vértices**, que es lo que la
fusión no puede perder. Son 229.444; el piso quedó en 200.000.

## Lo que se miró y se dejó como está

- **Los 3.923 pedazos de vegetación** también cuestan en el recorrido de dibujo, que es
  otro paseo por la escena. Sacarlos de ahí pide cargar y descargar pedazos según dónde
  esté el jugador: es un cambio grande, con riesgo de tirones al caminar, y no lo hago
  sin poder medir cuadros por segundo de verdad.
- **Las piezas que construye el jugador** no se fusionan a propósito: se desarman.
- **El millón de triángulos** es sobre todo pasto instanciado en una sola llamada. Eso
  ya lo maneja la calidad automática.

## Lo que sigue sin probarse

Los cuadros por segundo. Todo lo de arriba está medido en una ventana sin placa de
video: son milisegundos de JavaScript y conteos de la escena, que son reales y
comparables, pero no son fps. **Para eso está el banco de pruebas**, que sigue
esperando desde la 1.8: Esc → «Banco de pruebas», 94 segundos, y mandame el .txt.
