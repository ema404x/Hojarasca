# Zona B: empleo fijo, integración con la aldea, el tiempo y la vida social (4.4.1, rama v44-integra)

Revisor: Claude (sólo lectura sobre el repo). Todo lo que usé está en `C:\Users\Andres\Documents\Hojarasca\trabajo\bugs44\zb\`
(`t1..t8.mjs` en Node, `ea1..ea3.cjs` en Electron oculto con perfil propio, `salida\*.png` capturas). Un solo Electron mío a la vez, cerrado al terminar
(verifiqué `Get-Process electron` = 0 antes y después de cada corrida). No corrí `npm run verify`.

Leyenda: **[V-Node]** lo ejecuté en Node y se ve; **[V-juego]** lo vi en la partida real (Electron) con medición o captura; **[R]** razonado leyendo el código, no ejecutado.

No encontré nada de gravedad ALTA (nada pierde plata, cuelga o rompe un guardado). Lo que sí hay: un agujero de equilibrio, un problema visual que se ve en cuanto
abrís cualquier menú con un turno en marcha, un ascenso que no se avisa, y varias incoherencias entre el empleo y la vida de la aldea (fiestas, baile, compra).

Lo que anduvo limpio (para que no se vuelva a mirar): guardar a mitad de turno y recargar la partida real (turno, tareas hechas, marca y HUD vuelven; [V-juego], `ea2.cjs`);
dormir de noche con el turno abierto (cierra con `dia`, cobra lo hecho: $600 por 3/8, sin multa ni falta, nota «Pasó el día: se cerró el turno»; [V-juego]);
saneado de `empleo` con 14 entradas basura (null, NaN, `__proto__`, `constructor`, `seq` rara, `escalon: 1e9`…): 0 excepciones y el sueldo se recalcula desde el escalón, no se confía en el guardado [V-Node];
fuzz de 400 partidas × 300 acciones al azar sobre `empleo-juego.js` con un contexto de mentira (fichar, tareas, cerrar con los 4 motivos, saltar horas y días, ir lejos, reloj real o no):
0 excepciones, 0 notas con `undefined`/`NaN`, y las invariantes se mantienen (`economia.ganado == empleo.total.cobrado`, nunca más de 1 turno por día, `hechas <= total`) [V-Node, `t6.mjs`].

---

## MEDIA

### B1. El cupo de «dos jornales por día» sólo cuenta en un sentido: con los 2 jornales hechos igual se puede fichar (3 pagos por día)
- **Dónde:** `src/empleo.js:210-222` (`puedeFichar`: no mira los jornales de hoy) contra `src/trabajos.js:51` (`puedeTrabajar`: sí cuenta `turnosDelDia`).
- **Qué pasa:** el informe dice «el turno ocupa uno de los dos jornales» y el simulador de equilibrio asume «turno + el jornal que queda». Si hacés primero los dos jornales (carpintero + herrero, por ejemplo) y después fichás, el cartel te deja y cobrás el turno entero encima. El orden contrario sí se frena (turno + 1 jornal y el tercero dice «Hoy ya trabajaste por dos»).
- **Cómo verlo [V-Node]:** `zb\t1.mjs`, bloque B1: con dos `T.cumplirJornal(...)` hechos el día 2, `E.puedeFichar(p,'almacen',2,16)` devuelve `{ok:true,...}`, se completa el turno y cobra $1.600 más; `jornalesHoy=2` y `turnosDelDia=1` el mismo día.
- **Efecto:** hasta ~$1.000–2.800 de más por día respecto del techo que usó el equilibrio (el encargado con oficio ya queda ~25 % arriba de lo previsto con el cupo bien aplicado).
- **Corrección:** en `puedeFichar`, agregar `if (jornalesHoy(p, dia) + turnosDelDia(p, dia) >= JORNAL.porDia) return { ok: false, motivo: 'cupo' }` (hay que importar de `trabajos.js` sin crear un ciclo: pasar el número de jornales como parámetro desde `empleo-juego.js`, que ya tiene `prog()`), con su texto en `motivoTexto` («Hoy ya hiciste tus dos jornales»).

### B2. El HUD del turno se dibuja ENCIMA de la pausa, el cuaderno (J), el mapa, la guía, etc., y en el modo foto
- **Dónde:** `src/empleo-juego.js:156-166` (se crea en `document.body`, `position:fixed; z-index:6`) + `:168-188` (`dibujarHud`, que sólo corre desde `actualizar`) + `src/main.js:10140` (`actualizar` sólo con `modo === 'jugando' && !foto.activo`). Los velos del juego (`#pausa`, `#cuaderno`, `#mapa`… son `.velo`, `position:fixed` sin z-index, `plantilla.html:480`) quedan por debajo de un z-index positivo.
- **Qué pasa:** con un turno en marcha, al abrir la pausa o el cuaderno el recuadro dorado queda pegado arriba a la izquierda tapando el título del cuaderno / «En pausa» y los primeros botones; en el modo foto (F2) el `#hud` se oculta pero este recuadro no, y queda en la escena. Nadie lo esconde porque `actualizar` no corre fuera de `jugando`.
- **Cómo verlo [V-juego]:** `zb\ea1.cjs`. Fichar en el almacén (`H.__empleo()._fichar('almacen')`), abrir J, Esc y `H.abrirModoFoto(true)`: `#turno-hud` queda `display:block; z-index:6` en los tres casos. Capturas: `salida\02-hud-con-cuaderno.png`, `03-hud-con-pausa.png`, `04-hud-en-modo-foto.png` (en las tres se lee «Ayudante de mostrador · Almacén…» pisando el menú/la foto). Con la mochila abierta sí se esconde (`ver()` mira `panelDelHudAbierto`), por eso en las pruebas del autor no salió.
- **Corrección:** meter el HUD adentro de `#hud` (así hereda el z-order, el `oculto` del modo foto y el zoom de la letra, ver B3) en vez de en `body`; o esconderlo con un `hud.style.display='none'` desde un gancho de cambio de modo. Lo primero es una línea (`document.getElementById('hud').appendChild(hud)` y sacar el `z-index`/`position:fixed` por `absolute`).

### B3. Cuando el oficio llega DESPUÉS de los días, el ascenso se da en silencio (nunca aparece «Ascendiste…»)
- **Dónde:** `src/empleo.js:258` y `:267-268` (`antes = escalonDe(p, t.local)` calculado EN VIVO, que ya incluye el oficio) en `cerrarTurno`.
- **Qué pasa:** `escalonDe` mira días + nivel de oficio al momento de llamarlo. Si cumpliste los 5 días y recién después subís `huertero` a nivel 1, el escalón sube de golpe (el cartel ya ofrece «Despachante · $2.100» y `fichar` fija `escalon=1`), pero al cerrar ese turno `antes == despues` y `ascendio` queda `null`: no hay aviso de ascenso, `l.escalon` guardado queda en 0 y el cuaderno/aviso final sólo dice «Para Encargado…». El caso contrario (el oficio primero y los días al final) sí avisa.
- **Cómo verlo [V-Node]:** `zb\t2.mjs`: `locales.almacen.dias=5`, `sumarXp(p.oficios,'huertero',50)`, fichar/completar/cerrar → «ascendio en cierre: null | l.escalon 0», y el cartel ya decía `Despachante 2100`.
- **Corrección:** comparar contra lo ya anunciado: `const antes = Math.min(ESCALONES.length - 1, l.escalon || 0)` (y que `despues > antes` anuncie y guarde). Opcional: anunciar al fichar si el escalón vivo supera al guardado.

### B4. Los turnos se ofrecen igual en los días de fiesta, de baile y de cumpleaños aunque el jefe «que te dice qué hacer» esté en la fiesta; y los saltos de reloj se comen la fiesta
- **Dónde:** el empleo no consulta nada de `fiestas.js` ni de `aldea.js` (sólo usa `PUESTOS.desde/hasta`). Horarios en conflicto: `aldea.js:2097-2098` (sábado con el salón abierto, todos a casa a las 16:15 y luego al baile 17–19), `aldea.js:1001` (`HORA_FIESTA = [18, 20]`, cumpleaños) y `fiestas.js:858-` (`repartoFiesta`).
- **Qué pasa [V-Node, `t3.mjs` y `t4.mjs`]:**
  - **Almacén (16–20):** Ercilia (y Nélida) se van a las 16:15 los sábados con el salón abierto y no vuelven en todo el turno; los días de cumpleaños de Ercilia (día 6, 18, 30…) está en su casa de 18 a 20; en 6 de los 12 días del año (fiesta del verano, Día de la Aldea, Cosecha, 25 de Mayo, 9 de Julio, Nieve) está en la fiesta durante 2 a 4 h del turno.
  - **Casa de té (9–13):** el día de la minga (día 7 del año) Ceinwen está en la mesa de la minga TODO el turno (`repartoFiesta … 'trabajo' 9-13`); durante «la gran nevada» (palear 8–16) también; en 6 de los 12 días la mesa larga se la lleva de 12 a 13 y en 3 (Día de la Aldea, 25 de Mayo, 9 de Julio) el acto de 10 a 11.
  - **Banco (8:30–12:30):** Amadeo en la mesa de 12 a 12:30 en 6 días del año. **Taller:** Martín no aparece (se queda en el taller).
  - El texto del fichaje sigue diciendo «Ceinwen: «Pasá, querida…»» aunque no esté, y el informe 4.3 promete «el vecino de siempre sigue en su lugar con su horario».
  - Además `terminarTarea` suma 0,4 h por tarea: un turno de 16 a 19:20 se pasa por encima de la fase de juegos y de media hora de baile de una fiesta sin que el jugador la vea (el cartel no avisa «hoy hay fiesta»).
- **Corrección posible (decisión de diseño, ver preguntas):** (a) que el cartel diga «Hoy hay fiesta: [jefe] no está» y no deje fichar mientras el jefe no está en su puesto (`rutinaAldea(jefe, ...)`), o (b) dejarlo y que el saludo/aviso cambie («hoy te toca solo»), o (c) pausar el turno durante la fiesta. Lo mínimo: el aviso del cartel.

### B5. Comprar el local del vecino con el turno en marcha: el turno sigue y te paga un «Sueldo» de tu propio negocio; y el cuaderno no marca el local como tuyo
- **Dónde:** `src/empleo.js:214` (`tuyo` sólo se mira al fichar); `src/negocios-vecinos*.js` no llama al empleo (0 coincidencias de «empleo»/«turno»); `src/empleo-juego.js:262-265` (cuaderno).
- **Qué pasa [V-Node, `t5.mjs`]:** fichás en el almacén, hacés una tarea, comprás el almacén (hablando con Ercilia, que no tapa nada fuera de las tareas) → `esTuyo=true`, el turno sigue «activo», terminás las 8 tareas y `cerrarTurno` cobra $1.600 de «Ercilia» y suma el día cumplido (`dias 1`). Al día siguiente el cartel dice «Este local ahora es tuyo» (bien). El cuaderno sigue listando «Almacén de Ramos Generales · te recibe Ercilia · $… por turno» sin decir que es tuyo.
- **Corrección:** en `empleo-juego.actualizar` (o al comprar) cerrar el turno con `cerrar('dia')` si `esTuyo`; o en `cerrarTurno` no cobrar si el local pasó a ser tuyo. En el cuaderno, anteponer «(es tuyo)» cuando `p.negociosVecinos.comprados[k]`.

---

## BAJA

### B6. «Irse antes» sin multa ni falta: dormir (de noche) o una siesta en la última hora cierran el turno como «tiempo/dia»
- **Dónde:** `src/empleo.js:253-272` + `:275-281` (`motivoDeCierre`); `main.js:1255` (`dormir`).
- **Qué pasa [V-juego, `ea2.cjs`]:** con el turno del almacén a las 19:42 y 3 tareas hechas, `H.__dormir()` → `dia 3`, «Cobraste $600 · 3 de 8 tareas · Pasó el día: se cerró el turno», `faltas = 0`. La multa del 25 % y la falta se evitan siempre que el jugador pueda dormir (de noche en el turno del almacén, o la siesta de 2 h en la última hora de cualquiera: pasa `hasta + 0,75`). [R] para la siesta.
- **Corrección (si se quiere que «irse» pese):** en el cierre por `dia` (y por `tiempo` con `hechas < total` y la hora ya pasada por salto de siesta) aplicar la misma multa y falta si `hechas < total` y el jugador se fue antes de `hasta`.

### B7. Con la hora de tu reloj el turno no se cierra por la hora: se puede fichar a las 8 y terminar a las 23:30 cobrando entero
- **Dónde:** `src/empleo.js:279` (`!reloj && …`), decisión documentada en el informe 4.3 («el turno se mide sólo en tareas»).
- **Cómo verlo [V-Node, `t5.mjs`]:** `motivoDeCierre(p, 2, 23.5, true)` → `null` (con `false`: `'tiempo'`). Sólo el cambio de día cierra el turno.
- **Nota:** es consecuencia consciente; lo dejo como pregunta de diseño (abajo). El cartel y el HUD mostrarían «Terminó el turno» a las 23:30 de un turno «de 8 a 12».

### B8. Dos avisos seguidos al irte a más de 45 m
- **Dónde:** `src/empleo-juego.js:237` (`ctx.nota('Te fuiste del trabajo', …)` y a continuación `cerrar('abandono')`, que da `ctx.nota('Te fuiste del …', textoCierre)` en `:143`).
- **Qué pasa [R + visible en el fuzz: dos notas por abandono]:** salen dos tarjetas casi iguales («Te fuiste del trabajo» y «Te fuiste del almacén»).
- **Corrección:** sacar la nota de la línea 237 (la del cierre ya dice lo que cobraste y la multa).

### B9. La tarea «Armar las bandejas» de la casa de té cae a 0,27 m de una silla del salón; el cuadro HUD no respeta la letra grande
- **Silla [V-Node, `t7.mjs`]:** `PUESTOS['casa-te'].tareas.bandejas = (2.2, -1.2)` contra la silla `mesa-4 (2.02, -1.0)` de `CASA_TE`. Mientras esa sea la tarea pendiente, quien se sienta en esa silla (para que Ceinwen le traiga el té) tiene la E tomada por el empleo (`main.js:3208` va antes que `teJuego.accion` en `:3244`), y el aviso de «sentarse» se pisa con «Armar las bandejas…».
- **Letra [V-juego, `ea3.cjs`]:** `--escala-letra: 1.5` agranda `#hud`, `#pausa`… (`plantilla.html:47`) pero no `#turno-hud`: sigue en 330×100 px y 14 px (medido igual con escala 1 y 1,5). Se arregla solo con la corrección de B2 (meterlo en `#hud`).
- **Además:** `aria-live="polite"` en un texto que se reescribe cada minuto de juego (la hora del HUD): un lector de pantalla lo anuncia sin parar. Sugerencia: sacar la hora del texto con aria-live o `aria-live="off"` y anunciar sólo cambios de tarea.

### B10. El cartel dice «entran N tareas» con una cuenta que no coincide con el cierre real
- **Dónde:** `src/empleo.js:198-202` (`tareasPosibles`: `(hasta + 0,25 - desde)/0,5`) contra `EMPLEO.gracia = 0,75` y las 0,4 h por tarea.
- **Qué pasa [V-Node]:** fichando en el último minuto permitido (`hasta - 1,5`) el aviso promete 3 tareas; el turno cierra recién a `hasta + 0,75` y cada tarea suma 0,4 h + el camino, o sea caben 5 o 6. Para «día cumplido» hacen falta 6, así que un fichaje tardío puede o no sumar día sin que el texto lo diga.
- **Corrección:** usar la gracia y 0,4 h en la cuenta (o decir «entran unas 5 tareas») y avisar «con tan pocas tareas no suma día».

---

## PREGUNTAS DE DISEÑO PARA EL USUARIO

1. **Cupo (B1):** ¿el turno debe contar siempre como uno de los dos jornales (cerrar el agujero) o querés que turno + 2 jornales sea posible?
2. **Fiestas, baile y cumpleaños (B4):** ¿qué querés que pase si el día del turno hay fiesta? Opciones: (a) no se ficha mientras el jefe no está; (b) se ficha pero con un aviso y sin saludo del jefe; (c) el turno se pausa mientras la fiesta; (d) dejarlo como está. Hoy en 6 de 12 días el almacén queda sin Ercilia.
3. **Irse antes (B6):** ¿dormir o la siesta pueden «salvar» la multa o conviene que cuenten como irse (multa y falta)?
4. **Reloj real (B7):** ¿con la hora de tu reloj el turno tiene que cerrarse por la hora como en el resto, o se deja libre?
5. **Compra del local (B5):** ¿se cierra el turno al comprar, o se deja pagar el sueldo hasta el final?
6. **Amistad:** hoy trabajar para Ercilia, Ceinwen, Martín o Amadeo no suma nada con ellos (ni puntos de vecindad ni romance). ¿Querés que cada turno cumplido sume un poco de amistad con el jefe (y que cuente para el 4.4 de «empleados»/compra, que depende de la amistad)?
7. **Faltas:** sólo se anotan cuando te vas explícitamente; dormir o dejar vencer el turno con 2 tareas hechas no es falta. ¿Está bien?

## QUÉ NO ALCANCÉ A REVISAR

- Vecindad (charla, amistad, historia) y romance con los vecinos que son jefes: no encontré enganches con el empleo (0 referencias a empleo/turno/sueldo en `vecindad*.js`, `amor*.js`, `diario.js`, `noticias*.js`), y no hay nada que sume o reste amistad por trabajar; no probé la cita/boda con un jefe durante su turno.
- Citas, asado y cumpleaños de los vecinos CONTRATADOS por el jugador (4.4 empleados): sólo leí `ocupado()`/`ocupacion()` (la fiesta o la cita lo sacan del local y la aldea lo muestra afuera; coherente), sin ejecutarlo en el juego.
- Cantina, peña y casa de té por dentro (carta, cobro, borrachera, truco): sólo verifiqué por Node que `HORARIO_CANTINA` (18 a 2), `penaActiva` (sábado 21:30 a domingo 1:30) y `rutinaAldea` de la moza/bailarina son coherentes, y que comprar la cantina, la casa de té o el almacén no altera su servicio (las tres tienen `puedeIrse:false` y `negocios-vecinos-juego.js` no toca `servicioDe`/rutinas más que con `fijarDesvioRutina` para los que «se van»).
- Que el sábado de baile el banco cierre a las 16 (no choca con el turno de 8:30 a 12:30), el taller y el banco no tienen conflicto de horario propio.
- Sentarse en un banco al lado de un cartel que sólo informa (E del cartel gana si el objetivo es «sentarse», `main.js:3208`), la E con el turno y el kayak/tren/caballo (el enganche los excluye) y el mando (fuera de alcance).
- Picapedrero/hachero: sólo vi que el empleo cuenta el nivel «crudo» de `p.oficios` (sin el bono de tu esposa que sí suma `nivelDe` de main.js); no revisé XP ni los escalones de golpes de pico (`golpesParaPicar` queda en 2 como mínimo, con el filo y el temple `max(1, …)`).
- Fps y memoria del HUD/marca por cuadro (nada por cuadro salvo la barra mientras se hace una tarea; no medido).
- Una partida de otra versión con más puestos: `sanearEmpleo` descartaría los puestos que esta versión no conoce (como pasa con las obras ajenas, que sí se conservan en `main.js`); no es un problema hoy porque sólo hay 4.
