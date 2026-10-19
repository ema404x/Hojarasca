// 4.2: lo que cuesta el pico si se compra directo en el almacén, en pesos (el trueque y la forja del herrero salen más baratos)
export const PESOS_PICO_COMPRADO = 1200;

// Lo que se consigue en el almacén, a cambio de lo que juntás en el bosque
export const TRUEQUES = [
  {
    id: 'hacha', nombre: 'Hacha de mano',
    pide: [['canto', 2], ['ramita', 8]],
    texto: 'Cabeza de acero y cabo de lenga. La misma que usan los puesteros para la leña.',
    efecto: 'Sirve para hacer troncos y talar árboles. Para picar piedra hace falta el pico.',
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
  // 3.8.8: para saber la hora y el día sin ir a la aldea (en la plaza hay un reloj y en la biblioteca un almanaque: ver reloj-almanaque.js)
  {
    id: 'reloj', nombre: 'Reloj de bolsillo',
    pide: [['canto', 3], ['pluma', 2]],
    texto: 'De cuerda, con tapa de bronce y una cadenita. Lo dejó un viajante de los que bajaban del tren.',
    efecto: 'Muestra la hora en un costado de la pantalla.',
  },
  {
    id: 'almanaque', nombre: 'Almanaque de pared',
    pide: [['pinon', 2], ['ramita', 5]],
    texto: 'Una hoja por día, con la luna y las estaciones del valle, impreso en papel de diario.',
    efecto: 'Muestra el día de la semana, el día y la estación en un costado de la pantalla.',
  },
  // 4.2: el pico. Para picar piedra no alcanza el hacha. Se consigue de tres maneras (van al final: no mueven los números de lo que ya había):
  //   · acá, por trueque (cantos y ramitas, un poco más caro que el hacha);
  //   · con el herrero de la aldea, que lo forja por cantos y pesos (el camino «normal»: ver `cantosPico` y `pesosPico` en aldea.js);
  //   · acá mismo con plata (`pesos`): el atajo, el más caro. Sólo hay plata en el Relax (en el Desafío se arranca con el pico).
  // `cosa` es lo que se lleva (y la anotación del cuaderno); si falta, es el `id`.
  {
    id: 'pico', cosa: 'pico', nombre: 'Pico de cantero',
    pide: [['canto', 3], ['ramita', 12]],
    texto: 'Cabeza de acero con una punta y una pala chica, cabo de lenga. De los que usan en la cantera de la loma.',
    efecto: 'Sirve para picar piedra de los pedreros (H). Los árboles se siguen talando con el hacha.',
  },
  {
    id: 'pico-comprado', cosa: 'pico', nombre: 'Pico de cantero, ya hecho', pesos: PESOS_PICO_COMPRADO, pide: [],
    texto: 'El mismo pico, de los que Ercilia tiene colgados detrás del mostrador. Sale caro: es para el apuro.',
    efecto: 'Sirve para picar piedra de los pedreros (H). Los árboles se siguen talando con el hacha.',
  },
];

// Lo que se gasta (semillas, yerba) se puede volver a cambiar; lo demás, una vez.
export function tieneYa(trueque, cosas = {}) {
  return !trueque.repetible && !!cosas[trueque.cosa || trueque.id];
}

export const TRUEQUE = Object.fromEntries(TRUEQUES.map((t) => [t.id, t]));

// nombres lindos para lo que pide cada cambio
export const NOMBRE_COSA = {
  calafate: 'frutos de calafate', pluma: 'plumas', canto: 'cantos rodados', ramita: 'ramitas',
  pinon: 'piñones', frutilla: 'frutillas', llaollao: 'llao llao', amancay: 'amancayes',
  'frasco-frutilla': 'frascos de dulce de frutilla', 'calafate-seco': 'bolsitas de calafate seco', 'hongos-secos': 'atados de llao llao seco',
};
// 3.8.6: y de a uno (el almacén decía «y 1 plumas», «1 cantos rodados», «1 atados de llao llao seco»)
export const NOMBRE_COSA_UNO = {
  calafate: 'fruto de calafate', pluma: 'pluma', canto: 'canto rodado', ramita: 'ramita',
  pinon: 'piñón', frutilla: 'frutilla', llaollao: 'llao llao', amancay: 'amancay',
  'frasco-frutilla': 'frasco de dulce de frutilla', 'calafate-seco': 'bolsita de calafate seco', 'hongos-secos': 'atado de llao llao seco',
};
export function cantidadCosa(k, n) {
  const nombre = (n === 1 && Object.hasOwn(NOMBRE_COSA_UNO, k) ? NOMBRE_COSA_UNO[k] : Object.hasOwn(NOMBRE_COSA, k) ? NOMBRE_COSA[k] : k);
  return `${n} ${nombre}`;
}
