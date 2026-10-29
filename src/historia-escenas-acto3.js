// 4.17.0 (B): las escenas del ACTO III de la Historia («El trato del molino», GUION_HISTORIA.md, capítulos 9 a 13) como DATOS, con el formato del
// motor de escenas (escenas.js) y la misma estructura que los actos I y II:
//   · ESCENAS_ACTO3      id → escena (56), armadas en historia-escenas-acto3-c9.js … -c13.js (c11 en dos: -c11 y -c11b);
//   · IDS_ACTO3          los ids, en orden de capítulo;
//   · EFECTOS_ACTO3      todos los nombres de efecto que usan, para registrarlos uno por uno (convención de historia-escenas-util.js y, para
//                        `duendes:`, `noche:`, `armas:` y `perfil:`, la de historia-escenas-acto3-util.js);
//   · DISPARO_ACTO3      por escena: capítulo, dónde tiene que estar parado el jugador, cuándo y qué objetivo (id de TEXTO_ACTO3) la cuenta;
//   · POR_DEFECTO_ACTO3  la opción que vale si el jugador saltea la escena de cada decisión (D5 la majada, D6 trato o pelea) o la de la noche perdida.
// Los textos de las tarjetas, notas, cuaderno de lo raro, charla de los vecinos y finales están en historia-texto-acto3.js.
import { ESCENAS_C9 } from './historia-escenas-acto3-c9.js';
import { ESCENAS_C10 } from './historia-escenas-acto3-c10.js';
import { ESCENAS_C11 } from './historia-escenas-acto3-c11.js';
import { ESCENAS_C11B } from './historia-escenas-acto3-c11b.js';
import { ESCENAS_C12 } from './historia-escenas-acto3-c12.js';
import { ESCENAS_C13 } from './historia-escenas-acto3-c13.js';
import { efectosDe } from './historia-escenas-util.js';

export const ESCENAS_ACTO3 = { ...ESCENAS_C9, ...ESCENAS_C10, ...ESCENAS_C11, ...ESCENAS_C11B, ...ESCENAS_C12, ...ESCENAS_C13 };
export const IDS_ACTO3 = Object.keys(ESCENAS_ACTO3);

// Todos los efectos que usan juntas (para registrar uno por uno en el aplicador de la historia)
export const EFECTOS_ACTO3 = [...new Set(Object.values(ESCENAS_ACTO3).flatMap((e) => efectosDe(e)))].sort();

// Qué vale si el jugador saltea la escena de una decisión: D5 (la majada), Fermín la lleva entera; D6 (trato o pelea), dejar la puerta abierta
// (`duendes:trato`); la noche perdida, «Otra vez» (sin castigo). El aplicador lo usa también para cumplir la decisión si nunca llega a la escena.
export const POR_DEFECTO_ACTO3 = { majada: 'a', duendes: 'trato', noche: 'otra' };

// Dónde y cuándo se dispara cada una. `jugadorEn`: dónde tiene que estar parado el jugador (los planos se anclan a él). `objetivo`: el id del
// objetivo de capítulo (TEXTO_ACTO3.capitulos[n].objetivos[].id) o de la optativa que la cuenta como hecha; null si no cuenta para ninguno.
const d = (cap, jugadorEn, cuando, objetivo = null) => ({ cap, jugadorEn, cuando, objetivo });
export const DISPARO_ACTO3 = {
  // capítulo 9 · Los primeros fríos
  'ramon-cama': d(9, 'dentro del Puesto Alto, con la puerta cerrada y la estufa prendida', 'mañana (8 a 12) del día en que arranca el capítulo, al entrar al Puesto Alto', 'subir'),
  'fermin-tranquera': d(9, 'afuera del Puesto Alto, frente a la puerta, a unos 4 m de la tranquera', 'al terminar ramon-cama (salir del puesto): la decisión D5', 'majada'),
  'majada-fermin': d(9, 'a la entrada del galpón de esquila, con la majada ya adentro del corral', 'terminar el arreo si D5 = a', 'majada'),
  'majada-vos': d(9, 'en el corral de Ramón, a la tercera mañana de forraje y agua', 'la tercera mañana cuidando la majada si D5 = b', 'majada'),
  'majada-belisario': d(9, 'frente a Belisario, en el Puesto del Paso', 'entregar la majada si D5 = c (el cobro lo da la economía)', 'majada'),
  'hojas-canelo': d(9, 'junto a la puerta del Puesto Alto o del puesto sanitario', 'la mañana siguiente (5 a 9) a la decisión D5; la variante depende de si convidaste al valle (condición convidado)', 'ramon'),
  'papel-elsa': d(9, 'en el andén de la Estación del Valle', 'optativa «El papel de Elsa»: caminar sobre el papel caído', 'papel-elsa'),
  'visita-ramon': d(9, 'frente a Ramón, en el puesto sanitario de la aldea', 'optativa «Visitar a Ramón»: llevarle algo rico', 'visita-ramon'),
  // capítulo 10 · Golpeá antes de abrir
  'galpon-golpe': d(10, 'frente a la puerta del galpón del jugador', 'noche (22 a 24) del cierre del capítulo 9; la E dice «Golpear»', 'golpe'),
  'galpon-sin-golpear': d(10, 'frente a la puerta del galpón, sin haber golpeado', 'abrir la puerta del galpón con la E antes de que haya pasado galpon-golpe (repetible)', null),
  'galpon-encuentro': d(10, 'adentro del galpón, a 5 m del fondo', 'al terminar galpon-golpe: el jugador entra y los ve (D6: duendes.trato)', 'duendes'),
  'galpon-trato': d(10, 'en el umbral del galpón, de espaldas al interior', 'si D6 = trato o fuerte: justo después de la elección', 'duendes'),
  'galpon-pelea': d(10, 'adentro del galpón, con la pala y el farol en la mano', 'si D6 = pelea: justo después de la elección; la segunda parte pasa a la mañana', 'duendes'),
  'cerro-mirador': d(10, 'sobre la piedra del mirador del pehuén, con Josefina o Belisario al lado', 'mañana (7 a 12) siguiente al encuentro', 'cerro'),
  'mesa-guerra': d(10, 'en la mesa del refugio, con el mapa del valle abierto', 'tarde (16 a 20) con la mesa puesta; trae las visitas sin esperar los 3 días', 'mesa'),
  'llave-79': d(10, 'junto al cajón trabado de las piedras del molino viejo', 'optativa «La llave del 79»: probarla en el cajón (sólo si D6 = trato)', 'llave-79'),
  'pedir-perdon': d(10, 'al pie de la raíz del coihue grande (o del tocón)', 'optativa «Pedir perdón»: dejar algo en la raíz (sólo si D6 = pelea)', 'pedir-perdon'),
  // capítulo 11 · El arco y la honda
  'tito-arco': d(11, 'frente a Tito, en la carpintería', 'la mañana siguiente (7 a 11) a dejarle la lenga o las tablas de coihue', 'arco'),
  'plumas-bosque': d(11, 'en el bosque, con las seis plumas juntadas en la mano', 'juntar la sexta pluma del suelo del bosque', 'arco'),
  'plumas-gallinero': d(11, 'junto al gallinero, con las seis plumas juntadas', 'juntar seis plumas del gallinero (necesita gallinero)', 'arco'),
  'plumas-josefina': d(11, 'frente a Josefina, en la seccional', 'pedirle las plumas a Josefina (sólo con lazo de Josefina ≥ +2)', 'arco'),
  'elvira-cuerda': d(11, 'frente a Elvira, en la hilandería', 'entregar dos vellones y un pan de cera', 'arco'),
  'anselmo-puntas': d(11, 'frente a Anselmo, en la herrería', 'encargar las doce puntas de flecha', 'arco'),
  'blancos-paso': d(11, 'a 15 m de los cinco blancos de paja del Puesto del Paso, con el arco tensando', 'pegarle a cinco blancos de paja (mantener el clic tensa el arco)', 'arco'),
  'fermin-paces': d(11, 'frente a Fermín, en el galpón de esquila', 'entregarle un regalo (harina, yerba o pan), sólo si D5 = c o su lazo es negativo', 'honda'),
  'fermin-honda': d(11, 'frente a Fermín, en el galpón de esquila, a mediodía', 'pedirle que te enseñe la honda (hablar fermin/honda)', 'honda'),
  'blancos-esquila': d(11, 'a 12 m de los postes del galpón de esquila, con la honda y los cantos', 'voltear cinco latas de los postes', 'honda'),
  'prestado-herrero': d(11, 'frente a Anselmo, en la herrería', 'pedirle las estacas prestadas', 'prestado'),
  'prestado-apicultor': d(11, 'frente a Guido, en la sala de miel', 'pedirle las dos trampas de miel prestadas', 'prestado'),
  'prestado-maquinista': d(11, 'frente a Martín, en el taller ferroviario', 'pedirle la campana vieja prestada', 'prestado'),
  'prestado-guarda': d(11, 'frente a Elsa, en la Estación del Valle', 'pedirle la empalizada de durmientes prestada', 'prestado'),
  'prestado-tobias': d(11, 'frente a la pirca del coihue, con Tobías al lado', 'se dispara solo, sin pedirlo, si D2 = c (cuarta defensa prestada)', 'prestado'),
  'deuda-pagada': d(11, 'al pie de la raíz del coihue grande (o del tocón), con la bolsa o las seis tablas en la mano', 'pagar la deuda del trato (sólo si duendes.deuda > 0)', 'deuda'),
  'recorrer-lado': d(11, 'en la orilla del arroyo, a 6 m del galpón, con el lado del ataque delante', 'atardecer (16:30 a 19:30) con las defensas prestadas ya armadas', 'recorrer'),
  'flechas-de-mas': d(11, 'frente a Tito, en la carpintería', 'optativa «Flechas de más»: llevarle más plumas y puntas', 'flechas-de-mas'),
  'cumple-nevada': d(11, 'dentro del almacén de Ercilia, en un cumpleaños de la aldea', 'optativa «El cumpleaños que no se suspende»: ir a un cumpleaños de CUMPLES_ALDEA (15 a 20)', 'cumple-nevada'),
  'pareja-noche-antes': d(11, 'en el lugar favorito de tu pareja (la mesa del refugio o el banco de la plaza)', 'optativa «Alguien que te espera», 19 a 23, SOLO con el amor prendido y con pareja o saliendo (condición `amor`); nunca obligatoria', 'alguien-te-espera'),
  // capítulo 12 · La noche de la nevada
  'cena-caliente': d(12, 'en el refugio, junto a la mesa, con un plato caliente cocinado', 'cocinar un plato caliente el día de la nevada (17 a 21)', 'cena'),
  'herminia-estacion': d(12, 'dentro de la Estación del Valle, junto a la salamandra', 'llegar con Herminia y los chicos de los Jones (sólo si D4 ≠ a: con D4 = a vienen solos)', 'estacion'),
  'noche-espera': d(12, 'en la puerta del galpón, con el arco y la honda, mirando al arroyo', '21:30 a 23, al llegar con las armas; al terminar arranca la noche de defensa (A)', 'galpon-22'),
  'noche-entre-1': d(12, 'en el galpón, entre la ola 1 y la 2 de la defensa', 'al ganar la primera ola de la noche (A pausa la defensa)', 'noche'),
  'noche-entre-2': d(12, 'en el galpón, entre la ola 2 y la 3 de la defensa', 'al ganar la segunda ola de la noche', 'noche'),
  'noche-tras-ganar': d(12, 'en el galpón, justo al ganar la noche', 'cuando `noche = ganada`, antes del amanecer', 'noche'),
  'noche-tras-perder': d(12, 'en el galpón, sentado en la nieve', 'cuando se pierde la noche: ofrece «Otra vez» (vuelve a las 22:00 sin castigo) o «Que amanezca»', 'noche'),
  'amanecer-trato-ganada': d(12, 'en la puerta del galpón, al amanecer', 'amanecer (5 a 9) si trato y noche ganada', 'amanecer'),
  'amanecer-trato-perdida': d(12, 'en la puerta del galpón, al amanecer', 'amanecer (5 a 9) si trato y noche perdida', 'amanecer'),
  'amanecer-pelea-ganada': d(12, 'en la puerta del galpón, al amanecer', 'amanecer (5 a 9) si pelea y noche ganada', 'amanecer'),
  'amanecer-pelea-perdida': d(12, 'en la puerta del galpón, al amanecer', 'amanecer (5 a 9) si pelea y noche perdida', 'amanecer'),
  // capítulo 13 · El deshielo
  'carpeta-celeste': d(13, 'en el andén de la Estación del Valle, con Elsa y Graciela delante', 'mañana (10 a 13) con el tren de la mañana', 'carpeta'),
  'majada-fin': d(13, 'junto al galpón de esquila o la loma del Puesto Alto', 'tarde, después de carpeta-celeste', 'majada-fin'),
  'volver-a-subir': d(13, 'en la loma del Puesto Alto, sentado al lado de Ramón, con el mate', 'optativa «Volver a subir»: llevarle el mate a la loma y esperar una hora (sólo si D5 = c)', 'volver-a-subir'),
  'josefina-fin': d(13, 'junto al coihue (o al tocón), con Josefina', 'tarde (14 a 19)', 'josefina-fin'),
  'fiesta-nieve': d(13, 'en el predio de la aldea, con la fiesta armada', 'noche de la Fiesta de la Nieve (17 a 23); si la fecha ya pasó, la fiesta del deshielo guionada', 'fiesta'),
  'umbral-fin': d(13, 'en el umbral del refugio, mirando el escalón desde arriba', '7 a 9 del primer día del año (aniversario) después de dormir; el círculo se cierra', 'umbral-fin'),
  'costumbre-dejar': d(13, 'en el umbral del refugio, con la bolsa vacía', 'después de la historia, cada cosecha (sólo en el final A): llenar la bolsa y dejarla', null),
  'costumbre-regalito': d(13, 'en el umbral del refugio, a la mañana', 'la mañana siguiente a costumbre-dejar (sólo en el final A)', null),
};
