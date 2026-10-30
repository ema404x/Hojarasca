# 4.18.0 (A) — Las subtramas optativas de la Historia: la mecánica

Rama `v4180-a` (worktree `t4180-a`), con la rama de B ya juntada (`git merge v4180-b`). Las escenas y los textos son de B
(`historia-escenas-optativas.js`, `historia-texto-optativas.js`); acá está todo lo que hace que se ofrezcan, se cumplan, se anoten y den su premio.

## Lo que quedó

1. **El registro** (`src/historia-optativas.js`, puro): las 28 optativas del guion (§6 y los bloques «Optativas» de cada capítulo), cada una con
   su ventana de capítulos (`desde` … `hasta`), quién la ofrece y con qué condición (`ofrece`), cuándo está a medias (`enCurso`, `avance`), cuándo
   está hecha (`hecha`), las escenas que la tocan y su premio. Estados: `cerrada`, `ofrecida`, `en-curso`, `hecha`.
2. **Nunca traban**: no son objetivos de capítulo. Una hecha queda anotada en `historia.optativas[id] = día` y da el premio una sola vez.
3. **Hasta cuándo siguen abiertas** (lo que dice el guion; si no dice, el fin del acto):
   | Optativa | Ventana | Nota |
   |---|---|---|
   | frasco-masa-madre | 1–4 | el guion la abre en el 2 y dice 1–2: queda hasta el fin del acto I |
   | oveja, banco-primero | 2–4 | la oveja: la historia ofrece el evento `oveja` en el capítulo 2 |
   | encargo, fermin-pan | 3–4 | |
   | vuelta-ingeniera, vuelta-completa | 4 | Graciela se va al cerrar el 4 |
   | trigo-abuelo, tablas-tito, truchas | 5–8 | |
   | masa-crece, foto-sofia, tres-de-tres | 6–8 | |
   | concurso, fermin-habla | 7–8 | |
   | veta-vuelve, mulas, noventa | 8 | |
   | papel-elsa, visita-ramon, trochita-nieve | 9–11 | Ramón está en el sanitario hasta la noche |
   | juntar-ovejas | 9–10 | «optativa obligatoria del D5»: no traba; si la majada se está arreando (D5 = a o c), espera a que llegue |
   | llave-79, pedir-perdon | 10–11 | |
   | flechas-de-mas, cumple-nevada, alguien-te-espera | 11–12 | hasta la escena de la espera (`noche-espera`) |
   | volver-a-subir | 13 | |
   Los disparadores de cada optativa valen en su ventana (historia-disparadores.js les pisa el `cap`) y van **al final** de la tabla: con la E
   sobre un vecino, primero la escena que es objetivo del capítulo y después la optativa.
4. **El tablón**: el panel de la historia suma un bloque «De paso (si querés)» con las ofrecidas y en curso (☆, el título de B más el avance de la
   mecánica: «1 de 2 lugares con Graciela», «te falta un pan casero…») y las hechas de la ventana (✓). La guía suma «Lo que hiciste de paso»
   (día, título y la línea `hecha` de B).
5. **Los premios del guion**: los lazos los da la escena (`lazo:<quién>:<n>`); si la escena vista no trae el lazo de esa persona, lo da el
   registro (no se duplica: se mira si alguna escena vista de la optativa ya tiene `lazo:<quién>:` o `ramal:`). Lo demás lo da el registro:
   pan de Rosa (un pan casero cada mañana de 6 a 12, tres mañanas desde el día siguiente), Graciela +2 y ramal +2 (si los dos lugares son mirador
   y faro; con la casa de té lo dio `te-graciela`), 10 cantos (la veta), Ercilia +1 con cinta en el concurso del dulce, ramal +1 (la trochita en
   la nieve), 2 vellones (juntar las ovejas: el guion no dice premio; es el de la majada), +15 flechas en la noche (flechas de más),
   $900 por las seis tablas de coihue (Tito: la escena de la 4.16 no cobraba nada).
6. **Disparadores nuevos** (`src/historia-disparadores-optativas.js`): `frasco-repisa` (E en el frasco del refugio, objeto `frasco-repisa`),
   `frasco-rosa` (E sobre Rosa con el frasco, y Rosa en la aldea), `oveja-ramon` (al llegar al Puesto Alto con la oveja; con el perro, al pasar
   por el puesto), `pan-fermin` (E sobre Fermín con pan o harina), `vuelta-mirador` y `vuelta-faro` (con Graciela de acompañante), `juntar-ovejas`
   (las seis en el corral), `cumple-nevada` (el cumpleaños de hoy de la aldea, de 15 a 21, en la casa o la plaza), `plumas-gallinero` (seis plumas
   junto a tu gallinero; le gana a las del bosque), `galpon-sin-golpear` (E «Abrir la puerta del galpón sin golpear», objeto `puerta-galpon-abrir`,
   capítulo 10 de noche, **repetible**). `costumbre-dejar` y `costumbre-regalito` las dispara el juego a mano (repetibles) al llenar la bolsa del
   umbral y al regalito de la mañana; la harina la gasta la mecánica una vez por año (el `quitar:harina:1` de la escena se da por aplicado).
7. **El arreo de las optativas** (`historia-arreo.js` y `-mundo.js`): `crearArreo` acepta `posiciones` y `min`. La oveja escapada (capítulo 2,
   «Arrearla vos» en el evento) arranca a 55 m del puesto hacia el mirador y te sigue; las seis desparramadas (capítulo 9) quedan entre 18 y 42 m
   del corral, siempre en el mismo lugar, y tienen que volver todas. Mismas mallas y materiales que la majada (0 programas nuevos).
8. **La oveja de Ramón**: la historia ofrece el evento `oveja` una vez en el capítulo 2, al rato de empezado (el mismo rato que un momento «pronto»).
   Un evento de la oveja de antes del capítulo no cuenta.
9. **Lazo +1 por encargos** de los vecinos con arco (Ramón, Josefina, Ercilia, Elsa, Fermín, Graciela): cada encargo cumplido con la historia en
   marcha suma +1 a quien lo pidió, una vez. La primera vez, lo ya hecho queda de base sin lazo (`historia.encargosLazo`: `null` = sin base).
10. **La charla de historia**: hasta la 4.17 las líneas `charla` de los textos no se mostraban en ningún lado. Ahora la E sobre un vecino dice
    primero una línea de historia (una vez cada una): la del capítulo en curso cuya condición se cumple o, aunque el capítulo haya pasado, la «de
    después» de una optativa (las de B ganan a igual capítulo). `rosa-c2-frasco` («¡traelo!») es de antes: vale mientras el frasco está ofrecido.
11. **La bolsa del umbral con la historia terminada**: la E de la costumbre del trato no andaba en la fase `fin` (el objeto se veía pero la E
    estaba cortada); ahora sí, y sólo esa.
12. **Enganches de C** (tablero): `OBJETOS_PROPS_ACTO3` en OBJETOS, `efectoMundoHistoria(id, args)` y `efectoDuendeHistoria` avisan a los
    objetos, Fermín en el techo del galpón en `aliadosDeNoche`. Con un hueco `src/historia-props-acto3.js` que se reemplaza con el de C al juntar.

## Claves nuevas (A)
- `historia.optativas` `{ id: día }`, `historia.oidas` `{ idLínea: día }` (tope 400), `historia.panRosa` `{ quedan, ultimo }`,
  `historia.flechasExtra` (n), `historia.encargosLazo` `{ idEncargo: día | 0 }` o `null`. Todas en `historiaNueva` y `sanearHistoria`.
- Temas: `optativa:oveja` (la ofreció la historia, con el día), `arreo:oveja-ramon`, `arreo:corral-ramon`, `vuelta:mirador`, `vuelta:faro`.
- Estado (`estadoHistoria`): `encargos`, `eventosOpcion`, `ofrecidas`, `pan`, `tablasCoihue`, `cumple`, `cintaDulce`.
- Lugares (main.js): `cumple` (la casa o la plaza del cumpleaños de hoy) y `gallinero`.
- Disparador: `repetible: true`. Noche: `crearNoche({ flechas })`.
- Objetos: `frasco-repisa`, `puerta-galpon-abrir` (los dos sin malla: forma null).

## Archivos
Nuevos: `src/historia-optativas.js`, `src/historia-disparadores-optativas.js`, `src/historia-props-acto3.js` (hueco de C),
`pruebas/verificar-4-18-0-optativas-a.mjs`, `pruebas/humo-4-18-0-optativas.cjs`.
Tocados: `historia.js`, `historia-ui.js`, `historia-disparadores.js`, `historia-disparadores-acto2.js` (las tablas de Tito piden las tablas),
`historia-disparadores-acto3.js` (las plumas del bosque ceden al gallinero), `historia-arreo.js`, `historia-arreo-mundo.js`, `historia-noche.js`,
`historia-noche-mundo.js` (flechas), `main.js`, `package.json` (verify:pasos), y las pruebas viejas que miraban textos que cambiaron
(4.15 historia, 4.16 historia A, 4.17 historia A, 4.17 pulido C).

## Pruebas
- `pruebas/verificar-4-18-0-optativas-a.mjs`: 368 comprobaciones, 20 de 20 mutaciones atrapadas (cada una en un proceso aparte sobre una copia de `src/`).
- `pruebas/humo-4-18-0-optativas.cjs` (Electron, monitor externo, ~25 min entero): con las 7 escenas de B registradas, las 28 optativas hechas al menos
  una vez (27 en la corrida entera; el cumpleaños falló y se arregló —ver abajo— y la sección 3 se volvió a correr en verde), más abrir sin golpear
  (dos veces), las plumas del gallinero y la costumbre (dejar la bolsa con una sola medida de harina y el regalito). Programas: 111 → 113; los +2 salen
  con la escena «La masa que crece sola» (23:36 en la aldea) y el control del Relax libre de noche en la aldea suma 3: no son de las optativas.
- Las de historia anteriores (4.15, 4.16, 4.17 A y pulido C) y la de B (4.18 escenas), en verde.

## Arreglos que salieron del humo
- La E de «Abrir sin golpear» quedaba a 1,8 m de la de «Golpear» y ganaba siempre «Golpear»: ahora a 3 m.
- El cumpleaños: la fiesta del juego libre sólo la hacen los cercanos tuyos, así que casi nunca había. Ahora, si no hay fiesta, el que cumple hoy y
  vive en la aldea lo festeja en el almacén de Ercilia (como dice el guion); casi todos los días hay uno.
- La escena «Las mulas de Belisario» es larga: el humo la lee 110 s y saltea el resto con Esc.

## Lo que no
- Rosa, Tobías, Tito, Belisario, Herminia, Nicanor y Sofía no tienen lazo en la historia: sus `lazo:` se ignoran (como antes).
- «Fermín quiere hablar» → «D5 A sin costo»: la opción A de D5 ya no tiene costo con Ramón, así que no hay nada que destrabar.
- Las optativas con «algo rico» (visitar a Ramón) o «una torta» (Herminia) no gastan nada: las escenas no lo piden.
- El frasco y la puerta de abrir sin golpear no tienen malla propia (sólo la E): si C pone una, va en `historia-objetos.js`.
