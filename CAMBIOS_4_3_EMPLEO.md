# Hojarasca 4.3 · Parte 1: el empleo fijo (rama `v43-empleo`)

Pedido del usuario (`PLAN_4_3_NEGOCIOS.md`, decisiones del 19-10): poder **tomarse un puesto fijo en un local de la aldea**, ficharlo, hacer el turno con tareas
cortas del puesto y cobrar un sueldo, y **ascender con los días**. Sólo Relax, sin mando, sin inglés (lo de la versión no se tocó: no se subió).
Los jornales de siempre (`trabajos.js`) siguen como extras sueltos.

## Cómo se juega

1. En cada uno de los cuatro locales hay un **cartel de turnos** (un poste con una tablilla y un papel). Parado al lado, el aviso de la E dice
   «Tomar el puesto: Ayudante de mostrador · turno de 16 a 20 · $1.600». E pregunta **«¿Querés trabajar acá? …»** (Tomar el puesto / Ahora no).
2. Si aceptás, **fichás**: aparece el **HUD del turno** (arriba a la izquierda: cargo y local, hora, «tareas 3 de 8», sueldo acumulado y la tarea que toca con
   dónde se hace) y una **flechita dorada con un aro** en el lugar de la tarea.
3. En el lugar, el aviso dice la tarea («Pesar y embolsar la yerba y la harina (3 de 8)») y **E la empieza**: unos segundos con una **barra** en el HUD
   (si te alejás más de 1,3 m se corta y no cuenta). Al terminar suena, **el reloj del juego avanza 0,4 h** y la flecha pasa a la tarea siguiente.
4. A la octava tarea el turno se cierra solo y **cobrás el sueldo** (entra por `economia.cobrar` con el motivo «Sueldo: Ayudante de mostrador, el almacén»
   y la billetera muestra el +$). Un aviso cuenta lo cobrado y lo que falta para el próximo escalón.
5. **Irte antes**: E en el cartel (con el turno en marcha) pregunta y, si aceptás, cobrás lo hecho **menos una cuarta parte** y queda una **falta**; alejarte
   a más de 45 m del local hace lo mismo (a 28 m te avisa). Si no hiciste ninguna tarea no cobrás y el día queda libre para volver a fichar.
6. **Ascensos**: tres escalones por local (Aprendiz, Empleado, Encargado) que se ganan con **días cumplidos** (un turno con al menos 6 de 8 tareas) y con el
   **nivel de un oficio** relacionado. Al cumplirlos, aviso de ascenso («Ascendiste: Despachante · Ahora sos empleado en el almacén y cobrás $2.100 por turno»)
   y el turno siguiente ya paga el sueldo nuevo (el escalón se fija al fichar: no cambia a mitad de turno).
7. El **cuaderno (J)** tiene una página nueva en «Oficios y aldea»: **«Trabajo en la aldea»** (turnos hechos, cobrado, y por local: cargo, escalón, días
   cumplidos, faltas, sueldo, lo que falta para ascender, y los últimos turnos).

## Puestos, turnos, tareas y sueldos

Un turno completo son **8 tareas** (las cuatro del puesto, dos veces cada una, en un orden que cambia cada día y nunca repite la misma dos veces seguidas).
**Un turno por día** (de lunes a sábado: el domingo no se trabaja) y **el turno ocupa uno de los dos jornales del día** (ver «Equilibrio»).
Se ficha desde media hora antes del turno hasta 1,5 h antes de que termine; si llegás con el turno empezado entran menos tareas y cobrás por las que hagas.

| Local (quien manda) | Turno | Aprendiz | Empleado | Encargado | Oficio que cuenta |
|---|---|---|---|---|---|
| Almacén de Ramos Generales (Ercilia) | 16 a 20 | Ayudante de mostrador $1.600 | Despachante $2.100 | Encargado del almacén $2.700 | huertero |
| Casa de Té (Ceinwen) | 9 a 13 | Ayudante de salón $1.600 | Moza de té $2.000 | Encargada del salón $2.600 | huertero |
| Taller ferroviario (Martín) | 8 a 12 | Ayudante de taller $1.800 | Herrero de taller $2.300 | Encargado del taller $2.800 | picapedrero |
| Banco del Pueblo (Amadeo) | 8:30 a 12:30 | Ayudante de ventanilla $1.700 | Cajero $2.200 | Encargado de caja $2.800 | constructor |

Los horarios son los de los vecinos (Ercilia atiende a la tarde, Ceinwen hornea a la mañana, Martín trabaja de 8 a 12:30, Amadeo abre a las 8:30).

Escalones (iguales en los cuatro): **Empleado** con 5 días cumplidos y el oficio en nivel 1; **Encargado** con 14 días y el oficio en nivel 2. El escalón alcanzado no se
pierde. Cada local lleva su propia cuenta.

Tareas (cuatro por puesto; la marca dice dónde):

- **Almacén**: atender el mostrador (frente al mostrador) · pesar y embolsar la yerba y la harina (junto a las bolsas) · acomodar la mercadería en los cajones · barrer la vereda (afuera).
- **Casa de té**: servir el té en las mesas (la galería) · amasar y hornear la tanda · cargar leña a la cocina · armar las bandejas con scones (las tres de adentro: hay que abrir la puerta con E).
- **Taller ferroviario**: atizar la fragua con el fuelle · limar piezas en la morsa · aceitar el juego de ruedas · llenar el barril para templar.
- **Banco**: contar los billetes de la caja · sellar los formularios · ordenar el archivo de legajos · lustrar los bronces de la reja.

## Cómo convive con los vecinos (sin tocar `aldea.js`)

El vecino de siempre **sigue en su lugar** con su horario (Ercilia detrás del mostrador, Martín en la morsa o el yunque, Amadeo detrás de la reja, Ceinwen en la
cocina): el jugador es un **ayudante** que trabaja en sus propios lugares del local, del lado del público (los mostradores del almacén y del banco no se pueden
cruzar). Mientras hay una tarea a mano, **un vecino mirado no le saca la E** (`tapaVecino`, como las fiestas y la cantina) y la E del puesto va **antes que la
del mostrador del almacén**; el cartel que sólo informa cede ante lo que estés mirando.

## Equilibrio (`herramientas/simulador-negocios.mjs 120`)

El turno ocupa un jornal: «turno + el jornal que queda». Con el jugador goloso del simulador (un turno de lunes a sábado, siempre en el puesto mejor pago):

| | por día |
|---|---|
| sólo jornales (como antes) | $2.700 (todo junto, con pedidos y abastecimiento: $3.016) |
| sólo el turno, siempre aprendiz | $1.545 |
| sólo el turno, con los oficios en nivel 2 (asciende: empleado el día 5, encargado el día 16) | $2.324 |
| turno + el jornal que queda, con oficios | $3.912 |
| todo junto con turno y oficios | $4.225 |

Un turno pesa cerca de dos jornales de los de siempre ($1.600 a $2.800 contra $700 a $1.300) pero **cuesta cuatro horas del día** (el reloj corre con cada tarea) y
se lleva uno de los dos jornales. El mejor caso (encargado + oficio nivel 2 + un jornal) queda **~25 % arriba** de los ~$3.200/día de `ECONOMIA_NUMEROS.md`; el
caso corriente (aprendiz o empleado) queda en $2.900 a $3.300. Es para revisar con el usuario si lo quiere más flojo (hay que tocar sólo `PUESTOS[*].sueldos`).

## Archivos

- **Nuevos**: `src/empleo.js` (reglas puras: puestos, tareas, turnos, escalones, sueldos, guardado), `src/empleo-juego.js` (fichar, tareas con E, avisos, HUD,
  cobro, cuaderno), `src/empleo-mundo.js` (los carteles y la marca; sólo `MAT_FAUNA`: no compila nada nuevo), `pruebas/verificar-4-3-empleo.mjs` (en el gate),
  `pruebas/humo-4-3-empleo.cjs` (partida real, no está en el gate), este informe.
- **Compartidos con otras ramas (tocados lo mínimo)**: `src/main.js` (+33 líneas: la importación, la creación aislada con `fallaSistema`, la E después del vecino y
  antes del mostrador, el aviso en el mismo lugar, `tapaVecino`, el `actualizar` por `fallaSistema`, `extras` del cuaderno y `__empleo` de depuración),
  `src/guardado.js` (+4: `empleo: empleoNuevo()` y `sanearEmpleo` como líneas aparte), `package.json` (sólo la prueba nueva en `verify:pasos`; **la versión no se subió**).
  `src/aldea.js` y `plantilla.html` **no se tocaron**.
- **Otros**: `src/trabajos.js` (el turno cuenta en el cupo de jornales: una línea), `src/oficios-ui.js` (páginas extra del cuaderno: genérico, `ctx.extras`),
  `src/guia.js` (una entrada de la guía), `herramientas/simulador-negocios.mjs` (sección del empleo).

## Decisiones que tomé yo (a revisar)

1. **Quién cuenta para ascender**: almacén y casa de té con el huertero, el taller con el picapedrero y el banco con el constructor (no hay un oficio de «atender
   público»; son los más cercanos). Los números (5 y 14 días, nivel 1 y 2) son míos.
2. **El empleador paga siempre**: el sueldo no sale de la caja del local (a diferencia de los jornales de `aldea-viva.js`), así el turno no falla por una caja vacía.
3. **El turno ocupa un jornal** (decisión de equilibrio; el cupo sigue siendo de 2 por día).
4. **El reloj salta 0,4 h por tarea** (con la hora de tu reloj no salta y el turno se mide sólo en tareas). El turno se cierra solo 45 minutos después de la hora de cierre
   o si pasa el día (dormir): en ese caso cobrás lo hecho, sin multa.
5. **Multa y faltas**: irte antes cobra lo hecho menos el 25 % y anota una falta (se ve en el cuaderno); no hay otro castigo (ni reputación ni bloqueo).
6. **Los lugares del puesto son del lado del público** (no se puede cruzar la reja del banco ni el mostrador del almacén); el vecino no se va ni se toma un descanso.
7. **Un solo turno por día aunque abandones** (si hiciste al menos una tarea); fichar y no hacer nada devuelve el día.
8. **Casa de té**: tres de las cuatro tareas están adentro, con la puerta cerrada de entrada (se abre con E como siempre).

## Verificación

- **Verificado** — `npm run verify` completo, una vez y de corrido, al final: **251 pasos OK** (los 250 de antes y `verificar-4-3-empleo.mjs`; 413 s en esta notebook).
- **Verificado** — `pruebas/verificar-4-3-empleo.mjs` (332 comprobaciones, Node): los cuatro puestos y sus escalas, el orden de las tareas, fichar y sus horarios, el cobro completo, proporcional y con multa, el cierre por hora o por día, los escalones (con y sin oficio, y que nunca se baja), el equilibrio, el guardado (una partida vieja sin `empleo` queda como estaba, lo roto se sanea, el turno a medias viaja, el Desafío no lo tiene), el cupo de jornales, el juego completo con un contexto de mentira (cartel, pregunta, tarea con E, reloj, cobro, irse antes, alejarse, la hora con el reloj real, el cuaderno) y lo enganchado en main.js, guardado.js, oficios-ui.js y trabajos.js (sin mando ni textos en otro idioma).
- **Verificado en Electron, partida real** — `pruebas/humo-4-3-empleo.cjs` (219 comprobaciones, con las teclas de verdad, en el monitor externo; no está en el gate): los cuatro locales, cada uno un día (cartel, aviso, pregunta, fichar, HUD, marca, las 8 tareas con E y su barra, el reloj corre ~3,2 h, se cobra, y la E no se la come el mostrador, ni una charla, ni la puerta); cada lugar del puesto **se alcanza a pie** con las colisiones; el cartel que sólo informa (antes de hora, domingo, turno de hoy ya hecho); irse antes (pregunta, multa y falta); el ascenso (con el gancho de la prueba: 4 días + oficio nivel 1) y el sueldo nuevo al día siguiente; el turno a medias en el guardado; y la página del cuaderno. **TODO BIEN** en la última corrida (las corridas anteriores fallaron por la propia prueba: se paraba en el lugar viejo del cartel, o se sentaba en un banco mirando el cartel, o miraba el guardado antes de que se escribiera; se arregló y se repitió entera).
- **Capturas** (a tamaño completo, miradas una por una; en `C:\Users\Andres\Documents\Hojarasca\salida-cantina\empleo\`): `01` el cartel que informa, `02a/03a/04a/05a` el cartel de cada local, `02b-pregunta-del-puesto`, `02b/03b/04b/05b` HUD y marca de la primera tarea, `02c/03c/04c/05c` el cobro, `06a/06b` irse antes, `07-ascenso`, `08-cuaderno-trabajo`. Lo que se vio y se corrigió: la flecha dorada era enorme (se achicó); el cartel de la casa de té y el del almacén estaban pegados a la puerta o a una tarea y el del banco caía en el perchero (se movieron, y el radio del cartel bajó a 1,3 m); había lugares que no se alcanzaban a pie (se corrigieron con un caminador real y quedó como prueba).
- **Razonado, no probado en el juego**: el ritmo de un turno con otras duraciones del día (se probó con el de 30 min); el comportamiento con la hora de tu reloj (sólo en Node); los fps (no se midieron en la 4600G: no hay nada por cuadro salvo la barra mientras se hace una tarea, y 5 mallas estáticas chicas con el material de la fauna).
- **No verificado**: oído (los sonidos son los de siempre: `juntar`, `paso`, `anotar`), jugarlo un día entero a mano, mando (a propósito no se hizo), cargar una partida real guardada a mitad de turno y seguir (sólo el saneado en Node y que el turno está en el guardado).

## Lo que no quedó

- Más locales (panadería, herrería de la aldea, cantina de noche, escuela…): la estructura de `PUESTOS` los admite (una entrada con sus cuatro tareas y sus lugares).
- Minijuegos: las tareas son esperas cortas con barra, no minijuegos.
- Que el vecino se tome un descanso o reaccione al ayudante (no se tocó `aldea.js`).
- El negocio propio, la compra de locales y la sociedad (otra rama, otro agente).
- Textos en otro idioma y mando: a propósito, no se hizo.
