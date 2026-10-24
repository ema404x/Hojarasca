# 4.10.4 — regresiones de la 4.10.2/4.10.3 y la vida de la aldea (zonas R2 y S2)

Rama `bugs-4-10-4-regresiones-aldea` (desde `origin/main` = 4.10.3). Sin push, sin tocar `main`, sin subir la versión. Informes de origen: `trabajo\bugs6\zona-R2.md` y `zona-S2.md` (revisiones de lectura: cada hallazgo se confirmó antes de tocarlo). No se abrió Electron ni se corrió el gate completo.

## Estado de cada hallazgo

### R2 (regresiones)
| # | Hallazgo | Estado |
|---|---|---|
| R2-1 | La regla G-2 impedía poner piezas chicas adentro de un establo, un corral grande o un cobertizo de heno | **Arreglado y probado.** Confirmado con `r2-solape3.mjs` (todo «Se superpone con otra pieza»). Los tres planos llevan `admiteInterior: true` y la regla G-2 de `construccion.js` no se aplica cuando la que ya está es de esas y la nueva es una pieza chica (no ocupa suelo). La herrería, el local y las demás obras grandes siguen sin fundirse entre sí ni con los edificios del valle; el silo, el herramientero, la fuente, la estatua y la pila siguen macizos (no aceptan nada adentro). Mover o ampliar la propia obra ya andaba por `ignorarObra`. |
| R2-2 | «Seguir recorriendo» (clic) atrapaba el mouse con un panel abierto debajo | **Arreglado y probado.** `btn-seguir`, `cerrar-cuaderno` y `cerrar-mapa` llaman a `volverAlJuego(!!panelDelHudAbierto())`, igual que Esc/J/M. (No se tocó `reanudar` del mando: sólo teclado y ratón.) |
| R2-3 / G-8 | Torreón de piedra: el fondo de la planta baja inalcanzable | **Arreglado y probado.** Confirmado con el arnés de colisiones de bugs5 (BFS con la física del jugador): con la 4.10.3 lo más al fondo que se llega es z local -0,25 en 0° y 180° (la estantería está en 1,8 y el baúl en 1,6); con el arreglo, 1,58 en todos los giros. Se corrió la mesa (con su alfombra y el farol colgante) 10 cm al oeste: de 0,69 m a 0,79 m de pasaje. |
| R2-4 | Aviso «Partida recuperada» falso en una partida nueva | **Arreglado y probado.** `olvidarRecuperada()` borra la marca de la sesión en «Empezar de nuevo», «Otra vuelta» y «Otra corrida» (sólo cuando la partida nueva cupo). |
| R2-5 | Avisos de falla de P10 invisibles, y `metaJuego.terminar()` corría antes del intento | **Arreglado y probado.** `avisarFalla()` suma un cuadro de diálogo (que se ve en la portada y sobre los velos) a la nota; `metaJuego.terminar()` pasa a después de que la partida nueva cupo. |
| R2-6 | Calce de patas del Coihue sólo en el asedio | **Arreglado** (probado por texto del enganche más la prueba V6 existente, que sigue en verde). `actualizarNodriza` calza después de animar, con la rotación real (`n.g.rotation.y`, que cambia al irse) y no mientras cae. |
| R2-7 | Reverb por la mezcla por hora (cambio de nivel no declarado) | **Descartado como bug**: el propio informe dice que es cosmético y probablemente deseable. Sin cambios. |
| R2-8 | El texto «El bosque» promete pájaros que no controla | **No tocado** (ver preguntas). |
| R2-9 | «Pesadilla» no suma duendes después de la noche ~7 en Implacable | **No tocado** (equilibrio; ver preguntas). |

### S2 (vida social y económica)
| # | Hallazgo | Estado |
|---|---|---|
| S2-1 | El mostrador del banco abría con Amadeo donde estuviera | **Arreglado y probado.** Nueva regla pura `bancoAbierto(hora, díaSemana, sábadoDeBaile)` en `aldea.js`, usada por la rutina de Amadeo (sin cambiar su horario: la prueba la compara con la rutina cada cuarto de hora) y por su charla. Fuera de horario (plaza de 18 a 20, domingos, mediodía, sábado de baile desde las 16) es un vecino con quien hablar: `lineaFueraDeHorario` en `banco-voces.js`, con líneas por situación; no abre el mostrador. |
| S2-2 | Las cifras de «ayer» del negocio comprado usaban la fórmula base | **Arreglado y probado.** En un negocio tuyo la charla dice lo que entró de verdad (`n.ultimo`). Además `visitar()` ya no corre antes de armar el resumen: el aviso «hace N días que no pasabas» deja de ser código muerto (verificado: sale, y no sale si acabás de pasar). |
| S2-3 | El alquiler que se va a la deuda no deja aviso y cuenta como cobrado | **Arreglado y probado.** `alquilerDelDia` informa lo aplicado a la deuda; `cerrarCuentas` lo devuelve (`aDeuda`) y la aldea avisa «Tu alquiler pagó $X de tu deuda». «Alquileres cobrados en total» suma sólo lo que entró a la billetera. **Sin renglón en el libro de la billetera** (ver decisiones). |
| S2-4 | Plato fantasma si te sentás en otra mesa | **Arreglado y probado.** Si la limpieza pendiente era de otra mesa, su plato se levanta al sentarte (y al pisarse la ranura en `terminarVisita`). Si volvés a la misma mesa el plato sigue ahí. |
| S2-5 | El pedido pagado se pierde al guardar y salir | **Arreglado y probado.** Campo guardado `pendiente` (id del pedido pagado que no llegó), en la cantina y en la casa de té; se limpia al servirlo; al sentarte de nuevo te lo dejan en la mesa con un aviso. Una libreta vieja carga con `pendiente: null`. |
| S2-6 | «Tiene 1 casa en alquiler» con tres | **Arreglado y probado.** Suma `cuantas` de cada tipo. |
| S2-7 | La panadera vende 3 panes a $200 | **No tocado** (ver preguntas). |
| S2-8 | Mates gratis sin tope | **Arreglado y probado**, con una decisión de equilibrio mínima (ver decisiones): un solo mate por la casa por noche (`fuertes.mate`). |
| S2-9 | Comentario de `cerrarCuenta` que no coincide con el código | **Arreglado** (el comentario; el código no cambia). |

## Decisiones tomadas sin consultar
1. **R2-1: regla explícita por plano** (`admiteInterior`) en vez de tocar la lógica de `sobrePlataforma`/`cubreOtras` o dejar entrar a cualquiera cuyo centro esté adentro: es lo que cambia menos el comportamiento de los demás planos. Sólo establo, corral grande y cobertizo de heno (los que se caminan); el silo y el herramientero siguen macizos como en la 4.10.3.
2. **R2-3: la mesa 10 cm al oeste** (la otra opción era achicar el hogar o ensanchar el pasaje por el otro lado). Mueve también la alfombra y el farol colgante para que sigan centrados; el aspecto no cambia más que eso.
3. **S2-3: aviso y contador, sin renglón en el libro de la billetera.** El libro sólo guarda movimientos de pesos que entran o salen (y `sanearEconomia` descarta los de monto 0); un renglón «a la deuda» o bien no sumaría o bien movería `ganado`/`gastado`. Se eligió lo conservador: aviso diario + «cobrado en total» exacto. Si querés el renglón, es otra decisión (cobrar y pagar el mismo monto, con su efecto en los totales).
4. **S2-5: guardar el pedido pagado** en la libreta (campo nuevo `pendiente`) en lugar de cobrar recién al apoyar la bandeja (eso habría cambiado cuándo se paga).
5. **S2-8: un mate por noche.** Es un tope nuevo a algo que era gratis sin fin; se tomó como bug (era un grifo para bajar la borrachera sin límite). Si te parece que «te frena con un mate cada vez» era el diseño, se quita `fuertes.mate` y vuelve a ser como antes. Los pedidos fuertes siguen limitándose a 3 por noche.
6. **R2-5: el cuadro de aviso reusa `dialogos.confirmar`** con «Entendido / Cerrar» (el módulo no tiene un `alerta`); se deja la nota también.
7. **R2-6: la prueba es por texto del enganche** (el módulo `desafio-eventos.js` no se puede cargar en Node sin el mundo entero); la conducta de `calzarPatasCoihue` ya la cubre `verificar-4-10-3-visual.mjs`.

## Preguntas (no tocado)
- **S2-7, la panadera:** 3 panes por $200 con el pan a $200 cada uno es un descuento ×3 que da $300 a $800 por día de arbitraje. Arreglos posibles: subir a $600 (precio de mercado), o dar 1 pan por $200. Cambia la economía visiblemente: ¿cuál preferís, o queda como «precio de amigo»?
- **R2-8, el texto «El bosque: viento, agua, pájaros y lluvia»:** poner el control en 0 deja los pájaros sonando. Se corrige el texto (sacar «pájaros») o se manda a los pájaros por ese bus. Tocar el texto deja una clave sin traducir hasta el repaso final del inglés (regla vigente), por eso no lo hice.
- **R2-9, «Pesadilla»:** el texto dice «más duendes» pero el tope de 24 de la oleada lo anula desde la noche ~7 en Implacable. Equilibrio.
- **S2-9, `cerrarCuenta` todo o nada:** con deuda de $1.000 y $900 disponibles no se paga nada y se perdona todo. Quedó así (a favor del jugador, tope $1.250); sólo se corrigió el comentario.

## Pruebas nuevas (enganchadas al gate con `sumar-prueba.cjs`)
- `pruebas/verificar-4-10-4-sitios.mjs` (47 pasos): R2-1 (revisarSitio con el mundo llano: cinco piezas chicas adentro de los tres recintos, la herrería y un segundo recinto rechazados, silo/herramientero macizos) y R2-3 (BFS de alcanzabilidad con la física del jugador en cuatro giros).
- `pruebas/verificar-4-10-4-aldea.mjs` (627 pasos): S2-1 (la regla contra la rutina real de Amadeo cada cuarto de hora, y la charla real con `crearAldeaGente` en horario y fuera de horario), S2-2 (los tres negocios del arnés del revisor y el aviso de gestión), S2-3 (18 días de cierre con préstamo vencido), S2-6.
- `pruebas/verificar-4-10-4-interfaz.mjs` (25 pasos): R2-2 (los tres manejadores evaluados con y sin panel), R2-4, R2-5 y R2-6.
- `pruebas/verificar-4-10-4-cantina.mjs` (26 pasos): S2-4, S2-5 (con guardado y recarga de la partida) y S2-8, con la cantina real y una moza de mentira.

Las nuevas fallan sobre el código de la 4.10.3 donde se probó (sitios R2-3, negocios, cantina).

## Pruebas existentes ajustadas (lo mínimo)
- `verificar-3-9-0-cantina.mjs`: la forma exacta de `sanearCantina` ahora incluye `fuertes.mate: 0` y `pendiente: null` (campos nuevos, vacíos).
- `verificar-4-10-3-ajustes.mjs`: la línea que buscaba `nota('No pude empezar otra vuelta'` busca `avisarFalla(...)`.

## Pruebas sueltas que corrí (una por vez, todas en verde)
`verificar-3-6-1-aldea`, `3-6-aldea`, `3-7-0-aldea`, `3-8-3-aldea`, `3-8-6-aldea`, `3-8-7-aldea`, `3-8-8-banco`, `3-8-8-economia`, `3-8-8-negocios`, `3-8-coihue`, `3-9-0-cantina`, `3-9-2-cantina`, `3-9-moza`, `4-0-1-cantina`, `4-0-1-construccion`, `4-0-3-aldea`, `4-0-3-mando-menu`, `4-10-1-npc`, `4-10-2-interfaz`, `4-10-3-ajustes`, `4-10-3-sitios` (G-1..G-6, 122 pasos), `4-10-3-visual`, `4-10-coihue`, `4-2-ampliar`, `4-3-negocio`, `4-4-2-construccion`, `4-4-2-negocio`, `banco`, `coherencia-rc2` (con `node armar.mjs` antes), `construccion-ingenieria-rc8`, `construccion-multinivel-rc9`, `construccion-premium-rc6`, `construccion-senior-rc7`, `construccion-ultra-rc10`, `geometria-headless-rc3`, `guardado-rc2`, `mando`, `persistencia-eventos-rc2`, `estabilidad-rc25`, `2-8-personal`, `idioma`, `idioma-2-4`, `idioma-2-3`, `idioma-1-11`, `idioma-1-10`, más las cuatro nuevas. `herramientas/revisar-escritura.cjs`: sin hallazgos.

**No corrí** `npm run verify` ni `verify:paralelo`, ni nada con Electron.

## Para mirar en Electron (cuando la PC esté libre)
1. Relax: armar un establo para el caballo, un corral grande y un cobertizo de heno y poner adentro un estante, un banco de trabajo, una mesa de campo, un acopio y un catre; mover y girar (Shift+Y) uno ya puesto. Probar que la herrería, un local o el silo siguen sin dejarse fundir con otra obra.
2. Panel del local abierto → Alt+Tab → clic en «Seguir recorriendo»: el mouse debe quedar suelto para usar el panel. Lo mismo con las X del cuaderno y del mapa.
3. Torreón de piedra: entrar, rodear la mesa y llegar a la estantería y al baúl del fondo (y al hogar); mirar la mesa, la alfombra y el farol por si quedó algo raro de aspecto.
4. Banco: hablar con Amadeo a las 18:30 en la plaza, un domingo y un sábado de baile después de las 16: tiene que contestar con su voz y no abrir el mostrador; a las 10 de un día hábil sí.
5. Hablar con el dueño de un negocio comprado después de varios días sin pasar: las cifras de ayer tienen que ser las de la caja, y la línea «hace N días que no pasabas».
6. Préstamo vencido con una casa en alquiler: tiene que salir el aviso «Tu alquiler pagó $X de tu deuda» al empezar el día; en «Casas y alquiler», el cobrado total no debe contar eso.
7. Cantina: sentarse, pedir, levantarse y sentarse en otra mesa antes de que Lucrecia venga a levantar (el plato viejo debe desaparecer); pedir y salir a la pausa/guardar y recargar antes de que llegue el plato (al sentarte debe aparecer, con el aviso); pedir un cuarto fuerte (un mate gratis) y un quinto (ya no).
8. Portada: romper el principal de una ranura (se carga la copia), tocar «Empezar de nuevo» y entrar: no debe salir «Partida recuperada». Y el fallo sin lugar (difícil de provocar) debe verse como cuadro.
9. Noche final del Coihue: mirarlo entrar y irse por una ladera; las patas de cuesta abajo deben apoyar.
