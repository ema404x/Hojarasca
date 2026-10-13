# Hojarasca 3.9.1 — La peña de los sábados (y el pulido de la cantina)

Sólo en el Relax. Rama `v391-pena` (sale de `v390-cantina`, la 3.9.0). Las capturas están en `salida-cantina\pena\` (fuera del repositorio):
`partida\` (la partida real, con la peña entera) y `dalia-final\` (los primeros planos de Dalia).

## Parte 1 · El pulido de la cantina
- **Pose «bandeja» parada**: Lucrecia quieta también lleva la bandeja en alto (antes sólo caminando).
- **Delantal partido** (blanco y bordó) visto de frente y de tres cuartos: el delantal quedó pegado a la falda y envuelve el cuerpo (±1,45 rad), sin hueco.
- **Botas flotando**: Lucrecia comparada con una vecina normal, las suelas apoyan en el piso (la suela bajó 1 cm en `gente-cuerpo.js`; lo miré en capturas).
- **Luz de adentro de noche**: la cantina de noche ya no queda negra; sigue habiendo **una sola luz por edificio** (la salamandra), sin luces dinámicas nuevas.
- **Parroquianos**: de noche, los vecinos van a la cantina según su horario y tiempo libre (`parroquianosDeLaNoche` en `aldea.js`), se sientan en las
  sillas (**nunca más de 4 de las 8**: te queda dónde sentarte), cada uno con su vaso, y se oye el `murmullo`. Los más truqueros juegan en la mesa del rincón.

## Parte 2 · La peña
- **Cuándo**: sábado desde las 21:30 hasta la 1:30 del domingo. **Tango** hasta las 23:30; **chamamé** después.
- **Músicos**: el Cholo (guitarra) y Anselmo (bombo) en el rincón. La música se sintetiza por código (sin archivos), baja cuando hablás con Lucrecia y calla
  si no hay audio.
- **Dalia Kerber** (30 años, de Crespo, Entre Ríos; bailarina de variedades que se quedó en Esquel): vecina nueva en `aldea.js`, `vecindad.js`,
  `vecindad-voces.js` y `vecindad-social-voces.js` (es + en), con su historia («El telón de Esquel»), cumpleaños, gustos (pan casero, dulce, miel), charla,
  regalos, ayudas, deseos y su cama en el cuarto de atrás de la cantina. Rubia, de curvas marcadas (busto y cadera, ajustados con proporciones de
  `gente-cuerpo.js` sin tocar el esqueleto ni las poses), vestido negro de fiesta ajustado con tajo en V, flor roja en el pelo, rodete, tacos rojos.
  Sensual y nada explícito.
- **Te saca a bailar**: baja de la pista, camina hasta tu mesa y se abre un panel (tango, chamamé o «más tarde»). Bailás con ella unos segundos
  reusando el sistema de baile de Pocha (rinde como bailar en la fiesta: amistad y descanso según tu nivel).
- **Mesa de truco**: dos vecinos juegan de verdad con `src/truco.js` (y cantan); sentado ahí, E te invita a jugar con uno.
- **Vecino que se arrima**: pasado un rato sentado, alguien viene a tu mesa, charla y vuelve a su silla.
- **Zapato de taco** (`gente-cuerpo.js`): suela y taco apoyados en el piso (no flota).
- **Poses nuevas** sin acumular rotaciones (lección de la 3.9.0): `tango`, `chamame-solo`, `bombo`, `tocar` y `cartas`.

## La borrachera (leve, opcional)
- Cada sorbo de lo fuerte sube el nivel; tope de **3 tragos fuertes**; baja con el tiempo (0,6 por hora de juego) y un mate cocido lo baja de golpe.
- Efecto: la imagen se balancea apenas y al caminar el rumbo se te va un poco. Ajuste en Ajustes → **Efecto de la borrachera**: Normal, Suave
  (la mitad) o Apagado. Con la cámara en «Reducido» casi no se nota. Nada de consecuencias duras.
- Lucrecia lo comenta con humor al ponerte alegre, y **frena al que no debe más** al llegar al tope de tragos fuertes de la noche (el de la 3.9.0).

## El romance (`amor.js`, `amor-mundo.js`, `amor-voces.js`)
- Lucrecia (34) y Dalia (30) son candidatas como las demás: piropos, citas, regalos, declaración, casamiento, celos. Historia y carácter propios.
- **Lo que decidí (reglas de exclusividad)**:
  1. Se puede salir con las dos, pero se enteran (chisme) y se enojan. Los celos comunes valen −afecto y días de enojo; como las dos son amigas y
     comparten el cuarto de atrás, si salís con **las dos a la vez** se suma una penalidad extra (`AMOR.rivales`: −10 de afecto y +2 días de enojo).
  2. Ambas **sólo viven en su casa** (el cuarto de atrás de la cantina): no hay mudanza al refugio (`SOLO_SUYA`).
  3. La **cita en la cantina** (una noche en la mesa del frente) sólo es con Dalia; con Lucrecia, que trabaja ahí, la cita es de día y afuera.
  4. Con amor (saliendo en adelante) los chistes pasan a un banco más atrevido; sin amor y sin confianza, no.

## Los chistes de doble sentido (sugeridos, nunca explícitos)
Rotación con memoria (no repiten los últimos tres de cada banco, se guardan en la partida), distinta probabilidad por situación, y más y más picantes
con la confianza (amigo, compadre) o el amor. Hay en sentarse, pedir (por bebida), cuenta, tomar, despedirse, bailar, pies y calor. Todos con su inglés
de igual gracia (`idioma-en-v.js`), cubiertos por `verificar-3-9-1-pena.mjs`. Los dos descartados («Pisame si querés…» y «Me dejaste sin aliento…») no están.
La línea más atrevida de Lucrecia pasó a un guiño con las patas de la mesa y las sillas: sólo con confianza o amor, sin nombrar actos.

## Lista de chistes (castellano / inglés)

### Lucrecia

**sentarse**

- ¿Mesa para uno? Qué desperdicio de silla de al lado.
  - _Table for one? What a waste of the chair next to you._
- Sentate, que la silla no muerde. Yo, depende de la hora y de cómo te portes.
  - _Sit down, the chair doesn't bite. Me, that depends on the hour and on how you behave._

**pedir / ginebra**

- Esta ginebra pega fuerte y despacito. Como yo.
  - _This gin hits hard and slow. Like me._
- Ginebra: se toma de a sorbos y se recuerda de a pedazos. Como a mí, dicen.
  - _Gin: sipped in little drops and remembered in little pieces. Just like me, they say._

**pedir / vino-patero**

- Vino patero: con carácter, como la casa. Si te sube rápido, no es el vino, es la compañía.
  - _Foot-pressed wine: it's got character, like the house. If it goes to your head fast, it isn't the wine, it's the company._

**pedir / cerveza**

- Bien tirada, con buena espuma. Todo está en la técnica, forastero.
  - _Well poured, with a good head. It's all in the technique, stranger._
- Helada y con espuma. Si te sobra, no la desperdicies: yo no desperdicio nada.
  - _Ice cold with a good head. If you've got some left, don't waste it: I never waste anything._

**pedir / mate-cocido**

- Mate cocido: el trago de los prudentes. Después no digas que no te avisé que la noche es larga.
  - _Mate cocido: the drink of the cautious. Don't say I didn't warn you the night is long._

**pedir / chocolate**

- Chocolate caliente, espeso y sin apuro. Hay cosas que mejoran cuanto más se revuelven.
  - _Hot chocolate, thick and unhurried. Some things only get better the more they're stirred._

**pedir / empanadas**

- Te las traigo calentitas. Lo demás depende de cómo te portes.
  - _I'll bring them piping hot. The rest depends on how you behave._
- Empanadas: se comen con la mano y con calma. Y ojo con el jugo: el que se mancha se lleva mi mirada de regalo.
  - _Empanadas: eaten by hand and with patience. And mind the juice: whoever gets stained earns my look as a gift._

**pedir / picada**

- Picada para compartir. Si no tenés con quién, te acompaño yo un ratito. Un ratito, eh.
  - _A sharing platter. If you've got no one to share it with, I'll keep you company a while. A little while, mind you._

**pedir / guiso**

- Lleva todo lo que hace falta para aguantar la noche.
  - _It's got everything you need to last the night._
- Guiso de cuchara, de los que abrigan por dentro. El que repite se queda con ganas de más, y eso lo digo con conocimiento.
  - _A good spoon-stew, the kind that warms you from the inside. Whoever has seconds wants thirds, and I say that from experience._

**pedir / tortas-fritas**

- Tortas fritas: crocantes por fuera, tiernas por dentro. Como la moza, pero a mí no me tocan sin permiso.
  - _Fried tortas: crisp outside, tender inside. Just like your waitress, only nobody touches me without permission._
- Fritas, calentitas y con azúcar. Cuidado con los dedos: se pegan a todo lo dulce.
  - _Fried, warm and sugared. Careful with your fingers: they stick to anything sweet._

**pedir / trucha**

- Trucha: se pesca con paciencia y buena carnada. A mí me pasa igual: hay que saber tentarme.
  - _Trout: caught with patience and good bait. Same with me: you have to know how to tempt me._
- Trucha del lago, bien fresquita. Pescada con caña y no con red, que a mí también me gusta que me conquisten de a poco.
  - _Fresh lake trout. Caught with a rod, not a net, because I like being won over slowly too._

**cuenta**

- Anotalo, nomás. Pero yo cobro de a poquito y con intereses.
  - _Put it on the tab, then. But I collect little by little, and with interest._
- Va a la cuenta. Pero ojo: yo llevo la cuenta de todo, hasta de las miradas.
  - _It goes on the tab. But watch out: I keep count of everything, even the glances._

**tomar**

- Despacito, que lo bueno se saborea.
  - _Slowly now, the good things are savored._
- Sin apuro. La noche hay que tratarla con cariño, como a las cosas que uno quiere que duren.
  - _No rush. The night should be treated gently, like anything you want to last._

**despedida**

- Volvé pronto, que la barra se pone fría sin vos.
  - _Come back soon, the bar goes cold without you._
- Andá con cuidado y no tardes: acá siempre hay una silla con tu forma.
  - _Go safely and don't be long: there's always a chair here shaped like you._

**confianza**

- Ya sos de la casa: no te cobro la sonrisa, y eso es mucho viniendo de mí.
  - _You're one of the house now: I don't charge you for the smile, and that's a lot coming from me._
- Mirá cómo te trato: ya te guardo la mejor mesa. No se lo cuentes a los demás, que se me ponen celosos.
  - _See how I treat you: I'm already saving you the best table. Don't tell the others, they get jealous._

**amor**

- Hoy cerrar la barra me va a costar: se me hace tarde, y no es por el trabajo.
  - _Closing the bar tonight is going to be hard: it's getting late, and not because of work._
- Ya no sirvo nada a medias: ni las copas, ni las miradas.
  - _I don't serve anything by halves anymore: neither the drinks nor the glances._

**mesa**

- Mesas de cuatro patas, las mejores: firmes, de las que no se mueven aunque las apoyes con ganas. Yo también soy de apoyarme bien firme.
  - _Four-legged tables are the best: steady, the kind that won't budge however hard you lean on them. I like leaning on things good and steady myself._
- Una buena silla se reconoce enseguida: te recibe sin quejarse, te sostiene sin apuro y no te deja ir fácil. A mí me pasa algo parecido con algunos clientes.
  - _You spot a good chair right away: it welcomes you without complaint, holds you without hurry and doesn't let you go easily. Something similar happens to me with certain customers._
- Este mostrador es de lenga maciza: aguanta lo que le apoyen encima y nunca se queja. Hay quien envidia a la madera, ¿eh?
  - _This counter is solid lenga wood: it takes whatever gets leaned on it and never complains. Some people envy the timber, you know._

### Dalia

**invitar**

- Si sabés llevar, te dejo llevar. Si no, te enseño.
  - _If you know how to lead, I will let you lead. If not, I will teach you._
- Si te animás a pisar la pista, yo me animo a no pisarte. Es un trato justo.
  - _If you dare step onto the floor, I dare not to step on you. A fair deal._

**elegir**

- El tango, bien pegaditos; el chamamé, con un poco más de aire. Vos elegí.
  - _Tango, nice and close; chamamé, with a little more room. You choose._
- Tango para el que se anima, chamamé para el que se divierte. Y los dos para el que se queda toda la noche.
  - _Tango for the daring, chamamé for the fun-loving. And both for whoever stays all night._

**paso**

- ¿Me seguís el paso o preferís que te persiga yo?
  - _Will you follow my step, or would you rather I chase you?_
- Uno, dos, y en el tres me mirás a los ojos. El resto lo pone el piso.
  - _One, two, and on three you look me in the eye. The floor does the rest._

**pies**

- No me mires los pies, que el baile no está ahí.
  - _Don't look at my feet, the dance isn't down there._
- Los pies hacen el paso, pero el baile lo hacen los ojos. Mirá donde corresponde.
  - _The feet make the step, but the eyes make the dance. Look where you should._

**calor**

- Con este calor dan ganas de aflojarse todo menos el compás.
  - _In this heat you want to loosen everything except the beat._
- Se me pega el vestido y se me pega el ritmo. De las dos cosas, sólo una me molesta.
  - _The dress sticks to me and so does the rhythm. Of the two, only one bothers me._

**bailando**

- Dicen que bailo como si el piso quemara. Vení a probarlo.
  - _They say I dance as if the floor were burning. Come and try it._
- Aflojá los hombros, que no estás cargando leña. Ahí, así. Ya sos otro.
  - _Loosen your shoulders, you're not hauling firewood. There, like that. Now you're someone else._

**pena**

- Entre tanda y tanda se me enfrían los pies y se me calienta la vanidad. Tengo que cuidar las dos.
  - _Between rounds my feet cool down and my vanity heats up. I have to look after both._
- En la pista no hay pena que dure una tanda entera. Por eso siempre pido otra.
  - _On the floor no sorrow lasts a whole round. That's why I always ask for another._

**despedida**

- Gracias por el baile. Quedamos a mano: vos me llevaste y yo te dejé. Hasta la próxima tanda.
  - _Thanks for the dance. We're even: you led me and I let you. Until the next round._
- Qué lindo compás tenés. No lo gastes con cualquiera.
  - _You've got a lovely sense of rhythm. Don't waste it on just anyone._

**confianza**

- A vos ya te dejo marcar el paso. No se lo digas a los demás, que se acostumbran.
  - _I already let you set the step. Don't tell the others, they'd get used to it._
- Con vos no hace falta que me levanten en vilo: me alcanza con que me sigas el compás sin mirar.
  - _With you no grand lifts are needed: it's enough that you keep the beat without looking._

**amor**

- Cuando bailo con vos, el piso aprende a no quemar.
  - _When I dance with you, the floor learns not to burn._
- Todas las tandas bailo con la gente; la última, con vos. Nadie se da cuenta, pero la pista sí.
  - _All night I dance with everyone; the last round, with you. Nobody notices, but the floor does._


## Qué NO hay / dudas
- El audio sintetizado (guitarra, bombo, murmullo) **no lo escuché**: se verificó que se programa y que suena en el bus; el timbre es una apuesta.
- No medí cuadros por segundo en un Ryzen 5 4600G: razonado (sin luces nuevas, un solo sistema aislado con `fallaSistema('pena')` y cálculo nulo a más de
  `RADIO_PENA`), no verificado en esa máquina.
- Los vecinos caminan más de noche (hasta ~16 % del horario para unos pocos, antes ≤10 %): lo subí en las pruebas 3-6-2.
- El efecto de la borrachera lo vi en números y en un par de cuadros, no a lo largo de una noche.
- Un vecino con la peña activa y vos parado en la puerta: ahora Dalia no se frena en la cantina por tenerte cerca (`sinFrenar`).

## Cómo verlo
Relax, sábado a la noche (día 5 de la semana), a partir de las 21:30, en la cantina al final de la calle de la Loma.
`npm run verify` (205 pasos) y la partida real: `herramientas\lanzar-electron.ps1 -Script pruebas\humo-3-9-1-pena.cjs` (siempre en el monitor externo).
