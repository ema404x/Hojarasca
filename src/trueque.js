// Lo que se consigue en el almacén, a cambio de lo que juntás en el bosque
export const TRUEQUES = [
  {
    id: 'hacha', nombre: 'Hacha de mano',
    pide: [['canto', 2], ['ramita', 8]],
    texto: 'Cabeza de acero y cabo de lenga. La misma que usan los puesteros para la leña.',
    efecto: 'Sirve para hacer troncos y juntar piedra.',
  },
  {
    id: 'mosca', nombre: 'Mosca de pescar atada a mano',
    pide: [['calafate', 5], ['pluma', 2]],
    texto: 'Atada con pluma de carpintero. Los peces pican mucho antes.',
    efecto: 'Los piques llegan casi en la mitad de tiempo.',
  },
  {
    id: 'farol', nombre: 'Farol de kerosene',
    pide: [['canto', 3], ['ramita', 6]],
    texto: 'De bronce y vidrio, de los que colgaban en los boliches de campo.',
    efecto: 'La luz alumbra mucho más lejos que la linterna.',
  },
  {
    id: 'manta', nombre: 'Manta de lana tejida',
    pide: [['pinon', 4], ['frutilla', 3]],
    texto: 'Hilada y tejida en telar, con los grises naturales de la oveja.',
    efecto: 'Podés dormir en cualquier lado, sin fuego.',
  },
  {
    // se gasta: se puede volver a cambiar todas las veces que haga falta
    id: 'yerba', nombre: 'Un kilo de yerba', repetible: true, da: 8,
    pide: [['frutilla', 5], ['canto', 2]],
    texto: 'Yerba con palo, en paquete de papel. Acá se cambia por lo que traigas.',
    efecto: 'Se pueden cebar mates en cualquier fuego.',
  },
  // 2.1: lo que sólo se consigue con conservas (ver `conservas.js`)
  {
    id: 'grabador', nombre: 'Grabador de mano',
    pide: [['frasco-frutilla', 2], ['pluma', 2]],
    texto: 'De casete, con parlante chico. Se lo dejó un guardaparque que se jubiló.',
    efecto: 'Grabás cantos de aves anotadas; al hacerlos sonar, la más cercana contesta.',
  },
  {
    id: 'botas', nombre: 'Botas de goma',
    pide: [['calafate-seco', 2], ['hongos-secos', 1]],
    texto: 'Altas y negras, de las de pescador de río.',
    efecto: 'Cruzás el agua sin chapotear: los animales de la orilla casi no te oyen.',
  },
  // 1.10: la majada. La tijera no se gasta.
  {
    id: 'tijera', nombre: 'Tijera de esquilar',
    pide: [['canto', 2], ['pluma', 1]],
    texto: 'De hoja doble y resorte de acero, como las de las comparsas que recorrían las estancias.',
    efecto: 'Con ella se esquilan las ovejas del corral del galpón: dos vellones cada una.',
  },
  // 1.11: la harina, para la torta frita. Se gasta: se cambia todas las veces.
  {
    id: 'harina', nombre: 'Un kilo de harina', repetible: true, da: 4,
    pide: [['pinon', 2], ['canto', 1]],
    texto: 'Harina de trigo en bolsa de papel, de la que sube con el tren desde el valle.',
    efecto: 'Cuatro tortas fritas, con un huevo cada una.',
  },
  // 1.10: la huerta. Las semillas se gastan al sembrar, así que se cambian cuantas veces haga falta.
  {
    id: 'semillas-habas', nombre: 'Semillas de habas', repetible: true, da: 3,
    pide: [['calafate', 3], ['ramita', 2]],
    texto: 'Un cucurucho de papel de diario con habas secas de la cosecha pasada.',
    efecto: 'Tres siembras para el cantero (O → Trabajo). Salen en cinco días.',
  },
  {
    id: 'semillas-papa', nombre: 'Papa para semilla', repetible: true, da: 2,
    pide: [['pinon', 3], ['canto', 1]],
    texto: 'Papas chicas con los ojos ya brotados, en una bolsa de arpillera.',
    efecto: 'Dos siembras para el cantero. Tardan siete días, pero rinden.',
  },
  // 3.7.2: lo de la cocina que no se produce (ver cocina-pasos.js). Se gasta: se cambia todas las veces.
  {
    id: 'azucar', nombre: 'Un kilo de azúcar', repetible: true, da: 4,
    pide: [['pinon', 2], ['ramita', 3]],
    texto: 'Azúcar blanca en bolsa de papel, de la que sube con el tren desde el valle.',
    efecto: 'Para las mermeladas, el dulce de leche y el chocolate.',
  },
  {
    id: 'sal', nombre: 'Sal gruesa', repetible: true, da: 6,
    pide: [['canto', 1], ['ramita', 2]],
    texto: 'Sal gruesa de las salinas de la costa, en un cucurucho de papel de estraza.',
    efecto: 'Sin sal gruesa no hay asado: una medida por asado.',
  },
  {
    id: 'cacao', nombre: 'Cacao amargo', repetible: true, da: 3,
    pide: [['calafate', 3], ['pluma', 1]],
    texto: 'Cacao amargo en polvo, en una lata con un barco pintado.',
    efecto: 'Con leche y azúcar, el chocolate de los días de nieve.',
  },
  {
    id: 'maiz', nombre: 'Maíz blanco pisado', repetible: true, da: 4,
    pide: [['pinon', 3]],
    texto: 'Maíz blanco partido, en bolsa de arpillera chica.',
    efecto: 'Para el locro: se deja en remojo desde la noche antes.',
  },
  {
    id: 'porotos', nombre: 'Porotos', repetible: true, da: 3,
    pide: [['calafate', 2], ['canto', 1]],
    texto: 'Porotos blancos secos, de la cosecha pasada, en un cucurucho.',
    efecto: 'Para el locro y los guisos de invierno.',
  },
];

// Lo que se gasta (semillas, yerba) se puede volver a cambiar; lo demás, una vez.
export function tieneYa(trueque, cosas = {}) {
  return !trueque.repetible && !!cosas[trueque.id];
}

export const TRUEQUE = Object.fromEntries(TRUEQUES.map((t) => [t.id, t]));

// nombres lindos para lo que pide cada cambio
export const NOMBRE_COSA = {
  calafate: 'frutos de calafate', pluma: 'plumas', canto: 'cantos rodados', ramita: 'ramitas',
  pinon: 'piñones', frutilla: 'frutillas', llaollao: 'llao llao', amancay: 'amancayes',
  'frasco-frutilla': 'frascos de dulce de frutilla', 'calafate-seco': 'bolsitas de calafate seco', 'hongos-secos': 'atados de llao llao seco',
};
