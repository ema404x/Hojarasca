// Tanda J: lo que estaba tapado por un filtro mal puesto. El listador de faltantes daba
// por «nombre científico en latín» a cualquier par de palabras sin acentos, y así se
// escondían setenta y pico de textos de pantalla —«Perro ovejero» tiene la misma forma
// que «Vanessa carye»—. Ahora los nombres en latín se leen del campo `cientifico`.
export const EN_J = {
  // ---- cuaderno: plantas y árboles
  // Los que tienen nombre común en inglés se traducen, como el resto del cuaderno
  // (Cachaña → Austral parakeet). Los que no lo tienen se quedan como están, y los que
  // el resto de los textos nombran en castellano —calafate, piñones, arrayán— también:
  // si la ficha dijera «Magellan barberry» y las recetas «calafate jam», serían dos
  // cosas distintas para el que juega.
  'Coihue': 'Coihue beech',
  'Lenga': 'Lenga beech',
  'Ñire': 'Ñire beech',
  'Nalca': 'Chilean rhubarb',
  'Chilco': 'Chilco fuchsia',
  'Coirón': 'Coirón tussock grass',
  'Neneo': 'Neneo shrub',
  'Maitén': 'Maitén tree',
  'Maqui': 'Maqui berry',
  'Chaura': 'Prickly heath',
  'Notro': 'Notro firebush',
  'Frutilla silvestre': 'Wild strawberry',
  'Llao llao': 'Llao llao fungus',
  'pehuén': 'monkey puzzle',

  // ---- cuaderno: fauna
  'Pudú': 'Pudú deer',
  'Carpintero gigante': 'Magellanic woodpecker',
  'Chucao': 'Chucao tapaculo',
  'Huemul': 'Huemul deer',
  'Zorro colorado': 'Culpeo fox',
  'Bandurria austral': 'Black-faced ibis',
  'Perro ovejero': 'Sheepdog',
  'Ciervo colorado': 'Red deer',
  'Liebre europea': 'European hare',
  'Coipo': 'Coypu',
  'Panal silvestre': 'Wild honeycomb',
  'Dama pintada': 'Painted lady',

  // ---- cuaderno: lugares, cielo, recetas e historias
  // «Mallín» y «Las Tres Marías» no se traducen: el mallín es un lugar del valle (y una
  // parada de la trochita), y las constelaciones ya llevan el nombre astronómico abajo,
  // así que traducir el de arriba dejaba la ficha diciendo dos veces lo mismo.
  'Nubecula Maior y Minor': 'Nubecula Maior and Minor',
  'Canto rodado': 'River stone',
  'Cantos rodados': 'River stones',
  'Unos mates': 'A few mates',
  'Chocolate caliente': 'Hot chocolate',
  'Bajarse a empujar': 'Getting off to push',

  // ---- logros del Desafío
  'Primer alba': 'First dawn',
  'Fuego ajeno': "Someone else's fire",
  'Diez inviernos': 'Ten winters',
  'Viento blanco': 'Whiteout',
  'Noches resistidas': 'Nights held out',
  'Refugios terminados': 'Shelters finished',
  'Renovales plantados': 'Saplings planted',
  'Recetas fabricadas': 'Recipes crafted',
  'Tocones rebrotando': 'Stumps resprouting',
  'Fotos sacadas': 'Photos taken',

  // ---- piezas y objetos
  'Empalizada reforzada': 'Reinforced palisade',
  'Muro almenado': 'Battlemented wall',
  'Pared modular': 'Modular wall',
  'Baranda modular': 'Modular railing',
  'Tabique interior': 'Interior partition',
  'Farol interior': 'Indoor lantern',
  'Estacas trampa': 'Spike trap',
  'Cobertizo rural': 'Farm shed',
  'Arco reforzado': 'Reinforced bow',
  'Tres boleadoras': 'Three bolas',
  'Ocho flechas': 'Eight arrows',
  'Carpa armada': 'Tent pitched',

  // ---- avisos y estados del juego
  'Movimiento cancelado': 'Move cancelled',
  'Rumbo cancelado': 'Heading cancelled',
  'Marca retirada': 'Marker removed',
  'Demasiada pendiente': 'Too steep',
  'Buscando lugar': 'Looking for a spot',
  'Encastre activado': 'Snapping on',
  'Partida recuperada': 'Game recovered',
  'Partida exportada': 'Game exported',
  'Partida importada': 'Game imported',
  'Mando conectado': 'Gamepad connected',
  'Foto guardada': 'Photo saved',
  'Renoval plantado': 'Sapling planted',
  'Encargo cumplido': 'Errand done',
  'Llegan refuerzos': 'Reinforcements coming',
  'Noche silenciosa': 'Silent night',
  'Noche roja': 'Red night',
  'Hacer troncos': 'Make logs',
  'Picar piedra': 'Break stone',
  'Caza nocturna': 'Night hunt',
  'Modo foto': 'Photo mode',
  'Armas fijas': 'Fixed weapons',

  // ---- portada, pausa y ajustes
  'Seguir recorriendo': 'Keep exploring',
  'Seguir resistiendo': 'Keep holding out',
  'Volver a pausa': 'Back to pause',
  'Guardar archivo': 'Save file',
  'Guardar ahora': 'Save now',
  'Volumen general': 'Master volume',
  'Mirada vertical': 'Vertical look',
  'Caminar adelante': 'Walk forward',
  'Siempre despejado': 'Always clear',
  'Prefiero solo': 'No thanks',
  'Moverte lejos': 'Getting around',

  // ---- escenas del banco de pruebas
  'Bosque cerrado': 'Dense forest',
  'Vista larga': 'Long view',
};
