# Hojarasca — Guion de la Historia nueva: «El trato del molino»

> Documento de guion para aprobar (etapa 1 de `DECISIONES_HISTORIA_NUEVA.md`). No toca código.
> Reemplaza el guion de los 8 capítulos actuales de `src/historia.js`; reutiliza los sistemas del juego.
> Cómo leerlo: la **página 1** (resumen) alcanza para aprobar la idea. Después, de a un capítulo por vez.
> Las marcas **[EXISTE]** y **[NUEVO]** dicen si una condición o mecánica ya está en el juego o hay que hacerla
> (todo lo [NUEVO] está juntado al final, en «Necesidades técnicas»).

---

## 1. RESUMEN (una página)

**Premisa.** Respondiste un aviso chiquito del diario de Esquel: *«Se cede refugio en el valle a quien lo habite y lo
cuide. Preguntar por Ercilia, almacén de la Aldea de los Duendes.»* El refugio era de **Don Eusebio Millán**, el último
molinero del valle, que murió el invierno pasado. Llegás en la trochita con una mochila y la llave. Nadie te eligió:
el valle se está quedando sin gente y vos fuiste el único que contestó.
Al arreglar el refugio aparece la última bolsa de harina de Eusebio con una nota: *«Para la raíz del coihue grande,
antes del primer frío. No te olvides, que ellos no se olvidan.»* Desde ahí, en el valle empiezan a pasar cosas chicas:
herramientas que cambian de lugar, risas lejos, regalitos en el umbral, siluetas que corren entre las raíces.
Mientras tanto, la vida sigue y aprieta: el ramal de la trochita puede cerrar si no hay carga, Ramón se pone viejo,
y la aldea necesita que el molino vuelva a moler antes del invierno.

**Tono.** Cálido, con humor de mate y de vecino, misterio ambiguo (nunca se sabe del todo si los duendes son buenos o
malos hasta el clímax), paisaje de bosque, lago, estepa y nieve. Nada religioso, nada explícito, nada de sangre.
El valle y su gente son los protagonistas; vos sos el que llegó y decidió quedarse.

**Estructura.** 13 capítulos en un año del valle (verano, otoño, invierno y el primer día del año siguiente),
**unas 6 h** el camino principal y **~8 h** con las subtramas. Tres actos:
- **Acto I — Verano: quedarse** (cap. 1–4). Llegada con gancho, refugio, vecinos, trochita, la inspectora del ramal.
- **Acto II — Otoño: el molino** (cap. 5–8). El molino vuelve a moler, los indicios crecen, la cosecha;
  **punto medio** (fin del cap. 7): alguien abrió las bolsas del galpón y las dejó ordenadas en ronda; aparece
  el cuaderno de Eusebio: hubo un trato.
- **Acto III — Invierno: la noche** (cap. 9–13). Ramón se enferma, el encuentro en el galpón (**TRATO o PELEA**),
  las misiones del **arco** y la **honda**, la **noche de la nevada** (defensa de 3–5 min) y el epílogo.

**Personajes con arco (6).**
- **Don Ramón**, puestero del Puesto Alto: no sabe soltar nada; guarda un secreto del invierno de la ceniza.
- **Josefina**, guardaparque: lo cuida todo sola; esconde el cuaderno de su abuelo, que dibujaba puertitas.
- **Ercilia**, almacenera: quiere que la aldea no se vacíe; tiene en la libreta de fiado una cuenta que no cierra.
- **Elsa**, guarda de la trochita: el ramal es su vida y la pueden dejar sin tren.
- **Fermín Catrileo**, pastor «a medias» de Ramón: quiere algo propio y no se anima a pedirlo.
- **Graciela Pugh** *(nueva)*, ingeniera de la Administración del Ramal: vino a cerrar el ramal y trae el informe
  ya firmado en el portafolios.
- *(Ausente que pesa)* **Don Eusebio Millán**, el molinero: sólo por sus notas, su letra y su cuaderno.

**Seis decisiones grandes** (cambian misiones, relaciones y finales): la bolsa del molinero (cap. 2), el coihue de
las puertitas (cap. 5), la primera molienda (cap. 7), contar o callar (cap. 8), la majada de Ramón (cap. 9) y
**trato o pelea** (cap. 10). Además, la noche se puede **ganar o perder** (y reintentar sin castigo).

**Los dos finales.**
- **Final A — «El trato»**: en la noche, los duendes chicos están de tu lado (con lucecitas detrás de vos) y los que
  bajan son «los del cerro», más viejos y hambrientos. Con el deshielo hay una puertita nueva en la raíz del coihue y,
  cada cosecha, una bolsa del molino se deja en el umbral. Lo que se deja vuelve: el valle sigue raro y vivo.
- **Final B — «La pelea»**: echaste a los duendes del galpón y vuelven todos, con los del cerro, la noche de la nevada.
  Ganes o pierdas, con el deshielo las puertitas de las raíces están vacías. El valle queda más tranquilo y más callado;
  Herminia deja una puerta entornada «por si acaso». Lo que cambia es quién quedó al lado tuyo.
- Cada final tiene variantes según la noche (ganada o perdida), el ramal (salvado o a prueba), Ramón y Fermín,
  el cuaderno de Josefina y si Graciela se queda.

---

## 2. Reglas del guion

### 2.1 Duración y ritmo
| Acto | Capítulos | Estación del valle | Minutos (principal / con optativas) | Pulso |
|---|---|---|---|---|
| I | 1–4 | Verano (días 1–4) | 105 / 140 | Enganche, calma, comunidad, primera grieta |
| II | 5–8 | Otoño (días 5–8) | 125 / 165 | Construcción grande, misterio que crece, **punto medio** |
| III | 9–13 | Invierno (9–12) y día 1 del año 2 | 135 / 175 | Crisis, encuentro, preparación, **clímax**, epílogo |
| | | | **~6 h 05 / ~8 h 00** | |

Con la duración de día por defecto (30 min reales por día) el año del valle (12 días) cubre la historia. Las
**puertas de estación** (cap. 5, 9 y 12) esperan la estación; si el jugador viene adelantado, se duerme o se hacen
optativas; si viene atrasado y la estación ya pasó, **la historia no espera más de 2 días**: trae su propio clima
(una helada temprana, una nevada) [NUEVO: clima forzado por la historia].

**Curva de tensión** (1 = calma, 5 = máximo):
```
cap:      1   2   3   4   5   6   7   8   9  10  11  12  13
tensión:  3   1   2   3   2   3   4*  3   4   5   3   5*  2
            calma ^       ^giro   ^punto medio ^encuentro ^clímax
```
Alternancia: cada capítulo de misterio o acción viene después de uno de construcción y vida de valle.

### 2.2 Cómo entran los duendes (escalera de indicios)
Los duendes **nunca hablan**: se ven y se oyen. Se usan los modelos del Desafío (`duendes-modelo*.js`) con el
animador chico de `historia-duendes.js` (quieto, mirar, ir/correr, huir/desaparecer, saludar, reír, esconderse).
| Escalón | Capítulos | Qué se ve u oye | Tipos usados |
|---|---|---|---|
| 1. Sospecha | 1–3 | Una risa lejos de noche; algo chico cruza el sendero al atardecer; las ramitas aparecen en ronda | `rastreador` (pillo), de lejos y de espaldas |
| 2. Cosas que se mueven | 4–6 | Herramientas cambiadas de lugar; un canto rodado brillante en el umbral; montículos en la huerta; luces sobre el lago | pillo, `excavador` (topo, sólo los montículos), `volador` (lechucero, silueta contra la luna) |
| 3. Se dejan ver | 6–8 | Siluetas mirando desde las raíces del coihue grande; corren cuando los mirás; una saluda con la mano | pillo, `enjambre` (duendecitos de ojos ámbar, como luciérnagas raras) |
| 4. Encuentro | 10 | Diez o doce en el galpón, con las bolsas; el `jefe` (Mandamás) en la puerta | todos los chicos + Mandamás |
| 5. La noche | 12 | Un solo lado de ataque | ver capítulo 12 |

Lo que hacen depende de las decisiones (regalitos si convidaste; travesuras si no): siempre **ambiguo**, nunca
dañino de verdad (nada se pierde para siempre antes del clímax: lo que se llevan aparece en otro lado).
La risa de los duendes sigue apagada en el Relax y sólo suena en escenas de Historia (decisión de la 3.8.5).

### 2.3 Restricciones que respeta este guion
- Sólo teclado y ratón. Las escenas avanzan con **Espacio / clic**, se saltean con **Esc** (pide confirmación).
- Personajes con las poses y gestos que ya existen (`gente.js` `posar`, `gente-cuerpo.js` `POSES`,
  `social-anim.js`): saludar, asentir, negar, pensar, reír, encogerse, cruzarse-brazos, suspirar, palmada-hombro,
  abrazar, cebar-mate/tomar-mate, sentado, leyendo, contar, mirar, señalar con «mirar», sorprenderse, susurrar,
  hacer-broma, aplaudir, brindar, martillar, serruchar, amasar, jinete, tirar.
- Mundo único: todo pasa en lugares que ya están (refugio, Estación del Valle, Aldea de los Duendes, Puesto Alto,
  muelle, faro, mirador del pehuén, arroyo y molino, galpón de esquila, cantera, Puesto del Paso, mallín).
- Nada religioso ni criaturas del folclore sagrado; la palabra para lo que se deja es **«convidar»**, no ofrenda.
- Lo romántico, sugerido (la subtrama de amor es optativa y respeta el interruptor de Ajustes).
- Ideas rechazadas que **no** aparecen: invasores que roban (los duendes toman y devuelven; en la noche no roban:
  vienen por el galpón y se van), trincheras, sabotaje, expediciones, noche de ladrones o de tormenta, espantajos,
  farol que encandila.

---

## 3. Personajes

Cada uno tiene un **lazo** con vos [NUEVO: `historia.lazos`], de −2 a +3: **frío (−2), tirante (−1), conocido (0),
de confianza (+1, +2), de la casa (+3)**. Sube y baja con decisiones y optativas; decide quién está en la noche
y qué variante de final ve cada uno. (Se puede apoyar en la `gratitud` de los eventos del valle, que ya existe.)

### 3.1 Don Ramón — el que no suelta
- **Quién:** puestero del Puesto Alto, cuarenta inviernos con la majada, poncho, boina y el mate en la mano.
  Te dice «m'hijo». Tuvo un perro, Chocolate. Le vendieron el zaino «manso» y casi lo mata (Belisario).
- **Deseo:** que el valle siga como lo vio crecer. **Miedo:** volverse inútil; que la majada lo sobreviva sin él.
- **Secreto:** en el invierno de la ceniza, con la majada muriéndose de hambre, alguien le dejó piñones en la puerta
  todas las noches. Nunca supo quién ni dio las gracias. Desde entonces deja un puñado de yerba en una raíz del bosque
  de la ladera y no se lo contó a nadie (ni a Eusebio, que «seguro sabía»).
- **Arco:** de cuidar todo él solo (y retarte por cómo hacés las cosas) a **soltar**: dejar que Fermín lleve la majada
  o dejarse cuidar por vos. Si el lazo llega a +3, en el epílogo te regala el mate de Chocolate (la calabacita tallada).
- **Cómo cambia según vos:** D1 (bolsa) y D5 (majada) lo mueven mucho. Con lazo ≥ +1 está en la noche
  (repara defensas, como en el Desafío). Con lazo ≤ −1 no viene, y en el epílogo lo ves mirar desde la loma.

### 3.2 Josefina — la que lo cuida todo sola
- **Quién:** guardaparque, trenza, sombrero, la tablilla en la mano; vino a Bariloche a estudiar biología, se anotó
  por un verano y se quedó quince años. Su compañera de la seccional es Julia Antiñir. «Las plumas se quedan en el bosque.»
- **Deseo:** que el valle quede salvaje y entero. **Miedo:** que lo descubran y lo arruinen (turistas, loteos,
  gente que viene a buscar duendes con linterna).
- **Secreto:** su abuelo traía el trigo en carro desde la estepa al molino de Eusebio, y llevaba un **cuaderno con dibujos
  de puertitas en las raíces** y una frase: «El molino muele para todos los del valle. Para todos.» Ella lo tiene
  guardado en la seccional y nunca lo mostró: le da vergüenza (es científica) y miedo (si se sabe, viene gente).
- **Arco:** de cuidar todo sola y desconfiar del recién llegado (te ve talar el primer árbol con los brazos cruzados) a
  **compartir**: te muestra el cuaderno, y en D4 decide con vos qué hacer con él. Al final, o lo publica, o lo guarda,
  o lo deja en tu repisa.
- **Cómo cambia según vos:** D2 (el coihue) y D4 (contar o callar) la mueven mucho; también las plumas del arco
  (cap. 11). Con lazo ≥ +1 está en la noche (tira flechas, como en el Desafío).

### 3.3 Ercilia — la que quiere que nadie se vaya
- **Quién:** almacén de ramos generales en la Aldea de los Duendes; tres generaciones de mostrador; te dice «querido»;
  sabe todo antes que nadie. Ayudante: Nélida («vos sabés sumar»).
- **Deseo:** que la aldea no se vacíe; que vuelva a haber chicos en la escuela y bolsas en el andén.
  **Miedo:** cerrar la persiana como la cerró su tía, y que nadie lo note.
- **Secreto:** fue ella la que puso el aviso en el diario. Y en la libreta de fiado de su abuela hay una cuenta a
  nombre de **«Los de la raíz»** que dice *«debe: nada · se les debe: una»*, de puño de Eusebio. Nunca entendió qué se
  les debe.
- **Arco:** de la vecina que te usa un poco (te manda a cuidar el almacén, a llevar encargos) a la que admite que te
  trajo porque tenía miedo, y que la aldea se salva con gente, no con milagros. Si el ramal se salva, organiza la
  Fiesta de la Nieve más grande en años.
- **Cómo cambia según vos:** D1 (pan para la aldea), D3 (fiado de invierno) y D4 (contar en el fogón).

### 3.4 Elsa — la del tren
- **Quién:** guarda de la trochita; botones de bronce, rodete; abuelo maquinista, madre boletera; una vez quedó dos
  días varada en la nieve haciendo guiso en la salamandra. Te dice «pasajero» (hasta que te dice tu nombre).
- **Deseo:** que el tren siga pasando. **Miedo:** ser la última guarda del ramal. **Secreto:** pidió el traslado a
  Esquel «por si cierran», y tiene el papel sin mandar en el bolsillo del sobretodo.
- **Arco:** de la resignación graciosa («el tren se maneja con las orejas») a pelear por el ramal con números:
  te enseña a manejar, te consigue fletes, y en el epílogo rompe el papel (o lo manda, si el ramal queda a prueba
  y no la ayudaste).
- **Cómo cambia según vos:** cap. 4, D3 (fletes a Esquel) y las optativas de fletes.

### 3.5 Fermín Catrileo — el que no pide
- **Quién:** pastor del galpón de esquila, en la estepa; cuida las ovejas de Ramón «a medias» (se queda con la mitad de
  los corderos). «Ramón es así: te regala las cosas diciéndote que ya eran tuyas.»
- **Deseo:** un puesto y una majada propios. **Miedo:** que Ramón lo tome como una traición.
  **Secreto:** Belisario le ofreció irse con las mulas al otro lado de la cordillera; tiene hasta el invierno para contestar.
  Además, es el que mejor tira con honda del valle (de chico espantaba zorros) y no le gusta que se sepa.
- **Arco:** de callado y servicial a **pedir lo suyo**. En el cap. 11 te enseña la honda; en D5 se juega su futuro.
- **Cómo cambia según vos:** D5, la misión de la honda y las optativas de la majada.

### 3.6 Graciela Pugh — la que vino a cerrar *(personaje nuevo)*
- **Quién:** ingeniera de la Administración del Ramal, de Trevelin; sobretodo gris, portafolios, botas que no son para
  barro. Habla rápido y anota todo. Nieta de un foguista galés (lo cuenta tarde).
- **Deseo:** hacer bien su trabajo y no volver a sentir que cerró algo vivo. **Miedo:** encariñarse (le pasó con otro
  ramal y lloró en el andén).
- **Secreto:** el **informe de cierre ya está firmado** en el portafolios. La visita es un trámite.
- **Arco:** de los números fríos («cuarenta toneladas por mes, y ustedes cargan doce») a quedarse a la Fiesta de la Nieve.
  Según la carga (fletes) y lo que vio del valle, al final rompe el informe, lo cambia por «a prueba un año», o lo
  manda con un anexo escrito a mano. Si su lazo llega a +3, pide el traslado al valle.
- **Cómo cambia según vos:** cap. 4, D3, los fletes, y si la llevaste a ver el valle (optativa «Una vuelta para la ingeniera»).
- **Lo que pide al juego:** una persona nueva armada con lo que ya hay (`gente.js`/`gente-ropa.js`: sobretodo, botas,
  rodete; un portafolios en la mano como la tablilla de Josefina). Ver Necesidades técnicas.

### 3.7 Secundarios que aparecen (sin arco largo)
- **Nicanor** (pescador, muelle): luces sobre el lago, la subtrama del faro; amigo de Aurelio.
- **Herminia Huenchul** (la abuela, 89): la que cuenta lo de las puertitas («Tampoco vi el viento, y el viento existe»).
- **Rosa Quilodrán** (panadera): la masa madre que «crece raro» si D1 = pan.
- **Tito Arrieta** (carpintero): quiere el coihue grande para tablas finas; hace el arco con vos.
- **Anselmo Ruiz** (herrero): puntas de flecha, las estacas prestadas.
- **Tobías Hughes** (cantera): cantos rodados para la honda; la pirca del coihue; «Diolch».
- **Belisario Paredes** (arriero, Puesto del Paso): blancos para practicar; la oferta a Fermín.
- **Elvira Ñancucheo** (tejedora): la cuerda del arco. **Guido Rossetti** (apicultor): la cera y la trampa de miel.
- **Martín Sepúlveda** (maquinista jubilado): presta la campana vieja del taller.
- **Marta Williams** (enfermera): cura a Ramón. **Ernesto Llancafil** (jefe de estación): el andén y la bandera.
- **Don Eusebio Millán** (fallecido): sólo por escrito. Su letra es inclinada y siempre termina con «Y gracias».

---

## 4. Las decisiones grandes y el árbol de consecuencias

[NUEVO: `historia.decisiones` guarda cada una; los efectos sobre lazos van a `historia.lazos`.]

### D1 · La bolsa del molinero (cap. 2)
| Opción | Efecto inmediato | Lo que abre / cierra |
|---|---|---|
| **A. Convidarla a la raíz del coihue grande** (como dice la nota) | Ramón +1 («Eusebio sabía lo que hacía») | Indicios de **regalitos** (cap. 3–8): canto rodado, piñones, una pluma en el umbral. En el encuentro (D6) aparece la opción **«Devolver la bolsa al umbral»** (trato fuerte). |
| **B. Llevarla a Rosa: pan para la aldea** | Ercilia +2, Rosa te da pan (premio) | Indicios de **travesuras** (gallinero abierto, herramientas en el techo). Abre la optativa «La masa que crece sola» (cap. 6). En D6 el trato **cuesta una bolsa** (hay que tenerla). |
| **C. Llevársela a Josefina** (reconoce la letra) | Josefina +2 | Josefina te habla del abuelo **un capítulo antes** (cap. 5 en vez de 8). Indicios neutros. |

### D2 · El coihue de las puertitas (cap. 5)
El aserradero va al lado del molino y el mejor lugar tiene un coihue enorme con raíces talladas. Tito ofrece pagarlo bien.
| Opción | Efecto | Abre / cierra |
|---|---|---|
| **A. Dejarlo en pie** y armar el aserradero aguas abajo | Josefina +1, Tito −1 | Sin costo extra salvo caminar. Los duendes «se dejan ver» antes (cap. 6). |
| **B. Talarlo** (Tito paga $ y 12 tablas finas) | Josefina −2, Tito +2, $ | **Noche de las piedritas** (cap. 6: te tiran bellotas al techo toda la noche). En D6 el trato pide **devolver algo de madera** (6 tablas de coihue). Final A con variante «la puertita nueva está en el tocón». |
| **C. Pedirle a Tobías una pirca** que proteja la raíz (cuesta 10 piedras) | Josefina +1, Tobías +2 | Abre la subtrama de Tobías («La veta que vuelve», cap. 8). En la noche, la pirca es una defensa extra. |

### D3 · La primera molienda (cap. 7)
Diez bolsas de la primera molienda; las tres opciones piden **mover las bolsas de verdad** (flete, carro o a pie).
| Opción | Efecto | Abre / cierra |
|---|---|---|
| **A. Fletes a Esquel** (por la trochita) | Elsa +1, Graciela +2, cuenta para el ramal | Ramal más cerca de salvarse. Ercilia −1 («¿y acá qué comemos?»). |
| **B. El fiado de invierno de la aldea** (al almacén) | Ercilia +2, la aldea | Invierno sin hambre: en el cap. 9 hay más vecinos en la mesa. |
| **C. Partir: un poco de cada cosa y una bolsa a la raíz** | Todos +0/+1, duendes «tranquilos» | Pide más viajes (misión más larga). Cuenta como convidar para D6. |

### D4 · Contar o callar (cap. 8)
El cuaderno de Eusebio, la cuenta de Ercilia y el cuaderno del abuelo de Josefina dicen lo mismo: hubo un trato.
| Opción | Efecto | Abre / cierra |
|---|---|---|
| **A. Contarlo en el fogón de la leyenda** a toda la aldea | Ercilia +2, Herminia +, Josefina −1 | En la noche vienen **más vecinos** a mirar y a ayudar (ambiente, ánimo). Final con la aldea entera en el epílogo. |
| **B. Guardarlo entre los que ya saben** | Josefina +2, Ramón +1 | Los aliados de la noche son menos pero más fuertes (Josefina y Ramón con lazo +1 seguro). |
| **C. Que Josefina lo mande a la universidad de Bariloche** | Josefina +1 (alivio y miedo), Graciela +1 | Epílogo: el coihue queda protegido como «árbol notable»; llega una científica en el último tren. |

### D5 · La majada de Ramón (cap. 9)
Ramón cae con fiebre y la cadera mala; Marta lo manda a reposo en la aldea. ¿Quién sube con la majada?
| Opción | Efecto | Abre / cierra |
|---|---|---|
| **A. Que la lleve Fermín, entera** | Fermín +3, Ramón −1 → +2 en el epílogo | Fermín **no** se va con Belisario; te enseña la honda con ganas (cap. 11 más corto). Ramón aprende a soltar. |
| **B. Cuidarla vos hasta que Ramón se cure** | Ramón +2, Fermín −1 | Misión de trabajo (3 días de majada). Fermín duda y en el epílogo se va con las mulas (si lazo < 0). |
| **C. Venderle la majada a Belisario** (Ramón te dio poder «por las dudas») | $$, Ramón −3, Fermín −2 | Ramón **no viene a la noche**; final con Ramón mirando de lejos. Se abre la reconciliación optativa del epílogo. |

### D6 · Trato o pelea (cap. 10) — **la decisión que define el final**
Guarda `duendes.trato = 'trato' | 'pelea'` (nombre de campo alineado con lo que se construye en la 4.13.0).
| Opción | Condición | Efecto |
|---|---|---|
| **Dejar la puerta abierta y sentarte en el umbral** | siempre | `trato`. Si D2 = B, piden 6 tablas de coihue; si D1 = B, piden una bolsa de harina. Si no las tenés, el trato queda **a medias** (`trato` con `deuda`) y se paga en el cap. 11. |
| **Devolver la bolsa al umbral** | D1 = A o D3 = C | `trato` fuerte: en la noche los chicos ayudan un poco más (ver cap. 12). |
| **Agarrar la pala y el farol: ¡fuera de acá!** | siempre | `pelea`. Huyen con una bolsa. A la mañana: la ventana con barro y bellotas. Final B. |

### Árbol resumido
```
D1 bolsa ──┬─ A convidar ──► regalitos ─────────────┐
           ├─ B pan ───────► travesuras ─ (trato cuesta bolsa)
           └─ C Josefina ──► el abuelo antes        │
D2 coihue ─┬─ A en pie ────► se dejan ver antes     │
           ├─ B talar ─────► noche de las piedritas ─ (trato cuesta madera)
           └─ C pirca ─────► subtrama Tobías + defensa extra
D3 molienda┬─ A fletes ────► ramal ++                │
           ├─ B fiado ─────► aldea ++                │
           └─ C partir ────► convida ────────────────┤
D4 cuaderno┬─ A contar ────► la aldea en la noche    │
           ├─ B callar ────► aliados fuertes         │
           └─ C universidad► árbol notable / científica
D5 majada ─┬─ A Fermín ────► Fermín se queda, honda fácil
           ├─ B vos ───────► Ramón ++ / Fermín se puede ir
           └─ C vender ────► Ramón ausente en la noche
D6 ────────┬─ TRATO (+ «devolver la bolsa» si convidaste) ─► noche contra «los del cerro» ─┬─ ganada ─► Final A1
           │                                                                               └─ perdida ► Final A2
           └─ PELEA ─────────────────────────────────────► noche contra todos ─────────────┬─ ganada ─► Final B1
                                                                                           └─ perdida ► Final B2
Variantes de epílogo: ramal (salvado / a prueba), Ramón, Fermín, Josefina, Graciela, Elsa (por lazos y D3–D5).
```

### Cuenta del ramal [NUEVO: `historia.ramal`, un número]
Puntos: cada flete entregado desde el cap. 4 (+1, hasta 8), D3 = A (+4), D3 = C (+2), optativa «Una vuelta para la
ingeniera» (+2), Graciela con lazo ≥ +2 (+2). **≥ 10: el ramal se salva**; **6–9: queda a prueba un año**;
**< 6: queda a prueba y Elsa manda el papel del traslado** (nunca cierra del todo: el tono es cálido).

---

## 5. Cómo está escrito cada capítulo

- **Ficha:** acto, estación, duración estimada (principal / con optativas), tensión (1–5).
- **Tarjeta de entrada** (la que ya existe en `historia-ui.js`) y **tarjeta de cierre** con premio.
- **Objetivos principales** en orden. Cada uno con su **condición verificable**: las que ya mide `estadoHistoria`
  van marcadas [EXISTE]; las nuevas usan un vocabulario chico [NUEVO] que se arma una vez y sirve para todo:
  - `llegar(lugar, radio)` — estar cerca de un lugar con nombre.
  - `hablar(quién, tema)` — charla guionada con un vecino (la E de siempre, con un tema de historia arriba de todo).
  - `entregar(quién, cosa, n)` — darle algo a alguien.
  - `hora(desde, hasta)` y `esperar(lugar, desde, hasta)` — estar (o quedarse sentado) en un lugar a cierta hora.
  - `estacion(e)` — puerta de estación (con el «no más de 2 días» de 2.1).
  - `escena(id)` — una escena vista (o salteada).
  - `decision(D)` — una decisión tomada.
  - `objeto(id)` — juntar un objeto de historia puesto en el mundo (con E).
  - `acompanante(quién)` — llevar a alguien con vos (a pie, en la trochita o en el carro).
- **Escenas dirigidas** (E1, E2…): dónde, hora, quién, **cámara** en términos simples y el **diálogo** (líneas clave
  completas; entre corchetes, el gesto existente que hace el personaje). El jugador **no tiene voz**: a veces elige una
  respuesta corta (dos o tres) que sólo cambia el tono, salvo que diga *[lazo]*.
- **Optativas** (subtramas): no traban el capítulo; dan lazos, cuenta del ramal o cosas.
- **Premio y desbloqueo**: lo material (como hoy) y la **mejora de juego** que abre.

---

## ACTO I — VERANO: QUEDARSE

### Capítulo 1 — «La llave del molinero» (prólogo)
*Acto I · verano, día 1 (tarde a la mañana siguiente) · 20 / 25 min · tensión 3*

**Tarjeta de entrada**
> El aviso salió en el diario de Esquel, en un rincón, entre una cosechadora usada y un perro perdido:
> *«Se cede refugio en el valle a quien lo habite y lo cuide. Preguntar por Ercilia.»*
> Contestaste sin pensarlo mucho. Una semana después te llegó una llave pesada, atada con un piolín, y un pasaje
> de trochita. Ahora vas sentado contra la ventanilla, con el valle entrando de a poco por el vidrio.

**Escenas**

- **E1 · «Boleto, pasajero»** — *En la trochita, cruzando el puente del arroyo · 18:30 · Elsa.*
  Cámara: **plano general** de la trochita sobre el puente con el lago detrás (2 s) → **corte** al vagón,
  **plano medio** de Elsa por el pasillo → **sobre el hombro** del jugador cuando ella mira la llave.
  > **Elsa:** ¿Boleto, pasajero? *[saludar]* … ¿Hasta el Valle? Hace rato que no le corto uno a alguien con mochila de quedarse.
  > **Elsa:** *(ve la llave)* Esa es la del refugio de Eusebio. *[sorprenderse]* Mire usted. Cuarenta años moliendo para todo el valle, el hombre, y ahora la llave anda en tren.
  > **Elsa:** ¿Sabe lo que decía? Que el molino no era de él. Que él nomás le daba de comer. *[encogerse]* Era raro Eusebio. Buena gente, pero raro.
  > *(Respuesta del jugador, sabor: «¿Raro cómo?» / «Vengo a quedarme.»)*
  > **Elsa:** *(a «¿Raro cómo?»)* Hablaba con los árboles. Bueno… todos hablamos con los árboles acá. Él esperaba que le contestaran.
  > **Elsa:** *(a «Vengo a quedarme»)* Eso dicen todos en verano, pasajero. Yo lo anoto para el invierno. *[hacer-broma]*

- **E2 · La estación** — *Estación del Valle · 18:45 · Elsa, Ernesto Llancafil al fondo.*
  Cámara: **plano general** desde el andén, la trochita se va y deja vapor; el jugador recupera el control.
  > **Elsa:** *(desde el estribo)* ¡Siga el agua! El refugio está donde el arroyo llega al lago. Y prenda fuego antes de que baje el sol, que acá la noche no pide permiso.

- **E3 · Algo cruza** — *En el sendero, a mitad de camino · cuando el jugador pasa el punto, al atardecer.*
  Cámara: **mirada dirigida** de 3 s [NUEVO]: la cámara gira sola, suave, hacia un helecho a 15 m; algo de 60 cm, de
  espaldas, cruza corriendo y se mete entre las raíces (pillo, `rastreador`). Una risa corta y ahogada. Vuelve el control.
  Sin texto. El cuaderno anota solo: *«Algo cruzó el sendero. Un zorro, seguro. Un zorro con gorro.»* [NUEVO: cuaderno de lo raro]

- **E4 · La nota de Eusebio** — *Adentro del refugio · al entrar.*
  Cámara: **plano detalle** de la mesa: una foto de un hombre flaco con una bolsa de harina al hombro y una nota.
  > **La nota (letra de Eusebio):** «Al que venga: la leña de adentro está húmeda y la de afuera no existe. La estufa tira si le hablás bajito. No toques el frasco de la repisa, que es masa madre de 1987. Y gracias. E. M.»

- **E5 · La ronda** — *Umbral del refugio · al despertar, primera mañana.*
  Cámara: **picado** sobre el umbral: las ramitas que te sobraron anoche están acomodadas en ronda, como un relojito,
  y en el medio hay un **canto rodado blanco**, liso como un huevo. **Paneo** lento hacia el bosque: nada.

**Objetivos principales**
1. Llegá al Refugio del Arroyo — `refugio` [EXISTE].
2. Abrí la puerta con la llave de Eusebio (E en la puerta) — `escena('nota-eusebio')` [NUEVO].
3. Prendé un fuego antes de que oscurezca: tres ramitas y F — `fuego` [EXISTE].
4. Anotá dos cosas del bosque en el cuaderno — `desde(anotaciones) >= 2` [EXISTE].
5. Pasá tu primera noche (E junto al fuego o bajo techo) — `dia > base.dia` [EXISTE].
6. Mirá lo que hay en el umbral — `objeto('canto-blanco')` [NUEVO].

**Optativas**
- *El frasco de la repisa:* llevale la masa madre de Eusebio a Rosa, la panadera (se abre en el cap. 2; Rosa +1,
  te devuelve pan cada mañana durante 3 días).

**Premio:** seis ramitas, dos troncos y **el canto blanco** (queda en la repisa como adorno).
**Desbloqueo:** el **Cuaderno de lo raro** [NUEVO]: una página del diario donde se juntan los indicios (con fecha).

**Tarjeta de cierre**
> Amaneció. Del lago sube una neblina finita y en el techo canta un chucao.
> Alguien estuvo en tu puerta y no se llevó nada. Al contrario.
> El refugio tiene goteras, la puerta cierra mal y la leña de adentro es de otro siglo. Hay trabajo.

---

### Capítulo 2 — «La bolsa del molinero»
*Acto I · verano, día 2 · 30 / 40 min · tensión 1 → 2 (cierra con la D1)*

**Tarjeta de entrada**
> Don Ramón pasó temprano con la majada y se quedó mirando el techo como quien mira un caballo cansado.
> «Eso no aguanta el invierno», dijo, sin maldad. «Pero se arregla. Madera hay; lo que falta es hacha y banco.»

**Escenas**

- **E1 · Ramón en la tranquera** — *Frente al refugio · 8:00 · Ramón con la majada pasando.*
  Cámara: **plano general** de las ovejas cruzando → **plano medio** de Ramón apoyado en el palo, mate en mano.
  > **Ramón:** Así que vos sos el del aviso. *[tomar-mate]* Ercilia anduvo contando. A Ercilia le contás algo el lunes y el martes lo sabe Esquel.
  > **Ramón:** Eusebio era mi amigo. Callado, como yo. Bueno, más callado. *[suspirar]* Cuidame la casa, m'hijo, que él la quería.
  > **Ramón:** El hacha la cambia Ercilia en el almacén, en la aldea. Tomate la trochita. Y a la vuelta, el banco primero, que al lado del banco cada tronco rinde el doble.

- **E2 · El almacén** — *Almacén de la Aldea de los Duendes · media mañana · Ercilia, Nélida al fondo.*
  Cámara: **plano medio** desde la puerta, con la campanita sonando; Ercilia detrás del mostrador; **primer plano** cuando baja la voz.
  > **Ercilia:** ¡Vos sos! *[abrazar]* Querido, ¡pensé que no venía nadie! Bueno, pensé que venía uno de Buenos Aires con zapatillas blancas. Las tuyas están embarradas: buena señal.
  > **Ercilia:** El hacha, sí. Dame unas ramitas y un par de cantos y es tuya. *(baja la voz)* ¿Y? ¿Dormiste bien en lo de Eusebio? ¿No… oíste nada?
  > *(Respuesta: «Una risa, lejos.» / «Nada. Dormí como piedra.»)*
  > **Ercilia:** *(a «Una risa»)* Chimangos. *[hacer-broma]* O el viento en la chapa. Eso digo yo. *(mira a Nélida)* Eso decimos.
  > **Ercilia:** *(a «Nada»)* Mejor. *[asentir]* Mejor así.

- **E3 · «Ese no»** — *Bosque cerca del refugio · cuando el jugador apunta el hacha a su primer árbol vivo.*
  Cámara: **sobre el hombro** del jugador; Josefina entra a cuadro por la izquierda, brazos cruzados.
  > **Josefina:** Ese no. *[cruzarse-brazos]* El de al lado, que está seco. Ese da sombra a los renovales.
  > **Josefina:** Josefina, guardaparque. Vos sos el del refugio de Eusebio. *[mirar]* Ya veremos.
  (Si el jugador tala el árbol vivo igual: Josefina −1, línea: «Bueno. Ahora ya sé cómo sos.»)

- **E4 · La bolsa** — *Alero del refugio · al cambiar la cuarta tabla del alero.*
  Cámara: **plano detalle**: entre la chapa y la viga, envuelta en arpillera, una bolsa de harina atada con un piolín
  colorado y una nota. **Primer plano** de la nota.
  > **La nota:** «Para la raíz del coihue grande del molino viejo, antes del primer frío. No te olvides, que ellos no se olvidan. Y gracias. E. M.»

**Objetivos principales**
1. Hablá con Ramón — `hablar('ramon','alero')` [NUEVO] (la charla de la E1).
2. Tomá la trochita a la Aldea de los Duendes — `viaje` [EXISTE].
3. Conseguí el hacha en el almacén de Ercilia — `hacha` [EXISTE].
4. Talá un árbol seco (al pehuén no se lo toca) — `desde(talados) >= 1` [EXISTE] (+ escena E3).
5. Levantá un banco de carpintero — `terminadas.has('banco-trabajo')` [EXISTE].
6. Arreglá el alero del refugio: cuatro tablas (E en el alero) — `reparar('alero', 4)` [NUEVO: reparación guionada].
7. **D1 · Decidí qué hacer con la bolsa del molinero** — `decision('bolsa')` [NUEVO], y cumplí lo elegido:
   - **A.** Llevala a la raíz del coihue grande, junto a las piedras del molino viejo, arroyo arriba —
     `llegar('molino-viejo', 8)` + E en la raíz. **Escena E5a:** dejás la bolsa; al irte, la cámara se queda 3 s fija en
     la raíz [**plano fijo**, mirada dirigida]: la bolsa ya no está, o sí está y fue la luz. (Ambiguo a propósito.)
   - **B.** Llevala a Rosa, a la panadería de la aldea — `entregar('panadera','bolsa-eusebio')`. **Escena E5b:**
     > **Rosa:** ¡Harina de Eusebio! *[amasar]* Ésta es de la buena, de cuando molía despacio. Con esto hago pan para toda la aldea, ¿sabés lo que es eso? Ercilia va a llorar.
   - **C.** Llevásela a Josefina, a la seccional — `entregar('ema','bolsa-eusebio')`. **Escena E5c:**
     > **Josefina:** *(lee la nota y se le cambia la cara)* Esta letra… *[pensar]* Mi abuelo le llevaba el trigo. Eusebio le escribía así, con la «g» para atrás. *(guarda la nota)* Dejámela. Por favor. Después te cuento. Algún día.

**Optativas**
- *El frasco de la repisa* (del cap. 1): Rosa +1.
- *La oveja de Ramón* (evento `oveja` [EXISTE] forzado como momento opcional): Ramón +1.
- *El banco primero* (encargo `e-banco` [EXISTE]).

**Premio:** seis tablas y cuatro piedras del galpón de Ramón (+ pan de Rosa si B).
**Desbloqueo:** el **tema de historia** en la charla con vecinos (una línea arriba de todo en la E, con estrellita) [NUEVO].

**Tarjeta de cierre** (cambia una línea según D1)
> El alero ya no gotea. Ramón lo empujó con el palo para ver si bailaba y no bailó. «Ahora sí», dijo.
> A — *Esa noche, del lado del arroyo, alguien se rió bajito. Una risa contenta, si es que las risas se entienden.*
> B — *En la aldea, a la tarde, olía a pan en todas las cuadras. Y a la noche, en tu gallinero, alguien abrió la puertita.*
> C — *Josefina pasó dos veces por tu camino esa tarde, como si fuera casualidad. Las dos veces miró el refugio.*

---

### Capítulo 3 — «La mesa larga»
*Acto I · verano, día 3 · 25 / 35 min · tensión 2*

**Tarjeta de entrada**
> En el valle hay poca gente y todos se conocen. Se conocen tanto que se saludan de lejos para no tener que hablar.
> «Una casa sin mesa es un galpón», te dijo Ercilia. «Poné una mesa con dos sillas y vas a ver cómo la gente se arrima.»

**Escenas**

- **E1 · El hacha en el tocón** — *Refugio · al empezar (mañana).*
  Cámara: **plano general** del claro: tu hacha no está donde la dejaste. Está **clavada en el tocón** del árbol que
  talaste ayer, derechita, con una hoja de coihue enganchada en el mango. **Plano detalle** del mango.
  (Con D1 = A, además hay un puñado de **piñones** en el tocón. Con D1 = B, también tu cuchara de madera arriba del techo.)
  Cuaderno de lo raro: *«El hacha caminó sola hasta el tocón. Los zorros no hacen eso.»*

- **E2 · La placa del duende** — *Plaza de la Aldea, frente al duende tallado · cuando el jugador lee la placa (E).*
  Cámara: **contrapicado** del duende de madera; **paneo** hasta Herminia sentada en el banco de la plaza.
  > **Herminia:** ¿Leíste lo de abajo? «Golpeá antes de abrir.» *[reír]* Lo puso el primer jefe de estación. Cuando tendían la vía, los peones encontraban puertitas talladas en las raíces de los coihues. Chiquitas así. *(muestra con la mano)*
  > **Herminia:** Yo nunca vi uno, eh. Tampoco vi el viento, y el viento existe. *[encogerse]*
  > **Herminia:** Eusebio les dejaba harina. Todo el mundo sabía y nadie decía. *(te mira)* ¿Y vos qué hiciste con la bolsa?
  (Responde según D1: A «Bien hecho.» · B «Pan para todos… también es una forma. Ya vas a ver qué piensan ellos.» · C «Josefina. Mirá vos. Esa chica lleva al abuelo adentro.»)

- **E3 · La mesa** — *Mesa del refugio · 16:00–19:00 · la primera visita (la elige el juego entre los vecinos con mejor lazo).*
  Cámara: **plano general** de la mesa con el lago detrás → **plano y contraplano** sobre el hombro de cada uno.
  Si viene **Nicanor** (con el pie en alto si hubo tobillo):
  > **Nicanor:** ¿Risas de noche? *[tomar-mate]* Yo veo luces sobre el lago, y no digo nada porque después Aurelio se ríe. Luces chiquitas, que van y vienen. Como gente con farolitos. Muy petisa la gente.
  Si viene **Ramón**:
  > **Ramón:** Eusebio decía «los vecinos de abajo». *[barba]* Yo le decía que eran los zorros. Él se reía. *(silencio largo)* Vos dejá la puerta cerrada de noche, igual. Por las dudas. Por los zorros.

**Objetivos principales**
1. Conocé a los vecinos: Ramón, Nicanor, Josefina, Ercilia y Fermín (en el galpón de esquila) —
   `hablados` con los cinco [EXISTE para cuatro; NUEVO: sumar `fermin`].
2. Leé la placa del duende en la plaza y hablá con Herminia — `escena('placa-herminia')` [NUEVO].
3. Armá una mesa de campo con dos sillas — `mesa` [EXISTE].
4. Recibí una visita en tu mesa — `desde(visitas) >= 1` [EXISTE].
5. *(Momento)* Algo pasó en la orilla: ayudá a Nicanor — evento `tobillo` [EXISTE], `cuando: 'pronto'`.

**Escena con Fermín (objetivo 1)** — *Galpón de esquila, en la estepa · cualquier hora · Fermín.*
Cámara: **plano general** del galpón y la estepa amarilla con viento → **plano medio** de Fermín apoyado en el corral.
> **Fermín:** Las de la marca en la oreja son de Ramón. Las otras, mitad de él y mitad mías. *[contar]* Él dice que todas son mías y que me las presta. Ramón es así: te regala las cosas diciéndote que ya eran tuyas.
> **Fermín:** ¿Duendes? *(se ríe, pero mira para la cordillera)* Acá en la estepa no hay raíces, amigo. Acá hay viento. Arriba, en el paso, Belisario cuenta otras cosas. Pero Belisario cuenta muchas cosas.

**Optativas**
- *Aceptá un encargo de algún vecino* — `aceptados` [EXISTE] (sube lazo +1 con quien lo pide).
- *Pedido de Fermín:* llevale harina o pan al galpón de esquila — `entregar('fermin','pan')`; Fermín +1.

**Premio:** medio kilo de yerba de los vecinos.
**Desbloqueo:** el **tablón de encargos de la plaza** te muestra una fila de «encargos de historia» (con estrellita).

**Tarjeta de cierre**
> Esa tarde, en la mesa nueva, hubo mate. Nadie habló de risas ni de puertitas: se habló del tiempo, de las truchas
> y de lo cara que está la yerba. Pero a la hora de irse, todos miraron un segundo para el lado del arroyo.
> Nadie lo dijo, pero algo quedó decidido: ya sos del valle. Acá eso no se anuncia: se nota en que te guardan la yerba.

---

### Capítulo 4 — «La señora del ramal»
*Acto I · verano, día 4 · 30 / 40 min · tensión 3 (primer giro)*

**Tarjeta de entrada**
> Elsa te esperó en el andén con los botones de bronce lustrados como para un casamiento.
> «Viene una ingeniera de la Administración», dijo. «A contar. Cuando vienen a contar, pasajero, es porque ya contaron.»

**Escenas**

- **E1 · El andén** — *Estación del Valle · 10:00 · Elsa, Graciela, Ernesto.*
  Cámara: **plano general** de la trochita entrando con vapor → **contrapicado** de Graciela bajando del estribo con el
  portafolios → **plano y contraplano** Elsa / Graciela.
  > **Graciela:** Graciela Pugh, Administración del Ramal. *[saludar]* Vengo a ver la carga del verano. Cuarenta toneladas por mes es lo que hace falta para que un ramal se pague. Ustedes cargan doce.
  > **Elsa:** Doce en verano. En invierno cargamos gente, que pesa menos pero vale más. *[cruzarse-brazos]*
  > **Graciela:** La gente no figura en la planilla, señora. *(te ve)* ¿Y usted? ¿Es del valle?
  > *(Respuesta [lazo Graciela]: «Desde hace cuatro días.» (+0) / «Sí.» (+1, a ella le gusta la gente que se compromete) / «Todavía no sé.» (−0, Elsa −1))*
  > **Graciela:** Bueno. Tiene hasta el fin del verano para mostrarme que esta vía mueve algo más que turistas.

- **E2 · En la cabina** — *Locomotora, primer tramo manejado por el jugador · Elsa enseña, Graciela atrás anotando.*
  Cámara: **sobre el hombro** del jugador hacia la vía; en las paradas, **plano medio** de Elsa.
  > **Elsa:** El regulador de a poco, que no es un auto. *[mirar]* Mi padre decía que el tren se maneja con las orejas: se escucha cuándo va cansado.
  > **Graciela:** *(anotando)* ¿Siempre frenan con tanta… anticipación?
  > **Elsa:** Siempre que queremos llegar, ingeniera.

- **E3 · Piedras en la vía** — evento `derrumbe` [EXISTE] como **momento** del capítulo (con Graciela a bordo).
  Si el jugador **ayuda**: al mover la última piedra aparece, enterrada entre el ripio, **una puertita de madera de coihue**
  del tamaño de una mano, con bisagra de cuero y una manijita de hueso. Cámara: **plano detalle** de la puertita;
  **plano medio** de Graciela levantándola.
  > **Graciela:** ¿Y esto? *[sorprenderse]* … Los chicos de la aldea, seguro. Juguetes.
  > **Elsa:** *(no contesta. Le saca la puertita de la mano y te la da a vos.)* Guárdela usted. *[susurrar]* Usted vive en lo de Eusebio.
  Si **sigue de largo**: la puertita aparece igual, a la noche, apoyada contra tu puerta (cuaderno de lo raro).
  Graciela −1 («¿Así se ayudan acá?»).

**Objetivos principales**
1. Recibí a la ingeniera en la Estación del Valle (llegá antes de las 11) — `escena('anden-graciela')` [NUEVO + `hora`].
2. Viajá con Graciela hasta la Aldea de los Duendes — `acompanante('graciela')` + `llegar('aldea')` [NUEVO].
3. Subí a la cabina y manejá un tramo: W regulador, S freno — `conduciendo` [EXISTE].
4. Entregá dos fletes manejando, antes del fin del verano — `desde(entregas) >= 2` [EXISTE]; cada uno suma a la
   **cuenta del ramal** [NUEVO].
5. *(Momento)* Piedras en la vía — evento `derrumbe` [EXISTE], `cuando: 'pronto'` (forzado aunque falte `viaje` del día).
6. Guardá la puertita en tu repisa — `objeto('puertita')` [NUEVO].

**Optativas**
- **«Una vuelta para la ingeniera»:** llevá a Graciela en la trochita a dos lugares lindos (el mirador del pehuén, el
  faro o la casa de té) — `acompanante('graciela')` + `llegar(...)` ×2. En la casa de té, escena corta:
  > **Graciela:** Mi abuelo era foguista. En el ramal de Trevelin, el que cerraron. *[suspirar]* No le cuente a Elsa, que se me ablanda.
  Graciela +2, **ramal +2**.
- *La vuelta completa* (encargo de Elsa [EXISTE]): Elsa +1.

**Premio:** yerba y cuatro tablas de durmiente; **pase de cabina**: desde ahora podés manejar la trochita sin pedir permiso.
**Desbloqueo:** la **cuenta del ramal** aparece en el panel de la historia (una barrita con la locomotora) [NUEVO].

**Tarjeta de cierre**
> Graciela se quedó en el hospedaje de la aldea. Dice que vuelve en cada estación «a contar».
> Elsa la vio irse por la calle de la vía y se quedó mirando la puertita que te dio.
> «El tren se maneja con las orejas», repitió, bajito. «Y el valle también, pasajero. Escuche.»

---

## ACTO II — OTOÑO: EL MOLINO

### Capítulo 5 — «La rueda»
*Acto II · otoño, día 5 (puerta de estación) · 35 / 45 min · tensión 2*

**Puerta de estación:** el capítulo arranca en otoño. Si es verano todavía: tarjeta corta «Las lengas todavía están
verdes. Ramón dice que el molino se arma con el agua del deshielo de otoño: esperá a que se pongan coloradas»; se
puede dormir o hacer optativas. (Si el otoño ya pasó, se arranca igual: el arroyo «vino crecido».)

**Tarjeta de entrada**
> Una mañana las lengas amanecieron coloradas. Josefina golpeó tu puerta temprano, sin el sombrero y con la tablilla
> abajo del brazo. «Vení», dijo. «Te quiero mostrar algo. Traé el hacha, pero no la uses.»

**Escenas**

- **E1 · Las piedras del molino viejo** — *Arroyo arriba, junto a las piedras del molino de Eusebio · 9:00 · Josefina.*
  Cámara: **travelling** al lado de los dos caminando por la orilla (seguimiento) → **plano general** de las muelas
  rotas con el coihue enorme detrás → **primer plano** de Josefina.
  > **Josefina:** Acá se molía el trigo de todo el valle. *[mirar]* Mi abuelo lo traía en carro desde la estepa, tres días de viaje. Eusebio lo molía y le devolvía la harina menos la maquila. *[contar]* Y una bolsa aparte, que nunca supe para quién era.
  > **Josefina:** Con el agua de la nieve alcanza para mover una muela y una sierra. Si armás el molino, la harina sale de tus habas y el aserradero te hace las tablas mientras dormís. El arroyo trabaja gratis.
  > **Josefina:** *(mira el coihue)* Y ese no se toca. *(pausa)* Bueno. Eso lo vamos a hablar.
  (Con D1 = C, Josefina saca la nota de Eusebio del bolsillo, la mira y la vuelve a guardar: «Para quién era la bolsa aparte, digo».)

- **E2 · El zaino** — *Puesto Alto · Ramón y el zaino.*
  Cámara: **plano medio** de Ramón con la rienda; **plano general** cuando el jugador monta.
  > **Ramón:** Llevate el zaino para acarrear. Es manso. *[hacer-broma]* No le creas a Belisario, que dice que no.
  > **Ramón:** Montá con la izquierda, que si no, se ofende.

- **E3 · Tito y el coihue** — *Junto al coihue grande · cuando el jugador elige el lugar del aserradero · Tito y Josefina.*
  Cámara: **plano general** con los dos a cada lado del árbol, como en un duelo de western muy amable.
  > **Tito:** Ese coihue tiene cuatrocientos años de madera derecha. *[palmada-hombro al tronco]* Le pago bien, y le hago doce tablas que no va a encontrar ni en Bariloche. Y el aserradero va justo acá, en lo plano.
  > **Josefina:** Ese coihue tiene cuatrocientos años, punto. *[cruzarse-brazos]*
  > **Tito:** Señorita, los árboles se caen solos también.
  > **Josefina:** Que se caiga solo, entonces.
  → **D2**.

- **E4 · La rueda gira** — *Molino terminado · primera vez que gira.*
  Cámara: **plano detalle** de la rueda: el agua la empuja, se queja, agarra ritmo → **paneo** lento hacia el coihue
  (o hacia el tocón si D2 = B). Con D2 = A o C: entre las raíces, **dos puntitos verdes** que se apagan.
  > **Josefina:** *(se queda un rato largo mirando)* A mi abuelo le va a gustar saber que volvió a moler. *[suspirar]* Bueno, a mi abuelo le habría gustado. Ya me entendés.

**Objetivos principales**
1. Andá con Josefina a las piedras del molino viejo — `llegar('molino-viejo', 10)` + `escena('piedras')` [NUEVO].
2. Pedile el zaino a Ramón y acarreá con él (tres troncos y seis piedras al molino) —
   `p.cosas.caballo` [EXISTE] + `entregar('obra-molino', tronco 3, piedra 6)` [NUEVO: acopio en obra marcada].
3. Construí un molino de agua sobre el arroyo — `terminadas.has('molino-agua')` [EXISTE].
4. **D2 · El coihue de las puertitas** — `decision('coihue')`, y cumplí:
   - **A.** Aserradero aguas abajo, a más de 25 m del coihue — `terminadas.has('aserradero')` + distancia [NUEVO].
   - **B.** Talá el coihue grande (seis hachazos; el árbol está marcado) y construí el aserradero en lo plano —
     `talado('coihue-grande')` [NUEVO: árbol especial] + `terminadas.has('aserradero')`.
   - **C.** Llevale 10 piedras a Tobías a la cantera (trochita al Puesto de la Cantera), volvé con él y levantá la pirca;
     después, el aserradero — `entregar('tobias', piedra 10)` + `acompanante('tobias')` + `terminadas.has('aserradero')`.
5. Sembrá habas en un cantero — `sembrados >= 1` [EXISTE].
6. *(Momento)* La crecida aflojó el puente del arroyo: decidí qué hacer — evento `puente` [EXISTE].

**Escena de Tobías (si D2 = C)** — *Cantera · Tobías picando.*
> **Tobías:** ¿Una pirca para una raíz? *[martillar]* En Gales mi bisabuelo hacía pircas para que las ovejas no se cayeran del cerro. Para un árbol no hice nunca. *(se ríe)* Diolch, me gusta la idea. Las piedras redondas abajo, que la raíz respire.
> **Tobías:** ¿Sabe qué? Acá en la cantera, la veta que sacás un año vuelve al otro. Nadie sabe cómo. Mi padre decía que alguien la rellena de noche. *[encogerse]*

**Optativas**
- *El trigo del abuelo* (sólo si D1 = C): Josefina te muestra la foto del carro del abuelo en la seccional; Josefina +1.
- *Las tablas de Tito* (si D2 = B): vendéle 6 tablas de coihue en la carpintería — $ (ramal 0).
- *Primeras truchas del otoño* con Nicanor (encargo `t-truchas`/pesca [EXISTE]); Nicanor +1.

**Premio:** cuatro medidas de harina y semillas de habas.
**Desbloqueo:** el **molino de la historia** muele habas en harina con su ruido de muela (ya existe), y desde ahora
el **zaino** queda prestado (Ramón: «Devolvémelo cuando te devuelva el invierno»).

**Tarjeta de cierre** (según D2)
> La rueda agarró el ritmo del arroyo. Adentro, la muela hace un ruido hondo que se siente en los pies.
> A — *El coihue quedó en pie, mirando el molino como si lo hubiera estado esperando.*
> B — *Donde estaba el coihue quedó un tocón ancho como una mesa. Esa noche no se oyeron risas. Se oyó otra cosa.*
> C — *La pirca de Tobías abraza la raíz del coihue. Josefina pasó la mano por las piedras y no dijo nada, que en ella es mucho.*

---

### Capítulo 6 — «Lo que se pierde, aparece»
*Acto II · otoño, días 5–6 · 30 / 40 min · tensión 3 (misterio)*

**Tarjeta de entrada**
> Desde que el molino muele, en el valle se pierden cosas. No muchas: un dedal de Ercilia, la pipa de Belisario,
> la cuchara de palo de Rosa. Y aparecen, días después, en lugares imposibles: arriba de un poste, adentro de una bota,
> en el medio de la vía.
> Nicanor dice que de noche hay luces sobre el lago. Nadie le cree. Vos sí.

**Escenas**

- **E1 · Las luces del lago** — *Muelle · 20:30 · Nicanor.*
  Cámara: **plano general** del muelle al atardecer, el faro a lo lejos → **plano medio** de Nicanor con la caña.
  > **Nicanor:** Salen cerca del faro, a eso de la medianoche. *[pescar]* Si vas en el kayak despacito y no remás fuerte, las ves. Si remás fuerte, se apagan. Como las truchas: hay que llegar sin avisar.
  > **Nicanor:** Y no les saques foto. *(se ríe)* Mentira. Sacales. A ver si te sale.

- **E2 · El que vuela** — *En el lago, cerca del faro · entre las 23 y la 1 · nadie.*
  Cámara: **mirada dirigida** [NUEVO] hacia el faro: contra la luna pasa una **silueta de lechuza** con algo chiquito montado
  (lechucero, `volador`); tres lucecitas ámbar la siguen sobre el agua (duendecitos, `enjambre`) y se apagan de a una.
  Si el jugador saca una foto: la foto sale **movida**, con tres manchas doradas [NUEVO: foto guionada]. Cuaderno de lo raro:
  *«Saqué la foto. Salió como sale todo lo que importa: movida.»*

- **E3 · La guardia del molino** — *Banco junto al molino · entre las 22 y las 2 · el jugador sentado (E en el banco o en un tronco).*
  Cámara: fija, **plano general** desde el banco hacia el coihue (o el tocón); el tiempo corre rápido mientras estás
  sentado [NUEVO: esperar sentado]. A las 0:40: **una silueta** se asoma por la raíz, después dos, después cinco
  (pillos). Te miran. Uno levanta la mano **[saludar]** (animador `saludar` de `historia-duendes.js`). Si te levantás,
  corren y desaparecen entre las raíces.
  - D2 = B (tocón): en vez de saludar, **te tiran bellotas** al techo del molino toda la noche («la noche de las piedritas»).
    No hacen daño; no se duerme bien. Cuaderno: *«No saludaron. Tiraron cosas. Hay vecinos así también.»*

- **E4 · Las huellas** — *A la mañana, desde el molino · el jugador sigue huellas chiquitas en la escarcha.*
  Cámara de juego normal; las huellas brillan apenas [NUEVO: rastro guionado]. Llevan a la **ladera de Ramón**, a una raíz
  donde hay **un puñado de yerba** prolijo, en una hoja de nalca.
  → **E5 · Ramón en la raíz** — *Ladera del Puesto Alto · 7:30.*
  Cámara: **plano lejano** desde atrás de un árbol: Ramón se agacha, deja yerba en la raíz, se saca la boina un
  segundo, se la pone y se va. No te ve. (Sin diálogo. El secreto de Ramón queda insinuado.)

**Objetivos principales**
1. Preguntá en la aldea por las cosas perdidas: hablá con Ercilia y con Rosa — `hablar('ercilia','perdidas')`,
   `hablar('panadera','perdidas')` [NUEVO].
2. Encontrá tres cosas perdidas del valle (el dedal, la pipa, la cuchara) y devolvelas — `objeto(...)` ×3 +
   `entregar(...)` ×3 [NUEVO; aparecen en lugares raros: un poste del andén, la bota de un tendal, la vía cerca del faro].
3. Salí al lago de noche (kayak o velero) y acercate al faro — `hora(23, 1)` + `llegar('faro', 40)` + en kayak o vela [NUEVO].
4. Hacé guardia en el molino de noche — `esperar('molino', 22, 2)` [NUEVO] + `escena('guardia')`.
5. Seguí las huellas a la mañana — `escena('raiz-ramon')` [NUEVO].

**Optativas**
- **«La masa que crece sola»** (si D1 = B): Rosa te llama: su masa madre creció de noche hasta el techo y tiene
  marcas de deditos. Pasá la noche en la panadería (`esperar('panaderia', 23, 3)`): ves sólo la puerta del horno
  que se cierra sola. Rosa +1; Rosa te enseña **pan casero** si no lo sabías (`p.cocina.sabe`) [EXISTE la receta].
  > **Rosa:** Mirá, si quieren pan, que pidan. *[amasar]* Yo le doy pan a todo el que pide. Pero que no me toquen la masa madre, que es de 1987.
- *Foto para Sofía:* llevale la foto movida a Sofía Haddad (fotógrafa): «Esto no es una mancha. Esto es un ojo.» (sabor; Sofía +amor si corresponde).
- *Tres de tres* con Nicanor (encargo [EXISTE]).

**Premio:** una **lámpara de aceite de Eusebio** (cosa: se cuelga en el molino) y yerba.
**Desbloqueo:** el **farol** queda en la mano para las noches (si no lo tenías) y la página «Lugares raros» del Cuaderno
de lo raro marca en el mapa dónde viste cosas.

**Tarjeta de cierre**
> Ramón no te dijo nada y vos no le preguntaste. Hay cosas que en el valle se saben de costado.
> Las cosas perdidas volvieron a sus dueños. Ercilia guardó el dedal en el bolsillo del delantal y dijo «gracias»
> mirando para el lado del bosque. No a vos: para el bosque.

---

### Capítulo 7 — «La cosecha» (punto medio)
*Acto II · otoño, días 6–7 · 30 / 40 min · tensión 2 → 4 (cierra con el punto medio)*

**Tarjeta de entrada**
> Las habas están gordas, la muela está caliente y en la aldea se habla de la Fiesta de la Cosecha y de la minga.
> Graciela volvió en el tren de la mañana, con el portafolios y botas nuevas: alguien le avisó del barro.
> «Vengo a contar», dijo. Elsa le contestó: «Cuente, cuente. Hoy hay mucho».

**Escenas**

- **E1 · La primera molienda** — *Molino · mañana · Josefina, Ercilia y Graciela llegan una atrás de la otra.*
  Cámara: **plano general** del molino con diez bolsas apiladas → **paneo** por las tres caras.
  > **Ercilia:** Querido, diez bolsas. *[aplaudir]* Con esto la aldea pasa el invierno sin fiado. Bueno, con menos fiado.
  > **Graciela:** Diez bolsas a Esquel son media tonelada para el ramal. *[contar]* Media tonelada que figura en la planilla.
  > **Josefina:** *(sin mirar las bolsas, mirando el coihue)* Mi abuelo dejaba una aparte. Siempre una aparte.
  → **D3**.

- **E2 · La minga** — *Camino del refugio a la aldea · día de la minga (o la tarde siguiente) · vecinos trabajando.*
  Cámara: **plano general** con todos palando y cargando; **plano medio** de Ramón y Fermín juntos.
  > **Fermín:** *(a Ramón, bajito)* Don Ramón, este invierno… *[pensar]*
  > **Ramón:** Este invierno, lo mismo que todos. *[negar]* Pasame la pala.
  (Semilla del D5: Fermín quiere hablar; Ramón no lo deja.)

- **E3 · El galpón en ronda** — *Tu galpón · al amanecer después de la minga.* **PUNTO MEDIO.**
  Cámara: **plano detalle** de la puerta del galpón entornada → **travelling** hacia adentro → **picado** desde el techo:
  las bolsas que quedaban están **abiertas** y la harina volcada en **montoncitos en ronda**, como un reloj, con huellas
  chiquitas alrededor. En el medio, un **pozo** recién hecho en el piso de tierra (topo, `excavador`), y adentro del pozo,
  envuelto en hule, **un cuaderno**. **Primer plano** de la tapa: *«Molino del Arroyo. E. Millán. Cuentas y tratos.»*
  Música corta, una sola nota. El jugador lo agarra (E).
  > **Cuaderno de Eusebio (primera página, leída en pantalla):** «Al que tenga la llave. Si estás leyendo esto, ellos te lo dieron, y yo no estoy. No les tengas miedo, pero tampoco les tengas confianza: tené trato. El trato es así: el molino muele para todos los del valle. Para todos. Y gracias.»

**Objetivos principales**
1. Cosechá seis veces de la huerta — `desde(cosechas) >= 6` [EXISTE].
2. Molé diez medidas de harina en tu molino — `desde(molido) >= 10` [NUEVO contador; el molino ya muele].
3. Construí un galpón para guardar las bolsas (O → Trabajo → Galpón de herramientas) — `terminadas.has('galponcito')` [EXISTE].
4. **D3 · La primera molienda** — `decision('molienda')`, y cumplí:
   - **A.** Llevá seis bolsas a Esquel por la trochita: tres fletes desde la Estación del Valle al Puesto del Riel Sur —
     `entregar_flete('harina', 3)` [NUEVO: flete con carga de historia] → **ramal +4**.
   - **B.** Llevá seis bolsas al almacén de Ercilia en el carro (o en tres viajes a caballo) — `entregar('ercilia', harina 6)`.
   - **C.** Dos fletes, tres bolsas al almacén y una bolsa a la raíz del coihue (o del tocón) — combinación de A y B + `llegar('coihue')` → **ramal +2**.
5. Llevá algo cocinado a la minga (pan casero, tortas fritas o empanadas) — `p.cocina.hechas` [EXISTE] + `llegar('minga')`
   (si el día 7 ya pasó, la minga se arma igual con los vecinos: fiesta guionada) [NUEVO: fiesta de historia].
6. Entrá al galpón a la mañana — `escena('galpon-ronda')` [NUEVO] (se dispara al amanecer siguiente a la minga).

**Optativas**
- *Concurso del dulce* (otoño [EXISTE `concursos`]): con dulce de calafate; Ercilia +1 si ganás cinta.
- *Fermín quiere hablar:* buscalo en el galpón de esquila después de la minga. Escena:
  > **Fermín:** Belisario me ofreció irme con las mulas, al otro lado. *[encogerse]* Hasta el invierno tengo para contestar. No le digas a Ramón. Ramón ya tiene bastante con ser Ramón.
  Fermín +1 (desbloquea la opción A de D5 sin penalidad con Ramón si el lazo de Fermín es ≥ +2).

**Premio:** ninguno material: **el cuaderno de Eusebio** (se lee en el diario, página por página, a medida que avanza la historia).
**Desbloqueo:** la **página de tratos** del cuaderno: muestra, con la letra de Eusebio, lo que convidaste y lo que te
dejaron (un registro de indicios) [NUEVO].

**Tarjeta de cierre**
> No faltaba nada. Ni una medida. Estaba todo en el piso, en ronda, como si alguien hubiera querido mostrarte cuánto era.
> Y abajo, enterrado, el cuaderno del molinero. Alguien sabía que estaba ahí. Alguien quiso que lo tuvieras.
> Cerraste el galpón. Después lo volviste a abrir y dejaste la puerta entornada. No sabés bien por qué.

---

### Capítulo 8 — «El cuaderno de Eusebio»
*Acto II · otoño, días 7–8 · 30 / 40 min · tensión 3*

**Tarjeta de entrada**
> El cuaderno tiene cuarenta años de cuentas: bolsas, maquilas, nombres de vecinos que ya no están.
> Y entre las cuentas, otras cosas. Dibujos de puertitas. Una lista que dice «lo que dejaron»: un canto blanco,
> piñones, una pluma de cóndor, «la llave que perdí en el 79». Y una frase subrayada dos veces:
> *«Cuando la nieve tapa el paso, los del cerro bajan. Los de abajo les tienen más miedo que nosotros.»*

**Escenas**

- **E1 · La libreta de fiado** — *Almacén · Ercilia y el jugador solos, persiana a medio bajar.*
  Cámara: **plano medio** sobre el mostrador → **plano detalle** de la libreta de la abuela.
  > **Ercilia:** Te tengo que decir dos cosas, querido, y ninguna es fácil. *[suspirar]* La primera: el aviso del diario lo puse yo. La aldea se vacía. Hace tres años que no nace nadie. Pensé: si viene uno, vienen otros.
  > **Ercilia:** La segunda… *(abre la libreta)* Mirá esta cuenta. «Los de la raíz». Con la letra de Eusebio. «Debe: nada. Se les debe: una.» Cuarenta años mirándola y no sé qué se les debe.
  > *(Respuesta [lazo Ercilia]: «Gracias por el aviso.» (+1) / «Me podrías haber avisado del resto.» (−0, línea: «¿Y venías?»))*

- **E2 · El cuaderno del abuelo** — *Seccional de guardaparques · tarde · Josefina (con D1 = C, esta escena ya pasó en el cap. 5 y acá se profundiza).*
  Cámara: **plano medio** de Josefina sacando una caja de abajo del escritorio → **plano detalle** de un cuaderno de tapas de
  tela con dibujos de puertitas en raíces, a lápiz, con medidas.
  > **Josefina:** No se lo mostré a nadie. Ni a Julia. *[sentado]* Soy bióloga. Si digo «duendes» en una reunión de parques, me mandan a contar choiques a la estepa.
  > **Josefina:** Pero mirá: mi abuelo medía las puertitas. Ancho, alto, de qué madera. Tenía método. *[reír]* Era más científico que yo.
  > **Josefina:** Y si esto se sabe, viene gente con linternas a romper raíces. *[cruzarse-brazos]* Por eso lo cuido. Por eso los cuido. A ellos y al bosque. Es lo mismo.

- **E3 · Los del cerro** — *Puesto del Paso · Belisario junto al fogón, mulas al fondo.* (Se llega en trochita al Puesto del Paso o a caballo.)
  Cámara: **plano general** del paso con la cordillera nevada arriba → **plano medio** de Belisario.
  > **Belisario:** Usted pregunta por los del cerro. *[barba]* Mire, mi amigo: yo crucé ese paso doscientas veces con mulas. Las mulas no se espantan por nada. Por los del cerro, sí.
  > **Belisario:** Son más viejos. Más grandes. Con barba como liquen. Cuando la nieve tapa el paso no tienen qué comer y bajan. Los chiquitos de las raíces, los de ustedes, les disparan. *[encogerse]* Eusebio decía que el molino los tenía lejos. No sé si por la harina o por el ruido.
  > **Belisario:** Y dígale a Fermín que mi oferta sigue. Las mulas no esperan, pero yo sí, un poquito.

- **E4 · El secreto de Ramón** — *Puesto Alto · atardecer · Ramón en el banco de su puerta (si lazo Ramón ≥ 0; si no, lo ves de lejos en la raíz y no hay escena).*
  Cámara: **plano general** con el valle colorado detrás → **primer plano** de Ramón, la única vez en toda la historia.
  > **Ramón:** El invierno de la ceniza no había pasto. *[tomar-mate]* Las ovejas se morían paradas. Y una mañana, en la puerta, piñones. Y la otra. Y la otra. Un mes. Les di piñones a las ovejas tostados en la estufa, y pasamos.
  > **Ramón:** Nunca supe quién. Nunca di las gracias. *(se le quiebra la voz, se compone)* Por eso dejo la yerba. Es poco. Es lo que hay.
  > **Ramón:** No le cuentes a nadie, m'hijo. Que después Belisario se ríe.

- **E5 · El fogón de la leyenda** — *Predio de la aldea (la Noche de la Leyenda si es el día 9; si no, un fogón guionado) · 21:00 · media aldea.*
  Cámara: **plano general** del fogón con las caras naranjas → **paneo** de cara en cara → el jugador tiene los tres
  cuadernos (o dos) → **D4**.
  - Si **A (contar)**: el jugador lee en voz alta (texto en pantalla) la primera página de Eusebio. Herminia aplaude, Nahuel y
    Lucía preguntan si se pueden ver, Graciela anota. Josefina se va antes del final [irse-ofendido suave].
    > **Herminia:** ¡Por fin alguien lo dice en voz alta! *[aplaudir]* Ochenta y nueve años esperando.
  - Si **B (callar)**: el jugador cuenta otra leyenda (una de las que ya existen en `fiestas`). Josefina, al lado, apenas
    **[asentir]**. Al terminar, Ramón te pasa el mate sin decir nada.
  - Si **C (universidad)**: Josefina habla de «un árbol notable» y de «registrar el sitio». Graciela se interesa: «Un sitio
    protegido junto al ramal… eso sí figura en la planilla».

**Objetivos principales**
1. Leé el cuaderno de Eusebio (tres páginas en el diario) — `escena('cuaderno-1..3')` [NUEVO].
2. Mostrale el cuaderno a Ercilia — `hablar('ercilia','cuaderno')`.
3. Mostrale el cuaderno a Josefina en la seccional — `hablar('ema','cuaderno')`.
4. Andá al Puesto del Paso y preguntale a Belisario por «los del cerro» — `llegar('puesto-paso')` + `hablar('belisario','cerro')`.
5. Subí al Puesto Alto a ver a Ramón al atardecer — `hora(17, 20)` + `hablar('ramon','ceniza')`.
6. **D4 · En el fogón: contar o callar** — `decision('cuaderno')`.

**Optativas**
- **«La veta que vuelve»** (si D2 = C): con Tobías, de noche en la cantera, ves una veta que alguien rellenó con cantos
  rodados blancos como el de tu umbral. Tobías +1; te deja llevarte 10 cantos (sirven para la honda del cap. 11).
- *Las mulas de Belisario:* acompañá la tropa de mulas a caballo hasta el mallín (`jinete` [EXISTE caballo]); Belisario +1,
  y te cuenta que el zaino es hijo de la yegua «mansa» que le vendió a Ramón.
- *Herminia y los noventa* (si cae su cumpleaños [EXISTE `noventa`]): llevale una torta; Herminia te da «la llavecita»,
  una llave de bronce chiquita que encontró de nena en una raíz (objeto que aparece en el final A).

**Premio:** yerba, una **pluma de cóndor** (de las de la lista de Eusebio, aparece en tu umbral esa noche) y, según D4:
A — la aldea te trae leña para el invierno (6 troncos secos); B — Ramón te regala su poncho viejo; C — Graciela te
consigue un flete de «material de estudio» (ramal +1).
**Desbloqueo:** el **horario de invierno** de la trochita aparece en la estación (para que el jugador planifique los fletes
del acto III).

**Tarjeta de cierre**
> Esa noche, de vuelta del fogón, el valle estaba lleno de ruidos chiquitos: hojas, agua, algo que corría.
> Ya no te dieron miedo. Te dieron otra cosa, más difícil de nombrar: la sensación de que el valle te estaba mirando
> para ver qué hacías.
> En la cordillera, arriba de todo, cayó la primera nieve.

---

## ACTO III — INVIERNO: LA NOCHE

### Capítulo 9 — «Los primeros fríos»
*Acto III · invierno, día 9 (puerta de estación) · 30 / 40 min · tensión 4 (crisis)*

**Puerta de estación:** arranca en invierno. Si todavía es otoño: «Esperá la primera helada» (se puede dormir). Si se
pasó, la historia trae una **helada temprana** a los 2 días [NUEVO: clima forzado].

**Tarjeta de entrada**
> El balde amaneció con una tela de hielo y el aliento se ve. En la aldea dicen que Ramón no bajó con la majada.
> Ramón baja siempre. Ramón bajó el día que se le murió el perro.

**Escenas**

- **E1 · Ramón en cama** — *Adentro del Puesto Alto · 9:00 · Ramón sentado con manta junto a la estufa, Marta (enfermera) a su lado.*
  Cámara: **plano general** del cuarto chico y oscuro → **plano medio** de Ramón tapado → **plano y contraplano** con Marta.
  > **Marta:** Fiebre y la cadera. *[curar]* Dos semanas de reposo en la aldea, cerca del puesto sanitario. No es negociable, don Ramón.
  > **Ramón:** Todo es negociable. *[cruzarse-brazos]* Menos la majada. ¿Quién sube con la majada?
  > **Marta:** *(te mira a vos)* Esa es otra pregunta.
  > **Ramón:** *(a vos, más bajo)* Hace un mes te firmé un papel, por las dudas. Ercilia te lo guarda. Con eso podés hacer lo que haga falta. *(pausa)* Pero vos sabés lo que hace falta.

- **E2 · Fermín en la puerta** — *Afuera del Puesto Alto · Fermín llega a caballo, se queda en la tranquera.*
  Cámara: **plano general** con Fermín chiquito en la tranquera y la nieve en el cerro.
  > **Fermín:** *(sin bajarse)* Si quiere, me la llevo yo. Entera. *[mirar]* Ya sé que no es lo mismo.
  → **D5**.
  - **A (Fermín):** Ramón tarda en contestar. **[suspirar]** «Llevala. Y no me la devuelvas flaca.» Fermín se saca el sombrero.
  - **B (vos):** Ramón **[asentir]**: «Vos.» Fermín se va sin decir nada.
  - **C (vender):** el papel de Ramón, Belisario compra. Ramón no te mira. «Andá.» (Ramón −3.)

- **E3 · Las hojas de canelo** — *Puerta del Puesto Alto · a la mañana siguiente (o en el puesto sanitario de la aldea).*
  Cámara: **plano detalle** del umbral.
  - Si el lazo con los duendes está **convidado** (D1 = A, D3 = C o D2 = A/C con dos de tres): un atado de **hojas de canelo**
    y un yuyo pálido, atado con un pelo de oveja. Marta: «Esto es lo que yo le iba a dar. ¿Quién lo trajo?». Ramón se cura
    un día antes. (El `curandero`/yuyero se ve de espaldas, huyendo, si el jugador está cerca al amanecer.)
  - Si **no**: la tranquera del corral **abierta** y las ovejas desparramadas (hay que juntarlas: optativa obligatoria del D5).

**Objetivos principales**
1. Subí al Puesto Alto: Ramón no bajó — `llegar('puesto-alto')` + `escena('ramon-cama')`.
2. **D5 · La majada de Ramón** — `decision('majada')`, y cumplí:
   - **A.** Ayudá a Fermín a arrear la majada al galpón de esquila (a caballo, ir delante) — `arreo('majada','galpon-esquila')` [NUEVO: arreo simple: las ovejas siguen al caballo].
   - **B.** Cuidá la majada tres días: llevá agua y forraje al corral cada mañana — `entregar('corral-ramon', ...)` ×3 días [NUEVO] (se apoya en `corral`/`majada` [EXISTE]).
   - **C.** Llevá la majada al Puesto del Paso para Belisario — `arreo('majada','puesto-paso')` → $$ (pesos al cobrar).
3. Llevá a Ramón a la aldea: en el carro o en la trochita — `acompanante('ramon')` + `llegar('puesto-sanitario')` [NUEVO].
4. Prepará tu invierno: seis troncos secos en la leñera — `lena >= 6` [EXISTE]; una estufa a leña — `terminadas.has('estufa-hierro')` [EXISTE];
   abrigo — `abrigo` [EXISTE].
5. A la noche, en el galpón hay luz: andá a ver — se encadena al capítulo 10 (no se cumple acá: cierra el capítulo
   con la tarjeta).

**Optativas**
- **«El papel de Elsa»:** Elsa está rara; le encontrás el pedido de traslado caído en el andén. Opciones: devolvérselo sin
  decir nada (Elsa +1) o devolvérselo diciendo «la cuenta del ramal va bien» (sólo si ramal ≥ 6; Elsa +2).
  > **Elsa:** *(guarda el papel)* Usted no vio nada, pasajero. *[pedir-perdón]* … Gracias. Ya no le digo pasajero, ¿eh? Le digo por el nombre. Pero no se acostumbre.
- *Visitá a Ramón en el puesto sanitario* con algo rico (trucha ahumada, piñones): Ramón +1, cuenta del perro Chocolate.
- *La trochita en la nieve* (encargo de temporada `t-trochita-nieve` [EXISTE]): ramal +1.

**Premio:** seis troncos secos y medio kilo de yerba; con D5 = C, los pesos de la venta.
**Desbloqueo:** con D5 = A, **Fermín te vende lana a precio de amigo** (para el poncho y la cuerda del arco); con D5 = B,
**la majada de Ramón te da vellones** mientras la cuidás.

**Tarjeta de cierre**
> Esa noche nevó finito. Volviendo al refugio con el farol, viste que por la rendija de tu galpón salía luz.
> Una luz amarilla, temblona, como de muchas velitas. Y risas. Muchas risas, bajitas, como de gente que se tapa la boca.
> Dejaste el farol en el suelo. Te sacaste los guantes. Y fuiste.

---

### Capítulo 10 — «Golpeá antes de abrir»
*Acto III · invierno, la misma noche y el día siguiente · 25 / 30 min · tensión 5 (el encuentro)*

**Tarjeta de entrada**
> La placa de la plaza lo dice clarito: «Golpeá antes de abrir».
> Tu galpón tiene luz adentro, risas bajitas y olor a harina. Es tu galpón. Pero esta noche no está tan claro de quién es.

**Escenas**

- **E1 · El golpe** — *Puerta del galpón · 23:00 · nevando finito.*
  El jugador se acerca: la E dice **«Golpear»** (no «Abrir») [NUEVO: interacción de historia]. Si abre sin golpear, la luz se
  apaga de golpe y hay que esperar 10 s en la oscuridad hasta que se vuelve a prender (sin castigo: es una broma de ellos).
  Al golpear: silencio total. La puerta se abre sola, un palmo.
  Cámara: **sobre el hombro** entrando → **plano general** del interior.

- **E2 · El encuentro** — *Adentro del galpón.* (escena dirigida de 60–90 s)
  - **Plano general:** diez o doce duendes sentados en ronda alrededor de las bolsas abiertas: pillos, dos saltarines
    colgados de las vigas, duendecitos con lucecitas ámbar, un yuyero que huele la harina. Amasan bollitos con las manos.
    Se congelan.
  - **Paneo** lento de cara en cara: ojos verdes, ojos ámbar. Nadie se mueve.
  - **Contrapicado** al fondo: sentado arriba de una bolsa, el **Mandamás** (`jefe`), con los hongos del lomo brillando
    apenas. Te mira mucho rato.
  - **Primer plano** del Mandamás: levanta un brazo y señala **las bolsas**; después, despacio, **la ventana** →
    **mirada dirigida** por la ventana hacia el cerro nevado (2 s: nada, sólo nieve y oscuridad) → vuelve, y te señala **a vos**.
    (¿Te está pidiendo, te está avisando o te está amenazando? No se sabe. A propósito.)
  - Un duendecito estornuda harina. Risas tapadas. El Mandamás no se ríe.
  - **Tarjeta de decisión D6** (sin tiempo límite; el juego en pausa):
    1. **Dejar la puerta abierta y sentarte en el umbral.**
    2. **Poner la bolsa en el umbral** *(sólo si convidaste: D1 = A o D3 = C)*.
    3. **Agarrar la pala y el farol: ¡fuera de acá!**

- **E3a · Trato** — Cámara: **plano medio** del jugador sentándose en el umbral [sentado]; **plano general** desde adentro.
  El Mandamás se baja de la bolsa. Camina hasta vos. Mira la bolsa (si la pusiste) o mira tus manos vacías. Agarra **una**
  bolsa (con D1 = B, la que le debías; con D2 = B, además señala el tocón: «deuda» de 6 tablas de coihue para el cap. 11).
  Deja en el piso, adelante tuyo, **una llave grande, vieja, de hierro**: la que Eusebio anotó como «la llave que perdí en el 79».
  Salen en fila. Cada uno, al pasar, **te toca la bota** con un dedo. El último deja la puerta **entornada**.
  Cuaderno de lo raro: *«Nos dimos la mano. Bueno: me tocaron la bota. Creo que es lo mismo.»*
- **E3b · Pelea** — El jugador grita (texto: *«¡Fuera!» — te sale más fuerte de lo que pensabas*). Cámara: **plano general
  movido** (la cámara tiembla apenas): saltarines por la ventana, topos al pozo del piso, pillos entre tus piernas, el yuyero
  tirando su calabacita. El Mandamás es el último. Se levanta. Agarra una bolsa al hombro y sale **caminando**, sin apuro,
  por al lado tuyo. En la puerta se da vuelta. **Primer plano.** Se va.
  A la mañana: la ventana del refugio con barro y bellotas, y en la puerta del galpón, **una puertita de juguete clavada al
  revés**. Cuaderno: *«Nadie me pegó. Nadie me robó. Pero hay algo roto y no sé qué es.»*

- **E4 · Arriba, en el cerro** — *Mirador del pehuén · a la mañana · con Josefina (lazo ≥ +1) o con Belisario.*
  Cámara: **plano general** del cerro nevado → **acercamiento lento** (empuje de cámara): en la nieve, muy arriba, **formas
  oscuras** que se mueven en fila, más grandes que los de las raíces (variante «Viejo», barbudos, con liquen).
  - Trato: sobre la piedra del mirador, a tu lado, **tres lucecitas ámbar** que tiemblan. Josefina: *«Tienen miedo. Mirá cómo tiemblan.»*
  - Pelea: las formas de arriba **y**, bajando a juntarse con ellas por la ladera, otras más chicas. Josefina: *«Se van con ellos.»*
  > **Josefina** (o **Belisario**): Cuando la nieve tape el paso, bajan. *[mirar]* La nevada grande viene en un par de días. Y el molino es lo único caliente con harina de acá al lago.
  > **Josefina:** Vamos a necesitar algo más que una pala.

- **E5 · La mesa de guerra (sin guerra)** — *Mesa del refugio · tarde · los vecinos con lazo ≥ 0 (mínimo Ramón o Josefina; Ramón en silla si está convaleciente).*
  Cámara: **plano general** de la mesa con el mapa del valle (hoja del cuaderno) → **plano y contraplano** rápido.
  > **Ramón:** *(si está)* Yo en la cama no me quedo. *[cruzarse-brazos]* Con un martillo en la mano no me duele nada.
  > **Josefina:** Arco. Yo tiro con arco desde los quince. Pero vos también vas a tener que tirar.
  > **Fermín:** *(si lazo ≥ +1)* Y honda. Con honda le pego a una lata a treinta metros. No le cuenten a nadie.
  > **Ercilia:** Anselmo tiene estacas, Guido tiene miel, Martín tiene la campana vieja del taller. Esto es un valle, querido: acá nadie tiene todo, pero entre todos tenemos todo.

**Objetivos principales**
1. Andá al galpón y golpeá la puerta (E) — `escena('golpe')` [NUEVO].
2. **D6 · Trato o pelea** — `decision('duendes')` → guarda **`duendes.trato`** = `'trato'` | `'pelea'` (y `duendes.deuda` si corresponde).
3. A la mañana, subí al mirador del pehuén — `llegar('mirador')` + `escena('cerro')`.
4. Juntá a los vecinos en tu mesa — `escena('mesa-guerra')` (se dispara con la mesa puesta a partir de las 16; trae las
   visitas sin esperar los 3 días) [NUEVO: visita forzada de varios].

**Optativas**
- *La llave del 79* (sólo trato): probala en las cerraduras del valle. Abre **el cajón trabado del molino viejo** (junto a las
  piedras): adentro hay una foto de tres hombres jóvenes con una bolsa de trigo: Eusebio, el abuelo de Josefina y **Ramón**.
  Llevala a Josefina (+1) y a Ramón (+1). Ramón: *«Qué flaco estaba. Qué flaco y qué zonzo.»* (La foto va al final A.)
- *Pedir perdón* (sólo pelea): dejá algo en la raíz del coihue (una bolsa, piñones, la puertita): no cambia D6, pero en el
  final B aparece una variante más tibia (`duendes.perdon = true`).

**Premio:** con trato, **la llave del 79**; con pelea, nada (la puertita al revés queda en tu galpón).
**Desbloqueo:** el plan de la noche: el **lado del arroyo** queda marcado en el mapa como el lado de ataque.

**Tarjeta de cierre** (según D6)
> Trato — *Afuera nevaba despacio. En la nieve nueva había huellas chiquitas que salían del galpón en fila y se perdían
> en la raíz del coihue. Ninguna volvía. Todas estaban tranquilas, si es que las huellas pueden estar tranquilas.*
> Pelea — *Las huellas salían corriendo para todos lados. Una sola fila iba despacio, derecho al cerro: la del grande.
> Era la única que no tenía miedo.*

---

### Capítulo 11 — «El arco y la honda»
*Acto III · invierno, días 10–11 · 35 / 45 min · tensión 3 (preparación activa)*

**Tarjeta de entrada**
> Nadie en el valle tiene armas. Hay hachas, palas, cañas, un rifle viejo de Belisario que no tira desde 1970.
> Pero Josefina tira con arco desde los quince, Fermín le pega a una lata a treinta metros con la honda,
> y en la aldea cada uno tiene algo para prestar. Hay dos días hasta la nevada grande. Alcanza, si se empieza ya.

**Cadena A · El arco** (con Tito, Elvira, Anselmo y Josefina)
1. **La madera:** talá una lenga seca de la ladera (marcada) — `talado('lenga-seca')` [NUEVO]; o, si D2 = B, llevale a Tito
   dos tablas de coihue (`entregar('carpintero', tabla-coihue 2)`; Tito: *«La madera vuelve adonde tenía que ir»*).
2. **El arco:** dejásela a Tito en la carpintería y volvé a la mañana — `entregar('carpintero', ...)` + `esperar_dia(1)` [NUEVO].
   **Escena E1 · La carpintería** — *Carpintería · 8:00 · Tito.* Cámara: **plano detalle** de las manos de Tito [serruchar],
   **plano medio** cuando te da el arco sin cuerda.
   > **Tito:** Lenga. Flexible y terca, como la gente de acá. *[hacer-broma]* No lo deje al sol ni lo deje en la nieve. Trátelo como a un perro viejo.
3. **La cuerda:** llevale a Elvira dos vellones (de la majada, de Fermín o del almacén) y un pan de cera (de tu colmena o de
   Guido) — `entregar('tejedora', vellon 2, cera 1)` [NUEVO: la cera como cosa].
4. **Las puntas:** encargale a Anselmo doce puntas de flecha — `pagar('herrero', $)` [NUEVO o se apoya en la forja del anillo].
5. **Las plumas** (micro-decisión, cambia el lazo de Josefina):
   - Juntar seis **plumas del bosque** (`pluma` [EXISTE como objeto del suelo]) → Josefina −1: *«Las plumas se quedan en el bosque. Te lo dije el primer día.»*
   - Juntar seis plumas de **tu gallinero** (necesita gallinero [EXISTE]) → Josefina +1: *«Mirá vos. Aprendiste.»*
   - **Pedirle a Josefina** (lazo ≥ +2): plumas de la colección de la seccional, de aves que encontró muertas → Josefina +1 y escena corta:
     > **Josefina:** Cada una tiene una ficha: dónde, cuándo, de qué. *[leyendo]* Esta es de un cauquén del invierno pasado. Que sirva para algo.
6. **Practicá:** en el Puesto del Paso, cinco blancos de paja de Belisario (mantener el clic tensa el arco) —
   `blancos('paso', 5)` [NUEVO] → **`armas.arco = true`**.
   > **Belisario:** ¡Eso! *[aplaudir]* Ahora no le dispare a mis mulas.

**Cadena B · La honda** (con Fermín y Tobías)
1. **Pedile a Fermín que te enseñe** — `hablar('fermin','honda')`. Con D5 = C o lazo de Fermín < 0, primero hay que
   **hacer las paces**: llevale un regalo que le guste (harina, yerba o pan) — `entregar('fermin', ...)`.
   **Escena E2 · El galpón de esquila** — *Galpón de esquila · mediodía con viento · Fermín.*
   Cámara: **plano general** con la estepa blanca → **sobre el hombro** de Fermín revoleando → **plano detalle** de la lata que vuela.
   > **Fermín:** La honda no se apunta. Se siente. *[tirar]* Como cuando llamás al perro: no pensás, sale.
   > **Fermín:** *(si D5 = A)* Ramón vino ayer a ver la majada. En carro, con la cadera mala. Dijo que estaban flacas. *[reír]* No estaban flacas. Es su forma de decir gracias.
2. **La honda:** un cuero del almacén o lana trenzada (dos vellones) — `entregar('fermin', cuero 1 | vellon 2)`.
3. **Los cantos:** veinte cantos rodados del arroyo — `canto` [EXISTE como objeto del suelo]; o diez de la veta de Tobías
   (si hiciste la optativa del cap. 8).
4. **Practicá:** voltear cinco latas de los postes del galpón — `blancos('esquila', 5)` → **`armas.honda = true`**.

**Cadena C · Lo prestado** (las defensas armadas para la noche: pedile a tres de cuatro)
- **Anselmo:** estacas de hierro viejo. *«Son de un arado viejo. Duras como el que las forjó.»*
- **Guido:** dos trampas de miel (traba un rato a los chicos). *«Que no se la coman, que es de ulmo.»*
- **Martín:** la campana vieja del taller ferroviario (avisa de cada ola; suena sola si la golpean).
- **Elsa:** una empalizada de durmientes viejos del ramal (se arma en el lado del arroyo). *«Que sirvan de algo esos durmientes, que de tren ya no sirven.»*
- **Tobías** (si D2 = C): la pirca del coihue, reforzada (cuarta defensa sin pedir).
Condición: `prestado >= 3` [NUEVO].

**Si hay deuda del trato** (D6 trato con D1 = B o D2 = B): **pagala** antes de la noche — una bolsa de harina o seis tablas de
coihue en la raíz o el tocón — `duendes.deuda = 0`. Si no se paga, el trato vale igual pero los chicos no ayudan en la noche.

**Escena E3 · Recorrer el lado** — *Del arroyo al galpón · atardecer · Ramón (con bastón) o Josefina.*
Cámara: **travelling** al costado de los dos caminando por el lado del ataque; cada defensa prestada ya está en su lugar
(se ven armadas) → **plano general** final desde el galpón hacia el arroyo.
> **Ramón:** Por acá vienen. *[mirar]* Por el agua. Todo baja por el agua, en este valle: la nieve, las truchas, los problemas.
> **Ramón:** *(si D5 = A)* Fermín me dijo que la majada está bien. *(pausa)* Está mejor que conmigo. No se lo digas.

**Objetivos principales**
1. Cadena A completa — `armas.arco = true`.
2. Cadena B completa — `armas.honda = true`.
3. Tres cosas prestadas — `prestado >= 3`.
4. *(Si hay)* pagá la deuda — `duendes.deuda === 0` (no traba: si no se paga, se avisa en la tarjeta de cierre).
5. Recorré el lado del arroyo — `escena('recorrer-lado')`.

**Optativas**
- *Flechas de más:* con más plumas y puntas, Tito te hace un segundo atado (más munición en la noche).
- *El cumpleaños que no se suspende* (si cae algún cumpleaños de la aldea [EXISTE `CUMPLES_ALDEA`]): ir igual, aunque haya
  nevada; Ercilia +1.
- *Alguien que te espera* (subtrama de amor, sólo si el sistema está prendido y tenés pareja o estás saliendo): una cita
  corta en su lugar favorito la noche antes; la persona te pide que tengas cuidado (todo sugerido: una mano en el brazo, un
  silencio largo) y está en la escena del amanecer.

**Premio:** **el arco y la honda** (quedan en la mochila; después de la historia, colgados en la pared del refugio como recuerdo).
**Desbloqueo:** el **arsenal prestado** (sólo para la noche) y el **puesto de la campana** en el galpón.

**Tarjeta de cierre**
> La radio del Cerro Negro lo dijo tres veces: nevada grande en la cordillera, baja al valle esta noche.
> Ercilia cerró temprano. Los chicos de los Jones pegaron la nariz al vidrio. Ramón pidió que lo llevaran al refugio
> «para mirar, nomás». Josefina se trajo el sombrero.
> Afuera empezó a nevar. Grueso, esta vez.

---

### Capítulo 12 — «La noche de la nevada» (clímax)
*Acto III · invierno, la noche de la nevada · 25 / 30 min (de los cuales la defensa: **3 a 5 min**) · tensión 5*

**Puerta:** la nevada grande (`nevada` de `fiestas.js`, días 9–10 [EXISTE]) o, si ya pasó, **la nevada de la historia**: la
noche siguiente al cierre del cap. 11 [NUEVO: clima forzado].

**Tarjeta de entrada**
> Nieva como si el cielo se estuviera vaciando. En el valle, las luces de las casas se apagan una por una: la gente
> se junta en la estación, cerca de la salamandra, como en las noches bravas de antes.
> En tu galpón está la harina del invierno. Detrás, el arroyo, negro, haciendo ruido entre la nieve.

**Preparación (objetivos, antes de la defensa)**
1. Comé algo caliente: un guiso, un locro o trucha con papas — `p.cocina.hechas` desde el capítulo [EXISTE].
   > **Ramón:** Nadie pelea con la panza vacía. Ni ellos. *[cebar-mate]* Por eso bajan.
2. Llevá a Herminia y a los chicos de los Jones a la estación (con D4 = A vienen todos solos, y miran desde la loma) —
   `acompanante('abuela')` + `llegar('estacion')` [NUEVO] (con D4 = B o C, se salta: «Ya están en la estación»).
3. Estate en el galpón a las 22 con el arco y la honda — `hora(22)` + `llegar('galpon')`.

**Escena E1 · La espera** — *Puerta del galpón · 22:00.*
Cámara: **plano general** del lado del arroyo con la nieve cayendo y las defensas prestadas armadas → **paneo** a los aliados
en su lugar → **sobre el hombro** del jugador mirando el bosque.
- **Trato:** detrás tuyo, en las raíces del coihue (o del tocón), se prenden **lucecitas ámbar**, una por una, hasta ser veinte.
  > **Josefina:** *(si está)* Están con nosotros. *[susurrar]* O nosotros con ellos. Da igual.
- **Pelea:** en el bosque, del otro lado del arroyo, se prenden **ojos verdes**. Muchos. Una bellota pega en la campana: *¡tin!*
  > **Ramón:** *(si está)* Bueno. *[cruzarse-brazos]* Ahora sí que no me duele la cadera.
Martín (o el que te prestó la campana) la toca tres veces. Empieza.

**La defensa (3 a 5 min, un solo lado)** [NUEVO: `historia-noche`]
- **Lado:** del arroyo al galpón (unos 40 m). Defensas prearmadas: las 3–4 prestadas + la pirca (si D2 = C).
- **Arsenal:** el arco (mantener clic para tensar) y la honda (cantos); el hacha para lo que llega cerca. Munición limitada;
  hay un atado extra en el galpón (y otro con la optativa de flechas).
- **Olas** (la campana avisa cada una):
  | Ola | Trato: «los del cerro» (variante Viejo) | Pelea: los de las raíces + los del cerro |
  |---|---|---|
  | 1 (0:00–1:15) | 6 pillos viejos + 3 saltarines | 8 pillos + 4 saltarines (tiran bellotas a la campana) |
  | 2 (1:15–2:45) | 2 topos + 3 honderos viejos | 3 topos + 4 honderos + un yuyero que cura atrás |
  | 3 (2:45–4:30) | 1 grandote + el **Mandamás viejo** | 1 grandote + el **Mandamás** (el del galpón) |
- **Ganar:** el Mandamás se va (su punto débil es el lomo con hongos, como en el Desafío: ×2) o aguantás hasta que para
  la nevada (barra de nieve en el borde de la pantalla). **Perder:** el galpón se queda sin «aguante» o te quedás sin aire
  (te sentás en la nieve: nadie se lastima, nunca hay sangre).
- **Ayudas según lo que pasó:**
  - **Perro** (si tenés): ladra y muerde, como en el Desafío.
  - **Ramón** (lazo ≥ +1 y D5 ≠ C): repara las defensas prestadas, con el martillo, renegando.
  - **Josefina** (lazo ≥ +1): tira flechas.
  - **Fermín** (lazo ≥ +2): tira con honda desde el techo del galpón [NUEVO: aliado con honda].
  - **Trato:** los duendecitos de luz **avisan**: una lucecita se prende 2 s antes donde va a salir un topo, y los hongos del
    lomo del Mandamás brillan más cuando está de espaldas. Con **trato fuerte** (devolviste la bolsa), una vez por noche el
    enjambre se le tira encima al grandote y lo traba 5 s. Con **deuda sin pagar**, no ayudan.
  - **D4 = A:** la aldea mira desde la loma con faroles; cada ola ganada, se oyen aplausos (ánimo: sube el aire).
- **Si perdés:** tarjeta *«Te quedaste sin aire, sentado en la nieve. El galpón cruje.»* con dos botones:
  **«Otra vez»** (vuelve a las 22:00, todo como estaba, sin castigo) y **«Que amanezca»** (resultado `noche = 'perdida'`).
- Resultado: **`noche = 'ganada' | 'perdida'`** (empieza `'pendiente'`).

**Escena E2 · El amanecer** (cuatro variantes)
Cámara para todas: **plano general** del valle blanco con el sol bajo → **plano medio** del jugador y los aliados → **primer plano** final.
- **Trato · ganada:** los del cerro suben despacio la ladera. Las lucecitas salen de las raíces y rodean el galpón. El que te
  saludó en el cap. 6 (lo reconocés por la gorra torcida) se acerca y deja en la nieve, adelante tuyo, **un canto blanco**,
  el gemelo del de tu umbral. Se va. Josefina se ríe por primera vez en toda la historia [reír].
- **Trato · perdida:** el galpón medio caído, harina en la nieve. Los del cerro se llevaron bolsas y se fueron. Pero a la
  mañana, los chicos están **arreglando el galpón**: tablas torcidas, clavadas con espinas de calafate, mal y con ganas.
  > **Ramón:** Mirá cómo clavan. *[reír]* Igualito que vos el primer día.
- **Pelea · ganada:** el Mandamás se va último. En el borde del bosque se da vuelta y te mira (como en el galpón). **Baja la
  cabeza.** No se sabe si es derrota o despedida. Suben todos al cerro. El bosque queda en silencio; un silencio raro, nuevo.
  > **Josefina:** Ganamos. *[suspirar]* ¿Por qué no se siente como ganar?
- **Pelea · perdida:** el galpón vacío, las puertas abiertas, huellas en fila al cerro. Los vecinos llegan de la estación con
  bolsas: Ercilia con harina del fiado, Rosa con pan, Fermín con un cordero.
  > **Ercilia:** Acá, cuando uno pierde, perdemos todos un poquito. *[abrazar]* Y un poquito, entre todos, es poco.

**Objetivos principales**
1. Comé algo caliente — `cocina`.
2. *(Si D4 ≠ A)* llevá a Herminia y a los chicos a la estación — `acompanante`.
3. Estate en el galpón a las 22 con el arco y la honda.
4. **La noche** — `noche !== 'pendiente'`.
5. Mirá el amanecer — `escena('amanecer-<variante>')`.

**Premio:** según el final: trato · **la llave del molino viejo** (si no la usaste) y el canto gemelo; pelea · seis troncos y
harina de los vecinos (lo de la solidaridad).
**Desbloqueo:** el **epílogo** espera a la Fiesta de la Nieve o al primer día del año (lo que llegue primero, sin esperar
más de 2 días).

**Tarjeta de cierre**
> Ganes o pierdas, la noche pasó. Siempre pasan.
> Quedó la nieve, quedaron las huellas y quedó un valle que se quedó despierto con vos.

---

### Capítulo 13 — «El deshielo» (epílogo)
*Acto III · Fiesta de la Nieve (día 12) y el primer día del año siguiente (aniversario) · 20 / 30 min · tensión 2*

**Tarjeta de entrada**
> Pasó una semana del valle. La nieve se puso dura y brillante, y en la aldea preparan la Fiesta de la Nieve.
> Graciela llegó en el tren de la mañana. No trae el portafolios: trae una carpeta celeste, cerrada con elástico.

**Escenas**

- **E1 · La carpeta celeste** — *Andén de la Estación del Valle · 11:00 · Graciela, Elsa, Ernesto, el jugador; con D4 = A, media aldea.*
  Cámara: **plano general** del andén nevado → **plano medio** de Graciela → **primer plano** de Elsa esperando.
  Según la **cuenta del ramal**:
  - **≥ 10 (se salva):** Graciela saca de la carpeta el informe firmado y lo **rompe** en cuatro.
    > **Graciela:** Cuarenta toneladas no son. *[encogerse]* Pero acá hay algo que no figura en la planilla, y yo ya no sé hacer planillas sin ponerlo. El ramal sigue.
    > **Elsa:** *(no dice nada. Saca un papel del bolsillo del sobretodo, el del traslado, y lo rompe también.)* [abrazar a Graciela]
  - **6–9 (a prueba):** «Un año a prueba. Con horario de invierno. Y yo vengo en cada estación a contar.» Elsa: *«Cuente, ingeniera. Que vamos a tener mucho.»*
  - **< 6 (a prueba, Elsa se va):** «A prueba. Lo mejor que pude.» Elsa se sube al tren a Esquel con el papel mandado. Te da el
    silbato: *«Manéjelo con las orejas. Y escríbame.»* (Vuelve de visita en verano: optativa del juego libre.)
  - Si **Graciela** tiene lazo +3: *«Pedí el traslado. Al valle. Alguien tiene que contar las toneladas de cerca.»*

- **E2 · Los de la majada** — *Galpón de esquila o Puesto Alto · Ramón y Fermín.*
  - D5 = A: un cartel nuevo en el galpón: **«Puesto Catrileo»**. Ramón sentado en un banco, mirando cómo Fermín trabaja.
    > **Ramón:** Las tiene flacas. *[tomar-mate]* *(Fermín se ríe.)* … Las tiene bien. Las tiene mejor que yo.
  - D5 = B: Ramón de vuelta con la majada; Fermín se fue con las mulas de Belisario (si su lazo quedó < 0) y llega una postal de Chile:
    *«Acá también hay viento. Pero no es el mismo. F.»*; si el lazo de Fermín es ≥ 0, se quedó de medianero, como siempre, y
    Ramón le regaló los corderos del año «que ya eran tuyos».
  - D5 = C: Ramón en la loma, solo, mirando el galpón vacío. **Optativa del epílogo «Volver a subir»:** llevale el mate,
    sentate al lado, esperá a que hable (`esperar('loma', 1 h)`). Si lo hacés, Ramón sube a +0 y dice: *«La majada era
    una excusa, m'hijo. Lo que no quería era quedarme solo.»*
  - Si **Ramón** tiene lazo +3 (en cualquier rama): te da **el mate de Chocolate**, la calabacita tallada con un perro.

- **E3 · Josefina y el cuaderno** — *Junto al coihue (o al tocón) · tarde.*
  - D4 = A: Josefina viene de la escuela, donde les contó a los chicos de las puertitas. *«Les dije que no se toca. Que se mira. Me entendieron mejor que los de Parques.»*
  - D4 = B: Josefina deja el cuaderno del abuelo **en tu repisa**, al lado del canto blanco. *«Acá está mejor. Acá alguien lo cuida.»*
  - D4 = C: baja del tren una bióloga de Bariloche con una cinta métrica. El coihue tiene un cartelito: *«Árbol notable. No tocar.»* Josefina: *«Ahora es oficial. Ahora sí da miedo.»* [reír]

- **E4 · La última escena** — *Refugio · el primer día del año (aniversario de llegada [EXISTE `ANIVERSARIO`]) · 7:30.*
  Cámara: igual que el **E5 del cap. 1** (picado sobre el umbral), a propósito: el círculo se cierra.
  - **Final A (trato):** en el umbral, una ronda de ramitas, un canto blanco y una **bolsa vacía doblada prolija**: piden la
    de este año. **Paneo** al coihue: en la raíz hay **una puertita nueva**, con bisagra de cuero, como la de tu repisa
    (con D2 = B, la puertita está en el tocón).
  - **Final B (pelea):** el umbral vacío. **Paneo** al coihue: las puertitas de las raíces están abiertas y vacías, con
    telarañas. Herminia, en la aldea, deja la puerta de su casa **entornada** (corte a su puerta). Con `duendes.perdon`: en la
    raíz hay **una sola bellota**, puesta derecha, como un soldadito. Nadie sabe qué quiere decir.

**Objetivos principales**
1. Andá al andén a recibir a Graciela — `escena('carpeta')`.
2. Visitá a Ramón y a Fermín — `escena('majada-fin')`.
3. Andá a la Fiesta de la Nieve [EXISTE `fiestas`] (si ya pasó, la aldea hace «la fiesta del deshielo» guionada) — `llegar('predio')`.
4. Pasá la tarde con Josefina junto al coihue — `escena('josefina-fin')`.
5. Dormí y despertá el primer día del año — `escena('umbral-fin')`.

**Premio final:** el arco y la honda colgados en la pared del refugio; según el final, **la puertita de la repisa se abre**
(final A: adentro hay un piñón tostado) o **el canto blanco queda** (final B); el título de perfil **«Del valle»** [NUEVO].
**Desbloqueo:** el juego libre sigue con todo lo construido; en el final A, **cada cosecha** aparece la bolsa vacía en el
umbral (si la llenás y la dejás, a la mañana hay un regalito: un canto, piñones o una pluma) [NUEVO: costumbre del trato].

**Tarjeta final** (se arma con piezas según el estado)
> **A · El trato.**
> El valle sigue raro. Las herramientas a veces amanecen en otro lado, el pan de Rosa crece de más, Nicanor ve luces sobre
> el lago y ya nadie se ríe de él. Cada cosecha, una bolsa del molino se deja en el umbral. Nadie la ve irse.
> Eusebio tenía razón: no hay que tenerles miedo ni confianza. Hay que tener trato. Como con los vecinos.
>
> **B · La pelea.**
> El valle quedó tranquilo. Las herramientas amanecen donde las dejás y el pan crece lo que tiene que crecer.
> A veces, de noche, te parece oír una risa lejos, y te quedás quieto, esperando. Nunca es. O casi nunca.
> Herminia dice que los vecinos que se van, a veces vuelven. Que hay que dejar la puerta entornada. Vos la dejás.
>
> *(Piezas que se agregan:)*
> Ramal salvado — *«La trochita pasa todos los días, con el silbato largo en la curva del puente. Elsa saluda con la mano.»*
> Ramal a prueba — *«La trochita pasa tres veces por semana. Cada vez que pasa, la mirás hasta que se pierde.»*
> D5 = A — *«En la estepa hay un puesto nuevo, con un cartel pintado a mano. Ramón lo visita los domingos y lo critica.»*
> D4 = A — *«En la escuela de la aldea, los chicos dibujan puertitas. Ninguno toca una raíz.»*
> Graciela +3 — *«Graciela alquiló la casa de al lado del hospedaje. Dice que es para contar mejor.»*
> Noche perdida — *«El galpón tiene una pared nueva, mal clavada. No la cambiaste.»*
> Siempre — *«La historia termina acá, pero el valle no. Queda todo por andar. Tomate tu tiempo: acá nadie tiene apuro, y
> el que tiene, se le pasa.»*

---

## 6. Subtramas optativas (todas)

| Subtrama | Capítulos | Con quién | Qué da |
|---|---|---|---|
| El frasco de la repisa | 1–2 | Rosa | Rosa +1, pan |
| La oveja de Ramón | 2 | Ramón | Ramón +1 |
| Pedido de Fermín | 3 | Fermín | Fermín +1 |
| Una vuelta para la ingeniera | 4 | Graciela | Graciela +2, ramal +2 |
| El trigo del abuelo | 5 (D1 = C) | Josefina | Josefina +1 |
| La masa que crece sola | 6 (D1 = B) | Rosa | Rosa +1, receta de pan |
| Foto para Sofía | 6 | Sofía | sabor; amor si corresponde |
| Fermín quiere hablar | 7 | Fermín | Fermín +1, D5 A sin costo |
| La veta que vuelve | 8 (D2 = C) | Tobías | Tobías +1, 10 cantos |
| Las mulas de Belisario | 8 | Belisario | Belisario +1, historia del zaino |
| Herminia y los noventa | 8 (si cae) | Herminia | la llavecita |
| El papel de Elsa | 9 | Elsa | Elsa +1/+2 |
| Visitar a Ramón | 9 | Ramón | Ramón +1 |
| La llave del 79 | 10 (trato) | Josefina, Ramón | la foto de los tres, +1 y +1 |
| Pedir perdón | 10 (pelea) | — | final B más tibio |
| Flechas de más | 11 | Tito | más munición |
| Alguien que te espera | 11–13 (amor prendido) | la pareja | escena sugerida, aparece al amanecer y en el final |
| Volver a subir | 13 (D5 = C) | Ramón | reconciliación |
| Encargos del valle existentes | todos | todos | lazo +1 con quien lo pide (cuando el encargo es de un personaje con arco) |

---

## 7. Lo que guarda la historia (propuesta)

Todo dentro de `progreso.historia` (y declarado en `sanearHistoria`, con valores por defecto):
```
historia.lazos      = { ramon, ema, ercilia, guarda, fermin, graciela }   // −2..+3, empieza en 0
historia.decisiones = { bolsa, coihue, molienda, cuaderno, majada }       // 'a'|'b'|'c'|null
historia.duendes    = { trato: null|'trato'|'pelea', deuda: 0, perdon: false, convidado: 0 }
historia.armas      = { arco: false, honda: false }
historia.noche      = 'pendiente' | 'ganada' | 'perdida'
historia.ramal      = 0                       // la cuenta del ramal
historia.prestado   = { herrero, apicultor, maquinista, guarda, tobias }  // true/false
historia.raro       = [{ id, dia }]           // el cuaderno de lo raro
historia.escenas    = { id: dia }             // escenas vistas (para no repetirlas y para los objetivos)
```
Los nombres `duendes.trato`, `armas` y `noche` se alinean con lo que se está armando para la 4.13.0; si allá quedan con
otra forma, se usa la de allá.

---

## 8. NECESIDADES TÉCNICAS

Lo que el guion pide y hoy no está (en orden de importancia; lo marcado ★ traba el guion entero).

1. ★ **Director de escenas** (etapa 2): cámara dirigida con los encuadres de este guion (plano general, medio, primer plano,
   detalle, sobre el hombro, travelling al costado, paneo, picado, contrapicado, acercamiento lento, plano fijo); cortes y
   fundidos; personajes que caminan a una marca y hacen un gesto existente; diálogo que avanza con Espacio o clic; saltear con
   Esc (con confirmación); **respuestas del jugador** (2–3 opciones, a veces con efecto en lazos); pausa que respeta el guardado.
2. ★ **Mirada dirigida corta** (2–3 s) en pleno juego: la cámara gira sola hacia un punto y vuelve, sin sacar el control del todo.
3. ★ **Objetivos nuevos** (vocabulario de 5): `llegar`, `hablar(tema)`, `entregar`, `hora`/`esperar` (con **esperar sentado**
   que acelera el reloj), `estacion`, `escena`, `decision`, `objeto`, `acompanante`, `reparar`, `talado(árbol marcado)`,
   `arreo`, `blancos`, `pagar`, `entregar_flete` y el contador `molido`.
4. ★ **Estado de historia ampliado** (sección 7) con `sanearHistoria` y las pruebas de basura; **13 capítulos**: hay que
   ajustar `verificar-3-1-historia.mjs` (tope 6–8), `3-8-3-relax`, `3-8-6-relax`, `3-8-7-progreso` (capítulo 8 fijo) y los
   trucos «historia capitulo N».
5. ★ **Tarjetas con variantes** (una línea distinta según decisión o lazo) y **tarjetas de decisión** que guardan la elección.
6. ★ **La noche de defensa de la historia** (`historia-noche`): un lado, defensas prearmadas prestadas (estacas, trampa de
   miel, campana, empalizada de durmientes, pirca), arco y honda **sólo esa noche**, tres olas, jefe con lomo débil, aliados
   (perro, Ramón, Josefina y **Fermín con honda** [nuevo aliado]), ayudas de los duendecitos en el trato, «Otra vez» sin
   castigo y «Que amanezca». Medir fps en la Ryzen 5 4600G. Variante **«Viejo»** (barbudos, liquen) para «los del cerro».
7. **Duendes en la historia** (`historia-duendes.js`, rama `v4130-a`): agenda de apariciones por capítulo (lugar, hora,
   condición); la risa sólo en escenas; **lechucero en silueta** contra la luna; **lucecitas ámbar** (duendecitos con brillo
   chico, sin luces nuevas: emisivo, por las luces fijas 4+1); **escena del galpón** con 10–12 a la vez (el tope de 8 de
   `historia-duendes.js` hay que subirlo a 12 sólo para esa escena, o usar duendecitos como relleno).
8. **Objetos de historia en el mundo** con su entrada en `INTERACCIONES` (canto blanco, puertita, dedal, pipa, cuchara,
   bolsa de Eusebio, cuaderno, llave del 79, foto de los tres, llavecita) y **props chicos**: ronda de ramitas, ronda de
   harina con huellas, pozo en el galpón, bellotas en el techo, puertita al revés, puertita nueva en la raíz.
9. **Rastro guionado** (huellas chiquitas que brillan apenas en la escarcha y llevan a un lugar).
10. **El coihue grande**: elegir **uno que ya existe** cerca de las piedras del molino (no se mueven ni se suman árboles,
    `verificar-3-3-bosque`), marcarlo como especial (talable con 6 hachazos, puertitas talladas en la raíz como decoración) y
    una **pirca** chica (pieza nueva o el cerco de piedra si existe).
11. **Personas:** **Graciela Pugh** (persona nueva con `gente.js`/`gente-ropa.js`: sobretodo gris, rodete, botas, portafolios en la
    mano como la tablilla); **Fermín** en `hablados`; **acompañantes** (un vecino que te sigue a pie y sube a la trochita o
    al carro con vos); **Ramón convaleciente** (sentado con manta, con bastón al caminar: pose existente + objeto en la mano).
12. **Arreo simple:** la majada sigue al caballo hasta un corral (sin física nueva: seguir al líder).
13. **Clima y calendario forzados por la historia:** helada temprana (cap. 9), nevada de la historia (cap. 12), fiesta
    guionada si la fecha fija ya pasó (minga, leyenda, nieve), **puerta de estación** con «no más de 2 días».
14. **Visita forzada de varios** a tu mesa (cap. 10) sin esperar el turno de 3 días.
15. **Blancos de práctica** (paja y latas) en el Puesto del Paso y el galpón de esquila: primer uso del arco y la honda en el Relax.
16. **Foto guionada** (sale movida con tres manchas doradas) usando el modo foto existente.
17. **Diario:** «Cuaderno de lo raro» (indicios con fecha y lugar en el mapa) y «el cuaderno de Eusebio» (páginas que se
    abren con la historia).
18. **Panel de historia:** capítulos de 13, barra de la **cuenta del ramal**, y en la guía, los lazos en palabras (no números).
19. **Costumbre del trato** (post-historia, final A): la bolsa vacía en el umbral cada cosecha y el regalito a la mañana.
20. **Flete de historia** con carga marcada (bolsas de harina) que suma a la cuenta del ramal.
21. *(Opcional)* Logros nuevos para Steam (`STEAM_LOGROS.md`): «Golpeá antes de abrir», «Tener trato», «La noche de la
    nevada», «Del valle».

Lo que **no** pide: mapas nuevos, modelos nuevos de animales, animaciones nuevas de personas (todo con poses y gestos que
ya están), voces habladas, mando.

---

## 9. PREGUNTAS PARA EL USUARIO

1. **¿El título «El trato del molino» y la premisa del aviso en el diario te cierran?** *Recomiendo que sí:* el jugador llega
   porque contestó un aviso, no porque sea «el elegido», y la historia gira en torno al valle.
2. **¿Aprobás a Graciela Pugh (personaje nuevo, la ingeniera del ramal)?** *Recomiendo que sí:* le da al acto I y al final
   algo en juego que no son los duendes (el ramal) y usa la trochita y los fletes. Si preferís no sumar gente, lo hace
   Amadeo, el gerente del banco, pero pierde fuerza.
3. **Calendario: ¿está bien que la historia «traiga su clima» (helada, nevada) si el jugador llega a destiempo, con no
   más de 2 días de espera?** *Recomiendo que sí:* el año del valle dura 12 días y sin esto alguien podría esperar casi un año entero.
4. **¿El molino sigue moliendo habas o sumamos trigo como cultivo** (por el abuelo de Josefina)? *Recomiendo habas* (cero
   trabajo nuevo; una línea de Josefina lo explica: «en los años malos se molía haba»). El trigo, para el DLC.
5. **En la noche, ¿sumamos a Fermín como aliado con honda** (nuevo, igual que Josefina con arco)? *Recomiendo que sí,* si
   cuesta poco: le da cierre a su arco. Si complica, queda mirando desde el techo sin tirar.
6. **Perder la noche: ¿dejamos las dos salidas («Otra vez» sin castigo y «Que amanezca» como final perdido)?**
   *Recomiendo que sí:* así perder es una variante con su propia escena linda y no un muro.
7. **Partidas con la historia vieja a medias: ¿qué hacemos?** *Recomiendo:* al cargar, una tarjeta avisa que hay historia
   nueva y la arranca desde el capítulo 1 sin tocar lo construido (lo ya hecho tilda solo los objetivos que mide); quien la
   terminó, la puede empezar de nuevo desde la pausa.
8. **Subtrama de amor: ¿incluimos la escena sugerida de la pareja la noche antes y su lugar en el amanecer y el final**
   (sólo si el amor está prendido)? *Recomiendo que sí,* corta y sugerida, nunca obligatoria.

---

*Nota de coherencia:* la Historia vieja decía «una carta de tu hermana», pero la familia que visita en `aldea-vida.js` es tu
hermano Facundo. Este guion no menciona hermanos: si se quiere sumar, Facundo puede bajar del tren en el epílogo (visita existente).
