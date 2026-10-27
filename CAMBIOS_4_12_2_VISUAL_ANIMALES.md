# Hojarasca 4.12.2 (bugs): mejora visual y animales con huesos

Rama `bugs-4-12-2-visual-animales`, desde `origin/main` = 4.12.1. **No se subió la versión, no se hizo push, no se tocó `main`.** Sale de las revisiones de lectura `zona-W.md` (mejora visual) y `zona-K.md` (animales con huesos). Cada hallazgo se confirmó (con arneses propios o los del revisor) antes de tocarlo. Nada se abrió en Electron ni se corrió el gate: lo visual y lo de rendimiento real queda en «Para mirar/medir en Electron».

## Estado de cada hallazgo

| Hallazgo | Estado | Qué se hizo |
|---|---|---|
| **W1** programa de profundidad que se compila tarde (103 → 104) | **Arreglado y probado en Node** (la causa concreta sigue sin confirmarse en placa) | `precalentarPiel` ahora dibuja **dos veces** y deja en la escena las tres figuras que se alternan en el juego (rígida, con huesos, instanciada de capa 1 con color por instancia). Ver «W1» abajo. |
| **W2** cajas ±70/±110 empeoran la sombra cercana | **Confirmado (aritmética), valores NO tocados**; queda como pregunta | Se agregó una perilla de prueba `sombraSesgo` (vale 1, no cambia nada). Ver «Preguntas». |
| **W3** sombra de contacto sobre lo transparente y halo lejano | **Arreglado y probado en Node** (el efecto en pantalla es para mirar) | `renderOrder` pasa de 1 a −1 y la fuerza se apaga con la distancia. Parte del hallazgo **no se confirmó** (agua), ver abajo. |
| **K1** salto de cabeza al cruzar los 40 m | **Arreglado y probado en Node** | La curva del cuello entra con la cercanía: a 40 m la piel está posada como el rígido. |
| **K2** piel armada para animales que no la usan | **Arreglado y probado en Node** | `mallaPerro` / `mallaCaballo` aceptan `{ piel: false }`; lo piden la aldea, la fiesta y el tren. |
| **K3** tramo de huesos del tren sin liberar | **Arreglado** (se resuelve con K2: sin piel no hay tramo) | Probado: 6 perros y 6 caballos más no gastan huesos. |
| **K4** la piel lee la calidad guardada, no la que corre | **Arreglado y probado en Node** | `fijarCalidadPiel()`, llamada por `main.js` al arrancar y cuando la automática baja. |
| **K5** sin re-precalentado tras recuperar el contexto | **Arreglado y probado en Node** (la recuperación real es para probar en Electron) | `rehacerGraficos` llama a `gente.precalentar` después de `compilarCarga`. |
| **K6** pendiente 103 → 104 | Es lo mismo que W1 | Ver W1. |
| **K7** cabeza del caballo 14–17 cm | **Arreglado con K1** (mismo mecanismo; caballo y huemul y perro incluidos) | Probado: a 40 m queda a menos de 3 cm del rígido. |
| **K8** `pielPermitida()` / `apagadaPorUrl()` por animal y por cuadro | **No se tocó** (micro, sin riesgo que justifique tocar) | Cachear la URL rompería a las pruebas que cambian `location` en el medio. |
| **W4** corte de sombras de árboles por tramo con sol rasante | **No se arregló** | No hay arreglo seguro sin captura: el corte es por tramo y el alcance sale de `sombraArboles`. Pregunta abajo. |
| **W5** rocas nuevas (~380 ms al armar, hasta 5 `InstancedMesh` por tramo) | **No se arregló** (no es trivial) | Sin cambio. |
| **W6** MSAA muerto (`?debug=1&sombrasx={"msaa":4}`) | **Se deja como está** | Sólo depuración; no se activa solo. |

## W1: el programa de profundidad que se compila tarde

**Confirmado el mecanismo** con un GL de mentira que deja a three armar sus programas de verdad (ahora es parte de la prueba): con la versión de antes, un ciervo con piel, uno rígido y una silueta instanciada que aparecen *después* de la carga armaban 2, 2 y 3 programas de profundidad nuevos respectivamente; con el arreglo, **0**. En la prueba se pone el material de profundidad compartido en la misma situación que el juego: primera pasada de sombras de la escena con los contadores de luces en cero, y un objeto de cada tipo que sólo aparece después.

**Qué cambió** (`src/animales-piel.js`, `precalentarPiel`):
1. se dibuja dos veces (la segunda ya ve los contadores de luces del juego);
2. durante esos dos dibujos hay en la escena tres figuras mínimas, en el orden en que se alternan: rígida con `normal`, con huesos con `normal` y un `InstancedMesh` de una instancia con color por instancia, en la capa 1 (como las siluetas de los árboles, que sólo ve la pasada de sombras);
3. al terminar se sacan de la escena, se liberan las geometrías y el tramo de huesos. La prueba comprueba que no queda nada.

Costo: sólo en la carga (un dibujo más y dos programas de profundidad más, uno por tipo de objeto). En el juego normal no cambia nada. En Baja y Mínima no hace nada (igual que antes).

**Lo que no se pudo confirmar** (sin placa): que el 104 del humo sea exactamente esto y no otra cosa. El arreglo cubre las dos hipótesis del revisor (contadores de luces en cero y tipo de objeto); si en Electron el 104 sigue, mirar «Para mirar/medir en Electron».

## W2: las cajas de sombra de la 4.12.3

Números confirmados (con `src/sombras-alcance.js` y `config.js`): téxel Media 0,078 → 0,137 m (+75 %), Alta 0,054 → 0,107 m (+100 %); borde blando Media 0,17 → 0,30 m; `normalBias` Media 0,144 → 0,207 m, Alta 0,116 → 0,172 m. **No se cambió ningún valor.** El corrimiento por normal crece con la caja a propósito (para que no aparezca acné); achicarlo sin ver una captura podría traer acné en troncos y laderas. Lo único agregado es una perilla de prueba, `calidad.sombraSesgo` (multiplica el corrimiento por normal; sin ella vale 1), para poder comparar con `?debug=1&sombrasx={"sombraSesgo":0.7}` en Electron. Prueba: sin la perilla da lo de siempre en Media y Alta.

## W3: sombra de contacto

- **Confirmado:** con `renderOrder = 1` se dibujaba después de lo transparente de orden 0 (todo lo que no fija su `renderOrder`: hojas que caen y demás transparentes sin orden) y les restaba; y con `fog: false` quedaba un anillo pleno a 200 m. **No se confirmó lo del agua:** el agua y el lago tienen `renderOrder` 5 a 7, es decir se dibujan *después* del anillo, que por lo tanto no les resta (el informe suponía lo contrario). Las bruma/humo de la cocina/halos (3 a 8) tampoco.
- **Arreglo:** `renderOrder = -1` (la primera transparente) y la fuerza del anillo baja con la distancia a la cámara: plena hasta la mitad del corte y cero en el corte (`fuerzaPorDistancia`, suavizada). No se usó la niebla de three porque con mezcla que resta el color de la niebla restaría de más. Cerca (menos de ~115 m en Media) se ve igual que antes.

## K1: la cabeza no salta a los 40 m

Mecanismo: el rígido gira la cabeza (ciervo) o el cuello entero (caballo, huemul, perro) como una pieza; la piel curva el cuello en tres huesos. Fix: la piel tiene una **mezcla de 0 a 1 que depende de la distancia** (`piel.mezcla`, que calcula `lod`): 0 a los 40 m (y a los 46 m, donde vuelve el rígido) y 1 desde los 28 m. Con 0 los huesos quedan posados como el rígido (el giro entero sobre el pivote que ya usaba la IA); con 1 es la curva de siempre. No hay estado ni tiempo: es simétrico al acercarse y al alejarse. Medido en Node (vértices de la cabeza, mismo ángulo): ciervo 0,9 rad: antes 0,58 m medio y 0,85 m máximo, ahora < 0,02 m máximo (lo que queda es la respiración del tórax, 1,2 %); caballo 0,55: antes 0,14–0,17, ahora < 0,02; huemul y perro también < 0,03.

## Pruebas

- Nueva: `pruebas/verificar-4-12-2-visual-animales.mjs` (**92 comprobaciones**, enganchada al gate con `herramientas/sumar-prueba.cjs`). Ejecuta: el render de mentira para W1, los anillos de contacto de W3, las cabezas de K1, la creación de animales sin piel de K2/K3, `pielPermitida` de K4, y `rehacerGraficos` / `aplicarCalidadAutomatica` reales de `main.js` (con un mundo de mentira) para K5 y K4.
- Ajustadas (lo mínimo):
  - `pruebas/verificar-4-12-2-animales.mjs`: `precalentarPiel` ahora dibuja dos veces y con tres figuras (antes una vez, una malla con huesos): se cambió `dibujos === 1` por 2, «hay una malla con huesos» por «alguna de las mallas es con huesos» y los nombres de la escena en las dos expresiones regulares (`f` en lugar de `malla`).
  - `pruebas/verificar-3-7-3-tren.mjs`: el texto exacto de la línea del caballo de la jaula ahora lleva `{ piel: false }`.
- Los cambios en `main.js` se colocaron para no romper las pruebas que miran el texto de `aplicarCalidadAutomatica` (la llamada a `fijarCalidadPiel?.()` va después de `acomodarEscalaPantalla`), y la perilla de `cielo.js` es una línea aparte para no tocar el fragmento que mutaba `verificar-4-12-3-sombras.mjs`.

### Pruebas sueltas que corrí (una a la vez, sin Electron)
Todas en verde con el cambio: `verificar-4-12-2-visual-animales` (92), `verificar-4-12-2-animales` (139), `verificar-4-12-3-sombras` (431 + 49 mutaciones), `verificar-4-12-1-edificios` (979), `verificar-4-12-1-agua` (122 + 28), `verificar-4-12-0-bordes` (50 + 23), `verificar-4-12-0-rocas` (151), `verificar-3-7-3-tren` (141), `verificar-3-5-distancia`, `verificar-4-10-3-ajustes` (49), `verificar-3-8-6-base` (76), `verificar-2-1`, `verificar-2-2` (huella del terreno), `verificar-2-8-compas`, `verificar-3-7-0-aldea` (2447), `verificar-3-7-0-integracion` (479), `verificar-3-7-0-personajes` (719), `verificar-3-7-2-cocina` (357), `verificar-3-7-5-fiestas` (5422), `verificar-3-8-0-arreglos`, `verificar-3-8-3-mundo` (49), `verificar-3-8-6-relax` (113), `verificar-3-8-7-aldea` (74), `verificar-3-8-8-banderas` (318), `verificar-4-10-3-sonido`, `verificar-4-11-5-carro` (156 + 48), `verificar-4-8-ambiente` (298), `verificar-desafio-2`, `verificar-hotfix-visual-rc30`, `verificar-lod-invasores`, `verificar-optimizacion-profunda-rc21`, `verificar-optimizacion-rc20`, `verificar-profundidad-escenica-rc30`, `verificar-rastreo`, `verificar-relax-2`, más `node armar.mjs` (439 módulos) y `herramientas/revisar-escritura.cjs` (sin avisos). **No corrí el gate completo**: eso queda para la integración.

## Decisiones tomadas sin consultar
1. **W1:** se eligió el precalentado más completo posible *sólo en la carga* (dos dibujos y tres tipos de figura) en lugar de tocar el sistema de luces o el material de profundidad. Es lo más conservador: el juego no cambia.
2. **W2:** no se tocó ningún valor de `config.js` ni de `sombras-alcance.js`; sólo se dejó la perilla `sombraSesgo` (neutra).
3. **W3:** `renderOrder -1` y la fuerza por distancia en la CPU, cada vez que se rehace la malla (cada 28 m o 1,5 s), en lugar de la niebla de three (restaría de más) o de cambiar el modo de mezcla.
4. **K1:** se eligió la mezcla por distancia (sin estado) en lugar de igualar la pose para siempre o de mezclar en el tiempo: no cambia la pose cercana (< 28 m) y funciona igual al ir y al volver.
5. **K2:** `piel = true` por defecto; los que no la usan lo piden con `{ piel: false }` (no se cambió nada para el perro y el caballo del jugador).
6. **K4:** una variable de módulo (`fijarCalidadPiel`) en lugar de una referencia a la calidad de `main.js`, así `animales-piel.js` sigue sin depender de `main.js`. Mientras no se fije (pruebas), se lee lo guardado como antes.
7. **K8, W4, W5, W6:** no se tocaron (ver tabla).

## Preguntas para el usuario
1. **W2:** ¿bajamos `sombraCaja` de Media a 55 (el propio fallback del CAMBIOS 4.12.3) o dejamos 70 y probamos `sombraSesgo` 0,7? Ver «Para mirar» más abajo: hay que mirar tu sombra sobre pasto a las 15:30 en Media. Decidir con captura.
2. **W4:** ¿vale la pena que `sombraArboles` mida cada árbol y no el tramo? Costaría más dibujos en la pasada de sombras con sol bajo; no se hizo.
3. **W5:** las rocas nuevas suman ~380 ms al armar el mundo en Media y Alta. ¿Se acepta o se reparte en cuadros?

## Para mirar/medir en Electron (con la PC libre)
1. **W1 (el 104):** `node armar.mjs` y `electron pruebas/humo-4-12-2-animales.cjs` (con la lanzadora `herramientas/al-monitor.cjs`). El humo ya cuenta programas: esperado 103 → 103 (o el mismo número antes y después). Para confirmar la causa, en `H.__hojarasca` (`?debug=1`): `renderer.info.programs.map(p => p.cacheKey)` justo después de la carga, y otra vez tras ver un ciervo cerca, un ciervo lejos y un árbol con sombra; comparar los **últimos 24 números** de cada clave (contadores de luces) y las dos máscaras finales. Si el número sigue en 104, es otra cosa (un caster nuevo sin `normal`, ver informe W-1).
2. **W2:** capturas de tu sombra sobre pasto a las 15:30 en Media con `?debug=1&sombrasx={"sombraCaja":55}`, `{"sombraSesgo":0.7}` y por defecto; mirar acné en troncos y laderas con `sombraSesgo` bajo.
3. **W3:** casa del lago con bruma/lluvia (el anillo ya no debería oscurecer el humo ni la lluvia) y edificios del valle a 150–250 m con niebla alta (sin halo oscuro). Comparar con la 4.12.1.
4. **K1:** ciervo pastando, caminar de 50 m a 28 m y volver: la cabeza no debe dar un tirón en los 40 m (hasta el 40 va rígida; al acercarse, el cuello se curva de a poco). Lo mismo con el caballo suelto pastando y el huemul.
5. **K2/K3:** entrar a la aldea con la PC cargada y mirar el cuadro que arma `armarAldea()` (antes ~15–20 ms de más); `H.__hojarasca` no expone el conteo de huesos, pero `esqueletosEnUso()` de `animales-piel.js` en la consola debe quedar en 1 o 2 (tu perro y tu caballo) y no en 10.
6. **K4:** en Media, elegir Baja en Ajustes sin reiniciar: los animales deben seguir con piel hasta reiniciar. Arrancando en Baja, elegir Media y tocar «Personalizar»: no debe haber tirón.
7. **K5:** forzar la pérdida de contexto (`H.__hojarasca` / `WEBGL_lose_context`) y mirar que al volver no aparezca un programa de sombra nuevo cuando se ve un animal con piel.
8. **Rendimiento general:** `hojarasca-medir` (la 4600G como referencia). Lo que se agregó cuesta sólo en la carga (W1) y no suma dibujos por cuadro; K2/K3 ahorran. Medir igual el cuadro de la plaza.
