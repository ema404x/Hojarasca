# Hojarasca 4.24.1 (parte B) — la primera hora, a ojo

Rama `v4241-b`, sobre `main` = 4.24.0. No se subió la versión (lo hace el cierre). Es la parte B de la 4.24.1: lo que quedó sin ver de la 4.24.0 en la primera hora (capítulos 2 a 4). Cada punto se miró en la partida real (Electron, monitor externo, candado) o tiene una prueba que falla sin el arreglo. **0 programas de shader nuevos** (110 antes y después en la partida real), 0 capas de pantalla, sin geometría de terreno nueva. Todo en castellano rioplatense; nada religioso, sin números de lazo.

## Resumen de decisiones
| tema | decisión |
|---|---|
| La silueta a 30 m no se veía | Se **acerca** (18 a 24 m en vez de 24 a 38; sin huir: el umbral sin trato sigue en 16 m), se agranda (escala 2,0 en vez de 1,6: ~1,5 m), mira de frente a donde mirás (abanico de 0,6 rad en vez de 0,9), nace sólo en un lugar **despejado** (sin tronco a menos de 1,1 m ni troncos en la línea desde donde estás), entre varios lugares posibles elige el de **terreno más alto** (asoma del pasto) y tiene los ojos prendidos ya al anochecer (`pisoNoche`). Sigue siendo la misma figurita quieta y lejana: no es un cartel, no brilla, no se marca. |
| Los capítulos 6 a 8 | **No cambian** (24 a 38 m, escala 1,6, sin ojos prendidos, entre los árboles). Las reglas nuevas sólo valen en la primera hora. |
| El plano de Elsa | Elsa aparece en el andén, entre el poste del medio y el de la derecha, mirando hacia la vía; la cámara cruza la vía y la ve de frente a la altura de los ojos, con el valle atrás. Antes la cámara salía «desde el jugador» y caía adentro del alero, de espaldas a un poste. |
| La leña y las botas | La leña pasó de dos tiras que parecían tablas a dos pilas de troncos **de punta hacia vos** con el corte claro (4, 3 y 2 troncos, los finos arriba). Las botas ganaron la boca oscura y un calafate más. |
| Los indicios repetidos | Se revisaron los diez; **se corrigió uno** (ver abajo). El resto son ecos buscados del guion. |

## 1. La silueta del anochecer se lee (`historia-presencia.js`, `historia-duendes.js`, `main.js`)
- `SILUETA_SUAVE = { dist: [18, 24], escala: 2.0, abanico: 0.6, pisoNoche: 0.5, candidatos: 6 }` (exportado). `aparecerSilueta(suave)`: prueba hasta 30 puntos (los primeros 18 en el abanico angosto, el resto abierto a 0,9 por si adelante no hay buen lugar), se queda con los 6 primeros válidos y elige el de mayor altura de terreno; si ninguno sirve, reintenta a los 8 s como siempre.
- `ctx.despejada(x, z)` (nuevo, en `presenciaHistoria` de `main.js`): ningún tronco a menos de 1,1 m del punto y ninguno a menos de 0,5 m de la línea que va de vos al punto (cada 2 m), con el mundo de colisiones de siempre (`col.resolver`). Sólo lo consulta la primera hora.
- `historia-duendes.js`: `aparecer` acepta `pisoNoche` (0 a 1): la «noche» mínima de ese duende para los ojos y la mirada (`e.noche = Math.max(n, s.pisoNoche)`). No cambia la luz del mundo ni agrega halos (los de los ojos ya existían).
- `forzarSilueta()` en el controlador (herramienta de las partidas de prueba): pone una ya, con las reglas del capítulo en que estás.
- **Medido en la partida real** (1366x768, calidad media, 19 h, desde el borde del bosque): antes 30 m y **22 px** por cada 1,2 m de alto; ahora 20 a 23 m y **29 a 33 px** (la figura de 1,5 m mide ~36 a 41 px). En las capturas (`1-silueta-real-2-zoom.png`) se lee con el sombrero verde y el cuerpo pardo parado en un claro, con arbustos rojos atrás.

## 2. El plano de Elsa en el andén (`historia-escenas-acto1.js`, `escenas-mundo.js`, `main.js`)
- **Causa:** el plano `medio` «desde el jugador» pone la cámara a 3,4 m de Elsa del lado de donde estés, y Elsa estaba a `dx: 3, dz: 2` del andén en ejes del mundo: según hacia dónde corra la vía quedaba adentro del alero, a oscuras, detrás de un poste. Había además un error de fondo en el plano `libre` (ver «Lo que se encontró»).
- **Arreglo:** un marco propio del lugar. `puntosDeHistoria` (main.js, **una línea**) le suma el ángulo de la vía (`ang`) al punto `estacion`, y `posicion` de `escenas-mundo.js` entiende `{ lugar, lx, lz }` (4 líneas): `lx` paralelo a la vía, `lz` alejándose de ella (la misma cuenta que `aMundo` de la parada). Sin `ang` o sin `lx/lz` no cambia nada (`dx`, `dz` siguen igual).
- La escena: Elsa aparece en `ELSA_ANDEN = { lx: 1,7, lz: -0,4 }` (entre los postes de x = 0 y x = 3,4, a 1,1 m o más de cualquiera, entre el filo y el frente del galpón) mirando a `ELSA_MIRA` (la vía); plano largo desde el otro lado de la vía y alto (3,1 m, se acerca 2,6 s) y plano de cerca a 5,6 m de la vía, 1,7 m de alto, con `posFin` y `miraFin` iguales para que la cámara no baje. Las líneas, los gestos, el apagón y el tren no se tocaron.
- A ojo (`2-elsa-0.png` a `2-elsa-6.png`): plano largo limpio con Elsa en el andén y la estación entera; plano de cerca con Elsa entera entre dos postes. **Queda oscuro** (está bajo el alero, a la sombra): se lee, no es lindo.

## 3. La leña y las botas, de cerca (`historia-objetos.js`)
- Se miraron de cerca (a 0,95 m, mirando hacia abajo, luz de las 17) y la E de verdad, parado frente a la puerta con el banco del umbral en la mira: **las dos andan** (aviso «Mirar la leña apilada» / «Mirar las botas de la puerta», el cuaderno anota `lena-apilada` / `botas-calafate`, el aviso se ve y una segunda E no repite). Se ven en `3-lena-apilada-cerca-antes.png` y `3-botas-calafate-cerca-antes.png`.
- La leña de la 4.24.0 se veía de costado como dos tiras de tablas (en `b-exp3`); ahora los troncos apuntan hacia vos con el corte de madera clara y se leen como leña. Las botas se leían bien; se les sumó la boca oscura y un calafate más.
- Sólo cajas, cilindros y esferas del three local, un dibujo por forma, sólo el que está a la vista.

## 4. Los indicios y las frases de otras escenas
Se revisaron los diez de la 4.24.0 contra los capítulos 2 a 13:
- **Corregido:** `silueta-ramal` decía «Elsa dice que son chicos de la aldea», pero esa frase es de **Graciela** y es recién de la escena `derrumbe-puertita` (a la que se llega después). Ahora dice «Será algún chico de la aldea, pensé. Pero los chicos de la aldea no andan a esta hora, y menos tan quietos.» (la duda se conserva). La prueba lo mira.
- **Ecos buscados, sin tocar:** `huellas-arroyo` (capítulo 2) anticipa las huellas chiquitas de `huellas-escarcha` y `galpon-ronda`; `ovejas-silencio` se repite con otro tono en la charla de Fermín del capítulo 6; `botas-calafate` anticipa el calafate del capítulo 12; `migas-rosa` y `almacen-acomodado` son del mismo estilo que lo «acomodado con cuidado» del capítulo 13 («lo que se deja, vuelve»). Ninguna frase se repite literal en otra escena (la prueba lo comprueba con las frases de 28 letras o más).
- El tono sigue el del guion: cuaderno en primera persona, vecinos con su voz («m'hijo», «querido», «pasajero»), sin lazos, sin religión, sin lo sensual.

## Lo que se encontró de paso (y se arregló)
- **`plano('libre')` sin `posFin` bajaba la cámara al piso:** en `compilarPlano`, `lerp(a.y + pos.dy, a2.y + posFin.dy, u)` con `a2 = a` toma `dy = 0` del fin: la cámara arrancaba a 1,7 m y terminaba a ras del suelo en la duración del plano. Ningún plano de la Historia usaba `libre` hasta ahora. **No se tocó el motor** (`escenas.js` es de todos): los dos planos `libre` de Elsa llevan `posFin` y `miraFin` explícitos, y la prueba compila el plano y mide la altura en 0, 0,5 y 1. Lo atrapó `verificar-4-17-0-pulido-c` («altura de cámara 0,0 m»).

## Claves nuevas de guardado
**Ninguna.** Los 10 indicios, la escena y los objetos usan las claves de la 4.24.0.

## Lo que no se hizo (y por qué)
- No se tocó el viaje de vuelta (es de A).
- No se tocó el motor de planos (`libre` sin `posFin`): queda anotado.
- La silueta no hace pasto más corto ni se marca de ninguna manera (sería un cartel).

## Lo que no se vio a ojo
- **Noche cerrada, lluvia y nieve con la silueta**: sólo sale al anochecer (18 a 22) en verano y en los capítulos 2 a 4; se probó a las 19 con cielo despejado y calidad media. Con lluvia no se probó. Con **calidad alta** el pasto llega a 42 m y con **baja/muy baja** a 20/15 m: la silueta (18 a 24 m) se probó sólo en media (29 m de pasto).
- **De 4 direcciones probadas, en 2 la silueta no encontró lugar despejado** (agua, árboles pegados o troncos en la línea): en el juego reintenta a los 8 s y vos te movés, pero puede tardar más que antes en aparecer cerca de un bosque cerrado. Tampoco se probó qué tan seguido ocurre caminando de verdad.
- **Alguna silueta puede asomar apenas entre el pasto o delante de un pino oscuro**: en `1-silueta-real-0-zoom.png` (20 m) la figura casi no se distingue. El criterio de lugar no ve el follaje bajo ni lo que hay detrás. Mejoró (de 22 a ~30 px, en claro y de frente), no es perfecto.
- El plano de cerca de Elsa **queda a la sombra del alero**; se lee pero oscuro.
- La **leña y las botas** se miraron en otoño (la partida de prueba arranca en otoño): no se vio con nieve ni con lluvia.
- La E sobre las botas **falló una vez de tres** en el humo viejo `humo-4-24-0-b` (corrida completa «tren, silueta, objetos»: «la tecla E no llegó al objeto»); en las otras dos y en las cuatro del humo nuevo anduvo. No se pudo reproducir; parece de orden de corrida (queda la silueta o el estado de la sección anterior). Lo anoto sin arreglo.

## Pruebas
- **`pruebas/verificar-4-24-1-b.mjs`**: 97 comprobaciones y **25 mutaciones** (cada una en su proceso, sobre una copia de `src/`; todas atrapadas; en la primera corrida dejó pasar tres —«se mira un solo lugar», la línea de troncos y el enganche del ángulo de la vía— y se reforzaron las comprobaciones). Cubre: los números de `SILUETA_SUAVE` (más cerca sin nacer dentro del umbral de huida, más alta, abanico angosto, ojos prendidos sin faro); que en los capítulos 2 a 4 pida esa escala, esos ojos y esa distancia dentro del abanico; que elija el lugar más alto de los 6 primeros (8 semillas) y mire los 6; que sólo nazca en lugares despejados y si no hay no se trabe; que los capítulos 6 a 8 sigan igual y sin consultar `despejada`; `forzarSilueta`; el piso de noche en `historia-duendes.js`; la geometría del andén (postes, filo, galpón, vía) leída de `trochita.js`; Elsa a más de 1,1 m de cualquier poste y la línea cámara-Elsa a más de 0,8 m de todos; la cámara del otro lado de la vía y a la altura de los ojos; la altura de cámara de los planos compilados en 0, 0,5 y 1; el marco `lx/lz` con vía este-oeste, girada un cuarto de vuelta y sin ángulo; el enganche de `main.js`; y las frases de los diez indicios contra todo el resto de `historia-*.js`.
- **`pruebas/humo-4-24-1-b.cjs`** (partida real; candado de Electron; `herramientas/correr-humo-4-24-1-b.ps1`): **todo en orden** (programas de shader 110 → 110): la silueta aparece en 2 de 4 direcciones a 22 m con 29 px (contra 22), Elsa arranca sola y la cámara queda a 23,6 m (altura del andén más 1,7 m), el cuaderno anota la charla, la leña y las botas con la E real, y no repite una segunda vez. Capturas en `pruebas/salidas/humo-4-24-1-b/` (no se sube).
- **Humo viejo** `humo-4-24-0-b.cjs` (tren, silueta, objetos): en verde dos de tres corridas (ver arriba); el tren llega a los 22 s, la silueta a 22,9 m anota `silueta-bolsa` y no suma «vistos».
- **Previas ajustadas a propósito:** `verificar-4-24-0-b.mjs` (una mutación apuntaba a `aparecerSilueta()` y ahora es `aparecerSilueta(suave)`).
- **Previas que se corrieron y siguen en verde:** `verificar-4-24-0-b`, `4-13-0-historia-a`, `4-14-0-escenas`, `4-15-0-escenas-acto1`, `4-15-0-historia`, `4-16-0-escenas-acto2`, `4-16-0-historia-a`, `4-17-0-escenas-acto3`, `4-17-0-historia-a`, `4-17-0-pulido-c`, `4-17-1-escenas-noche`, `4-18-0-pulido-c`, `4-18-1-pulido`, `4-18-4-a`, `4-18-4-b`, `4-18-4-c`, `4-19-0-c`, `4-23-0-b`, `4-24-0-a`, `3-6-1-aldea`, `3-7-3-tren`, `4-0-3-trochita`. No se corrió `npm run verify` completo. `verificar-4-24-1-b` está sumada a `verify:pasos` de `package.json` (después de la de la 4.24.0 B).

## Archivos
`src/historia-presencia.js`, `src/historia-duendes.js`, `src/historia-texto-acto1.js` (una frase), `src/historia-escenas-acto1.js` (sólo `elsa-anden`), `src/historia-objetos.js` (las dos formas), `src/escenas-mundo.js` (`lx`/`lz`, 4 líneas), `src/main.js` (2 líneas: el ángulo en `puntosDeHistoria` y `despejada` en `presenciaHistoria`), `package.json`, `pruebas/verificar-4-24-1-b.mjs`, `pruebas/humo-4-24-1-b.cjs`, `pruebas/verificar-4-24-0-b.mjs` (una mutación), `herramientas/correr-humo-4-24-1-b.ps1`.
