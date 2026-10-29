# Hojarasca 4.17.0 (parte B) — Las escenas y los textos del acto III de la Historia

Rama `v4170-b`, sobre `main` = 4.16.0. No se subió la versión. Esto es la parte B: el CONTENIDO del acto III (capítulos 9 a 13 de `GUION_HISTORIA.md`, el último) como datos para el motor de escenas. La parte A (objetivos, disparadores, la noche de defensa y el aplicador de efectos del acto III) la hace otro agente; acá no se tocó `historia.js`, `historia-ui.js`, `historia-disparadores*.js`, `historia-noche*.js`, `guardado.js` ni `main.js`. **Esta tabla de ids es la que manda para los guiones**: al juntar con la lista de A se concilia contra ella.

## Qué hay
- `src/historia-escenas-acto3.js` — `ESCENAS_ACTO3` (id → escena), las **56 escenas**, `IDS_ACTO3`, `EFECTOS_ACTO3` (185 nombres de efecto, para registrarlos uno por uno), `DISPARO_ACTO3` (por escena: capítulo, **dónde tiene que estar parado el jugador**, cuándo y qué objetivo la cuenta) y `POR_DEFECTO_ACTO3` (la opción que vale si se saltea cada decisión: `{ majada: 'a', duendes: 'trato', noche: 'otra' }`). Se arma con seis módulos: `historia-escenas-acto3-c9.js`, `-c10.js`, `-c11.js` y `-c11b.js` (el capítulo 11 tiene 20 escenas), `-c12.js` y `-c13.js`.
- `src/historia-escenas-acto3-util.js` — ayudas puras que se suman a `historia-escenas-util.js` y `historia-escenas-acto2-util.js` (que no se tocaron): los personajes nuevos (`PERSONAJES_ACTO3`, `pj3(...)`), las **condiciones nuevas** con sus constructores (`siTrato`, `siNoche`, `siRamal`, `siDeuda`, `siConvidado`, `siDevolver`, `siPerdon`, `siAmor`, `siPerro`), los **efectos nuevos** (`TIPOS_EFECTO_ACTO3`, `parsearEfectoActo3`) y `primerDe`.
- `src/historia-texto-acto3.js` — `TEXTO_ACTO3`: tarjetas de entrada (con la puerta de estación del capítulo 9 y una frase por la majada o por el trato) y de cierre (por D5, por el trato y por cómo salió la noche), objetivos y optativas en texto, premios, las notas que se leen (el papel de Ramón, el pedido de traslado de Elsa, el informe de cierre, el anexo de Graciela, la ficha del cauquén, la postal de Fermín, los carteles, la última hoja del cuaderno de Eusebio, la página de tratos del invierno), los objetos, el **cuaderno de lo raro** (57 entradas con id), la **charla «tema de historia»** de 17 vecinos (82 líneas), las **piezas de los dos finales** y los **créditos** de la historia. Funciones: `entradaDe3(n, decisiones, { puerta, trato })`, `cierreDe3(n, decisiones, { trato, noche })`, `premioDe3(n, decisiones, { trato })`, `paginaTratosDe3(decisiones, { trato })`, `finalDe3(estado)` y `charlaDe3(quien, cap, estado)`. Llevan el `3` al final para que `main.js` pueda importar las de los tres actos sin chocar.
- `pruebas/verificar-4-17-0-escenas-acto3.mjs` — la prueba (en el gate).

Ninguno está enchufado al juego todavía: `node armar.mjs` no los incluye hasta que A los importe. Son seguros para el empaquetador (un `import` por línea, un `export const` por nombre, sin `export … from`) y puros (sin three ni DOM).

## Tabla de ids: id → capítulo → cuándo / dónde
Los ids de elección también son únicos entre todas las escenas de los tres actos (las elecciones guardadas del motor son planas por id), salvo la decisión `majada`, que lleva el nombre de la decisión.

### Capítulo 9 · Los primeros fríos
| id | cuándo / dónde (jugador parado en…) |
|---|---|
| `ramon-cama` | dentro del Puesto Alto, mañana (8 a 12) del día en que arranca el capítulo (objetivo `subir`) |
| `fermin-tranquera` | afuera del Puesto Alto, al terminar `ramon-cama`: **D5** (objetivo `majada`) |
| `majada-fermin` | entrada del galpón de esquila, al terminar el arreo si D5 = a |
| `majada-vos` | corral de Ramón, la tercera mañana de forraje y agua si D5 = b |
| `majada-belisario` | frente a Belisario, en el Puesto del Paso, al entregar la majada si D5 = c |
| `hojas-canelo` | puerta del Puesto Alto (o del puesto sanitario), la mañana siguiente (5 a 9); con y sin `convidado` |
| `papel-elsa` | optativa, en el andén de la Estación del Valle |
| `visita-ramon` | optativa, frente a Ramón en el puesto sanitario |

### Capítulo 10 · Golpeá antes de abrir
| id | cuándo / dónde |
|---|---|
| `galpon-golpe` | frente a la puerta del galpón del jugador, 22 a 24 (la E dice «Golpear») |
| `galpon-sin-golpear` | repetible: abrir la puerta sin haber golpeado; la luz se apaga y vuelve |
| `galpon-encuentro` | adentro del galpón, justo después de `galpon-golpe`: **D6** (once duendes y el Mandamás) |
| `galpon-trato` | umbral del galpón, si D6 = trato o fuerte (deja la llave del 79 y, si corresponde, la deuda) |
| `galpon-pelea` | adentro del galpón, si D6 = pelea (la segunda parte pasa a la mañana) |
| `cerro-mirador` | mirador del pehuén, mañana (7 a 12) siguiente, con Josefina (lazo ≥ +1) o con Belisario |
| `mesa-guerra` | mesa del refugio, tarde (16 a 20), trae las visitas sin esperar los 3 días |
| `llave-79` | optativa, junto al cajón trabado del molino viejo (sólo si D6 = trato) |
| `pedir-perdon` | optativa, al pie de la raíz del coihue (sólo si D6 = pelea) |

### Capítulo 11 · El arco y la honda
| id | cuándo / dónde |
|---|---|
| `tito-arco` | frente a Tito, la mañana siguiente a dejarle la lenga (o las dos tablas de coihue) |
| `plumas-bosque` | seis plumas juntadas del bosque: Josefina −1 (devolverlas lo compensa) |
| `plumas-gallinero` | seis plumas del gallinero: Josefina +1 |
| `plumas-josefina` | frente a Josefina en la seccional, con lazo de Josefina ≥ +2: +1 |
| `elvira-cuerda` | frente a Elvira, al entregar dos vellones y un pan de cera |
| `anselmo-puntas` | frente a Anselmo, al encargar las doce puntas |
| `blancos-paso` | Puesto del Paso, cinco blancos de paja: **`armas:arco`** |
| `fermin-paces` | frente a Fermín, con un regalo (sólo si D5 = c o su lazo es negativo) |
| `fermin-honda` | galpón de esquila, a mediodía: Fermín enseña la honda |
| `blancos-esquila` | postes del galpón de esquila, cinco latas: **`armas:honda`** |
| `prestado-herrero` | frente a Anselmo: estacas de arado |
| `prestado-apicultor` | frente a Guido: dos trampas de miel |
| `prestado-maquinista` | frente a Martín: la campana vieja del taller |
| `prestado-guarda` | frente a Elsa: la empalizada de durmientes (Elsa +1) |
| `prestado-tobias` | en la pirca del coihue, se dispara sola si D2 = c (cuarta defensa; Tobías +1) |
| `deuda-pagada` | al pie de la raíz (o del tocón), con la bolsa o las seis tablas (sólo si `duendes.deuda` > 0) |
| `recorrer-lado` | orilla del arroyo, atardecer (16:30 a 19:30), con Ramón (o con Josefina si D5 = c) |
| `flechas-de-mas` | optativa, frente a Tito |
| `cumple-nevada` | optativa, en un cumpleaños de la aldea (Ercilia +1) |
| `pareja-noche-antes` | optativa, 19 a 23, **SOLO con el amor prendido** y pareja o saliendo (condición `amor`); sugerida, nunca explícita, nunca obligatoria |

### Capítulo 12 · La noche de la nevada
| id | cuándo / dónde |
|---|---|
| `cena-caliente` | refugio, junto a la mesa, con un plato caliente cocinado (17 a 21) |
| `herminia-estacion` | Estación del Valle, junto a la salamandra, con Herminia y los chicos (sólo si D4 ≠ a: con D4 = a vienen solos) |
| `noche-espera` | puerta del galpón, 21:30 a 23, con el arco y la honda; al terminar arranca la defensa de A |
| `noche-entre-1` | en el galpón, al ganar la primera ola |
| `noche-entre-2` | en el galpón, al ganar la segunda ola |
| `noche-tras-ganar` | en el galpón, cuando `noche = ganada` (antes del amanecer) |
| `noche-tras-perder` | en el galpón, cuando se pierde: «Otra vez» (vuelve a las 22:00 sin castigo) o «Que amanezca» |
| `amanecer-trato-ganada` | puerta del galpón, 5 a 9 si trato y ganada |
| `amanecer-trato-perdida` | puerta del galpón, 5 a 9 si trato y perdida |
| `amanecer-pelea-ganada` | puerta del galpón, 5 a 9 si pelea y ganada |
| `amanecer-pelea-perdida` | puerta del galpón, 5 a 9 si pelea y perdida |

### Capítulo 13 · El deshielo
| id | cuándo / dónde |
|---|---|
| `carpeta-celeste` | andén de la Estación del Valle, mañana (10 a 13): según la cuenta del ramal |
| `majada-fin` | galpón de esquila o loma del Puesto Alto, tarde: según D5 |
| `volver-a-subir` | optativa, en la loma, con el mate (sólo si D5 = c) |
| `josefina-fin` | junto al coihue (o al tocón), tarde: según D4 |
| `fiesta-nieve` | predio de la aldea, 17 a 23 (o la fiesta del deshielo guionada si la fecha ya pasó) |
| `umbral-fin` | umbral del refugio, 7 a 9 del primer día del año: **los dos finales** (el círculo se cierra) |
| `costumbre-dejar` | repetible, después de la historia y sólo en el final A: llenar la bolsa y dejarla |
| `costumbre-regalito` | repetible, la mañana siguiente y sólo en el final A: el regalito |

## Las dos decisiones del acto III
| Decisión | Dónde se toma | Dónde se cumple | Por defecto si se saltea |
|---|---|---|---|
| D5 `majada` | `fermin-tranquera` (efectos `decision:majada:a|b|c`) | A `majada-fermin` · B `majada-vos` · C `majada-belisario` (los lazos van en la escena de cumplimiento; **pisa la anterior**) | a (la lleva Fermín) |
| D6 trato o pelea | `galpon-encuentro` (efectos `duendes:trato` · `duendes:trato-fuerte` · `duendes:pelea`) | `galpon-trato` (trato y fuerte) o `galpon-pelea` | trato (`duendes:trato`) |
| Noche perdida | `noche-tras-perder` (efectos `noche:reintentar` · `noche:perdida`) | — | otra (reintentar, sin castigo) |

- **D6** no usa `decision:`: guarda `duendes.trato` por los efectos nuevos de abajo. La opción «Poner la bolsa de Eusebio en el umbral» (trato fuerte) sólo se ofrece con la condición `devolver-bolsa` (D1 = a o D3 = c): son dos pasos de elección con `si` contrarios (`duendes`, con tres opciones, y `duendes-sin`, con dos), cada uno con su opción por defecto = trato. Las deudas del trato (`duendes:deuda-bolsa` si D1 = b, `duendes:deuda-tablas` si D2 = b) las anota `galpon-trato`; `deuda-pagada` las salda (gasta la bolsa o las seis tablas). Si el jugador ya tiene lo que se pide, A puede pagar en el momento; los efectos son los mismos.
- **Aliados de la noche** (los que se ven en las escenas): Ramón con lazo ≥ +1, Josefina con lazo ≥ +1, Fermín con honda con lazo ≥ +2, el perro (`perro`). Los duendecitos de luz sólo en el trato; la aldea en la loma (faroles y aplausos) con D4 = a.
- **Variantes por los actos I y II**: D1 (bolsa) cambia `galpon-trato` (deuda), `deuda-pagada`, `umbral-fin` y el final; D2 (coihue) cambia `tito-arco` (dos tablas), `galpon-trato`, `deuda-pagada`, `prestado-tobias`, `josefina-fin`, `umbral-fin` (puertita en el tocón) y el final; D3 (molienda) cambia `umbral-fin` y el final; D4 (cuaderno) cambia las entradas del capítulo 9, `noche-espera`, `noche-entre-1`, `noche-tras-ganar`, `herminia-estacion`, `carpeta-celeste`, `josefina-fin` y el final. Los lazos mueven quién está en la noche, en la mesa y en el epílogo. La cuenta del ramal (`ramal-nivel`) cambia `papel-elsa`, `carpeta-celeste`, `fiesta-nieve` y el final.

## Convención de efectos (sigue la de los actos I y II)
Son pasos `{ tipo: 'efecto', nombre, args? }` o el `efecto` de una opción. `EFECTOS_ACTO3` los lista a todos. Se usan como en el acto II: `lazo:`, `decision:majada:`, `raro:`, `objeto:`, `entrega:puertita`, `optativa:`, `prestado:` y `quitar:` (`quitar:harina:1`, `quitar:pan-casero:1`, `quitar:yerba:1`, `quitar:vellon:2`, `quitar:pluma:6`, `quitar:pinon:3`, `quitar:tabla-coihue:2`, `quitar:tabla-coihue:6`). `prestado:` anota quién prestó (`herrero`, `apicultor`, `maquinista`, `guarda`, `tobias`); la condición «tres de cuatro» es de A. Todos idempotentes.

### Efectos nuevos (cuatro tipos; los entiende `parsearEfectoActo3`, no `parsearEfecto`)
| Efecto | Qué hace el aplicador |
|---|---|
| `duendes:trato` | `duendes.trato = 'trato'` (hubo trato) |
| `duendes:trato-fuerte` | `duendes.trato = 'trato'` y `duendes.convidado` +1: devolviste la bolsa (la noche: una vez el enjambre traba al grandote 5 s) |
| `duendes:pelea` | `duendes.trato = 'pelea'` |
| `duendes:perdon` | `duendes.perdon = true` (pediste perdón después de la pelea) |
| `duendes:deuda-bolsa` | suma a `duendes.deuda`: el trato pide una bolsa de harina (D1 = b) |
| `duendes:deuda-tablas` | suma a `duendes.deuda`: el trato pide seis tablas de coihue (D2 = b) |
| `duendes:deuda-pagada` | `duendes.deuda = 0` (en la noche los chicos ayudan; con deuda sin pagar, no) |
| `duendes:vistos` | los viste en el galpón (para el cuaderno y el objetivo `duendes`) |
| `noche:reintentar` | «Otra vez»: la noche vuelve a las 22:00, todo como estaba, sin castigo |
| `noche:perdida` | «Que amanezca»: `duendes.noche = 'perdida'` (final perdido) |
| `armas:arco` | `duendes.armas.arco = true` (el arco ya está conseguido) |
| `armas:honda` | `duendes.armas.honda = true` |
| `perfil:del-valle` | el título de perfil «Del valle» (premio del epílogo) |

### Efectos `mundo:` (el aplicador pone o cambia algo en el mundo; `args.donde` es una referencia de escena)
| Efecto | Qué hace |
|---|---|
| `mundo:ramon-convaleciente` | Ramón sentado con manta junto a la estufa (y con bastón al caminar) |
| `mundo:majada-al-galpon` | la majada llega al corral del galpón de esquila (D5 = a) |
| `mundo:majada-al-paso` | la majada llega al cerco del Puesto del Paso (D5 = c) |
| `mundo:majada-vellones` | mientras la cuidás, la majada te da vellones (D5 = b) |
| `mundo:fermin-lana-amiga` | Fermín te vende lana a precio de amigo (D5 = a) |
| `mundo:fermin-oferta-rechazada` | Fermín rechaza la oferta de Belisario (se queda en el valle) |
| `mundo:fermin-se-fue` | Fermín se fue con las mulas de Belisario (D5 = b con lazo < 0) |
| `mundo:cobro-majada` | el pago de la majada vendida; el importe lo decide la economía |
| `mundo:hojas-canelo` | el atado de hojas de canelo y yuyo pálido contra la puerta del Puesto Alto |
| `mundo:corral-abierto` | la tranquera del corral abierta y las ovejas desparramadas |
| `mundo:galpon-luz-adentro` | la luz amarilla temblona por las rendijas del galpón (y las risas) |
| `mundo:galpon-puerta-entornada` | la puerta del galpón abierta un palmo |
| `mundo:galpon-luz-apagada` | la luz del galpón se apaga de golpe (la broma de «sin golpear») |
| `mundo:galpon-luz-vuelve` | la luz del galpón vuelve a prenderse |
| `mundo:puertita-al-reves` | una puertita de juguete clavada al revés en la puerta del galpón (pelea) |
| `mundo:ventana-barro-y-bellotas` | la ventana del refugio con barro y bellotas contra el vidrio (pelea) |
| `mundo:lado-del-arroyo-marcado` | el lado del arroyo queda marcado en el mapa como el lado de ataque |
| `mundo:mesa-con-mapa` | la mesa del refugio con el mapa del valle abierto |
| `mundo:plan-de-la-noche` | queda armado el plan de la noche |
| `mundo:arco-sin-cuerda` | el arco de lenga sin cuerda (cadena A) |
| `mundo:puntas-de-flecha` | las doce puntas de flecha de Anselmo |
| `mundo:estacas-prestadas` | la fila de estacas de arado en el lado del arroyo |
| `mundo:trampas-de-miel` | los dos frascos de miel de ulmo en el lado del arroyo |
| `mundo:campana-del-taller` | la campana vieja colgada en el galpón (avisa cada ola) |
| `mundo:empalizada-durmientes` | la empalizada de durmientes viejos en el lado del arroyo |
| `mundo:pirca-reforzada` | la pirca del coihue con dos hileras más (D2 = c) |
| `mundo:flechas-extra` | el segundo atado de flechas (más munición) |
| `mundo:nevada-fuerte` | la nevada grande de la historia (clima forzado) |
| `mundo:defensas-armadas` | las defensas prestadas ya armadas en su lugar |
| `mundo:faroles-en-la-loma` | la aldea mirando desde la loma con faroles (D4 = a) |
| `mundo:ramal-salvado` | el informe de cierre roto: el ramal sigue (cuenta ≥ 10) |
| `mundo:ramal-a-prueba` | el ramal queda a prueba un año (cuenta 6 a 9) |
| `mundo:elsa-se-va` | Elsa se sube al tren a Esquel con el papel mandado (cuenta < 6) |
| `mundo:graciela-se-queda` | Graciela pidió el traslado al valle (lazo +3) |
| `mundo:cartel-puesto-catrileo` | el cartel «Puesto Catrileo» en el galpón de esquila (D5 = a) |
| `mundo:chicos-dibujan-puertitas` | los chicos de la escuela dibujan puertitas (D4 = a) |
| `mundo:cartel-arbol-notable` | el cartelito de chapa «Árbol notable. No tocar.» en el coihue (D4 = c); `args.donde` |
| `mundo:ronda-ramitas-final` | la ronda de ramitas en el umbral, como el primer día (final A) |
| `mundo:bolsa-vacia-doblada` | la bolsa vacía de harina, doblada prolija en el escalón (final A) |
| `mundo:puertita-nueva-en-la-raiz` | la puertita nueva con bisagra de cuero en la raíz del coihue (o en el tocón) |
| `mundo:puertita-repisa-abre` | la puertita de la repisa se abre: adentro, un piñón tostado (final A) |
| `mundo:costumbre-del-trato` | desbloquea la costumbre del trato (bolsa en el umbral cada cosecha) |
| `mundo:puertitas-vacias` | las puertitas de las raíces abiertas, vacías y con telarañas (final B) |
| `mundo:bellota-derecha` | una sola bellota puesta derecha en la raíz (final B con perdón) |
| `mundo:canto-blanco-queda` | el canto blanco queda en la repisa (final B) |
| `mundo:arco-y-honda-en-la-pared` | el arco y la honda colgados en la pared del refugio (los dos finales) |
| `mundo:bolsa-llena-en-umbral` | la bolsa llena de harina en el umbral (costumbre del trato) |
| `mundo:regalito-umbral` | el regalito de la mañana: un canto, piñones o una pluma (al azar) |

### Efectos `duende:` (usan `historia-duendes.js`; los duendes NO hablan; `args.tipo` es un tipo de los de `TIPOS_ALIEN` o de los nuevos del Desafío)
| Efecto | Qué hace |
|---|---|
| `duende:yuyero-de-espaldas` | un yuyero (`curandero`) se ve de espaldas huyendo entre los coirones; `args = { tipo, n, desde, hasta, deEspaldas, huye }` |
| `duende:galpon-pillos` | 4 pillos (`rastreador`) sentados en ronda amasando bollitos en el galpón |
| `duende:galpon-saltarines` | 2 saltarines (`saltador`) colgados de las vigas |
| `duende:galpon-lucecitas` | 3 duendecitos con lucecitas ámbar (`enjambre`) |
| `duende:galpon-yuyero` | un yuyero (`curandero`) que huele la harina |
| `duende:galpon-topo` | un topo (`excavador`) junto al pozo del piso |
| `duende:galpon-mandamas` | el Mandamás (`jefe`) sentado arriba de una bolsa, con los hongos del lomo apenas encendidos |
| `duende:galpon-se-congelan` | todos se congelan al entrar vos; `args.n = 11` es el total (no suma al conteo) |
| `duende:galpon-mandamas-camina` | el Mandamás se baja de la bolsa y camina hasta el umbral, despacio |
| `duende:galpon-salen-fila` | los once salen en fila tocándote la bota; el último deja la puerta entornada; `hasta: 'raiz-coihue'` |
| `duende:galpon-huyen` | los saltarines huyen por la ventana (pelea) |
| `duende:galpon-huyen-pozo` | el topo se mete en el pozo (pelea) |
| `duende:galpon-huyen-piernas` | los pillos se escapan entre tus piernas (pelea) |
| `duende:galpon-yuyero-tira` | el yuyero tira su calabacita y corre (pelea) |
| `duende:mandamas-se-va` | el Mandamás sale último, caminando, con una bolsa al hombro; en la puerta se da vuelta (pelea) |
| `duende:viejos-en-la-nieve` | cinco «viejos» (`bruto`, barbudos, con liquen) caminan en fila por la nieve del cerro |
| `duende:lucecitas-mirador` | tres lucecitas ámbar que tiemblan sobre la piedra del mirador (trato) |
| `duende:chicos-suben-cerro` | ocho chicos de las raíces suben a juntarse con los grandes (pelea) |
| `duende:lucecitas-raices` | veinte lucecitas ámbar que se prenden de a una en las raíces del coihue (o del tocón) (trato) |
| `duende:ojos-verdes` | doce pares de ojos verdes del otro lado del arroyo; una bellota pega en la campana (pelea) |
| `duende:viejos-suben-cerro` | los viejos del cerro suben despacio la ladera al amanecer (trato ganado) |
| `duende:lucecitas-rodean-galpon` | las lucecitas salen de las raíces y rodean el galpón; se apagan con el día |
| `duende:gorra-torcida-saluda` | el de la gorra torcida (el que te saludó en el capítulo 6) se acerca, saluda y deja el canto blanco |
| `duende:chicos-arreglan-galpon` | los chicos arreglan el galpón con tablas torcidas clavadas con espinas de calafate (trato perdido) |
| `duende:mandamas-al-bosque` | el Mandamás se va último hacia el borde del bosque, se da vuelta y baja la cabeza (pelea ganada) |
| `duende:suben-todos-al-cerro` | todos suben al cerro en una sola fila (pelea ganada) |

### Efectos de objeto
`objeto:llave-79` · `objeto:foto-de-tres` · `objeto:canto-gemelo` · `objeto:mate-de-chocolate` · `objeto:silbato-de-elsa` · `objeto:cuaderno-del-abuelo`: el objeto de historia queda en la mochila (descripción en `TEXTO_ACTO3.objetos`). `entrega:puertita` deja la puertita en la raíz (descripción en el acto I). `optativa:juntar-ovejas` (la ofrece `hojas-canelo` sin convidar) y `optativa:volver-a-subir` (la ofrece `majada-fin` si D5 = c).

## Condiciones (`si: { cond, args }`; las registra A con `registrarCondicion`)
Las mismas del acto I y II más las nuevas. Una condición sin registrar da `false` en silencio: la variante no se ve pero nada avisa.
| Condición | Qué mira |
|---|---|
| `decision` `{ d, es }` | la decisión d vale es (`majada` también; `ninguna` si todavía no se tomó) |
| `lazo` `{ quien, min?, max? }` | el lazo (la usan los aliados de la noche, la mesa y el epílogo) |
| `evento` `{ id }` | no la usa el acto III, queda registrada |
| `presente` `{ quien }` | no la usa el acto III, queda registrada |
| `trato` `{ es }` | `es` = `trato` (hubo trato, también el fuerte) · `fuerte` (devolviste la bolsa) · `pelea` |
| `noche` `{ es }` | `ganada` · `perdida` |
| `ramal-nivel` `{ es }` | `salvado` (cuenta ≥ 10) · `prueba` (6 a 9) · `traslado` (< 6: Elsa manda el papel). **Nombre distinto de la `ramal` que ya registra A** (esa mira `min`) |
| `deuda` `{ es: 'pendiente' }` | queda deuda del trato por pagar (`duendes.deuda` > 0) |
| `convidado` | convidaste al valle: al menos dos de tres entre D1 = a, D3 = c y D2 = a o c |
| `devolver-bolsa` | podés devolver la bolsa (D1 = a o D3 = c): la opción del trato fuerte |
| `perdon` | `duendes.perdon` |
| `amor` | tenés pareja (o salís con alguien) **y el amor está prendido** en los ajustes |
| `perro` | tenés perro |

## Pedidos para el agente A (lo que el guion usa y todavía no existe)
Las escenas corren igual sin ellos (el motor ignora al personaje o al lugar que no está), pero lo que dependa de ellos no se ve.
1. **Lugares con nombre**: sólo se usan `estacion` y `galpon` (existen en `T.lugares`); el resto se ancla al jugador. Faltan como lugares `puesto-alto`, `puesto-sanitario`, `puesto-paso`, `molino-viejo`, `seccional`, `herreria`, `hilanderia`, `sala-miel`, `taller-ferroviario`, `carpinteria`, `predio-fogon` y `loma`: los dispara A con el jugador parado ahí (`DISPARO_ACTO3[id].jugadorEn`).
2. **Graciela Pugh** (`clave: 'graciela'`): la persona nueva del acto I; las escenas `carpeta-celeste`, `fiesta-nieve` y la charla dependen de ella.
3. **«Tu pareja»** (`clave: 'pareja'`, nombre «Tu pareja»): no es una persona fija; es la persona con quien estás en pareja. Aparece en `pareja-noche-antes`, `fiesta-nieve`, `umbral-fin` y los cuatro amaneceres, **siempre detrás de la condición `amor`** (la prueba lo exige). A tiene que resolver la clave `pareja` (en `posicion` y `aparecer`) a la persona real y, si puede, pisar el nombre del personaje con el suyo al disparar. `pareja-noche-antes` va con `disparador.cond = 'amor'`: si el amor no está prendido, ni se dispara.
4. **La noche** (`historia-noche*.js`): las escenas rodean la defensa. Orden: `cena-caliente` → (`herminia-estacion`) → `noche-espera` → defensa → `noche-entre-1` → ola 2 → `noche-entre-2` → ola 3 → `noche-tras-ganar` (si gana) o `noche-tras-perder` (si pierde, con «Otra vez» → `noche:reintentar` / «Que amanezca» → `noche:perdida`) → el amanecer de la variante. Los efectos `noche:` ya están acá; la defensa propiamente dicha (olas, aliados, honda de Fermín, arsenal) es de A.
5. **Duendes**: los `duende:*` de arriba con `historia-duendes.js`; hacen falta los tipos `saltador`, `excavador`, `curandero`, `bruto` (variante «viejo», barbudo con liquen), `enjambre` (lucecitas ámbar) y `jefe`; once a la vez en el galpón (más el Mandamás): el tope de 8 de `historia-duendes.js` hay que subirlo a 12 sólo para esa escena. Ninguno habla.
6. **Props y objetos**: los `mundo:` de arriba, y los objetos de `TEXTO_ACTO3.objetos` (`llave-79`, `foto-de-tres`, `canto-gemelo`, `mate-de-chocolate`, `silbato-de-elsa`, `cuaderno-del-abuelo`; `arco` y `honda` los da el premio del capítulo 11).
7. **Cuaderno de lo raro**: `TEXTO_ACTO3.raro` tiene 57 entradas del capítulo 9 al 13 con `titulo`, `texto`, `cap`, `donde`; la fecha la pone el aplicador.
8. **Notas que se leen**: `TEXTO_ACTO3.notas` (papel de Ramón, pedido de traslado, informe de cierre, anexo de Graciela, ficha del cauquén, postal de Fermín, carteles, la placa de la plaza, la última hoja del cuaderno de Eusebio `cuaderno-4`, y la página de tratos del invierno con `paginaTratosDe3`).
9. **Optativas**: sus ids en `TEXTO_ACTO3.capitulos[n].optativas`; cada una se cierra con la escena de su mismo nombre (tabla de arriba). `trochita-nieve` es el encargo de temporada que ya existe (sin escena). `juntar-ovejas` y `volver-a-subir` las ofrecen escenas (efecto `optativa:`).
10. **Premios y desbloqueos** (`TEXTO_ACTO3.capitulos[n].premio`): lo material es de A. Los desbloqueos nombrados son `lana-y-vellones`, `lado-del-arroyo`, `arsenal-prestado`, `epilogo` y `juego-libre`.
11. **Estaciones**: la puerta del capítulo 9 usa `entradaDe3(9, decisiones, { puerta: 'temprano' | 'tarde' })`. El clima forzado (helada temprana, la nevada de la historia) y la fiesta del deshielo guionada no están implementados (son de A).
12. **Los finales**: `finalDe3({ decisiones, trato, noche, ramal, lazos, perdon, amor })` arma la tarjeta final con piezas; `TEXTO_ACTO3.creditos` son los créditos de la historia («Ver los créditos»).
13. **La costumbre del trato** (post-historia, sólo final A): `costumbre-dejar` y `costumbre-regalito` son repetibles; A decide cada cuánto (cada cosecha) y el azar del regalito.
14. **Ramificaciones con etiquetas**: `cerro-mirador` y `majada-fin` usan pasos `salto` con `etiqueta` (el motor ya los soporta y la prueba los recorre).

## Decisiones de redacción
- El guion está tal cual donde tiene líneas completas; donde las resume, se completaron con líneas nuevas del mismo estilo (la mesa de guerra, la visita a Ramón, las estacas, la miel, la campana, los durmientes, la noche entre olas, la fiesta, la costumbre del trato).
- Los gestos del guion entre corchetes se traducen con `POSE_DE` a las poses que existen (reír = manos a la cintura; suspirar = manos juntas; curar = `tocar`).
- Los duendes no hablan: sólo el narrador y los efectos `duende:*`. La palabra es «convidar», nunca ofrenda; no hay nada religioso ni sagrado.
- **Lo sensual**: la cita de la pareja es sugerida (un té que se enfría, una mano en el brazo, un silencio largo, una luz que baja y una ventana que se apaga) y la prueba la revisa contra una lista más estricta que la del resto. En la fiesta y el final, la pareja es una presencia, nada más.
- Elecciones: 59 en el acto III, con 159 opciones: 25 con efecto (D5, D6, la noche perdida, lazos) y el resto de **sabor declarado** (`sabor: true`: solo cambia el tono).
- No se reproduce el guion de los finales una vez más en el texto: las piezas del final están en `TEXTO_ACTO3.finales` y cada decisión de los actos anteriores tiene su frase.

## Verificación
- `pruebas/verificar-4-17-0-escenas-acto3.mjs` (en el gate): las 56 escenas pasan el validador del motor; ids exactos; cada una se corre por **todos los caminos de elección** y por las **variantes de decisiones, lazos, trato, noche, ramal, deuda y condiciones del amor** que mira, con un mundo de mentira; se saltan a los 2, 40, 300 y 1500 cuadros; cada elección tiene efecto o es de sabor declarado; los efectos siguen la convención (la del acto I más los cuatro tipos nuevos) y están registrados; largos de línea (≤ 260), de opción (≤ 96), de pregunta (≤ 72) y de párrafo (≤ 420); sin inglés, sin palabras religiosas ni explícitas (y una lista más estricta para la pareja), sin nombres propios ni lugares que no existan (claves contra `gente.js`, `aldea.js`, `gente-campo.js`; lugares contra `T.lugares`); los duendes no hablan; la pareja sólo con la condición del amor; ids de elección únicos contra los actos I y II; tabla de disparo y objetivos consistentes con las tarjetas; D5 y D6 con todas sus ramas y sus valores por defecto; los cuatro amaneceres, los desenlaces del ramal, los dos finales y las piezas de la tarjeta final; esta documentación lista los 56 ids, las 13 condiciones y cada efecto de `mundo:`, `duende:`, `duendes:`, `noche:`, `armas:` y `perfil:`; y **64 mutaciones** de los datos (se rompe una garantía a propósito) que la prueba atrapa todas.
- Pasos de `npm run verify`: ver el informe de la entrega.

## Lo que no se verificó
- No se miró ninguna escena en Electron: el ritmo de los planos, el largo de los diálogos al leer, el humo y los duendes en pantalla, y la puesta en el mundo (las anclas relativas al jugador) hay que verlos jugando.
- Los gestos se probaron contra la lista de poses del motor, no a ojo con cada personaje.
- Los duendes del acto III (once a la vez, el Mandamás, los viejos del cerro, las veinte lucecitas) y los props de `mundo:` no existen todavía: las escenas corren, pero esa parte no se ve.
- La noche en sí (tres olas, aliados, balance, fps) no es de esta parte: acá sólo están las escenas que la rodean y la tarjeta de perderla.
