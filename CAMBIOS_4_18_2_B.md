# Hojarasca 4.18.2 (parte B) — Los textos y la escena de los lazos de los vecinos

Rama `v4182-b`, sobre `main` = 4.18.1. No se subió la versión. Esto es la parte B: el CONTENIDO para que `rosa`, `tito`, `tobias`, `herminia`, `nicanor`, `belisario` y `sofia` tengan lazo de verdad. La mecánica (guardado, `sanearHistoria`, el aplicador de efectos, la guía, la tarjeta de decisión, las condiciones, el final y los encargos) la hace el agente A; acá no se tocó `historia.js`, `historia-ui.js`, `historia-disparadores*.js`, `historia-escenas-efectos.js`, `historia-optativas.js`, `historia-final.js`, `guardado.js` ni `main.js`. Las claves y los pedidos también están en el tablero compartido.

## Qué hay
- `src/historia-texto-lazos.js` — módulo puro y **sin imports** (así A lo puede importar desde `historia.js` sin ciclos). Exporta:
  - `TEXTO_LAZOS` con `guia`, `final`, `charlas`, `tablon` y `raro` (abajo, uno por uno);
  - `VECINOS_LAZO`: los siete, en el orden fijo del epílogo (`rosa`, `tito`, `tobias`, `herminia`, `nicanor`, `belisario`, `sofia`);
  - `lazoCumple(rango, n)`: ¿el lazo `n` está dentro de `{ min?, max? }`? Es la misma regla de la condición `lazo` de las escenas (inclusiva, sin tope del lado que falta, el lazo se toma entero y la basura vale 0);
  - `finalDeLazos(lazoDe)`: las líneas de epílogo que corresponden, en orden fijo; `lazoDe` es `(quien) => número`;
  - `fraseDeGuia(quien, palabra)`: la frase corta de la guía, o `null`.
- `src/historia-escenas-lazos.js` — la escena de Sofía. Exporta `ESCENAS_LAZOS`, `IDS_LAZOS`, `EFECTOS_LAZOS`, `DISPARO_LAZOS` y `POR_DEFECTO_LAZOS` (vacío), con la misma forma que `historia-escenas-optativas.js`.
- `src/historia-escenas-util.js` — una sola línea: `LAZOS_SECUNDARIOS` suma `'sofia'` (si no, `parsearEfecto('lazo:sofia:2')` da `null`). El cambio es idéntico en la rama de A, así que el merge no choca.
- `pruebas/verificar-4-18-2-lazos-escenas.mjs` — la prueba (sumada a `verify:pasos`).

## La escena nueva de Sofía: `foto-valle` («La luz de las cinco»)
Acto 2, capítulo 7. Sofía quiere sacar el valle entero desde la puerta del estudio y le falta una persona chiquita en el medio para que se entienda el tamaño: vos, de espaldas. Espera la luz de las cinco («el valle se pone del color de un durazno»; la escena adelanta la hora a las cinco menos diez con un `apagon`) y después revela en el cuarto oscuro. En la copia, al lado de tus botas, hay dos puntitos verdes (los mismos de `rueda-gira`); ella dice que es el vidrio y lo guarda en un cajón. Es chica: tres elecciones, una sola con peso.
- `valle-pide` (sabor): cómo le contestás.
- `valle-luz` (con peso): **esperar la luz da `lazo:sofia:2`**, apurarla (`apurar`) o moverte (`mover`) dan **`lazo:sofia:1`**. Nunca los dos (la prueba lo exige por todos los caminos). Si se saltea la escena vale `apurar` (+1, la opción prudente).
- `valle-copia` (sabor): una copia para el refugio / que quede en el estudio («un casamiento sin foto es un trato sin testigos») / «¿por qué de espaldas?».
- Efectos que usa: `lazo:sofia:1`, `lazo:sofia:2` y `raro:foto-del-valle`. Nada más: ni objetos ni plata.
- Se cuenta como hecha la optativa `foto-valle`. La entrada del tablón «De paso» está en `TEXTO_LAZOS.tablon['foto-valle']` (`{ caps: [7, 8, 9, 10], quien: 'sofia', titulo, ofrecida, hecha }`, la misma forma que `TEXTO_OPTATIVAS.tablon`); el cuaderno de lo raro, en `TEXTO_LAZOS.raro['foto-del-valle']` (cap 7, **A: sumalo a `RAROS`**).
- Registro sugerido (A): `{ id: 'foto-valle', desde: 'cosecha', hasta: 'golpea', quien: 'sofia', ofrece: (s) => s.pobladores.has('fotografa'), hecha: vista('foto-valle'), escenas: ['foto-valle'], disparadores: ['foto-valle', 'foto-valle:hablar'], premio: null }`. El lazo lo da la escena (`premioDe` ya no lo repite). Dónde y cuándo: `DISPARO_LAZOS['foto-valle']` (E sobre Sofía o llegar al estudio de fotos, de 9 a 16:30, como `foto-sofia`; a la vuelta del cuarto oscuro pasa una hora más).
- **Pedido chico, opcional**: `foto-sofia` (la del ojo, hoy sin premio) podría dar `lazos: { sofia: 1 }` en el registro. Con eso Sofía llega a 3 (de la casa); sin eso llega a 2. Su línea de final y su charla piden 2, así que no dependen de eso.

## Las frases por lazo (`TEXTO_LAZOS`)
Nunca hay números a la vista: lo que se muestra es la palabra del lazo (`palabraLazo`). La prueba rechaza cualquier dígito y la palabra «lazo» en los textos.
- `guia[quien] = { nombre, rol, frases }`: para `NOMBRES` y la guía («Rosa, la panadera: de confianza») y una frase corta por palabra (`conocido`, `de confianza`, `de la casa`; `tirante` sólo en Tito). `fraseDeGuia(quien, palabra)`.
- `final[quien] = [{ id, min?, max?, texto }]`: una línea de epílogo por vecino con lazo alto y una **tirante sólo para Tito**. En `tarjetaFinal`: `texto.push(...finalDeLazos((q) => lazoDe(h, q)))` después de la línea de Graciela y antes de `nochePerdida`. Cada línea es corta, una sola oración o dos, neutral frente al trato o la pelea.
- `charlas[quien] = [{ id, cap, texto, cuando }]`: `cuando` es `{ lazo: { min } }` (o `{ lazo: { max } }` para la tirante de Tito) o `{ escena: 'foto-valle' }` (la de después de la escena de Sofía). Son «de después» como las de las optativas: valen aunque el capítulo ya haya pasado, se dicen una vez cada una (`oidas`) y **A tiene que sumar `lazoCumple(cuando.lazo, lazoDe(h, quien))` en `cuandoOk`** y tratar `TEXTO_LAZOS.charlas` igual que `TEXTO_OPTATIVAS.charla` (con `deOptativa: true`). Las claves son las mismas de `CLAVE_DE` (`sofia` es `fotografa`, `tito` es `carpintero`, `rosa` es `panadera`, `herminia` es `abuela`).

| vecino | final (lazo) | charla (lazo) | línea de charla |
|---|---|---|---|
| `rosa` | 3 | 2 (cap 3) | `lazo-rosa-confianza` |
| `tito` | 3 y tirante (−1 o menos) | 2 y tirante (cap 5) | `lazo-tito-confianza`, `lazo-tito-tirante` |
| `tobias` | 3 | 2 (cap 5) | `lazo-tobias-confianza` |
| `herminia` | 3 | 2 (cap 8) | `lazo-herminia-confianza` |
| `nicanor` | 3 | 2 (cap 5) | `lazo-nicanor-confianza` |
| `belisario` | 2 | 2 (cap 8) | `lazo-belisario-confianza` |
| `sofia` | 2 | 2 (cap 7) y la de después de la escena | `lazo-sofia-confianza`, `sofia-opt-valle` |

### Por qué sólo Tito tiene la línea tirante, y por qué Belisario y Sofía piden 2
Con las escenas de hoy el único de los siete que puede quedar por debajo de cero es Tito: `coihue-en-pie` (D2 = dejar el coihue en pie) le resta 1 y sólo se compensa con «Gracias por aguantarse los dos» (+1) o más adelante con `tito-arco` y `flechas-de-mas`. Ninguna otra escena resta a Rosa, Tobías, Herminia, Nicanor, Belisario o Sofía; escribirles una línea tirante sería texto que no se ve nunca. Tampoco hay «frío» (−2) para ninguno.

Y cada línea pide un lazo que las escenas pueden dar (la prueba calcula la cota: por cada escena, lo máximo que da por un solo camino de elecciones, más los encargos de Nicanor):
| vecino | de dónde sale | cota |
|---|---|---|
| `rosa` | `bolsa-rosa` +1 (D1 = b), `masa-crece` +1 (D1 = b), `frasco-rosa` +1 | 3 |
| `tito` | `coihue-talado` +2 (D2 = b), `coihue-en-pie` −1/+1, `tito-arco` +1, `flechas-de-mas` +1 | 4 (tope 3) |
| `tobias` | `tobias-pirca` +2 (D2 = c), `veta-vuelve` +1, `prestado-tobias` +1 | 4 (tope 3) |
| `herminia` | `fogon-leyenda` +1 (D4 = a), `herminia-noventa` +2 | 3 |
| `nicanor` | `truchas-nicanor` +1, más los encargos que A suma (hay cuatro encargos fijos y dos de temporada) | 1 + encargos |
| `belisario` | `los-del-cerro` +1 («Gracias por contarme»), `mulas-belisario` +1 | 2 |
| `sofia` | `foto-valle` +1 o +2 (y +1 si A se lo da a `foto-sofia`) | 2 (3) |

## Revisión de los `lazo:<vecino>:n` que ya escribían las escenas
Se leyó cada escena de los 51 efectos `efecto('lazo:…')` y las opciones con efecto (hay más: `tito-arco`, `prestado-tobias`, `los-del-cerro`, `coihue-en-pie`). **Ningún n contradice a la escena**: no hay un lazo que suba con alguien que en la escena se lleve mal con vos, ni uno que baje con quien te agradece. Lo único para tener presente:
- `bolsa-rosa` da `lazo:ercilia:2` y `lazo:rosa:1`. Es lo que dice el guion (D1 = B: «Ercilia +2, Rosa te da pan»), aunque Ercilia no esté en la escena: se deja así.
- `coihue-en-pie` da `lazo:tito:-1` (lo dice el guion) y la respuesta «Gracias por aguantarse los dos» da `lazo:tito:1`: neto 0. Es el único camino a un lazo tirante con alguien de los siete.
- `juntar-ovejas` aparecen Fermín (D5 = a) o Belisario (D5 = c), pero el lazo es de Ramón: no cambia nada.

## Qué le toca a A (resumen; el detalle de formas está arriba y en el tablero)
1. `PERSONAS_LAZO_VECINOS` con los siete y `LAZOS_TODOS`; `NOMBRES` desde `TEXTO_LAZOS.guia[quien].nombre`; `sanearHistoria` con las claves que faltan en cero (partidas viejas siguen cargando).
2. El aplicador: `lazo:<vecino>:n` guarda y se aplica una sola vez por escena (`una(h, clave(...))`), en las dos rutas (`registrarEfectosHistoria` y `registrarEfectosActo1`).
3. La guía y la tarjeta de decisión: palabra del lazo con `fraseDeGuia`.
4. Condición de `cuandoOk`: `w.lazo` con `lazoCumple`.
5. `tarjetaFinal`: `finalDeLazos`.
6. El registro: `foto-valle`, y el tablón de `TEXTO_LAZOS.tablon` (el 29 de las optativas; `pistaOptativa` y `textoOptativa` miran primero `TEXTO_OPTATIVAS.tablon`).
7. `RAROS`: `TEXTO_LAZOS.raro`.

## La prueba
`node pruebas/verificar-4-18-2-lazos-escenas.mjs`. La suite es una función que recibe los **módulos**:
- valida la escena con el director real, la corre por todos los caminos de elección, la salta a los 2, 40, 300 y 1500 cuadros y revisa que termine, quede vista, suelte a todos, corra los efectos, que Sofía sume una sola vez (+1 o +2) y que la hora quede entre las cinco menos diez y las siete;
- la convención de efectos y condiciones (sólo `lazo:sofia:1`, `lazo:sofia:2` y `raro:foto-del-valle`: sin premios nuevos), ids únicos contra los tres actos y las optativas, hablantes, claves, poses, lugares, largos, sin inglés ni religión ni nada explícito, sin números ni la palabra «lazo», nombres propios que existen;
- la guía (siete vecinos, tres frases, la tirante sólo de Tito), el final y la charla (cada línea pide un lazo que las escenas pueden dar, no sale antes de la primera escena que lo da, ids únicos contra los actos y las optativas, la tirante sólo de Tito), el tablón y el cuaderno de lo raro de la optativa nueva, la tabla de disparo;
- `finalDeLazos`, `lazoCumple` y `fraseDeGuia` por casos (rangos, orden fijo, claves peligrosas, basura);
- las reglas del empaquetador y de módulo puro sobre el texto de los dos archivos (exports de a uno, sin ñ en ids, imports en una línea, LF, sin DOM, el texto sin imports), este documento y `verify:pasos`.

**Mutaciones que miden de verdad**: de datos (se clona lo exportado y se rompe una garantía) y de **código**: se escribe una copia mutada de los dos archivos (con sus tres dependencias) en una carpeta temporal y se importa con `?v=<n>`, así cada mutante es un módulo nuevo y no el de la caché (por ejemplo: `lazoCumple` que ignora el máximo o excluye el mínimo, `finalDeLazos` que toma siempre la primera línea o cambia el orden, `fraseDeGuia` sin `hasOwn`, esperar que da +1, un import en el texto, CRLF, dos exports en una línea). Una copia sin mutar, cargada igual desde la carpeta temporal, tiene que pasar. La prueba exige atraparlas todas.

## Qué no se hizo / no se vio a ojo
- No se vio a ojo nada (sin Electron, por reparto). De `foto-valle` conviene mirar a ojo: la cámara anclada al jugador en el estudio (`FRENTE`), que Sofía esté a mano, adentro del estudio, cuando la escena arranca (la escena no la hace aparecer: usa la que ya está), los dos `apagon` (la luz de las cinco y el cuarto oscuro) y que el paso de la hora no se vea brusco.
- No hay línea tirante para los otros seis (ni «frío»): no se pueden dar con las escenas de hoy.
- No se escribieron escenas nuevas para Rosa, Tito, Tobías, Herminia, Nicanor ni Belisario: ya tenían las suyas; el valor es la guía, las charlas y el final.
