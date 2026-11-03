# Hojarasca 4.22.0 (parte B) — el valle se acuerda

Rama `v4220-b`, sobre `main` = 4.21.0. No se subió la versión (lo hace el cierre). Es la parte B de la 4.22.0: el hallazgo 2 de `AUDITORIA_4_20_0_B.md` (las consecuencias de las decisiones de la Historia) hecho con textos y una regla pura. **Cambia el juego** (poco, y a propósito). 0 programas de shader nuevos (base 111: medido en la partida real, 111 → 111), 0 capas de pantalla ni llamadas de dibujo nuevas, ninguna clave nueva de guardado.

## Resumen de decisiones (lo recomendado por el informe, salvo lo que se anota)
| tema | decisión |
|---|---|
| Líneas de final | **14 líneas nuevas** (D1, D2 y D3 con tres cada una; D4 y D5 con las dos que no tenían; y una de la D6 con la bolsa de Eusebio en el umbral). Cada decisión aporta como mucho **una**, en el orden de las decisiones, después del ramal y antes de Graciela y los vecinos. La D4 A (la escuela) y la D5 A (el puesto) siguen siendo las de siempre, ahora en su lugar. |
| Tope del lazo por encargos | A lo sumo **+2 por persona**; mientras esa persona esté fría o tirante (lazo < 0) **+1 en total**. Es la combinación de las dos salidas que proponía el informe. No se toca nada de lo ya dado ni de lo guardado. |
| D3 en el valle | Variantes de A (fletes) y de B (fiado) en la **mesa de guerra** (capítulo 10, Ercilia) y en el **fogón** (capítulo 8). La C ya tenía sus ecos. |
| D5 que decide los aliados | Se avisa **antes** de decidir, se nota **al decidir** (B y C) y el día de la nevada se **ve quién no está**. No traba nada: la noche se juega igual (el arsenal prestado sigue). No se cambiaron las reglas de `aliadosDe`. |
| D6 A y B | Se distinguen: el texto de cada opción dice qué hace, la tarjeta de respaldo dice la diferencia, el trato firme se nota en la espera de la noche y tiene su línea en el final. No se fundieron en una sola opción (la B tiene un efecto real: el enjambre de la noche). |
| Dificultad | Ninguna regla de la noche cambia: sólo textos y el tope de encargos. |

## 1. La tarjeta final se acuerda (`src/historia-final.js`)
Antes `tarjetaFinal` sólo miraba D4 A, D5 A, el ramal, Graciela, los vecinos y la noche perdida. Ahora `piezasDecisiones(h)` (módulo puro, junto a `ECOS_FINAL`) agrega una línea por decisión:

| decisión | A | B | C |
|---|---|---|---|
| D1 la bolsa | los piñones que aparecen cada otoño en el tocón | la panadería de Rosa que huele a algo que no sale en la receta (Ercilia: «la deuda bien llevada») | Josefina guarda la nota de Eusebio y compara la letra con la suya |
| D2 el coihue | sigue en pie, el aserradero aguas abajo, Tito y la caminata | los renuevos del tocón que Josefina cuenta | la pirca de Tobías que silba con el viento de la cantera |
| D3 la molienda | los fletes siguen saliendo, Ercilia no los perdona del todo | el fiado largo y un lugar más en la mesa larga (lo que prometía el guion) | la harina partida en tres, la costumbre |
| D4 el cuaderno | (la escuela, como siempre) | el cuaderno en la repisa, Josefina lo mira de reojo | la científica del último tren le pide permiso al coihue para medirlo (lo que prometía el guion) |
| D5 la majada | (el puesto nuevo, como siempre) | la majada en tu corral, Fermín cruza sin mirar, se le va pasando | las ovejas en el Puesto del Paso, Ramón baja a tomar mate y no se habla de eso |
| D6 | — | la bolsa de Eusebio que no volvió: cada cosecha un piolín colorado con un nudo que no es tuyo | (la pelea tiene su final propio) |

Reglas de escritura (las comprueba la prueba): entre 60 y 160 caracteres, sin números ni la palabra del lazo, sin inglés, **nada religioso ni figuras sagradas**, nada sensual explícito, y ninguna frase de cinco palabras repetida con las otras piezas del final, las líneas de los vecinos y las charlas. La D1 B no repite «el pan de Rosa» (el final A ya lo nombra).
**Lectura cómoda:** la paginación de la 4.19.0 no cambió (`TOPE_PAGINA` 560). En las 4096 combinaciones de decisiones (con los trece vecinos «de la casa» y la noche perdida) ninguna página pasa del tope y la última deja lugar al premio y a los botones. El peor final pasa de 5 a **6 páginas** (sin vecinos «de la casa», las seis decisiones suman como mucho dos páginas); en la partida real (1366x768 y 1024x600) ninguna página tiene barra de desplazamiento.

## 2. El tope del lazo por encargos (`src/historia-optativas.js`, `revisarEncargos`)
Los 28 encargos del Relax sumaban +1 cada uno a quien los pidió (Ramón 9, Josefina 7, Nicanor 6, Elsa 3, Ercilia 3) sobre un lazo de −2 a 3: la D5 C (Ramón en −2) se borraba con cinco encargos y la D2 B (Josefina en −2) con cuatro.
- `TOPE_ENCARGOS_LAZO = 2` (+2 por persona en total) y `TOPE_ENCARGOS_FRIO = 1` (mientras el lazo de esa persona sea < 0, +1 en total).
- Se cuenta mirando lo ya anotado en `encargosLazo` (valor ≥ 1 = pagó lazo; 0 = base o sin lazo): **no hay clave nueva**. Un encargo que no suma queda anotado con 0 y no se cobra después (no hay «deuda» de lazo).
- Si la historia levanta al vecino (lazo ≥ 0), el tope vuelve a ser +2 en total (los que ya pagaron cuentan).
- Una partida vieja con más de dos pagados no pierde nada; los nuevos simplemente no suman.
- **Se mantiene** lo que decía el guion: Nicanor llega a «de la casa» con un lazo de la historia y dos encargos (la prueba lo comprueba), y nada pasa del máximo.
- El aviso en pantalla («te tiene más confianza») sólo sale cuando de verdad suma.
- Medido en la partida real con los 22 encargos del Relax hechos (Ramón en −2 por la majada vendida): Ramón queda en −1 (antes: máximo), los demás no pasan de +2 por encargos.

## 3. El valle se acuerda de la molienda (D3)
- **Mesa de guerra** (`historia-escenas-acto3-c10.js`): con D3 A, Ercilia dice que los sacos de la trochita «ni los menciona» pero que no se le pida harina al almacén; con D3 B, que el almacén está lleno de fiado y de gente que viene a pagar con gusto.
- **Fogón** (`historia-escenas-acto2-c8.js`): con D3 A, Graciela anota el flete del día y Ercilia la mira de reojo; con D3 B, la gente le devuelve a Ercilia algo del fiado de invierno.

## 4. La majada (D5) se siente, sin trabar
Los aliados de la noche siguen siendo los de `aliadosDe` (D5 B: Fermín queda en −1 y aun con las paces y la honda no llega al lazo +2 que pide la noche; D5 C: ni Ramón ni Fermín). Lo que cambia es que ahora se **ve**:
- **Antes de elegir** (`fermin-tranquera`, capítulo 9): «Lo que elijas se va a notar el día de la nevada: quién está a tu lado y quién no.»
- **Al elegir:** B, Fermín se aleja por la ladera y queda una silla que va a hacer falta; C, ninguno de los dos te acompaña hasta la tranquera.
- **Mesa de guerra** (capítulo 10): una silla vacía (Fermín, B) o dos (Ramón y Fermín, C).
- **La espera de la noche** (capítulo 12): falta la silueta de Fermín en el techo (B), o no están ni Ramón ni Fermín y hay una manta doblada en el cajón (C).
- Las tarjetas de respaldo (`DEFINICION_DECISIONES.majada`) dicen lo mismo en el detalle de B y C.
La noche se puede ganar igual (el arsenal prestado y los demás aliados siguen).

## 5. La D6 A y B se distinguen
- Opción A: «Dejar la puerta abierta y sentarte en el umbral, con las manos vacías.» Opción B (sólo si ya convidaste): «Dejar la puerta abierta y poner la bolsa de Eusebio en el umbral: el trato más firme.»
- La tarjeta de respaldo dice «un trato, sin palabras: les dejás el lugar y nada más» y «un trato firme, de los que se devuelven: los duendecitos se acuerdan la noche de la nevada».
- En **la espera de la noche** una lucecita se adelanta y parpadea hacia vos «como quien reconoce una bolsa con su piolín colorado» (sólo con el trato firme). Ojo: la ayuda real del enjambre contra el grandote sigue sin darse si quedó una deuda con los duendes; el texto es de sabor.
- Línea propia en el final (ver 1).

## Lo que **no** se hizo (y por qué)
- No se tocaron las reglas de la noche ni de los aliados: el informe pedía que la consecuencia «se sienta», no que cambie la dificultad.
- No hay premios de objetos nuevos ni logros (los logros de la Historia son de otra versión).
- No se fundieron D6 A y B (la B tiene un efecto real en la noche).
- Más ecos de D1 y D2 en el valle (fuera del final): D1 y D2 ya tienen 4 a 11 escenas cada una según el informe; el hueco real eran D3, D5 y el final.

## Qué **no** se vio a ojo
- Las escenas nuevas (la mesa, el fogón, la espera, la tranquera) se corrieron con el director real (la prueba, por cada decisión, y el humo en la partida de Electron), pero no se miró el encuadre de cámara con los personajes que faltan (por ejemplo la mesa de guerra con las sillas vacías: no hay silla vacía dibujada, sólo el texto).
- El final con los vecinos «de la casa» en una partida jugada de punta (la partida real usó lazos puestos a mano).
- Los textos en el idioma inglés (no se traduce todavía).

## Guardado
**Sin claves nuevas.** El tope de encargos se calcula con `encargosLazo` (que ya existía). Una partida guardada vieja sigue igual.

## Archivos
Nuevos: `pruebas/verificar-4-22-0-b.mjs`, `pruebas/humo-4-22-0-b.cjs`, este documento.
Tocados: `src/historia-final.js`, `src/historia-optativas.js`, `src/historia.js` (sólo el `detalle` de las tarjetas de respaldo D5 y D6), `src/historia-escenas-acto2-c8.js`, `src/historia-escenas-acto3-c9.js`, `src/historia-escenas-acto3-c10.js`, `src/historia-escenas-acto3-c12.js`, `package.json` (sólo `verify:pasos`), `pruebas/verificar-4-18-2-lazos-a.mjs` (una mutación que apuntaba a la línea del código que ahora lleva el tope).

## Pruebas
- **`pruebas/verificar-4-22-0-b.mjs`**: 831 comprobaciones y 29 mutaciones (cada una en su proceso, sobre una copia de `src/`; todas atrapadas): las 14 líneas (cada opción trae la suya y ninguna otra), las 4096 combinaciones de decisiones (orden, una por decisión, cierre último, páginas), la tarjeta de la UI página por página, el tono (largo, sin números, sin inglés, nada religioso, nada repetido), el tope de encargos en una veintena de situaciones, las escenas corridas con el director real por cada decisión (mesa, fogón, espera, tranquera), que lo que se dice de los aliados es verdad con `aliadosDe`, y tres partidas completas del jugador de mentira.
- **`pruebas/humo-4-22-0-b.cjs`** (partida real, candado de Electron, monitor externo): la tarjeta final en 1366x768 y 1024x600 sin barra en ninguna página; la mesa de guerra y la espera de la noche con las variantes; el tope de encargos con los 22 encargos de verdad; programas de shader 111 → 111.
- **Ajustada a propósito:** `verificar-4-18-2-lazos-a` (la mutación «los encargos de Nicanor no suman» apuntaba a una línea del código que ahora lleva el tope).
- Corridas de las pruebas de Historia previas que toqué o que miran estos archivos, en verde: `verificar-4-14-0-escenas`, `4-15-0-escenas-acto1`, `4-15-0-historia`, `4-16-0-escenas-acto2`, `4-16-0-historia-a`, `4-17-0-escenas-acto3`, `4-17-0-historia-a`, `4-17-1-escenas-noche`, `4-17-1-progreso`, `4-17-0-pulido-c`, `4-18-0-escenas-optativas`, `4-18-0-optativas-a`, `4-18-0-pulido-c`, `4-18-2-lazos-a`, `4-18-2-lazos-escenas`, `4-18-3-gastos`, `4-18-4-a`, `4-18-4-b`, `4-19-0-a`, `4-19-0-b`, `4-21-0-b`, `3-1-historia`, `4-13-0-historia-a`, `4-8-noches`. No se corrió `npm run verify` completo (lo pide el cierre).
