# Hojarasca 2.3.0 — Diez ideas nuevas

Cinco para el Relax y cinco para el Desafío, sobre la 2.2 (las dos ramas juntas). Todo
generado por código, como siempre: ni sonidos ni modelos de afuera.

## Relax

1. **La colmena.** Pieza nueva (O → Trabajo, 3 tablas y 1 tronco). Los canteros que
   tiene a menos de 18 m rinden uno más por cosecha: las abejas polinizan. Con días de sol
   junta miel (hasta tres frascos), que se saca con E. De noche y en invierno las abejas no
   salen, y la lluvia las frena; con canteros sembrados al alcance trabajan un poco más.
   Zumba cuando estás cerca —con el mismo sonido del panal del bosque— y si pasás
   corriendo se alborota (no pica: avisa). (`colmena.js`)
2. **El ahumadero.** Pieza nueva (6 piedras, 2 tablas, 2 troncos). Hasta ahora todo lo que
   se pescaba volvía al agua; con un ahumadero terminado te quedás con dos truchas por
   día, como pide el permiso de pesca de la zona. La perca y el pejerrey, que son nativos,
   vuelven siempre. Se cuelgan hasta cuatro truchas con un tronco de leña y en medio día
   salen ahumadas. (`ahumadero.js`)
3. **El vivero.** Pieza nueva (4 tablas, 1 piedra) con seis almácigos. En otoño, junto a
   un coihue, una lenga, un ñire o un ciprés grande, E junta semilla (una por árbol y por
   día). En el vivero germina en tres días y salen plantines, que se plantan con B como
   los renovales pero ya crecidos a la mitad (una semana en vez de dos). Los piñones
   también sirven, y el ñire y el ciprés se pueden plantar por primera vez. (`vivero.js`)
4. **La leña del invierno.** En invierno, además de las ramitas, cada fuego —el fogón,
   la estufa, una fogata— pide un tronco seco. La leñera techada (pieza nueva) guarda la
   leña seca; la que llevás encima se moja con la lluvia y tarda medio día en secarse, y
   mojada hace humo y no prende. Si dormís una noche de invierno sin fuego cerca, amanecés
   entumecido y caminás más lento un par de horas, o hasta que te calentás junto a un
   fuego; con la manta, menos. Nada que haga perder la partida. (`lena.js`)
5. **El fogón de cuentos.** Si el vecino que vino de visita encuentra un fuego prendido
   cerca de la mesa, no se va a las ocho: se queda hasta las once. Hablale de noche y
   cuenta un cuento de los que se cuentan al fuego —la luz mala, el cuero del lago, el
   huemul blanco, el tren de medianoche—, uno por visitante, que quedan en una sección
   nueva del cuaderno. Y después de haber oído las historias del lago, alguna noche clara
   con luna, desde la orilla, asoma algo en el agua. Tiene su foto en el álbum. (`cuentos.js`)

La miel y las truchas ahumadas van a dos recetas nuevas (sopaipillas con miel, trucha
ahumada con papas) y, en invierno, se abren junto al fuego como las conservas.

## Desafío

6. **La infestación.** Desde la noche 4, al amanecer quedan capullos en el bosque
   alrededor de la base (dos al principio, hasta seis). De día se queman con E y una
   ramita (+1 cristal) o se rompen a golpes (tres, y el que estaba adentro sale flojo).
   Los que quedan se abren cuando cae la noche y suman invasores desde el bosque.
   (`desafio-infestacion.js`)
7. **La trochita varada.** Algunas noches (desde la 5, nunca la misma que un rescate) el
   tren se queda sin presión a 240–380 m de la Estación del Valle, con Elsa adentro. Avanza
   sólo si estás cerca, y los invasores que no te tienen a tiro van por él. Si llega, Elsa
   deja cristales, tablas y piedra; si lo rompen, no te habla por dos días. Al amanecer el
   tren sigue igual. (`desafio-varada.js`)
8. **El volador.** Invasor nuevo, desde la noche 8. Vuela a siete metros, busca las
   antorchas prendidas y baja en picada a apagarlas; si no queda ninguna, pasa rasante
   sobre vos. Arriba sólo lo alcanzan las flechas, la pistola y la **ballesta al cielo**
   (defensa nueva, que lo prefiere); cuando baja, también la lanza. La ballesta común no
   le apunta cuando va alto. Sale de los cupos del saltador y el tirador: cada noche sigue
   trayendo la misma cantidad de invasores. Tiene su página en el bestiario. (`desafio-cielo.js`)
9. **La zanja de fuego.** Defensa nueva. Se carga con dos troncos (E) y se prende (E)
   cuando llegan: arde un minuto y quema a los que la cruzan; los livianos se frenan. Con
   viento el fuego puede escaparse al pasto a favor del viento y quemar invasores, madera
   de las defensas y a vos; con lluvia no prende. Es la idea del fuego que se escapa, que
   había quedado afuera en la 1.10. (`desafio-zanja.js`)
10. **El código de partida.** En la portada del Desafío hay un campo nuevo: con un código
    (COIHUE-4821) o el de esta semana, las decisiones de azar de cada noche —qué noche
    especial, dónde baja la nave, si atacan a un vecino o se vara el tren, dónde crecen los
    capullos— salen siempre iguales. El valle ya era siempre el mismo. Sirve para comparar
    récords con la otra computadora o con amigos, sin internet. El récord de cada código se
    guarda aparte. La otra vuelta sigue con el mismo código. (`semilla.js`)
    *Lo que no cubre:* el clima de cada día sigue siendo al azar, y lo que hacés vos cambia
    lo demás (a quién le pegás, cuándo cae cada uno).

## Arreglos que aparecieron en el camino

- **Un cantero de calafates tiraba un error** al dibujarse: la unión de la 2.2 sumó los
  calafates a la huerta sin decir cómo se ven. Ahora tienen su mata, y cualquier cultivo
  nuevo sin aspecto usa uno por defecto. Una prueba exige que todos lo tengan.
- **Tres líneas del diario no salían nunca.** Las dos ramas usaban el mismo nombre
  (`'rastro'`, `'cosecha'`) para cosas distintas: el segundo caso nunca corría, el perro
  que rastrea no aparecía en el diario, y los huevos y la lana se anotaban como «coseché
  lana de la huerta». Ahora cada cosa tiene el suyo, y una prueba no deja repetir casos.
- La marca de «tendal ya saneado» viajaba dentro del guardado: un tendal editado a mano
  no se volvía a sanear al cargar. Ahora vive sólo en memoria (sirve también para las
  obras nuevas).
- El perro del Desafío ya no persigue invasores que están bajo tierra, dormidos en la
  ruina o volando alto.

## Inglés

Tanda P (`src/idioma-en-p.js`): todo lo nuevo, con moldes para lo que se arma con números
y lugares. Los cuentos del cuaderno se arman con sus partes ya traducidas. La tanda N de la
1.11, que genera las recetas por combinación, aprendió los ingredientes nuevos. Una prueba
nueva (`verificar-idioma-2-3.mjs`) pasa cada texto por el traductor.

## Verificación

- `npm run verify`: 100 pasos, todos en verde. Nuevos: `verificar-2-3.mjs` (la lógica de
  las diez, los arreglos del camino) y `verificar-idioma-2-3.mjs`. Ajustadas: la cuenta de
  tipos de invasor (ocho) y la de la visita, que ahora admite el cuento en el medio.
- Partidas reales en Electron: 23. Nueva: `humo-2-3.cjs`, que juega las diez dentro del
  juego (armar las obras, cosechar con abejas, ahumar, juntar semilla y plantar, prender
  en invierno con leña mojada y seca, dormir con y sin fuego, la visita que se queda al
  fogón y cuenta, el lago; en el Desafío, el código desde la portada, quemar y romper
  capullos, escoltar el tren, el volador apagando una antorcha y la ballesta al cielo, la
  zanja que quema, el fuego que se escapa con viento y la lluvia que no la deja prender).
