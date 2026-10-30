# 4.17.1 · guion y progreso de la Historia (pase de bugs 8, zonas E2 y E4)

Rama `bugs-4-17-1-progreso` (desde `main` = 4.17.0). Sin subir versión, sin push. Sólo Node: no se abrió Electron, no se corrió el gate ni `verify:paralelo`.
Prueba nueva: `pruebas/verificar-4-17-1-progreso.mjs` (99 pasos, enganchada al gate con `sumar-prueba.cjs`). Corre el código de verdad: los módulos puros, `guardarCopiaPrevia`, el bloque del reinicio e `historiaObjetoCerca` de `main.js` (con `ayuda-codigo.mjs`), y `escribirCopia` de `copias-main.cjs` en una carpeta temporal.

## Estado de cada hallazgo

### Altos
| Hallazgo | Estado | Qué se hizo |
|---|---|---|
| E2-1 · las partidas viejas con la historia TERMINADA se reiniciaban enteras | **arreglado y probado** | `historiaViejaTerminada(h)` en `historia-reinicio.js`: en la 4.14 y antes una historia terminada seguía `activa`; se reconoce por `terminada > 0` o `fase === 'fin'` (lo que deja `cerrarCapitulo` en todas las versiones desde la 3.4), y también la que tenía los ocho capítulos hechos y sólo le faltaba la tarjeta de cierre (`outro` en el capítulo 8). `debeReiniciar` devuelve `false` para esas: sólo se limpia la historia, como decía el comentario de `main.js`. Probado con partidas simuladas: en curso (se reinicia), esperando tarjeta (se reinicia), terminada con `activa`, terminada sólo con el día, sólo con la fase, outro del último, terminada en pausa, en pausa, nunca empezada, Libre sin historia, historia nueva y Desafío; saneadas y sin sanear, y corriendo el bloque real de `main.js` (el mundo queda entero). |
| E2-2 / E4-1 · la copia previa no se podía recuperar | **arreglado y probado** (la (e), con aviso; ver «Decisiones») | (a) La copia va en el formato de «Exportar» (`textoPaqueteCopia` → `empaquetar`), con las fotos; «Importar acá» la acepta. (b) Sale del texto CRUDO que se leyó del guardado (`textoUltimaCarga()` nuevo en `guardado.js`), antes del saneado de la 4.17: trae los objetivos, el momento y los capítulos cerrados de la historia vieja. Lleva su nombre en `historia.copiaPrevia` (una historia vieja nunca lo tiene): importada en esta versión NO se vuelve a reiniciar, sólo se limpia la historia y vuelve el mundo. (c) Sólo cuenta el ARCHIVO: si no se pudo escribir no hay reinicio (antes bastaba la clave del navegador, que no se ve desde el juego); la clave queda como respaldo extra y también es importable. (d) La tarjeta nombra el archivo REAL (`escribir` devuelve el nombre con `-2` si estaba ocupado) y dice cómo traerla («Importar acá»). Con muchísimas fotos que no entran, se reintenta sin las fotos. (e) La carpeta sincronizada: al ofrecer una partida de la carpeta que es la reiniciada (mientras importa) o una con la historia vieja a medias, el cuadro lo dice antes de reemplazar la de esta computadora (`avisoSyncHistoria`, en `textoOferta` y `textoDosCambiaron`). |
| E2-3 · el arco del capítulo 11 podía quedar imposible (las plumas no vuelven) | **arreglado y probado** | La escena `plumas-gallinero` (escrita por B, «necesita gallinero») no tenía disparador: ahora sale junto a tu gallinero (punto nuevo `gallinero-propio`, armado en `puntosDeHistoria` como el galponcito), de 7 a 20, sin seis plumas y sin las otras dos escenas. Con eso el objetivo se cumple y se abren los blancos. El texto del objetivo suma «en tu gallinero (de día)». No cambia el guion: la escena ya existía. |

### Medios
| Hallazgo | Estado | Qué se hizo |
|---|---|---|
| E2-4 · D5 (la majada) se preguntaba dos veces | **arreglado y probado** | La tarjeta de respaldo cuelga de `fermin-tranquera` (donde está la elección), no de `ramon-cama`. La prueba también revisa que cada `tras` sea una escena con disparador. |
| E2-5 / E4-3 · la costumbre del trato no andaba | **arreglado y probado** | Después del final (`fase 'fin'`, final A) la E vuelve a andar SÓLO para la bolsa del umbral (`conEDespuesDelFinal`, `hayEDespuesDelFinal` en `historia-ui.js` y `historiaObjetoCerca`). Además la cuenta de cosechas arranca de las de ese día al dejar el regalito (antes la bolsa volvía en el acto). |
| E2-6 / E4-7 · el cuaderno de lo raro dejaba de anotar a los 60 | **arreglado y probado** | `TOPE_RARO = 160` (hay 108 indicios, cada uno una vez). Guardar y cargar no los recorta. |
| E2-7 · talar el coihue en cualquier capítulo reescribe D2 | **no se tocó: pregunta** | Limitarlo cambia cómo se juega (qué pasa si se tala antes del capítulo 5, o con D2 = a/c ya cumplida). Ver «Preguntas». |
| E2-8 / E4-8 · la consola deja estados viejos | **arreglado y probado** (parcial) | `historia reiniciar` arma una historia nueva de verdad (conserva sólo los vecinos conocidos, como `limpiarHistoria`); `historia capitulo N` suelta al acompañante; la ayuda dice «los trece». Lo que `capitulo N` deja de capítulos posteriores al volver atrás (escenas vistas, decisiones) queda como estaba. |
| E2-9 · pagos de escena que no miran lo que tenés | **no se tocó: pendiente** | Toca los efectos de las escenas de B (`c11b`, `c11`) y el disparador de la raíz; hay dos formas (cobrar lo que se tiene o pedir lo que la decisión cobra). Ver «Preguntas». |
| E2-10 · la tarjeta final no usa las piezas de B | **no se tocó: pregunta** | Cambia el texto del final (guion). |
| E2-11 · desarmar el galponcito traba el capítulo 7 | **no se tocó: pendiente** | Se arregla reconstruyéndolo; un aviso nuevo en el HUD sería texto nuevo. |
| E4-2 · la foto movida, la llavecita y la bolsa le ganaban la E a la puerta | **arreglado y probado** | `cedeALaPuerta` (en `historia-disparadores.js`): con una puerta a mano, la E de esos tres objetos sólo si los estás mirando (frente a menos de ~25° y más que a la puerta). En una grilla del umbral mirando la puerta: 0 de 143 puntos le dan la E a un objeto (antes, 76). Mirando la foto, la foto. |
| E4-4 · las escenas con `hora(x, { dur: 0 })` atrasan el reloj | **no es de esta rama** | Es el motor de escenas y la hora que cambian las escenas (`escenas.js`, `escenas-mundo.js`): lo arregla el otro agente. |
| E4-5 · el prólogo de Bruno contradice el comienzo de la Historia | **arreglado y probado (texto del código)** | Ver «Decisiones». Una partida nueva que entra en modo Historia no ve el prólogo (queda visto) ni la nota «Salí a caminar». En Libre, como siempre. |
| E4-6 · las mutaciones de 4.13, 4.15 y 4.16 medían 3, 6 y 4 | **arreglado y probado** | Un archivo por mutación (`.mut<n>`, y el juntador mutado apunta a la copia del acto con el mismo número) en `verificar-4-13-0-historia-a`, `4-15-0-historia`, `4-16-0-historia-a` y `4-17-0-historia-a`. Midiendo de verdad aparecieron **8 mutaciones que nadie atrapaba**; a cada prueba se le sumó lo mínimo para atraparlas (ver «Pruebas ajustadas»). Ahora: 18 de 18, 30 de 30, 36 de 36 y 32 de 32, todas medidas. |

### Bajos
| Hallazgo | Estado |
|---|---|
| E2-12 · `lenga`: la alternativa de las dos tablas no la marca nadie | **pendiente** (texto o mecánica nueva: pregunta) |
| E2-13 · textos de objetivos | **arreglado**: «volteá»; las paces con Fermín dicen «harina o yerba» (el disparador no acepta pan). La guardia («entre las 22 y las 2» con disparador de 0:30 a 2:30): **descartado**, no es bug: sentado a las 22 el reloj corre ×8 hasta las 0:30 y la escena sale (CAMBIOS_4_16_0_A). |
| E2-14 · el nombre de la copia lleva «4.15.0» fijo | **no se tocó**: marca la versión que hizo el reinicio y la fija `humo-4-15-0-historia`. Lo del nombre ocupado quedó arreglado con E2-2 (d). |
| E4-9 · el objeto más cercano armaba el estado de la historia ~39 veces cada 250 ms | **arreglado y probado**: `objetoCercano` mira la distancia antes de pedir la acción (mismo resultado). |

## Decisiones tomadas sin consultar
1. **Historia terminada (E2-1):** también cuenta como terminada la que tenía los ocho capítulos hechos y sólo le faltaba la tarjeta de cierre (`outro` en el capítulo 8). Es lo más conservador: no había nada a medias y reiniciarla se llevaba el mundo.
2. **Sin archivo, sin reinicio (E2-2 c):** si el archivo de la copia no se pudo escribir (o no hay puente de archivos), la partida NO se reinicia aunque la clave del navegador sí se haya guardado: sólo se limpia la historia. No se agregó un botón para exportar la copia del navegador: esa situación ya no lleva a reiniciar.
3. **La copia importada no se reinicia (E2-2 b):** se reconoce por `historia.copiaPrevia` (campo que ya existía y una historia vieja nunca trae). Importada en la 4.17 vuelve el mundo como estaba y la historia nueva queda en pausa para empezarla cuando quieras (lo mismo que una historia vieja en pausa). En una versión vieja el campo se ignora.
4. **Carpeta sincronizada (E2-2 e):** no se frena la copia a la carpeta; el aviso va en el cuadro que ya pregunta antes de reemplazar (el de la oferta y el de «las dos siguieron»). Del lado reiniciado, mientras importa (tarjeta sin ver o la de acá va más adelantada); del lado de una partida con la historia vieja a medias, avisa que al abrirla se reiniciará. La ida y vuelta con una PC en la 4.14 sigue pudiendo pasar, pero ahora pregunta y avisa.
5. **Fotos en la copia:** la copia lleva las fotos (si no, importarla vaciaba el álbum de esa ranura); si no entra en el tope del archivo, se guarda sin fotos.
6. **Plumas (E2-3):** se usó la escena del gallinero que ya existía en vez de reponer plumas en el bosque (no toca el mundo ni el guion). Pide tener un gallinero construido.
7. **Puerta (E4-2):** la puerta gana salvo que mires el objeto, en lugar de mover los objetos (no cambia dónde están ni el arreglo de la 4.17 C).
8. **Prólogo (E4-5):** con Historia, el prólogo de Bruno no se muestra y queda visto; tampoco la nota «Salí a caminar». No se tocó el texto del prólogo (lo eligió el usuario).
9. **Consola (E2-8):** `historia reiniciar` empieza de cero de verdad; `historia capitulo N` sólo suelta al acompañante (no borra lo de capítulos posteriores).

## Preguntas (no se hicieron porque cambian el guion o cómo se juega)
- **E2-7:** ¿talar el coihue grande fuera del capítulo 5 debe seguir decidiendo/reescribiendo D2? (antes de tiempo, o con D2 = a/c ya cumplida en los capítulos 9 a 13). ¿Y el tocón que rebrota a los 9 días con D2 = b?
- **E2-9:** la deuda del trato y las paces: ¿se cobra lo que tenés (harina o tablas, una sola cosa) o lo que dice la decisión? ¿El pan debe valer para las paces (ahora el disparador no lo acepta)?
- **E2-10:** ¿la tarjeta final debe usar las piezas que escribió B (`finalDe3`, `cierreDe3`…) y el «Elsa manda el papel del traslado» del guion con el ramal < 6?
- **E2-11:** ¿un aviso en el HUD si se desarmó el galponcito en el capítulo 7?
- **E2-12:** ¿se implementa entregarle a Tito dos tablas (si talaste el coihue) o se saca esa alternativa del texto de `lenga`?

## Pruebas ajustadas (lo mínimo) y por qué
- `humo-4-15-0-historia.cjs`: la copia (archivo y clave del navegador) ahora es un paquete de «Exportar»: se lee `cuerpo.progreso.dia` en vez de `dia` (2 líneas). **No se corrió (es Electron).**
- `verificar-4-13-0-historia-a.mjs`: un archivo por mutación; + «instalado, pero sin la Historia en curso, no aparece ninguno» (atrapa «duendes sin Historia»).
- `verificar-4-15-0-historia.mjs`: un archivo por mutación; + Graciela tampoco en el capítulo 3, los fletes no cuentan en el capítulo 3, y el almacén no sale antes de Ramón en la tranquera (atrapan 3 mutaciones que no se medían).
- `verificar-4-16-0-historia-a.mjs`: un archivo por mutación (también el juntador); + la molienda partida cuenta fletes, `baseDe` anota lo molido y lo cocinado, y Josefina lo toma mal una sola vez (3 mutaciones).
- `verificar-4-17-0-historia-a.mjs`: un archivo por mutación (el juntador mutado apunta a la copia del acto III con el mismo número); + con el trato, después de su amanecer no sale el de la pelea (1 mutación).
- Queda como estaba: en las cuatro, una excepción durante la prueba mutada cuenta como atrapada (`catch { atrapadas++ }`).

## Pruebas sueltas corridas (de a una, Node)
| Prueba | Resultado |
|---|---|
| `verificar-4-17-1-progreso.mjs` (nueva) | OK, 99 pasos. Además, a mano: deshaciendo cada arreglo (reinicio de terminadas, copia importada, cosechas de la costumbre, puerta en `main.js`, tope de lo raro, `tras` de la majada) la prueba falla. |
| `verificar-4-15-0-historia.mjs` | OK, 1488 comprobaciones, 30 de 30 mutaciones |
| `verificar-4-13-0-historia-a.mjs` | OK, 193, 18 de 18 |
| `verificar-4-16-0-historia-a.mjs` | OK, 587, 36 de 36 |
| `verificar-4-17-0-historia-a.mjs` | OK, 238, 32 de 32 |
| `verificar-4-17-0-escenas-acto3.mjs` | OK, 22830 (64 mutaciones) |
| `verificar-4-17-0-pulido-c.mjs` | OK, 71718, 0 fallas |
| `verificar-4-16-0-escenas-acto2.mjs` | OK, 1610 |
| `verificar-4-15-0-escenas-acto1.mjs` | OK, 742 |
| `verificar-4-14-0-escenas.mjs` | OK, 77 |
| `verificar-4-1-prologo.mjs` | OK, 75 |
| `verificar-3-8-7-mundo.mjs` | OK, 68 |
| `verificar-trucos.mjs` | OK, 606 |
| `verificar-sincronia.mjs`, `verificar-4-0-1-sincronia.mjs`, `verificar-3-5-1-relax.mjs`, `verificar-4-12-2-carro-guardado.mjs` (88) | OK |
| `verificar-guardado-rc2.mjs`, `verificar-3-5-4-caos.mjs`, `verificar-2-4-1.mjs` | OK |
| `verificar-idioma.mjs` | OK (4669 textos) |
| `node armar.mjs` | OK (478 módulos, 12,00 MB) |

No se corrieron: el gate completo, `verify:paralelo`, ningún humo ni medición.

## Para mirar en Electron
1. `humo-4-15-0-historia.cjs` (ajustado): el reinicio de una partida vieja en curso, la copia en `partidas/hojarasca/copias/` y la tarjeta (ahora más larga: dice «Importar acá»).
2. A mano: importar con «Importar acá» el archivo de la copia en una ranura: debe volver el mundo de antes, sin otra tarjeta de reinicio y sin otra copia.
3. Una partida vieja con la historia terminada (`historia: { activa: true, fase: 'fin', terminada: 40, capitulo: 7 }`): debe abrirse con su mundo, sin tarjeta.
4. La carpeta sincronizada con una partida reiniciada: el cuadro de la oferta debe decir «OJO: esa partida es la que empezó de cero…».
5. `humo-4-17-0-historia.cjs`: la bolsa del umbral; y a mano, terminado con el trato y «Seguir en el valle», la E sobre la bolsa con harina: «Llenar la bolsa…», y a la mañana el regalito.
6. La puerta del refugio con la foto movida o la llavecita (consola: `historia capitulo 9` y `__hojarasca.progreso.historia.temas['obj:llavecita']=1`): mirando la puerta, «Abrir/Cerrar la puerta del refugio»; mirando la llavecita, «Mirar la llavecita».
7. Capítulo 11 con un gallinero propio y sin plumas: la escena «Plumas del gallinero» (cómo queda la cámara junto al gallinero: no se miró a ojo).
8. Partida nueva en modo Historia: después de crear a Bruno no sale el prólogo y se entra a la estación sin la nota «Salí a caminar». En Libre, el prólogo como siempre.
9. Capítulo 9: después de `ramon-cama` no debe salir la tarjeta «Una decisión · La majada de Ramón»; la pregunta va una sola vez, en la escena de Fermín.
