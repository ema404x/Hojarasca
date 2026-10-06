// 3.6: la Aldea de los Duendes. Un pueblo que ya existe en el valle (sólo en el Relax), en la
// parada chica del sur de la trochita, escondido a casi 600 m del refugio. Empieza chico (la
// estación, la plaza, la biblioteca popular, el almacén de Ercilia y la casa de té, la escuela a medio
// hacer y las casas de los vecinos) y crece: los pobladores bajan del tren en la aldea, les decís que sí y entre todos
// les levantan el local (la obra del pueblo: vos traés el material, los vecinos ponen la mano).
// Al terminar la obra abre el local y el poblador vive en el cuarto de atrás.
//
// Reemplaza al "fundar el pueblo" de la 3.1 (ver PLAN_ALDEA.md, sección 10): los cinco
// pobladores de la 3.1 se mudaron acá con sus diálogos y sus servicios del día; ya no hay
// casas tuyas que regalar, ni nombre, ni cartel. Sigue valiendo lo de la 3.1: nadie consume,
// pasa hambre ni se va. La aldea sólo crece.
//
// Lo que hay acá (todo datos y reglas; lo visual va en aldea-arquitectura.js y aldea-mundo.js):
//   · el plano: dónde está cada edificio y cada calle, en el marco de la parada (X a lo largo
//     de la vía, Z alejándose de ella, como `construirParada` en trochita.js), los puntos de
//     cada edificio (puerta, adentro, cama, trabajo, bancos, pupitres…) y las zonas que el
//     mundo tiene que despejar y emparejar;
//   · la gente: los vecinos de siempre y los once pobladores, con su ropa y sus charlas;
//   · lo que ofrece cada poblador una vez por día;
//   · la llegada y las obras del pueblo (cuatro etapas con aportes parciales);
//   · los horarios de cada uno y las charlas entre vecinos;
//   · el guardado (`progreso.aldea`) y la migración de un pueblo de la 3.1.
//
// 3.7.0 «La aldea crece» (PLAN_3_7.md): la calle de la Loma con sus nueve lotes; las ocho pobladoras
// nuevas y Pocha, la modista, intercaladas con los once de la 3.6; lo que da cada una por día; el año de
// doce días con los cumpleaños de todos; los chicos que crecen una etapa por año; las charlas nuevas (y
// las de la radio de la seccional, Julia con Josefina: Ema pasó a llamarse Josefina). Lo demás
// de la vida de la aldea (calendario, visitantes, mascota, apodo, familia, ritmo y cartas) está en
// aldea-vida.js.
//
// Módulo puro (se prueba en Node): sin three ni DOM.
import { ENTRADAS } from './cuaderno.js';
import { vecinosActivos } from './personal-partida.js';
import { porRetirar, porEnviar, enviarFoto } from './correo.js';
import { MELODIAS, anotarPartitura } from './personal-musica.js';

export const NOMBRE_ALDEA = 'Aldea de los Duendes';
const PI = Math.PI;
// Un número o NaN, sin tirar nunca: `Number()` de un objeto sin prototipo (o con un
// `valueOf` roto) tira, y un guardado retocado puede traer cualquier cosa.
// 3.6 (optimizar): `num`, `azar` y `suave01` son de acá; vecindad.js, aldea-mecanicas.js y aldea-mundo.js
// los usan (antes cada uno tenía su copia)
export const num = (v) => (typeof v === 'number' ? v : typeof v === 'string' || typeof v === 'boolean' ? Number(v) : NaN);
export const suave01 = (t) => { const x = Math.min(1, Math.max(0, t)); return x * x * (3 - 2 * x); };

// ---------------------------------------------------------------- el lugar
// La parada chica del sur: la elige trochita.js sólo con el terreno (el riel, su altura y la
// distancia al sendero), así que es siempre la misma. `ang` es la rotación del grupo de la
// parada (el ángulo de la vía + π/2), la misma que trochita.js devuelve como `parada.ang`.
// La prueba vuelve a calcularla desde el terreno y avisa si se movió.
export const PARADA_ALDEA = {
  x: 40.33335217430335, z: -339.13893663781784, y: 25.235360296996703,
  ang: 2.992763908303246, indice: 116, nombre: 'Estación Aldea de los Duendes',
};
// El marco de la aldea a partir de una parada ({ x, z, ang }): pasar del plano (lx, lz) al
// mundo y al revés. Las rotaciones del plano se suman a `ang` (las dos son giros en Y).
export function marcoAldea(parada = PARADA_ALDEA) {
  const p = parada && Number.isFinite(parada.x) && Number.isFinite(parada.z) && Number.isFinite(parada.ang) ? parada : PARADA_ALDEA;
  const c = Math.cos(p.ang), s = Math.sin(p.ang);
  return {
    x: p.x, z: p.z, y: Number.isFinite(p.y) ? p.y : PARADA_ALDEA.y, ang: p.ang,
    aMundo: (lx, lz) => ({ x: p.x + lx * c + lz * s, z: p.z - lx * s + lz * c }),
    aLocal: (x, z) => { const dx = x - p.x, dz = z - p.z; return { lx: dx * c - dz * s, lz: dx * s + dz * c }; },
    rotMundo: (r) => p.ang + r,
  };
}

// ---------------------------------------------------------------- el plano
// Cada edificio: tamaño (ancho en su X × fondo en su Z, metros), centro de la planta en el
// plano de la aldea (x, z) y su giro `rot` en el plano. El origen de cada edificio es el centro
// de la planta al nivel del piso y la puerta está en su cara +Z, la que mira a la calle.
// `y`: la altura objetivo del piso (la media del terreno en la planta; la prueba la recalcula).
// `calle`: la calle a la que da la puerta. `lado`: de qué costado (su +X o su −X) queda el
// lugar de trabajo de afuera, el lado con más aire. El contrato de ids y tamaños lo comparte
// aldea-arquitectura.js: no se cambian sin avisar.
//
// El pueblo, como uno patagónico de verdad: la estación sobre la vía; enfrente, cruzando la
// calle de la Vía, la plaza; la biblioteca popular de cara a la plaza del lado oeste; la casa de té
// de las galesas en la esquina de enfrente, con su galería mirando a la estación; el almacén de
// ramos generales de Ercilia cruzando la calle Norte, en diagonal a la plaza; la escuela al fondo
// de la calle de la Biblioteca; los locales sobre la calle Norte y la calle de la Vía; las casas de los vecinos en el lado del bosque (oeste) y los oficios
// que hacen ruido o necesitan campo (herrería, carpintería, miel, seccional) hacia el este,
// donde el terreno baja. Nada a menos de 22 m del eje de la vía (como `buscarLlano`) salvo la
// estación; nada en el agua; 3 m o más entre edificios; desnivel de cada planta ≤ 1,5 m.
//
// 3.6: el almacén y la casa de té son los mismos del valle (estructuras.js), que en el Relax se
// mudan a la aldea; en el Desafío quedan donde estaban. Su planta es la REAL completa (vereda,
// escalones, galería, mesas, alero, chimenea y cartel) y `estructura` dice cómo armarlos con el
// código de siempre: `id` del sitio, `dz` (dónde cae el centro del cuerpo, el `sitio` de
// estructuras.js, en el marco de la planta) y `giro` (lo que hay que sumarle al giro de la
// planta: el almacén tiene la fachada en su −Z, así que va con π). Ver `sitioEstructura`.
export const EDIFICIOS_ALDEA = {
  'estacion-aldea': { nombre: 'Estación Aldea de los Duendes', rol: 'estacion', inicial: true, fija: true, ancho: 16, fondo: 10, x: 0, z: 0, rot: 0, y: 25.24, huella: { x0: -8, x1: 8, z0: 0, z1: 10 } },
  plaza: { nombre: 'La plaza', rol: 'plaza', inicial: true, abierta: true, ancho: 18, fondo: 14, x: 6, z: 39.5, rot: PI, y: 22.82, calle: 'calle-via' },
  // la biblioteca popular, frente a la plaza (pedido del usuario: nada religioso en el juego)
  biblioteca: { nombre: 'La biblioteca popular', rol: 'biblioteca', inicial: true, ancho: 7, fondo: 11, x: -18, z: 41, rot: PI / 2, y: 21.77, calle: 'calle-oeste', lado: 1 },
  // el almacén de Ercilia: cuerpo de 7,5 × 5,5 m con vereda de 2,4 m, escalones y el cartel
  almacen: { nombre: 'Almacén de Ramos Generales', rol: 'almacen', inicial: true, ancho: 9.6, fondo: 9.8, x: -17, z: 60.5, rot: PI, y: 21.89, calle: 'calle-norte', estructura: { id: 'almacen', dz: -1.5, giro: PI, ancho: 7.5, fondo: 5.5 } },
  // la casa de té de las galesas: cuerpo de 6,4 × 5,2 m, galería con dos mesas, escalón y cartel
  'casa-te': { nombre: 'Casa de Té', rol: 'casa-te', inicial: true, ancho: 8, fondo: 10.6, x: 27.5, z: 36, rot: PI, y: 24.23, calle: 'calle-via', estructura: { id: 'casa-te', dz: -2, giro: 0, ancho: 6.4, fondo: 5.2 } },
  escuela: { nombre: 'La escuela', rol: 'escuela', inicial: true, poblador: 'maestra', ancho: 10, fondo: 7, x: 0, z: 71, rot: -PI / 2, y: 20.27, calle: 'calle-oeste', lado: 1 },
  'casa-jefe': { nombre: 'La casa del jefe de estación', rol: 'casa', inicial: true, ancho: 6, fondo: 6, x: -35, z: 36, rot: PI, y: 24.21, calle: 'calle-via', lado: 1 },
  'casa-ercilia': { nombre: 'La casa de Ercilia', rol: 'casa', inicial: true, ancho: 5, fondo: 5, x: -14, z: 71, rot: PI / 2, y: 21.28, calle: 'calle-oeste', lado: -1 },
  'casa-nelida': { nombre: 'La casa de Nélida', rol: 'casa', inicial: true, ancho: 6, fondo: 5, x: -32.5, z: 69, rot: PI / 2, y: 23.27, calle: 'pasaje-oeste', lado: -1 },
  'casa-abuela': { nombre: 'La casa de la abuela Herminia', rol: 'casa', inicial: true, ancho: 5, fondo: 5, x: -34, z: 45.5, rot: 0, y: 23.52, calle: 'calle-norte', lado: -1 },
  'casa-familia': { nombre: 'La casa de los Jones', rol: 'casa', inicial: true, ancho: 7, fondo: 6, x: -35, z: 60, rot: PI, y: 23.32, calle: 'calle-norte', lado: 1 },
  // los lotes: uno por poblador (la escuela es inicial y lote a la vez: la termina la maestra)
  panaderia: { nombre: 'La panadería', rol: 'local', poblador: 'panadera', ancho: 7, fondo: 6, x: 1, z: 59.5, rot: PI, y: 20.99, calle: 'calle-norte', lado: -1 },
  herreria: { nombre: 'La herrería', rol: 'local', poblador: 'herrero', ancho: 7, fondo: 7, x: 62, z: 34, rot: PI, y: 19.2, calle: 'calle-via', lado: 1 },
  carpinteria: { nombre: 'La carpintería', rol: 'local', poblador: 'carpintero', ancho: 8, fondo: 6, x: 73, z: 34, rot: PI, y: 19.34, calle: 'calle-via', lado: 1 },
  pescaderia: { nombre: 'La pescadería', rol: 'local', poblador: 'pescador', ancho: 6, fondo: 5, x: 83, z: 33, rot: PI, y: 20.48, calle: 'calle-via', lado: -1 },
  'puesto-sanitario': { nombre: 'El puesto sanitario', rol: 'local', poblador: 'enfermera', ancho: 6, fondo: 6, x: 46, z: 45, rot: 0, y: 21.61, calle: 'calle-norte', lado: -1 },
  estafeta: { nombre: 'La estafeta', rol: 'local', poblador: 'telegrafista', ancho: 5, fondo: 5, x: 40.5, z: 33, rot: PI, y: 22.76, calle: 'calle-via', lado: 1 },
  hilanderia: { nombre: 'La hilandería', rol: 'local', poblador: 'tejedora', ancho: 7, fondo: 6, x: 46, z: 59, rot: PI, y: 20.99, calle: 'calle-norte', lado: 1 },
  'sala-miel': { nombre: 'La sala de miel', rol: 'local', poblador: 'apicultor', ancho: 6, fondo: 5, x: 72, z: 58.5, rot: PI, y: 19.99, calle: 'calle-norte', lado: 1 },
  seccional: { nombre: 'La seccional de guardaparques', rol: 'local', poblador: 'guardaparque', ancho: 6, fondo: 6, x: 69.5, z: 45, rot: 0, y: 19.13, calle: 'calle-norte', lado: 1 },
  salon: { nombre: 'El salón', rol: 'local', poblador: 'musico', ancho: 10, fondo: 8, x: 34, z: 61, rot: PI, y: 20.85, calle: 'calle-norte', lado: 1 },
  // 3.7.0: la calle de la Loma. Detrás de la aldea (hacia el norte del plano) está la ladera del valle, que
  // sube casi un metro por metro: ahí no entra una planta de 6 m con menos de 1,5 m de desnivel. La loma
  // de verdad está al oeste: la calle Norte sigue derecho y sube de 24 a 31 m, entre mesetitas donde sí
  // entran los lotes (medido con el terreno real en verificar-3-7-0-aldea.mjs). Arriba de todo, el
  // observatorio, a unos 8 m sobre la plaza, con la aldea, el valle y la cordillera adelante.
  // `anexo`: lo que va afuera en su propio lugar (el corral de la veterinaria, el horno de la ceramista),
  // en el marco del edificio; `cupula`: el observatorio lleva cúpula. Tamaños del contrato con
  // aldea-arquitectura.js (no se cambian sin avisar). 3.7.0 (integración): el corral y el horno, donde los arma
  // aldea-arquitectura.js con `espejoAnexo` (del costado −X: el +X de la veterinaria da al estudio de fotos).
  veterinaria: { nombre: 'La veterinaria', rol: 'local', poblador: 'veterinaria', ancho: 8, fondo: 6, x: -65, z: 61.5, rot: PI, y: 21.41, calle: 'calle-loma', lado: 1, anexo: { id: 'corral', x: -7.8, z: 0, ancho: 6, fondo: 6 } },
  'estudio-fotos': { nombre: 'El estudio de fotos', rol: 'local', poblador: 'fotografa', ancho: 6, fondo: 6, x: -78, z: 61.5, rot: PI, y: 23.24, calle: 'calle-loma', lado: 1 },
  'refugio-andinista': { nombre: 'El refugio andinista', rol: 'local', poblador: 'andinista', ancho: 7, fondo: 6, x: -128.5, z: 44.5, rot: 0, y: 30.01, calle: 'calle-loma', lado: 1 },
  herboristeria: { nombre: 'La herboristería', rol: 'local', poblador: 'herbolaria', ancho: 6, fondo: 6, x: -105, z: 59.5, rot: PI, y: 26.66, calle: 'calle-loma', lado: 1 },
  'taller-arte': { nombre: 'El taller de arte', rol: 'local', poblador: 'pintora', ancho: 7, fondo: 6, x: -51, z: 43, rot: 0, y: 25.26, calle: 'calle-loma', lado: 1 },
  ceramica: { nombre: 'La cerámica', rol: 'local', poblador: 'ceramista', ancho: 7, fondo: 6, x: -62, z: 43, rot: 0, y: 24.66, calle: 'calle-loma', lado: -1, anexo: { id: 'horno', x: -5.1, z: -0.7, ancho: 2, fondo: 2 } },
  varadero: { nombre: 'El varadero', rol: 'local', poblador: 'botera', ancho: 8, fondo: 6, x: -110, z: 43, rot: 0, y: 27.71, calle: 'calle-loma', lado: -1 },
  observatorio: { nombre: 'El observatorio', rol: 'local', poblador: 'astronoma', ancho: 6, fondo: 6, x: -138, z: 43, rot: 0, y: 30.68, calle: 'calle-loma', lado: -1, cupula: true },
  costureria: { nombre: 'La costurería', rol: 'local', poblador: 'modista', ancho: 6, fondo: 5, x: -46.5, z: 59.5, rot: PI, y: 23.94, calle: 'calle-loma', lado: -1 },
};
export const IDS_EDIFICIOS = Object.keys(EDIFICIOS_ALDEA);
export const esEdificioAldea = (id) => typeof id === 'string' && Object.hasOwn(EDIFICIOS_ALDEA, id);
export const INICIALES_ALDEA = IDS_EDIFICIOS.filter((id) => EDIFICIOS_ALDEA[id].inicial);
// el lote de cada poblador (el que se levanta cuando llega)
export const LOTE_DE = Object.fromEntries(IDS_EDIFICIOS.filter((id) => EDIFICIOS_ALDEA[id].poblador).map((id) => [EDIFICIOS_ALDEA[id].poblador, id]));
export const LOTES_ALDEA = Object.values(LOTE_DE);
export const esLote = (id) => LOTES_ALDEA.includes(id);
export const pobladorDeLote = (id) => (esEdificioAldea(id) ? EDIFICIOS_ALDEA[id].poblador || null : null);

// Las calles de ripio: polilíneas en el plano con su ancho (sin las veredas, que son 1 a
// 4 m de tablas entre la calle y cada frente).
export const CALLES_ALDEA = [
  { id: 'calle-estacion', nombre: 'Calle de la Estación', ancho: 5, puntos: [[6, 9], [6, 26]] },
  { id: 'calle-via', nombre: 'Calle de la Vía', ancho: 6, puntos: [[-44, 26], [90, 26]] },
  { id: 'calle-norte', nombre: 'Calle Norte', ancho: 5, puntos: [[-44, 52], [80, 52]] },
  { id: 'calle-oeste', nombre: 'Calle de la Biblioteca', ancho: 5, puntos: [[-8, 26], [-8, 78]] },
  { id: 'calle-este', nombre: 'Calle del Almacén', ancho: 5, puntos: [[20, 26], [20, 70]] },
  { id: 'pasaje-oeste', nombre: 'Pasaje de los Coihues', ancho: 4, puntos: [[-27, 26], [-27, 68]] },
  { id: 'pasaje-este', nombre: 'Pasaje de las Chacras', ancho: 4, puntos: [[53, 26], [53, 68]] },
  // 3.7.0: la que sigue a la calle Norte y sube a la loma, hasta el observatorio
  { id: 'calle-loma', nombre: 'Calle de la Loma', ancho: 5, puntos: [[-44, 52], [-146, 52]] },
];

// De la planta de un edificio: dónde cae un punto suyo (bx, bz) en el plano de la aldea.
function enPlano(e, bx, bz) {
  const c = Math.cos(e.rot), s = Math.sin(e.rot);
  return { x: e.x + bx * c + bz * s, z: e.z - bx * s + bz * c };
}
// Dónde y cómo armar con estructuras.js un edificio que viene del valle (el almacén, la casa
// de té): el `sitio` (centro del cuerpo) en el mundo y el giro que espera ese código. null si
// el edificio no viene del valle.
export function sitioEstructura(id, parada = PARADA_ALDEA) {
  if (!esEdificioAldea(id) || !EDIFICIOS_ALDEA[id].estructura) return null;
  const e = EDIFICIOS_ALDEA[id], s = e.estructura, m = marcoAldea(parada);
  const c = enPlano(e, 0, s.dz);
  const r = m.rotMundo(e.rot + s.giro);
  return { id: s.id, ...m.aMundo(c.x, c.z), y: e.y, rot: Math.atan2(Math.sin(r), Math.cos(r)), ancho: s.ancho, fondo: s.fondo };
}
// La planta en el plano: sus medidas y la caja que ocupa (los giros son de a 90°).
export function plantaDe(id) {
  if (!esEdificioAldea(id)) return null;
  const e = EDIFICIOS_ALDEA[id];
  if (e.huella) return { id, x: e.x, z: e.z, rot: e.rot, ancho: e.ancho, fondo: e.fondo, ...e.huella };
  const giro = Math.abs(Math.sin(e.rot)) > 0.5;
  const ax = giro ? e.fondo : e.ancho, az = giro ? e.ancho : e.fondo;
  return { id, x: e.x, z: e.z, rot: e.rot, ancho: e.ancho, fondo: e.fondo, x0: e.x - ax / 2, x1: e.x + ax / 2, z0: e.z - az / 2, z1: e.z + az / 2 };
}
// Las muestras de una planta, cada `paso` metros, en el plano (para medir el terreno).
export function muestrasPlanta(id, paso = 0.5) {
  const p = plantaDe(id);
  if (!p) return [];
  const lista = [];
  const d = Math.max(0.1, num(paso) || 0.5);
  for (let x = p.x0; x <= p.x1 + 1e-6; x += d) for (let z = p.z0; z <= p.z1 + 1e-6; z += d) lista.push({ lx: x, lz: z });
  return lista;
}
// ¿El punto (lx, lz) del plano cae dentro de la planta (con `margen` metros hacia adentro)?
// 3.6 (optimizar): la planta de cada edificio, armada una vez (la tabla no cambia; antes era un objeto
// nuevo en cada pregunta, y se pregunta por cada edificio)
const cachePlantas = new Map();
export function dentroDePlanta(id, lx, lz, margen = 0) {
  let p = cachePlantas.get(id);
  if (p === undefined) { p = plantaDe(id); cachePlantas.set(id, p ? Object.freeze(p) : null); }
  return !!p && lx >= p.x0 + margen && lx <= p.x1 - margen && lz >= p.z0 + margen && lz <= p.z1 - margen;
}
const distSegmento = (px, pz, a, b) => {
  const vx = b[0] - a[0], vz = b[1] - a[1], l2 = vx * vx + vz * vz;
  const t = l2 ? Math.max(0, Math.min(1, ((px - a[0]) * vx + (pz - a[1]) * vz) / l2)) : 0;
  return Math.hypot(px - a[0] - vx * t, pz - a[1] - vz * t);
};
// Distancia del punto al borde de una calle (negativa: está sobre la calle).
export function distanciaACalle(lx, lz, calle) {
  let m = Infinity;
  for (let i = 0; i < calle.puntos.length - 1; i++) m = Math.min(m, distSegmento(lx, lz, calle.puntos[i], calle.puntos[i + 1]));
  return m - calle.ancho / 2;
}

// ---------------------------------------------------------------- los puntos de cada edificio
// En el marco del edificio (bx, bz; la puerta en +Z) y con hacia dónde mira cada uno (`rot`,
// el mismo giro que los edificios: mira hacia (sen rot, cos rot)). Los locales tienen el
// cuarto de atrás con la cama del poblador; los de la plaza, la biblioteca, la escuela y el
// salón tienen lugares para estar, bancos, pupitres y sillas.
const atrasDe = (e) => Math.min(2.6, e.fondo * 0.4);
const medioDe = (e) => (-e.fondo / 2 + atrasDe(e) + e.fondo / 2) / 2;
// 3.7.0: el muelle del lago (el `muelle` de terreno.js, a casi 500 m de la aldea), en el plano: Martina, la
// del varadero, trabaja de día al lado de donde arranca el muelle, en la orilla (2,8 m al costado y un metro
// antes de la primera tabla), mirando al agua. La prueba lo vuelve a calcular desde el terreno.
export const MUELLE_ALDEA = { lx: -74.16, lz: -489.71, rot: -1.0 };
// De un punto del plano (lx, lz, giro) al marco de un edificio (lo contrario de `enPlano`).
function desdePlano(e, lx, lz, rot) {
  const c = Math.cos(e.rot), s = Math.sin(e.rot), dx = lx - e.x, dz = lz - e.z;
  return { x: dx * c - dz * s, z: dx * s + dz * c, rot: rot - e.rot };
}
// 3.7.0 (integración): los puntos de los locales de la calle de la Loma, en el marco de cada uno ([x, z, rot]):
// adentro, su lugar de trabajo (la camilla, la cámara, el mapa, el mortero, el atril, el torno, el bote, las
// cartas del cielo, la máquina de coser), con el cliente enfrente; la cama de la vivienda; la silla del retrato,
// la del modelo y la de la clienta (lugar-1); y en el observatorio, la escalera y el telescopio, arriba
export const PUNTOS_LOMA = {
  veterinaria: { adentro: [1.6, 1.91, PI], cliente: [0.4, 1.3, PI / 2], cama: [-2.42, -1.66, -1.78] },
  'estudio-fotos': { adentro: [1.12, 1.31, -1.45], cliente: [-1.1, 1.75, PI / 2], cama: [1.42, -1.66, 1.78], 'lugar-1': [-1.9, 1.2, PI / 2] },
  'refugio-andinista': { adentro: [2.74, 1.4, -PI / 2], cliente: [1.95, 2.4, PI / 2], cama: [-1.92, -1.66, -1.78] },
  herboristeria: { adentro: [-1.72, 0.5, -PI / 2], cliente: [-0.9, 1.15, -2.2], cama: [-1.42, -1.66, -1.78] },
  'taller-arte': { adentro: [2.1, 1.45, PI], cliente: [1.15, 1.25, 1.4], cama: [1.92, -1.66, 1.78], 'lugar-1': [-0.6, 1.95, PI - 0.5] },
  ceramica: { adentro: [1.3, 1.88, PI], cliente: [0.2, 1.6, PI / 2], cama: [-1.92, -1.66, -1.78] },
  varadero: { adentro: [0.3, 1.15, -PI / 2], cliente: [-1.2, 2.1, PI / 2], cama: [-2.42, -1.66, -1.78] },
  observatorio: { adentro: [-1.35, 0.4, -1.97], cliente: [-0.4, 1.45, -2.4], cama: [-1.42, -1.66, -1.78], escalera: [1.65, 2.17, -PI / 2], 'escalera-arriba': [-0.88, 2.2, -PI / 2], telescopio: [-0.45, 0.62, PI / 2],
    // (por delante de la escalera, sin pasar por debajo)
    'escalera-rodeo-1': [-1.5, 1.3, PI / 2], 'escalera-rodeo-2': [1.65, 1.3, 0], 'escalera-base': [1.3, 2.175, -PI / 2], 'escalera-cima': [-0.44, 2.175, -PI / 2] },
  costureria: { adentro: [-1.6, 1.44, 0], cliente: [-0.4, 1.95, -2.0], cama: [1.42, -1.16, 1.78], 'lugar-1': [2.26, 2.04, -2.4] },
};
// 3.7.0 (integración): adentro de su local, sentadas en lo suyo: Malena en el banco del torno y Pocha en la silla
// de la máquina de coser
export const SENTADO_ADENTRO = ['ceramica', 'costureria'];
// 3.7.0 (integración): las escaleras que la gente sube de verdad (el observatorio: a la torreta del telescopio).
// Lo de arriba (`altos`) se alcanza por el pie y el tope de la escalera; `alto`: el piso de arriba sobre el lote.
// (`rodeo`: por dónde se llega al pie desde la puerta, sin pasar por debajo de la escalera; `base` y `cima`: el
// primer y el último escalón, con la altura de cada uno sobre el lote: la gente sube por la rampa entre los dos)
export const ESCALERAS_ALDEA = {
  observatorio: { pie: 'escalera', base: 'escalera-base', cima: 'escalera-cima', tope: 'escalera-arriba', rodeo: ['escalera-rodeo-1', 'escalera-rodeo-2'], altos: ['escalera-arriba', 'telescopio'], piso: 0.32, alto: 2.98 },
};
// ¿El punto queda lejos de la aldea (fuera del rectángulo que ocupa)? Lo de Martina en el muelle.
export const esPuntoLejano = (punto) => punto === 'trabajo-muelle';
// 3.7.0 (integración): dónde está de verdad la puerta de cada uno (su x en el marco del edificio, la de
// aldea-arquitectura.js; la prueba las compara). Antes la gente entraba y salía por el medio del frente: con la
// puerta a un metro y medio de ahí, atravesaba la pared. Se sale por el zaguán (adentro, frente a la puerta).
export const PUERTA_X = {
  biblioteca: -1.6, escuela: -1.5, 'casa-jefe': -1, 'casa-ercilia': 0.7, 'casa-nelida': -0.9, 'casa-abuela': 0.6, 'casa-familia': -1.2,
  panaderia: -1.2, carpinteria: -1, pescaderia: -1, 'puesto-sanitario': -0.9, estafeta: 0.8, hilanderia: -1.4, 'sala-miel': -0.9, seccional: -1,
  veterinaria: -0.6, 'estudio-fotos': 1.5, 'refugio-andinista': -0.9, herboristeria: -1, 'taller-arte': -1.4, ceramica: -0.6, observatorio: -1.7, costureria: 1,
};
function puntosBase(e, id) {
  const { ancho: W, fondo: D } = e;
  const frente0 = -D / 2 + atrasDe(e);            // donde empieza el cuarto del frente
  const medio = (frente0 + D / 2) / 2;
  const lado = e.lado || 1;
  const xP = Object.hasOwn(PUERTA_X, id) ? PUERTA_X[id] : 0;
  return {
    puerta: { x: xP, z: D / 2 + 0.9, rot: 0 },
    zaguan: { x: xP, z: D / 2 - 0.75, rot: 0 },
    adentro: { x: W / 4, z: medio - 0.3, rot: 0 },
    cliente: { x: W / 4, z: Math.min(D / 2 - 0.5, medio + 0.9), rot: PI },
    trabajo: { x: lado * (W / 2 + 1.4), z: D / 2 - 1.2, rot: lado > 0 ? -PI / 2 : PI / 2 },
  };
}
// Los del almacén y la casa de té, leídos de estructuras.js y main.js, en el marco del CUERPO con
// la puerta en +Z (el almacén, que allá tiene la fachada en −Z, va dado vuelta: x y z cambiadas
// de signo). El mostrador del almacén está en (0, 0,3) de allá y Ercilia atiende detrás, en
// (0, 1,3); `cercaDelMostrador` pide estar adentro del cuerpo y a menos de 3,2 m: los clientes
// van entre el mostrador y las bolsas. En la casa de té se sirve en la galería, junto al
// `mostrador` de main.js (`enLaCasaDeTe`: a menos de 4,5 m), y las sillas son las de las mesas.
const PUNTOS_ESTRUCTURA = {
  almacen: {
    adentro: { x: 0, z: -1.3, rot: 0 }, mostrador: { x: 0, z: -0.3, rot: 0 },
    'cliente-1': { x: 1.6, z: 0.4, rot: PI }, 'cliente-2': { x: 0, z: 0.4, rot: PI }, 'cliente-3': { x: -1.2, z: 0.4, rot: PI },
    reponer: { x: -2.3, z: -1.75, rot: PI }, deposito: { x: 2.4, z: 1.6, rot: 0 },
    puerta: { x: 0, z: 5.75, rot: 0 }, vereda: { x: -0.9, z: 4.3, rot: 0 }, trabajo: { x: -3.4, z: 4.4, rot: 0 },
  },
  'casa-te': {
    adentro: { x: 0, z: 4.5, rot: 0 }, mostrador: { x: 0, z: 4.1, rot: 0 }, cocina: { x: 1.6, z: -0.8, rot: PI }, cama: { x: 2.2, z: -1.7, rot: 0 },
    'mesa-1': { x: -2.41, z: 4.0, rot: PI / 2 }, 'mesa-2': { x: -1.39, z: 4.0, rot: -PI / 2 }, 'mesa-3': { x: 1.39, z: 4.0, rot: PI / 2 }, 'mesa-4': { x: 2.41, z: 4.0, rot: -PI / 2 },
    puerta: { x: 0, z: 5.7, rot: 0 }, trabajo: { x: 3.7, z: 1.2, rot: -PI / 2 },
  },
};
function puntosLocales(id) {
  const e = EDIFICIOS_ALDEA[id];
  const { ancho: W, fondo: D } = e;
  if (e.estructura) {
    const p = {};
    for (const [k, q] of Object.entries(PUNTOS_ESTRUCTURA[e.estructura.id])) p[k] = { x: q.x, z: q.z + e.estructura.dz, rot: q.rot };
    return p;
  }
  if (e.rol === 'estacion') {
    // en el marco de la parada: el andén va de 1,15 a 4,75 m de la vía y el galpón de 4,5 a 7,5
    return {
      anden: { x: 0, z: 2.95, rot: PI }, espera: { x: 1.4, z: 3.55, rot: PI }, puerta: { x: 0, z: 4.0, rot: PI },
      adentro: { x: 0.6, z: 6.1, rot: PI }, cama: { x: -1.2, z: 6.8, rot: 0 }, trabajo: { x: -3.3, z: 3.0, rot: PI },
      salida: { x: 6, z: 9, rot: 0 },
    };
  }
  if (e.rol === 'plaza') {
    // la plaza mira a la estación (su +Z da a la calle de la Vía): el duende tallado recibe al que
    // llega y el músico toca en el medio, de cara a la estación
    const p = { mastil: { x: 0, z: 0, rot: 0 }, duende: { x: -3, z: 2.5, rot: 0 }, musico: { x: 0, z: -2.6, rot: 0 } };
    // 3.6 (mecánicas): al pie de la soga del mástil (el de aldea-arquitectura.js, en z 5,25), donde
    // el jefe de estación iza la bandera a las 8 y la arría a las 19, mirando al mástil
    p.soga = { x: -1.4, z: 5.7, rot: 1.88 };
    // veinte lugares para estar: bancos de a dos en los lados largos y cuatro en los cortos
    let k = 1;
    for (const z of [-5.5, 5.5]) for (const x of [-6.5, -5.5, -2.5, -1.5, 1.5, 2.5, 5.5, 6.5]) p[`estar-${k++}`] = { x, z, rot: z < 0 ? 0 : PI };
    for (const x of [-7.6, 7.6]) for (const z of [-0.5, 0.5]) p[`estar-${k++}`] = { x, z, rot: x < 0 ? PI / 2 : -PI / 2 };
    // donde juegan los chicos
    [[-3, -2], [3, -2], [-2, 3.8], [2.5, 4]].forEach(([x, z], i) => { p[`juego-${i + 1}`] = { x, z, rot: 0 }; });
    return p;
  }
  const p = puntosBase(e, id);
  if (e.rol === 'biblioteca') {
    // el mostrador junto a la puerta (el que atiende y el que pide un libro), cuatro mesas de
    // lectura con cuatro sillas cada una y, al fondo, el sillón de la abuela junto a la estufa
    // a leña, donde lee los cuentos del domingo
    // 3.6 (mecánicas): donde están de verdad los muebles de aldea-arquitectura.js (el mostrador a la
    // izquierda de la puerta, tres mesas de lectura en el medio y el sillón de orejas junto a la
    // estufa): los vecinos se sientan en las sillas y la abuela en su sillón, no en el aire
    // (verificar-3-6-mecanicas.mjs los compara con los puntos con nombre de la arquitectura)
    p.adentro = { x: -1.9, z: 1.83, rot: 0 };
    p.cliente = { x: -1.9, z: 3.43, rot: PI };
    p.cuentos = { x: 1.75, z: 4.0, rot: -2.5 };
    let k = 1;
    for (const mz of [0.9, -1.3, -3.5]) for (const x of [0.1, 0.9]) for (const [dz, r] of [[-0.62, 0], [0.62, PI]]) p[`lectura-${k++}`] = { x, z: mz + dz, rot: r };
    // y los cuatro almohadones de la alfombra, mirando al sillón (los domingos no alcanzan las sillas)
    for (const [x, z] of [[0.5, 2.6], [1.15, 2.2], [1.6, 2.85], [0.75, 3.15]]) p[`lectura-${k++}`] = { x, z, rot: Math.atan2(1.75 - x, 4.0 - z) };
    return p;
  }
  if (e.rol === 'casa') {
    delete p.cliente;
    p.adentro = { x: -W / 4, z: D / 4 - 0.5, rot: 0 };   // la mesa de la cocina
    p.cama = { x: W / 2 - 1.0, z: -D / 2 + 1.0, rot: 0 };
    if (id === 'casa-familia') p['cama-chicos'] = { x: -W / 2 + 1.0, z: -D / 2 + 1.0, rot: 0 };
    return p;
  }
  // los locales (y la escuela): el cuarto de atrás con la cama del poblador
  p.cama = { x: W / 2 - 1.0, z: -D / 2 + 0.9, rot: 0 };
  if (e.rol === 'escuela') {
    // la maestra frente al pizarrón y ocho pupitres mirando hacia ella (3.6 (mecánicas): donde están
    // de verdad en aldea-arquitectura.js: el pizarrón en la pared de la izquierda y los pupitres dobles)
    delete p.cliente;
    p.adentro = { x: -4.3, z: 0.2, rot: PI / 2 };
    let k = 1;
    for (const [x, z] of [[-1.24, -0.27], [-1.24, 0.27], [0.96, -0.27], [0.96, 0.27], [3.16, -0.27], [3.16, 0.27], [-1.24, 1.18], [-1.24, 1.72]]) p[`pupitre-${k++}`] = { x, z, rot: -PI / 2 };
  }
  if (id === 'salon') {
    // el escenario y ocho sillas
    p.escenario = { x: 0, z: -D / 2 + atrasDe(e) + 0.6, rot: 0 };
    let k = 1;
    // 3.6 (mecánicas): las sillas de verdad de aldea-arquitectura.js (a los costados de las mesas)
    for (const z of [1.2, 2.9]) for (const x of [-3.45, -1.75, 1.75, 3.45]) p[`lugar-${k++}`] = { x, z, rot: x < -2.6 || (x > 0 && x < 2.6) ? PI / 2 : -PI / 2 };
    // 3.6 (mecánicas): la pista de baile, en el pasillo entre las mesas: cuatro parejas, frente a frente
    k = 1;
    for (const z of [0.6, 1.4, 2.2, 3.0]) for (const x of [-0.6, 0.6]) p[`baile-${k++}`] = { x, z, rot: x < 0 ? PI / 2 : -PI / 2 };
  }
  // 3.7.0: lo propio de los locales de la calle de la Loma: el corral de la veterinaria y el horno de la
  // ceramista (adentro del corral, y frente a la boca del horno), la silla de los retratos, la del modelo
  // y la de la clienta que se prueba, y el lugar de Martina junto al muelle del lago (lejos: trabaja allá)
  // 3.7.0 (integración): adentro (donde atiende y trabaja: junto a su herramienta), el cliente enfrente, la cama
  // y las sillas, donde están de verdad en aldea-arquitectura.js (la prueba los compara); los de la base caían
  // adentro de la camilla, del torno, del atril o de la mesa del refugio
  if (Object.hasOwn(PUNTOS_LOMA, id)) for (const [k, q] of Object.entries(PUNTOS_LOMA[id])) p[k] = { x: q[0], z: q[1], rot: q[2] };
  // (3.7.0 (integración): frente a la tranquera, adentro: se entra por ahí y no a través del cerco)
  if (e.anexo?.id === 'corral') p.corral = { x: e.anexo.x, z: e.anexo.z + 1.7, rot: PI };
  if (e.anexo?.id === 'horno') p.horno = { x: e.anexo.x, z: e.anexo.z + 1.7, rot: PI };
  if ((id === 'estudio-fotos' || id === 'taller-arte' || id === 'costureria') && !p['lugar-1']) p['lugar-1'] = { x: -W / 4, z: medioDe(e), rot: PI / 2 };
  if (id === 'varadero') p['trabajo-muelle'] = desdePlano(e, MUELLE_ALDEA.lx, MUELLE_ALDEA.lz, MUELLE_ALDEA.rot);
  // alrededor de un lote, donde trabajan los vecinos mientras dura la obra
  if (e.poblador) {
    let k = 1;
    for (const sx of [1, -1]) for (const sz of [0.25, -0.25]) p[`obra-${k++}`] = { x: sx * (W / 2 + 1.0), z: sz * D, rot: sx > 0 ? -PI / 2 : PI / 2 };
  }
  return p;
}
const cachePuntos = new Map();
// Los puntos de un edificio en el plano de la aldea: { nombre: { x, z, rot } }.
export function puntosDe(id) {
  if (!esEdificioAldea(id)) return {};
  if (!cachePuntos.has(id)) {
    const e = EDIFICIOS_ALDEA[id];
    const salida = {};
    for (const [k, q] of Object.entries(puntosLocales(id))) {
      const a = enPlano(e, q.x, q.z);
      salida[k] = { x: a.x, z: a.z, rot: e.rot + q.rot };
    }
    cachePuntos.set(id, Object.freeze(salida));
  }
  // copias: quien los use puede moverlos sin pisar los de los demás
  return Object.fromEntries(Object.entries(cachePuntos.get(id)).map(([k, q]) => [k, { ...q }]));
}
// 3.6 (optimizar): los mismos SIN copiar, sólo para leer (aldea-gente.js los mira cada medio segundo
// para cada vecino: antes copiaba todos los puntos del edificio para usar uno)
const SIN_PUNTOS = Object.freeze({});
export function puntosFijosDe(id) {
  if (!esEdificioAldea(id)) return SIN_PUNTOS;
  if (!cachePuntos.has(id)) puntosDe(id);
  return cachePuntos.get(id);
}
// Los mismos, en el mundo (y: el piso del edificio).
export function puntosMundo(id, parada = PARADA_ALDEA) {
  const m = marcoAldea(parada);
  const e = EDIFICIOS_ALDEA[id];
  const salida = {};
  for (const [k, q] of Object.entries(puntosDe(id))) salida[k] = { ...m.aMundo(q.x, q.z), y: e.y, rot: m.rotMundo(q.rot) };
  return salida;
}
// Un edificio en el mundo: centro, giro y altura del piso (para quien lo dibuje).
export function edificioEnMundo(id, parada = PARADA_ALDEA) {
  if (!esEdificioAldea(id)) return null;
  const m = marcoAldea(parada);
  const e = EDIFICIOS_ALDEA[id];
  return { id, ...m.aMundo(e.x, e.z), y: e.y, rot: m.rotMundo(e.rot), ancho: e.ancho, fondo: e.fondo };
}

// 3.6.2: la aldea para el mapa del valle (mapa.js), en coordenadas del mundo: las calles (su eje y su ancho) y la
// planta de cada edificio (sus cuatro esquinas): 'plaza', 'lote' (el de un poblador que todavía puede no haber
// llegado: el lote con sus estacas también está) o 'edificio'
export function planoAldeaMapa(parada = PARADA_ALDEA) {
  const m = marcoAldea(parada);
  const calles = CALLES_ALDEA.map((c) => ({ id: c.id, ancho: c.ancho, puntos: c.puntos.map(([lx, lz]) => m.aMundo(lx, lz)) }));
  const edificios = IDS_EDIFICIOS.map((id) => {
    const p = plantaDe(id), e = EDIFICIOS_ALDEA[id];
    const esquinas = [[p.x0, p.z0], [p.x1, p.z0], [p.x1, p.z1], [p.x0, p.z1]].map(([lx, lz]) => m.aMundo(lx, lz));
    return { id, esquinas, tipo: e.abierta ? 'plaza' : e.poblador && !e.inicial ? 'lote' : 'edificio' };
  });
  return { calles, edificios };
}

// Lo que el mundo tiene que despejar (sacar árboles, con `veg.despejar`) y emparejar antes
// de armar la malla del suelo: un rectángulo por edificio (con 2,5 m de borde para fundirse
// con el terreno), a la altura objetivo de su piso, y las calles, que se despejan pero siguen
// el terreno. La estación no: ya la arma trochita.js. Con `altura(x, z)` la altura objetivo
// se recalcula (la media del terreno en la planta); sin ella, la de la tabla.
export function zonasAldea(parada = PARADA_ALDEA, altura = null) {
  const m = marcoAldea(parada);
  const zonas = [];
  for (const id of IDS_EDIFICIOS) {
    const e = EDIFICIOS_ALDEA[id];
    if (e.fija) continue;
    let y = e.y;
    if (typeof altura === 'function') {
      let s = 0, n = 0;
      for (const q of muestrasPlanta(id)) { const w = m.aMundo(q.lx, q.lz); const h = num(altura(w.x, w.z)); if (Number.isFinite(h)) { s += h; n++; } }
      if (n) y = s / n;
    }
    zonas.push({ id, tipo: 'rect', ...m.aMundo(e.x, e.z), rot: m.rotMundo(e.rot), ancho: e.ancho, fondo: e.fondo, altura: y, borde: 2.5, despejar: true, emparejar: true });
  }
  for (const c of CALLES_ALDEA) {
    for (let i = 0; i < c.puntos.length - 1; i++) {
      const [ax, az] = c.puntos[i], [bx, bz] = c.puntos[i + 1];
      const r = Math.atan2(bx - ax, bz - az);
      // con las veredas: un metro y medio de cada lado
      zonas.push({ id: `${c.id}-${i + 1}`, tipo: 'rect', ...m.aMundo((ax + bx) / 2, (az + bz) / 2), rot: m.rotMundo(r), ancho: c.ancho + 3, fondo: Math.hypot(bx - ax, bz - az), altura: null, borde: 1.5, despejar: true, emparejar: false });
    }
  }
  return zonas;
}

// ---------------------------------------------------------------- la gente
// Los vecinos de la aldea: están desde el día 1. Mismo formato que los pobladores (ver
// gente.js: `colores` con ropa, abrigo, gorro, pelo, barba, bufanda y poncho), más dónde
// viven y trabajan, y unas líneas de charla. Los chicos llevan `chico` y su `talla`.
export const VECINOS_ALDEA = {
  jefe: {
    nombre: 'Ernesto Llancafil', oficio: 'jefe de estación', mano: null, casa: 'casa-jefe', trabajo: 'estacion-aldea',
    colores: { ropa: '#3d4a5c', abrigo: '#2a3240', gorro: 'gorro', pelo: '#4a4038', barba: '#8a8378' },
    saludo: 'Bienvenido a la Aldea de los Duendes. El tren llega puntual, más o menos.', despedida: 'Cuidado al cruzar la vía.',
    charla: [
      'Esto era un apeadero de dos tablas. Ahora tiene jefe, que soy yo, y una campana en el andén que avisa cuando viene el tren.',
      'El duende de la plaza lo talló el primer jefe de estación, de un ciprés que tiró la nevada grande.',
      'Si ves gente nueva en el andén, hablale: los que bajan acá vienen a quedarse.',
    ],
  },
  nelida: {
    nombre: 'Nélida Ojeda', oficio: 'ayudante del almacén', mano: 'mate', casa: 'casa-nelida', trabajo: 'almacen',
    colores: { ropa: '#9a6b5a', abrigo: '#6b4538', gorro: null, pelo: '#3a2a22', bufanda: '#d9c7a8' },
    saludo: 'Pasá, que Ercilia ya viene. ¿Te busco algo mientras?', despedida: 'Volvé cuando quieras, que siempre hay algo.',
    charla: [
      'Le doy una mano a Ercilia: atiendo cuando ella duerme la siesta, repongo los estantes y barro la vereda, que con este viento es de nunca acabar.',
      'Ercilia es prima de mi madre. Cuando se vino a la aldea con todo el almacén, me dijo: «Nélida, vos sabés sumar». Y acá estoy.',
      'Cuando abran más locales vamos a ser un pueblo de verdad. Ya me imagino la cola para el pan.',
    ],
  },
  abuela: {
    nombre: 'Herminia Huenchul', oficio: 'la abuela de la aldea', mano: null, casa: 'casa-abuela', trabajo: 'casa-abuela',
    colores: { ropa: '#5e4a52', abrigo: '#3f3138', gorro: null, pelo: '#d8d4cc', bufanda: '#b89a7a', poncho: true },
    saludo: 'Sentate un rato, m\'hijo, que los cuentos se cuentan sentados.', despedida: 'Y si ves una puertita en una raíz, no la abras: golpeá.',
    charla: [
      'Dicen que los duendes del monte son del tamaño de un hachazo y usan gorro de corteza de lenga. Cuidan los árboles viejos.',
      'Cuando trajeron la vía, los peones encontraron puertitas talladas en las raíces de los coihues. Nadie supo nunca quién las hizo.',
      'Por eso a la parada le dicen Aldea de los Duendes. Yo nunca vi uno, eh. Tampoco vi el viento, y el viento existe.',
    ],
  },
  padre: {
    nombre: 'Mario Jones', oficio: 'hachero y peón de obra', mano: null, casa: 'casa-familia', trabajo: 'casa-familia',
    colores: { ropa: '#7a6a4e', abrigo: '#4e5a3c', gorro: 'boina', pelo: '#6b4a32', barba: '#6b4a32' },
    saludo: 'Buenas. Si hay obra, contá conmigo.', despedida: 'Nos vemos, que la leña no se corta sola.',
    charla: [
      'Mi abuelo vino de Gales a Chubut y mi viejo subió a la cordillera. Yo me quedé acá, por la Gladys.',
      'Cuando alguien nuevo levanta su local, los vecinos ponemos el hombro. Vos traés el material y nosotros la mano.',
      'Las chapas se clavan con el viento a favor, nunca en contra. Eso lo aprendí a los golpes.',
    ],
  },
  madre: {
    nombre: 'Gladys Calfuqueo', oficio: 'vecina, hace dulces', mano: 'mate', casa: 'casa-familia', trabajo: 'casa-familia',
    colores: { ropa: '#7d5a6e', abrigo: '#5a4058', gorro: null, pelo: '#2a2220', bufanda: '#c8b48e' },
    saludo: 'Hola. ¿Querés probar el dulce de rosa mosqueta?', despedida: 'Andá con cuidado.',
    charla: [
      'Los chicos esperan la escuela como el agua. Hasta ahora estudian en la mesa de la cocina.',
      'La rosa mosqueta crece sola al costado de la vía. La junto en otoño y hago dulce para todo el invierno.',
    ],
  },
  nene: {
    nombre: 'Nahuel', oficio: 'chico de la aldea', mano: null, casa: 'casa-familia', trabajo: 'casa-familia', chico: true, talla: 0.62,
    colores: { ropa: '#3f6a8a', abrigo: '#2e4f6a', gorro: 'gorro', pelo: '#2a2220' },
    saludo: '¡Hola! ¿Viste el duende de la plaza?', despedida: '¡Chau!',
    charla: [
      'Cuando sea grande voy a ser maquinista de la trochita.',
      'La abuela Herminia dice que los duendes no se dejan ver. Yo igual los busco.',
    ],
  },
  nena: {
    nombre: 'Lucía', oficio: 'chica de la aldea', mano: null, casa: 'casa-familia', trabajo: 'casa-familia', chico: true, talla: 0.76,
    colores: { ropa: '#a0523e', abrigo: '#7a3a2e', gorro: 'gorro', pelo: '#3a2a22', bufanda: '#e0c890' },
    saludo: '¡Hola! Yo ya sé leer.', despedida: '¡Chau, chau!',
    charla: [
      'Mi hermano dice que vio un duende. Era un hongo.',
      'Cuando haya maestra voy a tener cuaderno propio, como el tuyo.',
    ],
  },
  // 3.6: la casa de té ya no está sola: la atiende una galesa de la colonia del Chubut
  galesa: {
    nombre: 'Ceinwen Evans', oficio: 'la de la casa de té', mano: null, casa: 'casa-te', trabajo: 'casa-te',
    colores: { ropa: '#5a6a7a', abrigo: '#3e4a5a', gorro: null, pelo: '#c8b89a', bufanda: '#e8e0d0' },
    saludo: 'Prynhawn da! Buenas tardes, quiero decir. ¿Un té?', despedida: 'Hwyl fawr! Que te vaya bien.',
    charla: [
      'La torta negra lleva frutas secas, especias y paciencia. La receta la trajo mi tatarabuela de Gales, en el Mimosa.',
      'Los galeses llegamos al Chubut en 1865. Del valle del río subimos a la Colonia 16 de Octubre, y de ahí algunos vinimos hasta acá.',
      'El té se toma de tarde, con la pava al fuego y sin apuro. Desde las tres te espero en la galería.',
    ],
  },
};
export const ORDEN_VECINOS_ALDEA = ['jefe', 'nelida', 'abuela', 'padre', 'madre', 'nene', 'nena', 'galesa'];
// 3.6: Ercilia, la del almacén, también vive en la aldea (en el Relax), pero su figura, su saludo
// y sus historias son los de siempre (PERSONAJES.ercilia y HISTORIAS en gente.js): acá sólo
// están su casa, su trabajo y su rutina.
export const VECINOS_DEL_VALLE = { ercilia: { casa: 'casa-ercilia', trabajo: 'almacen', definida: 'gente.js' } };
export const esVecinoAldea = (clave) => typeof clave === 'string' && (Object.hasOwn(VECINOS_ALDEA, clave) || Object.hasOwn(VECINOS_DEL_VALLE, clave));
const vecinoDe = (clave) => (Object.hasOwn(VECINOS_ALDEA, clave) ? VECINOS_ALDEA[clave] : Object.hasOwn(VECINOS_DEL_VALLE, clave) ? VECINOS_DEL_VALLE[clave] : null);

// Los pobladores: los cinco de la 3.1 (movidos de pueblo.js tal cual, con sus diálogos) y los
// seis nuevos. `lote`: el local que se les levanta. `afuera`: a la tarde trabajan afuera (la
// fragua, el banco, las redes, las colmenas, la recorrida). `obrero`: ayudan en las obras.
export const POBLADORES_ALDEA = {
  carpintero: {
    nombre: 'Tito Arrieta', oficio: 'carpintero', mano: null, lote: 'carpinteria', afuera: true, obrero: true,
    colores: { ropa: '#8a6d4b', abrigo: '#5d4630', gorro: 'boina', pelo: '#4a3a2c', barba: '#6b5a48' },
    llegada: [
      'Buenas. Me llamo Tito Arrieta, soy carpintero. Vengo del valle de abajo, donde ya no queda madera que trabajar.',
      'En el tren me dijeron que acá arriba alguien anda levantando casas. Donde se construye, un carpintero siempre sirve.',
    ],
    saludo: 'Buenas, vecino. La sierra ya está afilada.', despedida: 'Cuando juntes troncos, ya sabés dónde estoy.',
    resumen: 'Te aserra troncos: cinco tablas por tronco, hasta seis troncos por día.',
  },
  panadera: {
    nombre: 'Rosa Quilodrán', oficio: 'panadera', mano: 'mate', lote: 'panaderia',
    colores: { ropa: '#b08a6a', abrigo: '#7a4f3e', gorro: 'gorro', pelo: '#2e2622', bufanda: '#d8cdb8' },
    llegada: [
      'Hola. Soy Rosa Quilodrán, panadera. Me vine con la masa madre en un frasco, envuelta en una toalla para que no se enfríe.',
      'Un pueblo sin pan no es pueblo. Si me dejás quedarme, el horno va a estar prendido todas las mañanas.',
    ],
    saludo: 'Pasá, que recién sale la tanda.', despedida: 'Y no te comas todo en el camino, eh.',
    resumen: 'Te cambia pan casero por yerba: tres panes por dos de yerba, una vez por día.',
  },
  herrero: {
    nombre: 'Anselmo Ruiz', oficio: 'herrero', mano: null, lote: 'herreria', afuera: true, obrero: true,
    colores: { ropa: '#5a5048', abrigo: '#3a322c', gorro: 'gorro', pelo: '#2a2420', barba: '#3a322c' },
    llegada: [
      'Anselmo Ruiz, herrero. Traigo el yunque en el furgón, que pesa más que yo.',
      'Donde hay hachas hay filo que se gasta. Si me das un techo, le doy fragua a este lugar.',
    ],
    saludo: 'El fuego de la fragua ya está vivo.', despedida: 'Cuidá el filo, que no es eterno.',
    resumen: 'Forja lo que te falte (el hacha, la tijera) con cantos rodados y te afila el hacha: diez árboles con un hachazo menos, una vez por día.',
  },
  pescador: {
    nombre: 'Aurelio Nahuel', oficio: 'pescador de red', mano: 'cana', lote: 'pescaderia', afuera: true,
    colores: { ropa: '#56707e', abrigo: '#34505e', gorro: 'sombrero', pelo: '#2e2622', barba: '#7a746a' },
    llegada: [
      'Aurelio Nahuel. Pesco con red y con caña, lo que el lago quiera dar.',
      'Nicanor me escribió que acá el agua es generosa. Si me hacen un lugarcito junto a los otros locales, me quedo a probar.',
    ],
    saludo: 'El lago estuvo bueno hoy.', despedida: 'Que pique, vecino.',
    resumen: 'Te cambia dos truchas frescas por dos troncos de leña, una vez por día.',
  },
  maestra: {
    nombre: 'Delia Ferreyra', oficio: 'maestra', mano: 'planilla', lote: 'escuela',
    colores: { ropa: '#7c6a8a', abrigo: '#4e4260', gorro: null, pelo: '#5a4232', bufanda: '#c9b89a' },
    llegada: [
      'Buen día. Soy Delia Ferreyra, maestra rural. Me mandaron a abrir una escuela donde hubiera chicos, o donde fuera a haberlos.',
      'Un pueblo que empieza necesita alguien que anote lo que pasa. Vi la escuela a medio hacer: ¿me ayudás a terminarla?',
    ],
    saludo: 'Buen día. ¿Trajiste el cuaderno?', despedida: 'Seguí anotando, que de eso se aprende.',
    resumen: 'Lee tu cuaderno, te dice qué te falta anotar y te da mandados: cuatro de yerba por cada uno cumplido.',
  },
  enfermera: {
    nombre: 'Marta Williams', oficio: 'enfermera', mano: null, lote: 'puesto-sanitario',
    colores: { ropa: '#e2e0d8', abrigo: '#3e5a72', gorro: null, pelo: '#7a5a3a', bufanda: '#9ab0c0' },
    llegada: [
      'Buenas tardes. Soy Marta Williams, enfermera. Trabajé quince años en el hospital de Esquel y pedí el pase a un puesto rural.',
      'Donde se hacha leña y se camina con helada, alguien tiene que vendar tobillos y tomar la presión. Si me ayudan a levantar el puesto, me quedo.',
    ],
    saludo: 'Pasá. ¿Cómo andamos de salud?', despedida: 'Abrigate, que el frío entra por los pies.',
    resumen: 'Te revisa, te da un té de canelo y te deja descansado unas horas (y sin el entumecido), una vez por día.',
  },
  telegrafista: {
    nombre: 'Benigno Saavedra', oficio: 'telegrafista', mano: 'planilla', lote: 'estafeta',
    colores: { ropa: '#4a4a52', abrigo: '#2e2e36', gorro: 'gorro', pelo: '#1e1a18', barba: '#2e2622' },
    llegada: [
      'Benigno Saavedra, telegrafista del ferrocarril. Me mandaron con el aparato Morse, una caja de formularios y dos rollos de cable.',
      'Con una estafeta la aldea queda conectada: cartas, telegramas y el pronóstico que pasan de Bariloche. Hace falta un techo para el aparato, nada más.',
    ],
    saludo: 'Estafeta abierta. ¿Mandamos o recibimos?', despedida: 'Raya, punto, raya: hasta luego.',
    resumen: 'Te entrega las cartas que llegaron con el tren y despacha las fotos que te pidieron, igual que Ercilia en el almacén. Si no hay nada, te pasa el pronóstico.',
  },
  tejedora: {
    nombre: 'Elvira Ñancucheo', oficio: 'tejedora', mano: null, lote: 'hilanderia',
    colores: { ropa: '#8a4a3a', abrigo: '#5a3a4a', gorro: null, pelo: '#1e1a18', bufanda: '#d8b878', poncho: true },
    llegada: [
      'Elvira Ñancucheo, tejedora. Traigo el witral de mi abuela desarmado en el furgón: cuatro palos y un peine de caña.',
      'Con la lana de las ovejas de acá salen los mejores ponchos de la cordillera. Si levantamos la hilandería, no se desperdicia un vellón.',
    ],
    saludo: 'Mirá este punto: es el de mi abuela.', despedida: 'Que te abrigue lo que tejas.',
    resumen: 'En su witral te teje un poncho con dos vellones (en tu telar son tres) o, si no tenés manta, la manta con tres. Una vez por día.',
  },
  apicultor: {
    nombre: 'Guido Rossetti', oficio: 'apicultor', mano: null, lote: 'sala-miel', afuera: true,
    colores: { ropa: '#d8cfa8', abrigo: '#8a7a50', gorro: 'sombrero', pelo: '#5a4a3a', barba: '#8a7a6a' },
    llegada: [
      'Guido Rossetti, apicultor. Vengo de El Hoyo con seis cajones de abejas tapados con arpillera. Ninguna se escapó en el viaje, creo.',
      'Acá hay notro, maqui, chilco y rosa mosqueta: flores para todo el verano. Con una sala para la miel, las abejas hacen el resto.',
    ],
    saludo: 'Despacito, que las abejas están trabajando.', despedida: 'Si ves un enjambre colgado de una rama, avisame.',
    resumen: 'Necesita tablas para los marcos de las colmenas: por tres tablas te da dos frascos de miel, una vez por día.',
  },
  guardaparque: {
    nombre: 'Julia Antiñir', oficio: 'guardaparque', mano: 'planilla', lote: 'seccional', afuera: true,
    colores: { ropa: '#5a6a3a', abrigo: '#4a5630', gorro: 'sombrero', pelo: '#2a2220' },
    llegada: [
      'Julia Antiñir, guardaparque. Me asignaron esta seccional, que hasta ahora era un mástil y un cartel con la pintura saltada.',
      'Cuido el bosque y llevo el registro de la fauna, con Josefina, mi compañera, que recorre el valle. Si anotás lo que ves, nos vamos a llevar muy bien.',
    ],
    saludo: 'Buen día. ¿Algún avistaje para el registro?', despedida: 'Mirá dónde pisás, que el bosque es de todos.',
    resumen: 'Pasa al registro de la seccional la fauna y los rastros que anotaste: por cada uno nuevo, una de yerba (hasta cuatro por día). Si no hay nada nuevo, te dice qué buscar.',
  },
  musico: {
    nombre: 'Cholo Barrientos', oficio: 'músico', mano: null, lote: 'salon',
    colores: { ropa: '#6a2e2e', abrigo: '#3a2a2a', gorro: 'boina', pelo: '#1e1a18', barba: '#3a2e28', bufanda: '#d8c8a0' },
    llegada: [
      'Me dicen Cholo, Cholo Barrientos. Toco la verdulera y la guitarra; el pasaje del tren lo pagué con dos chamamés.',
      'Un pueblo sin baile se duerme temprano. Denme un salón y los sábados a la tarde nadie se queda en la casa.',
    ],
    saludo: 'Pasá, que estoy afinando.', despedida: 'El sábado a la tarde, en la plaza. No faltes.',
    resumen: 'Una vez por semana te enseña una melodía del valle que te falte, para el tocadiscos del refugio. Los sábados a la tarde toca en la plaza.',
  },
  // ---------------------------------------------------------------- 3.7.0: las pobladoras nuevas
  // Ocho que llegan intercaladas con los once de la 3.6 (ver ORDEN_POBLADORES_ALDEA), cada una con su local
  // en la calle de la Loma y con el objeto que baja del tren (`objeto`, para la escena de llegada), y Pocha,
  // la modista, viuda y charlatana, que forma pareja con Anselmo, el herrero (el romance es de la 3.7.1:
  // `pareja` y `romance: false` lo dejan dicho: nunca es candidata del jugador). `edad`, en años. Ninguna
  // vende ni cobra: cada una da lo suyo una vez por día, con lo que ya existe en el valle.
  veterinaria: {
    nombre: 'Ayelén Catriel', oficio: 'veterinaria', edad: 29, mano: null, lote: 'veterinaria', afuera: true,
    objeto: 'un maletín de cuero gastado, con el estetoscopio colgando del asa',
    colores: { ropa: '#6b7a58', abrigo: '#3e4a36', gorro: null, pelo: '#1e1a18', bufanda: '#c8a878' },
    llegada: [
      'Hola. Soy Ayelén Catriel, veterinaria rural. Vengo de Junín de los Andes, de atender ovejas, caballos y algún que otro perro mordido por un zorro.',
      'Me contaron que acá hay majada, un zaino que presta Don Ramón y gallinas en cada patio. Donde hay animales, alguien tiene que mirarles los dientes.',
    ],
    saludo: 'Hola. ¿Algún animal que ande raro?', despedida: 'Y si el perro come pasto, no es nada: se está purgando.',
    resumen: 'Ayuda con tus animales una vez por día: le revisa las herraduras al zaino (anda más liviano hasta la noche), carda la lana que quedó en la majada o vitamina tus gallinas.',
  },
  fotografa: {
    nombre: 'Sofía Haddad', oficio: 'fotógrafa', edad: 31, mano: null, lote: 'estudio-fotos', afuera: true,
    objeto: 'una cámara de fuelle de su abuelo, en un estuche de madera con herrajes de bronce',
    colores: { ropa: '#7a3e48', abrigo: '#2e2a30', gorro: 'boina', pelo: '#2a1e1a', bufanda: '#d8c8a8' },
    llegada: [
      'Sofía Haddad, fotógrafa. Me vine de Buenos Aires con la cámara de mi abuelo, que sacó fotos de casamientos en Bahía Blanca durante cuarenta años.',
      'Allá todo el mundo tiene una cámara en el bolsillo y nadie mira. Acá la luz cambia cada diez minutos. Si me dejan un cuarto oscuro, me quedo.',
    ],
    saludo: '¡No te muevas! Ah, no, perdón, la costumbre. Hola.', despedida: 'Y mirá la luz de las cinco, que es la mejor.',
    resumen: 'Te mejora la cámara (un lente que se acerca más) y, una vez por día, mira tu álbum y te dice qué foto te falta y cómo sacarla. Las fotos las sigue despachando Benigno.',
  },
  andinista: {
    nombre: 'Rocío Lagos', oficio: 'guía de montaña', edad: 33, mano: null, lote: 'refugio-andinista', afuera: true,
    objeto: 'una mochila más alta que ella, con un piolet atado y una cuerda roja enrollada',
    colores: { ropa: '#b0502e', abrigo: '#3a4a5e', gorro: 'gorro', pelo: '#6a4228', bufanda: '#e0c060' },
    llegada: [
      '¡Buenas! Rocío Lagos, guía de montaña. Diez años subiendo gente al Tronador y al Lanín, y nunca dejé a nadie arriba. Bueno, una vez a un sombrero.',
      'Este valle tiene filos y lagunas que no salen en ningún mapa. Si me dan un refugio para las cuerdas y los mapas, les enseño cada rincón.',
    ],
    saludo: '¡Hola! ¿Hoy a dónde subimos?', despedida: 'Agua, abrigo y avisar a dónde vas. Siempre.',
    resumen: 'Una vez por día te cuenta cómo llegar a un lugar del valle que todavía no conocés y te lo marca en el mapa.',
  },
  herbolaria: {
    nombre: 'Inés Ancalao', oficio: 'herbolaria', edad: 35, mano: 'mate', lote: 'herboristeria', afuera: true,
    objeto: 'un canasto de mimbre lleno de frasquitos rotulados a mano y atados con lana',
    colores: { ropa: '#5e6a4a', abrigo: '#4a3e34', gorro: null, pelo: '#1a1614', bufanda: '#b8786a', poncho: true },
    llegada: [
      'Inés Ancalao. Conozco los yuyos del monte desde chica: mi abuela me llevaba a juntar canelo y matico antes de que saliera el sol.',
      'Acá crecen el calafate, la frutilla del bosque y el maqui casi en la puerta. Con una herboristería, nada de eso se pierde y nadie se queda sin remedio.',
    ],
    saludo: 'Buenas. Pasá, que hay olor a poleo.', despedida: 'Lo que juntes del monte, juntalo con permiso y dejá para otros.',
    resumen: 'Una vez por día te cambia un poco de yerba por un puñado de frutos del monte y te da pistas de las plantas que te faltan en el cuaderno (las de los animales las da Julia).',
  },
  pintora: {
    nombre: 'Abril Moretti', oficio: 'pintora', edad: 27, mano: null, lote: 'taller-arte', afuera: true,
    objeto: 'un caballete plegable atado con un cinturón y una caja de óleos manchada de todos los colores',
    colores: { ropa: '#3e6a8a', abrigo: '#c8a050', gorro: null, pelo: '#8a4a2a', bufanda: '#c84a4a' },
    llegada: [
      'Hola… Abril Moretti, pintora. Perdón, me quedé mirando el cerro: tiene un violeta que no existe en ningún tubo de pintura.',
      'Vine a pintar la cordillera un verano y ya van tres. Si me dejan un taller con buena ventana, le pinto los carteles a todo el pueblo.',
    ],
    saludo: 'Hola. Quedate quieto ahí, que te da la luz justo.', despedida: 'Chau. Fijate en las sombras: nunca son negras.',
    resumen: 'Por una tabla para el bastidor, una vez por día, le pinta un dibujito de tu parte a un vecino con el que todavía no tenés mucha confianza (le suma amistad).',
  },
  ceramista: {
    nombre: 'Malena Jones', oficio: 'ceramista', edad: 30, mano: null, lote: 'ceramica', afuera: true,
    objeto: 'una bolsa de arpillera con arcilla de Gaiman y el torno desarmado en un cajón',
    colores: { ropa: '#9a6248', abrigo: '#5a4a3e', gorro: null, pelo: '#7a4a2e', bufanda: '#d8c8b0' },
    llegada: [
      '¡Hola! Malena Jones, ceramista, y prima de Mario, que seguro no te contó que tiene una prima. Vengo de Gaiman con arcilla en la valija en vez de ropa.',
      'El barro del arroyo de acá es colorado y fino: con eso se hacen ollas, macetas y jarros que duran cien años. Si me ayudan con el taller y el horno, me quedo cerca de la familia.',
    ],
    saludo: '¡Hola! Perdón que no te doy la mano: barro.', despedida: 'Volvé, que el horno siempre tiene algo adentro.',
    resumen: 'Por cuatro piedras te hace macetas de barro para el vivero (dos por vez, hasta cuatro más). Después te muestra el horno y te cuenta del barro.',
  },
  botera: {
    nombre: 'Martina Roldán', oficio: 'la del varadero', edad: 28, mano: null, lote: 'varadero', afuera: true,
    objeto: 'un remo partido al medio, atado con alambre, y una lata de brea',
    colores: { ropa: '#2e4a5e', abrigo: '#c88a2e', gorro: 'gorro', pelo: '#3a2a1e', bufanda: '#e8e0d0' },
    llegada: [
      'Martina Roldán. Arreglo botes. Mi viejo tenía un varadero en Puerto Madryn y yo me crié entre virutas y brea.',
      'Vi que en el lago hay un muelle y un velero que pide mano. Si me levantan un varadero, de día estoy en el muelle con Nicanor y de noche duermo acá, en la loma.',
    ],
    saludo: 'Buenas. ¿El kayak sigue entero?', despedida: 'Al agua siempre con el viento de cara.',
    resumen: 'Por una tabla te calafatea el kayak: hasta la noche remás más rápido. De día trabaja en el muelle del lago; a la tardecita, en el varadero.',
  },
  astronoma: {
    nombre: 'Valentina Ruiz Díaz', oficio: 'astrónoma', edad: 32, mano: null, lote: 'observatorio',
    objeto: 'un telescopio en un cajón largo de madera, cargado como si fuera un bebé',
    colores: { ropa: '#2e3450', abrigo: '#1e2234', gorro: 'gorro', pelo: '#1e1a18', bufanda: '#8a7ab0' },
    llegada: [
      'Buenas noches… digo, buenas tardes. Valentina Ruiz Díaz, astrónoma. Trabajé en el observatorio de Bosque Alegre, en Córdoba, hasta que las luces de la ciudad me taparon las estrellas.',
      'Acá de noche no hay una sola luz en kilómetros. Si me ayudan a levantar un observatorio en la loma, les muestro el cielo como nunca lo vieron.',
    ],
    saludo: 'Hola. Perdón la cara: anoche hubo cielo limpio.', despedida: 'Mirá para arriba antes de dormir.',
    resumen: 'De noche, en el observatorio, una vez por día te muestra por el telescopio algo del cielo que todavía no anotaste. De día duerme hasta la siesta.',
  },
  modista: {
    nombre: 'Pocha Benítez', oficio: 'modista', edad: 58, mano: 'mate', lote: 'costureria', pareja: 'herrero', romance: false,
    objeto: 'una máquina de coser a pedal, con el mueble y todo, que bajaron entre tres del furgón',
    colores: { ropa: '#8a3a5a', abrigo: '#4a3040', gorro: null, pelo: '#a8a098', bufanda: '#e0b8c8' },
    llegada: [
      '¡Ay, qué viaje! Pocha Benítez, modista. Viuda, pero alegre, que el finado no hubiera querido otra cosa. Cosí para medio Corrientes y para la otra mitad de Esquel.',
      'Me dijeron que acá hay una tejedora, un herrero soltero y ninguna costurera. Lo del herrero lo digo por decir, eh. Si me arman una costurería, les arreglo la ropa a todos.',
    ],
    saludo: '¡Pasá, pasá! ¿Te enteraste de lo último?', despedida: 'Y no le cuentes a nadie lo que te conté, eh.',
    resumen: 'Te arregla la ropa y, de paso, una vez por día te cuenta qué le gusta a algún vecino (queda en el cuaderno, en «Tus vecinos»).',
  },
};
// 3.7.0: los once de la 3.6 y las nueve de la 3.7, por separado (para la migración, las pruebas y el orden de
// siempre de los índices: ver ORDEN_PERSONAS_ALDEA)
export const POBLADORES_36 = ['carpintero', 'panadera', 'herrero', 'pescador', 'maestra', 'enfermera', 'telegrafista', 'tejedora', 'apicultor', 'guardaparque', 'musico'];
export const POBLADORAS_37 = ['veterinaria', 'herbolaria', 'modista', 'botera', 'pintora', 'andinista', 'fotografa', 'ceramista', 'astronoma'];
// El orden en que llegan. 3.7.0: intercalados, uno de la 3.6 y una de la 3.7 (el carpintero primero, como
// siempre: sin tablas no hay obra; Pocha justo después de Anselmo; la fotógrafa después de Benigno, que le
// despacha las fotos; la astrónoma casi al final, arriba de la loma). Una partida vieja intercala desde
// donde está (ver `quienLlega`).
export const ORDEN_POBLADORES_ALDEA = ['carpintero', 'veterinaria', 'panadera', 'herbolaria', 'herrero', 'modista', 'pescador', 'botera', 'maestra', 'pintora',
  'enfermera', 'andinista', 'telegrafista', 'fotografa', 'tejedora', 'ceramista', 'apicultor', 'astronoma', 'guardaparque', 'musico'];
export const esPobladorAldea = (clave) => typeof clave === 'string' && Object.hasOwn(POBLADORES_ALDEA, clave);
export const esPobladora37 = (clave) => POBLADORAS_37.includes(clave);
// (3.7.0: los índices de siempre para los de la 3.6, que deciden su banco de la plaza o su lado de la obra, y
// las nuevas al final: el orden de llegada intercalado no los mueve)
export const ORDEN_PERSONAS_ALDEA = [...ORDEN_VECINOS_ALDEA, 'ercilia', ...POBLADORES_36, ...POBLADORAS_37];
export const esPersonaAldea = (clave) => esVecinoAldea(clave) || esPobladorAldea(clave);
export const personaAldea = (clave) => (esVecinoAldea(clave) ? vecinoDe(clave) : esPobladorAldea(clave) ? POBLADORES_ALDEA[clave] : null);

// ---------------------------------------------------------------- 3.7.0: el año, los cumpleaños y los chicos
// El año del juego es el de las estaciones de main.js (`DIAS_ANIO`): doce días, cuatro de verano, cuatro
// de otoño y cuatro de invierno (el calendario completo está en aldea-vida.js). Cada vecino cumple años un
// día del año (1 a 12): están repartidos, dos o tres por día, y el que cumple festeja a la tardecita.
export const DIAS_ANIO = 12;
export const diaDelAnio = (dia) => ((Math.max(1, Math.floor(num(dia) || 1)) - 1) % DIAS_ANIO) + 1;
export const CUMPLES_ALDEA = {
  jefe: 1, apicultor: 1, carpintero: 2, andinista: 2, madre: 3, maestra: 3, modista: 3, nene: 4, veterinaria: 4, guarda: 4,
  nelida: 5, guardaparque: 5, pintora: 5, ercilia: 6, pescador: 6, nicanor: 6, padre: 7, telegrafista: 7, ceramista: 7,
  nena: 8, fotografa: 8, ema: 8, panadera: 9, musico: 9, botera: 9, abuela: 10, enfermera: 10, herrero: 11, herbolaria: 11, ramon: 11,
  galesa: 12, tejedora: 12, astronoma: 12,
};
export const cumpleDe = (clave) => (typeof clave === 'string' && Object.hasOwn(CUMPLES_ALDEA, clave) ? CUMPLES_ALDEA[clave] : null);
export const esCumpleanos = (clave, dia) => cumpleDe(clave) !== null && cumpleDe(clave) === diaDelAnio(dia);
// La fiesta de cumpleaños de hoy, si hay: los que cumplen (de los que viven en la aldea) y dónde festejan.
// Uno solo festeja en su casa (los chicos, en la de los Jones, con la familia); si cumplen dos o más el mismo
// día, festejan juntos en la plaza. Los amigos van solos, en su tiempo libre (vecindad.js los manda de
// visita al que cumple). De 18 a 20 (ver `rutinaAldea`; con lluvia o nieve, la de la plaza pasa a la casa de cada
// uno: ver `aCubierto` en aldea-gente.js). Con un año de doce días, casi todos los días
// cumple alguien: por eso la fiesta es chica y no se lleva a toda la aldea.
// 3.7.0 (integración), decisión del usuario: sólo se FESTEJAN los cumpleaños de los más cercanos (tus amigos y
// compadres de la vecindad, `aldea.cercanos`, que aldea-gente.js renueva cada día; en la 3.7.1, también tu
// pareja y tus hijos) y los 90 de la abuela Herminia, en la plaza, con toda la aldea. Los demás cumplen sin
// fiesta: te enterás por una nota (`avisoDelDia` de aldea-vida.js) o en la charla (te lo dice al saludarte);
// cuando haya radio y diario (3.7.3), por ahí.
export const HORA_FIESTA = [18, 20];
// (el día desde el que se cuenta la vida de la aldea: el de los chicos, que en una partida nueva es el 1)
const inicioAldea = (a) => (objeto(a?.chicos?.nene) ? diaValido(a.chicos.nene.desde, 1) : 1);
// Los 90 de la abuela: su primer cumpleaños después de un año entero de partida (cumple 89 cuando llegás).
export const EDAD_ABUELA = 89;
export const noventaDeLaAbuela = (aldea, dia) => esCumpleanos('abuela', dia) && crecimientos('abuela', inicioAldea(aldea || {}), dia) === 1;
export const esCercano = (aldea, clave) => Array.isArray(aldea?.cercanos) && aldea.cercanos.includes(clave);
export const festejaCumple = (aldea, clave, dia) => esCercano(aldea, clave) || (clave === 'abuela' && noventaDeLaAbuela(aldea, dia));
export function fiestaDeCumple(dia, aldea) {
  const a = aldea || aldeaNueva();
  const claves = ORDEN_PERSONAS_ALDEA.filter((k) => esCumpleanos(k, dia) && (esVecinoAldea(k) || (a.pobladores || []).some((p) => p.clave === k && localAbierto(a, LOTE_DE[k]))) && !chicoAfuera(a, k) && festejaCumple(a, k, dia));
  if (!claves.length) return null;
  // (los 90 de la abuela: en la plaza, con toda la aldea)
  if (claves.includes('abuela') && noventaDeLaAbuela(a, dia)) return { claves, donde: 'plaza', edificio: 'plaza', noventa: true };
  if (claves.length > 1) return { claves, donde: 'plaza', edificio: 'plaza' };
  const k = claves[0];
  const edificio = Object.hasOwn(VECINOS_ALDEA, k) ? VECINOS_ALDEA[k].casa : k === 'ercilia' ? VECINOS_DEL_VALLE.ercilia.casa : LOTE_DE[k];
  return { claves, donde: 'casa', edificio };
}

// Los chicos crecen una etapa por año, el día de su cumpleaños (el primero que cae a un año entero de que
// se empezó a contar: en una partida nueva, desde el día 1; en una de la 3.6, desde el día en que se cargó).
// De jóvenes toman el oficio del poblador con el que más tiempo pasaron (`junto`, que suma cada día lo que
// le gusta a cada uno de los locales abiertos) o, si no hubo ninguno, se van a estudiar a la ciudad unos
// días y vuelven con algo nuevo. Nunca entran en el romance (ver `sinRomance`).
export const ETAPAS_CHICOS = ['bebe', 'chico', 'adolescente', 'joven'];
export const CHICOS_ALDEA = ['nene', 'nena'];
export const ETAPA_INICIAL = { nene: 1, nena: 1 };
const AFINIDAD = {
  nene: { pescador: 2, guardaparque: 2, andinista: 2, carpintero: 1, herrero: 1, botera: 1, astronoma: 1 },
  nena: { maestra: 2, pintora: 2, veterinaria: 2, tejedora: 1, fotografa: 1, enfermera: 1, herbolaria: 1, apicultor: 1 },
};
export const ESTUDIO = { dias: 4, umbral: 24 };
// Lo que estudia cada uno si se va, y dónde trabaja al volver
export const CARRERAS = {
  nene: { id: 'maquinista', oficio: 'maquinista de la trochita', edificio: 'estacion-aldea', punto: 'anden',
    vuelve: 'Volví de Jacobacci con el título de maquinista. El primer tren que maneje va a parar acá, aunque no tenga que parar.' },
  nena: { id: 'bibliotecaria', oficio: 'bibliotecaria', edificio: 'biblioteca', punto: 'adentro',
    vuelve: 'Volví de Esquel recibida de bibliotecaria. La abuela me dio la llave de la biblioteca como si fuera un tesoro.' },
};
// Cómo es cada uno en cada etapa: la talla (como dato: el dibujo es de gente.js), la ropa, lo que dice.
export const ETAPAS_DE = {
  nene: {
    adolescente: { talla: 0.84, oficio: 'adolescente de la aldea', colores: { ropa: '#3f5a7a', abrigo: '#2a3a4e', gorro: 'gorro', pelo: '#2a2220' },
      saludo: 'Hola. ¿Viste que ya llego a la cumbrera del galpón?', despedida: 'Nos vemos.',
      charla: ['Mi vieja dice que crecí como el álamo del patio: de golpe y torcido.', 'Ya no busco duendes. Bueno, a veces. Cuando no me ve nadie.'] },
    joven: { talla: 0.98, oficio: 'joven de la aldea', colores: { ropa: '#4a4a52', abrigo: '#2a2e36', gorro: 'boina', pelo: '#2a2220', barba: '#3a2e26' },
      saludo: 'Buenas, vecino. ¿Cómo anda el refugio?', despedida: 'Cuidate, eh.',
      charla: ['Todavía me acuerdo cuando te preguntaba si habías visto el duende de la plaza.', 'De grande uno entiende por qué la abuela cuenta la leyenda: para que la aldea no se olvide de dónde viene.'] },
  },
  nena: {
    adolescente: { talla: 0.82, oficio: 'adolescente de la aldea', colores: { ropa: '#8a4a3e', abrigo: '#5a2e2a', gorro: null, pelo: '#3a2a22', bufanda: '#e0c890' },
      saludo: 'Hola. Estoy leyendo uno de los libros grandes de la biblioteca.', despedida: 'Chau.',
      charla: ['Nahuel dice que leo demasiado. Yo digo que él lee demasiado poco.', 'Delia me presta los libros de los grandes. No le cuentes a mamá.'] },
    joven: { talla: 0.94, oficio: 'joven de la aldea', colores: { ropa: '#6a3a4a', abrigo: '#3a2a34', gorro: null, pelo: '#3a2a22', bufanda: '#d8c8a0' },
      saludo: 'Hola. ¡Qué grande está todo: la aldea, vos, yo!', despedida: 'Hasta luego.',
      charla: ['Cuando era chica te dije que ya sabía leer. Ahora sé leer el valle, que es más difícil.', 'La aldea creció conmigo. A veces no sé quién acompañó a quién.'] },
  },
};
export function chicosNuevos(dia = 1) {
  const desde = diaValido(dia, 1);
  return Object.fromEntries(CHICOS_ALDEA.map((k) => [k, { desde, etapa: ETAPA_INICIAL[k], junto: {}, oficio: null, estudia: 0, carrera: null, afuera: false, dia: 0 }]));
}
function sanearChicos(v, hoy, tope) {
  const base = chicosNuevos(hoy);
  if (!objeto(v)) return base;
  for (const k of CHICOS_ALDEA) {
    const x = objeto(v[k]) ? v[k] : null;
    if (!x) continue;
    const c = base[k];
    c.desde = Math.min(tope, diaValido(x.desde, hoy));
    c.etapa = Math.max(ETAPA_INICIAL[k], Math.min(ETAPAS_CHICOS.length - 1, entero(x.etapa, ETAPA_INICIAL[k])));
    if (objeto(x.junto)) for (const p of [...POBLADORES_36, ...POBLADORAS_37]) if (Object.hasOwn(x.junto, p)) { const n = Math.max(0, Math.min(TOPE_DIA, entero(x.junto[p]))); if (n) c.junto[p] = n; }
    c.oficio = c.etapa >= 3 && esPobladorAldea(x.oficio) ? x.oficio : null;
    c.carrera = c.etapa >= 3 && !c.oficio && x.carrera === CARRERAS[k].id ? x.carrera : null;
    c.estudia = c.etapa >= 3 && !c.oficio ? Math.max(0, Math.min(tope + ESTUDIO.dias, entero(x.estudia))) : 0;
    // (un joven sin oficio ni estudio, de un guardado roto, se va a estudiar desde hoy)
    if (c.etapa >= 3 && !c.oficio && !c.estudia) c.estudia = Math.min(tope, hoy) + ESTUDIO.dias;
    c.afuera = !!c.estudia && !c.carrera;
    c.dia = Math.min(tope, Math.max(0, entero(x.dia)));
  }
  return base;
}
const chicoDe = (a, k) => (CHICOS_ALDEA.includes(k) && objeto(a?.chicos) && objeto(a.chicos[k]) ? a.chicos[k] : null);
export const etapaDeChico = (a, k) => chicoDe(a, k)?.etapa ?? (CHICOS_ALDEA.includes(k) ? ETAPA_INICIAL[k] : null);
export const chicoAfuera = (a, k) => !!chicoDe(a, k)?.afuera;
// Cuántas etapas creció desde que se empezó a contar, hasta `dia` (por los cumpleaños).
export function crecimientos(k, desde, dia) {
  const c = cumpleDe(k);
  if (c === null) return 0;
  const d0 = diaValido(desde, 1) + DIAS_ANIO;   // un año entero
  const primero = d0 + ((c - diaDelAnio(d0) + DIAS_ANIO) % DIAS_ANIO);
  const hoy = diaValido(dia, 1);
  if (hoy < primero) return 0;
  return Math.floor((hoy - primero) / DIAS_ANIO) + 1;
}
// Pasa el día para los chicos: crecen el día de su cumpleaños, suman el tiempo con cada poblador y, de
// jóvenes, eligen. Llamarla una vez por día (si se llama más, no cambia nada). Devuelve los eventos:
// { tipo: 'crecio', clave, etapa } · { tipo: 'aprendiz', clave, con } · { tipo: 'estudiar', clave, carrera }
// · { tipo: 'volvio', clave, carrera }.
export function pasarDiaChicos(aldea, dia) {
  const eventos = [];
  if (!aldea || typeof aldea !== 'object') return eventos;
  const hoy = diaValido(dia, 1);
  if (!objeto(aldea.chicos)) aldea.chicos = chicosNuevos(hoy);
  for (const k of CHICOS_ALDEA) {
    if (!objeto(aldea.chicos[k])) aldea.chicos[k] = chicosNuevos(hoy)[k];
    const c = aldea.chicos[k];
    if (c.dia >= hoy) continue;
    c.dia = hoy;
    // el tiempo con cada uno: lo que le gusta de los locales abiertos (de chico, la mitad)
    if (c.etapa <= 2) for (const [p, n] of Object.entries(AFINIDAD[k])) if (localAbierto(aldea, LOTE_DE[p])) c.junto[p] = Math.min(TOPE_DIA, (c.junto[p] || 0) + (c.etapa === 2 ? n : Math.max(1, n / 2)));
    const etapa = Math.min(ETAPAS_CHICOS.length - 1, ETAPA_INICIAL[k] + crecimientos(k, c.desde, hoy));
    if (etapa > c.etapa) {
      c.etapa = etapa;
      eventos.push({ tipo: 'crecio', clave: k, etapa: ETAPAS_CHICOS[etapa] });
      if (etapa === 3) {
        const [con, n] = Object.entries(c.junto).sort((x, y) => y[1] - x[1] || ORDEN_POBLADORES_ALDEA.indexOf(x[0]) - ORDEN_POBLADORES_ALDEA.indexOf(y[0]))[0] || [null, 0];
        if (con && n >= ESTUDIO.umbral && localAbierto(aldea, LOTE_DE[con])) { c.oficio = con; eventos.push({ tipo: 'aprendiz', clave: k, con }); }
        else { c.estudia = hoy + ESTUDIO.dias; c.afuera = true; eventos.push({ tipo: 'estudiar', clave: k, carrera: CARRERAS[k].id }); }
      }
    }
    if (c.estudia && !c.carrera && !c.oficio && hoy >= c.estudia) { c.carrera = CARRERAS[k].id; c.afuera = false; eventos.push({ tipo: 'volvio', clave: k, carrera: c.carrera }); }
  }
  return eventos;
}
// Cómo se ve y qué dice ahora (la etapa de ETAPAS_DE, o la de siempre de VECINOS_ALDEA).
function etapaVisible(a, k) {
  const e = etapaDeChico(a, k);
  return e !== null && e >= 2 ? ETAPAS_DE[k][ETAPAS_CHICOS[e]] : null;
}
export function tallaDe(clave, aldea) {
  const v = Object.hasOwn(VECINOS_ALDEA, clave) ? VECINOS_ALDEA[clave] : null;
  const e = v ? etapaVisible(aldea, clave) : null;
  return e ? e.talla : v?.talla;
}
export function coloresDe(clave, aldea) {
  const e = etapaVisible(aldea, clave);
  return e ? e.colores : personaAldea(clave)?.colores || null;
}
// Lo que dice al hablarle (y su oficio, el saludo y la despedida), según la etapa y lo que eligió.
export function dichosDe(clave, aldea) {
  const def = personaAldea(clave);
  if (!def) return null;
  const e = etapaVisible(aldea, clave);
  const c = chicoDe(aldea, clave);
  let oficio = e?.oficio || def.oficio;
  const charla = [...(e?.charla || def.charla || [])];
  if (c?.oficio && esPobladorAldea(c.oficio)) {
    const m = POBLADORES_ALDEA[c.oficio];
    oficio = `aprendiz de ${m.oficio}`;
    charla.unshift(`Aprendo el oficio con ${m.nombre.split(' ')[0]}. Me dice que tengo buena mano, pero que todavía me falta paciencia.`);
  } else if (c?.carrera) {
    oficio = CARRERAS[clave].oficio;
    charla.unshift(CARRERAS[clave].vuelve);
  }
  return { oficio, saludo: e?.saludo || def.saludo, despedida: e?.despedida || def.despedida, charla };
}
// 3.7.0: con quién no hay romance nunca (lo usa la 3.7.1): los chicos, en cualquier etapa, los Jones (que
// están casados) y Pocha (`romance: false`: forma pareja con Anselmo, que tampoco).
const SIN_ROMANCE = new Set(['nene', 'nena', 'padre', 'madre']);
export const sinRomance = (clave) => !esPersonaAldea(clave) || SIN_ROMANCE.has(clave) || POBLADORES_ALDEA[clave]?.romance === false || clave === POBLADORES_ALDEA.modista.pareja;

// ---------------------------------------------------------------- estado y saneo
// La llegada: días entre la apertura de un local y el próximo que baja del tren, y cuánto
// tiene que estar anotado el valle (cada poblador pide un poco más). Era el ritmo de la 3.1 (el
// undécimo pedía 12 + 6 × 10 = 72 anotaciones y los once tardaban unos 66 días). 3.7.0: con veinte, el
// ritmo es otro: un día entre una apertura y el próximo tren, y cuatro anotaciones más por cada uno: la
// vigésima pide 10 + 4 × 19 = 86 de las 207 del cuaderno (la prueba lo cuenta y simula la partida entera:
// los veinte en unos 100 días; cada obra sigue llevando por lo menos cuatro).
export const LLEGADA = { entreDias: 1, anotaciones: 10, porPoblador: 4 };
// La obra: con la etapa completa, los vecinos trabajan y queda lista a las 7 de la mañana del
// día siguiente (si se completa a las 23, igual: los vecinos trabajan de noche con el farol;
// 3.6.1: y si se completa de madrugada, antes de las 7, queda lista esa misma mañana).
// La escuela arranca a medio hacer: cimientos y estructura ya están.
export const OBRA = { horaLista: 7, etapaInicial: { escuela: 2 } };
export const ETAPAS_OBRA = [
  { id: 'cimientos', nombre: 'Cimientos', pide: { piedra: 10, tronco: 4 }, dice: 'Se nivela el lote y se asientan las soleras sobre piedra, para que la madera no toque la tierra.' },
  { id: 'estructura', nombre: 'Estructura', pide: { tronco: 12, tabla: 4 }, dice: 'Postes, vigas y cumbrera: el esqueleto del local, apuntalado hasta que se clave todo.' },
  { id: 'paredes-techo', nombre: 'Paredes y techo', pide: { tabla: 18, tronco: 4 }, dice: 'Se entablona, se clava la chapa con el viento a favor y ya no llueve adentro.' },
  { id: 'terminaciones', nombre: 'Terminaciones', pide: { tabla: 8, piedra: 4 }, dice: 'Puertas, ventanas, la chimenea, el zócalo de laja y el cartelito pintado a mano.' },
];
// Lo que pide de más algún oficio: la fragua de piedra de la herrería y el horno de barro y
// piedra de la panadería.
const EXTRA_OBRA = { herreria: { 0: { piedra: 4 } }, panaderia: { 3: { piedra: 4 } } };
// Cuánto pide la etapa `i` del lote: las cantidades de arriba son para un local de unos 42 m²;
// uno más chico pide menos y el salón, más (de 0,75 a 1,5 veces).
export function pideEtapa(lote, i) {
  const etapa = ETAPAS_OBRA[i];
  if (!esLote(lote) || !etapa) return {};
  const e = EDIFICIOS_ALDEA[lote];
  const escala = Math.max(0.75, Math.min(1.5, Math.round((e.ancho * e.fondo) / 42 * 20) / 20));
  const pide = {};
  for (const [k, n] of Object.entries(etapa.pide)) pide[k] = Math.max(1, Math.round(n * escala));
  for (const [k, n] of Object.entries(EXTRA_OBRA[lote]?.[i] || {})) pide[k] = (pide[k] || 0) + n;
  return pide;
}
const etapaInicial = (lote) => (Object.hasOwn(OBRA.etapaInicial, lote) ? OBRA.etapaInicial[lote] : 0);

// Lo que ofrece cada uno, por día (los de la 3.1, tal cual, y los nuevos).
export const SERVICIO = {
  troncosPorDia: 6, tablasPorTronco: 5, yerbaPorPan: 2, panes: 3, troncosPorTruchas: 2, truchas: 2, filo: 10, yerbaMandado: 4, cantosHacha: 3, cantosTijera: 2,
  descanso: 3, lanaPoncho: 2, lanaManta: 3, tablasMiel: 3, miel: 2, yerbaPorAvistaje: 1, avistajesPorDia: 4, diasPartitura: 7,
  // 3.7.0: las de la calle de la Loma
  huevosVet: 2, lanaVet: 1, fotosLente: 3, yerbaPorFrutos: 1, frutos: 3, tablaBastidor: 1, amistadDibujo: 8,
  piedrasMacetas: 4, macetasPorVez: 2, macetasMax: 4, tablaKayak: 1,
};

const TOPE_DIA = 1e6;
const entero = (v, d = 0) => (Number.isFinite(num(v)) ? Math.floor(num(v)) : d);
const diaValido = (v, d = 1) => Math.max(1, Math.min(TOPE_DIA, entero(v, d)));
const objeto = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const IDS_ENTRADAS = new Set(ENTRADAS.map((e) => e.id));

export function aldeaNueva() {
  return {
    pobladores: [], llegando: null, ultimaLlegada: 0, ultimaApertura: 0, llamado: false,
    obras: {}, locales: {},
    usos: {}, afilado: 0, mandado: null, mandados: 0, fauna: 0, partitura: 0, descubierta: 0,
    // 3.7.0: el kayak calafateado y el zaino herrado (el día: dura hasta la noche) y los chicos que crecen
    calafateado: 0, herrado: 0, chicos: chicosNuevos(1),
    cercanos: [],   // 3.7.0 (integración): tus amigos y compadres de la aldea (sólo sus cumpleaños se festejan)
  };
}
function sanearObra(lote, o, hoy = TOPE_DIA) {
  const x = objeto(o) ? o : {};
  const etapa = Math.max(etapaInicial(lote), Math.min(ETAPAS_OBRA.length - 1, entero(x.etapa, etapaInicial(lote))));
  const pide = pideEtapa(lote, etapa);
  const aportado = {};
  if (objeto(x.aportado)) for (const k of Object.keys(pide)) if (Object.hasOwn(x.aportado, k)) {
    const n = Math.max(0, Math.min(pide[k], entero(x.aportado[k])));
    if (n > 0) aportado[k] = n;
  }
  const completa = Object.keys(pide).every((k) => (aportado[k] || 0) >= pide[k]);
  let lista = null;
  if (completa) {
    const d = objeto(x.lista) ? x.lista : null;
    // 3.6.1: como mucho, mañana (ver `sanearAldea`)
    lista = { dia: Math.min(hoy + 1, diaValido(d?.dia, 1)), hora: Math.max(0, Math.min(23.99, Number.isFinite(num(d?.hora)) ? num(d.hora) : OBRA.horaLista)) };
  }
  return { etapa, aportado, lista, desde: Math.min(hoy, diaValido(x.desde, 1)) };
}
// Todo saneado: un guardado retocado a mano o roto no deja la aldea en un estado imposible.
// 3.6.1: `hoy` (opcional): el día de la partida. Ninguna fecha de la aldea puede ser de después
// (la etapa lista, como mucho, mañana): con una fecha del futuro en un guardado roto, la obra
// quedaba con «los vecinos están trabajando» para siempre (la etapa lista el día 1.000.000) y no
// bajaba nadie más del tren (la última apertura en el futuro); el músico, lo mismo.
export function sanearAldea(v, hoy = null) {
  const x = objeto(v) ? v : {};
  const tope = Number.isFinite(num(hoy)) ? diaValido(hoy, 1) : TOPE_DIA;
  const diaHasta = (n, d = 1) => Math.min(tope, diaValido(n, d));
  const base = aldeaNueva();
  const vistos = new Set();
  const pobladores = [];
  for (const p of Array.isArray(x.pobladores) ? x.pobladores : []) {
    if (!objeto(p) || !esPobladorAldea(p.clave) || vistos.has(p.clave)) continue;
    vistos.add(p.clave);
    pobladores.push({ clave: p.clave, dia: diaHasta(p.dia, 1) });
  }
  const locales = {};
  if (objeto(x.locales)) for (const p of pobladores) {
    const lote = LOTE_DE[p.clave];
    if (Object.hasOwn(x.locales, lote) && Number.isFinite(num(x.locales[lote]))) locales[lote] = diaHasta(x.locales[lote], 1);
  }
  // cada poblador aceptado tiene su local abierto o su obra en curso
  const obras = {};
  for (const p of pobladores) {
    const lote = LOTE_DE[p.clave];
    if (Object.hasOwn(locales, lote)) continue;
    obras[lote] = sanearObra(lote, objeto(x.obras) && Object.hasOwn(x.obras, lote) ? x.obras[lote] : { desde: p.dia }, tope);
  }
  const llegando = objeto(x.llegando) && esPobladorAldea(x.llegando.clave) && !vistos.has(x.llegando.clave)
    ? { clave: x.llegando.clave, dia: diaHasta(x.llegando.dia, 1) } : null;
  const usos = {};
  // (un uso del futuro no es de hoy: se descarta, no se lo trae a hoy)
  if (objeto(x.usos)) for (const k of ORDEN_POBLADORES_ALDEA) if (Object.hasOwn(x.usos, k) && entero(x.usos[k]) > 0 && entero(x.usos[k]) <= tope) usos[k] = entero(x.usos[k]);
  const mandado = objeto(x.mandado) && typeof x.mandado.id === 'string' && IDS_ENTRADAS.has(x.mandado.id) ? { id: x.mandado.id, dia: diaHasta(x.mandado.dia, 1) } : null;
  const noNeg = (n, max = TOPE_DIA) => Math.max(0, Math.min(max, entero(n)));
  return {
    ...base,
    pobladores, llegando, obras, locales,
    ultimaLlegada: noNeg(x.ultimaLlegada, tope), ultimaApertura: noNeg(x.ultimaApertura, tope),
    llamado: x.llamado === true,
    usos,
    afilado: noNeg(x.afilado, SERVICIO.filo),
    mandado,
    mandados: noNeg(x.mandados),
    fauna: noNeg(x.fauna, ENTRADAS.length),
    partitura: noNeg(x.partitura, tope),
    descubierta: noNeg(x.descubierta, tope),
    // 3.7.0 (una partida de la 3.6 no los trae: los chicos empiezan a crecer desde hoy)
    calafateado: noNeg(x.calafateado, tope), herrado: noNeg(x.herrado, tope),
    chicos: sanearChicos(x.chicos, Number.isFinite(num(hoy)) ? diaValido(hoy, 1) : 1, tope),
    cercanos: Array.isArray(x.cercanos) ? [...new Set(x.cercanos.filter((k) => esPersonaAldea(k)))].slice(0, 60) : [],   // 3.7.0 (integración)
  };
}

// Una partida de la 3.1: los pobladores que ya tenías se mudan a la aldea con su local
// TERMINADO (abre el día de la migración); se descartan la casa tuya que tenían, el nombre
// del pueblo y el cartel (tus casas vuelven a ser tuyas). Se conservan el que estaba
// esperando en la estación (ahora espera en la de la aldea), el llamado de la historia, los
// servicios ya usados hoy, el filo del hacha y el mandado de la maestra.
export function migrarDesdePueblo(pueblo31, dia) {
  const p = objeto(pueblo31) ? pueblo31 : {};
  const hoy = diaValido(dia, 1);
  const pobladores = [], locales = {};
  for (const q of Array.isArray(p.pobladores) ? p.pobladores : []) {
    if (!objeto(q) || !esPobladorAldea(q.clave) || pobladores.some((o) => o.clave === q.clave)) continue;
    pobladores.push({ clave: q.clave, dia: diaValido(q.dia, hoy) });
    locales[LOTE_DE[q.clave]] = hoy;
  }
  return sanearAldea({
    pobladores, locales,
    llegando: p.llegando, ultimaLlegada: p.ultimaLlegada, ultimaApertura: pobladores.length ? entero(p.ultimaLlegada) : 0,
    llamado: p.llamado, usos: p.usos, afilado: p.afilado, mandado: p.mandado, mandados: p.mandados,
  }, hoy);   // 3.6.1: con el día de la partida (ninguna fecha del futuro)
}

// ---------------------------------------------------------------- avisos para otros módulos
const oyentes = new Set();
export function escucharAldea(fn) {
  if (typeof fn !== 'function') return () => {};
  oyentes.add(fn);
  return () => oyentes.delete(fn);
}
function avisar(tipo, datos) {
  for (const fn of [...oyentes]) { try { fn({ tipo, ...datos }); } catch { /* un oyente roto no frena a la aldea */ } }
}

// ---------------------------------------------------------------- la llegada
// 3.7.0: intercalados. El que sigue es el primero que falta de la otra tanda que la del último que llegó (de
// las de la 3.7 si el último fue de la 3.6, y al revés); si de esa tanda no queda nadie, el que falte. En una
// partida nueva sale el orden de ORDEN_POBLADORES_ALDEA; una partida de la 3.6 que ya tenía a varios sigue
// con las nuevas una por una entre los que le faltan.
export function quienLlega(aldea) {
  const a = aldea || aldeaNueva();
  const lista = Array.isArray(a.pobladores) ? a.pobladores : [];
  const ya = new Set(lista.map((x) => x.clave));
  const faltan = ORDEN_POBLADORES_ALDEA.filter((k) => !ya.has(k));
  if (!faltan.length) return null;
  const ultimo = lista.length ? lista[lista.length - 1].clave : null;
  if (!ultimo) return faltan[0];
  const otra = faltan.find((k) => esPobladora37(k) !== esPobladora37(ultimo));
  return otra || faltan[0];
}
export const anotacionesDe = (progreso) => Object.keys(progreso?.entradas || {}).length;
export const anotacionesPedidas = (aldea) => LLEGADA.anotaciones + LLEGADA.porPoblador * (aldea?.pobladores?.length || 0);
// La obra que se está levantando (una a la vez), o null.
export function obraEnCurso(aldea) {
  const lotes = Object.keys(aldea?.obras || {}).filter(esLote);
  return lotes[0] || null;
}
// ¿Puede llegar alguien hoy? Devuelve { ok, motivo, quien }.
export function puedeLlegar(progreso) {
  if (!progreso || typeof progreso !== 'object') return { ok: false, motivo: 'Sin partida', quien: null };
  if (progreso.modo === 'desafio') return { ok: false, motivo: 'En el Desafío la aldea no existe', quien: null };
  if (!vecinosActivos(progreso)) return { ok: false, motivo: 'En esta partida no hay vecinos', quien: null };
  const aldea = progreso.aldea || aldeaNueva();
  const quien = quienLlega(aldea);
  if (!quien) return { ok: false, motivo: 'Ya vinieron todos los que tenían que venir', quien: null };
  if (aldea.llegando) return { ok: false, motivo: 'Hay alguien esperando en la estación de la aldea', quien: aldea.llegando.clave };
  const obra = obraEnCurso(aldea);
  if (obra) return { ok: false, motivo: `Primero hay que terminar la obra de ${EDIFICIOS_ALDEA[obra].nombre.toLowerCase()}`, quien, obra };
  const dia = diaValido(progreso.dia, 1);
  if (!aldea.llamado && aldea.ultimaApertura && dia - aldea.ultimaApertura < LLEGADA.entreDias) return { ok: false, motivo: 'El próximo tren con gente viene en unos días', quien };
  const faltan = anotacionesPedidas(aldea) - anotacionesDe(progreso);
  // (3.6.1: «falta 1 anotación», no «faltan 1 anotaciones»)
  if (!aldea.llamado && faltan > 0) return { ok: false, motivo: `El valle todavía se conoce poco: ${faltan === 1 ? 'falta 1 anotación' : `faltan ${faltan} anotaciones`} en el cuaderno`, quien, faltan };
  return { ok: true, motivo: '', quien };
}
// La historia (o el evento del valle) llama al próximo: viene sin esperar días ni anotaciones
// (la obra anterior igual tiene que estar terminada). Reemplaza a `llamarPoblador` de la 3.1.
export function llamarProximo(aldea) {
  if (!aldea || typeof aldea !== 'object') return false;
  aldea.llamado = true;
  avisar('llamado', {});
  return true;
}
// Bajó del tren en la estación de la aldea y espera en el andén.
export function empezarLlegada(aldea, clave, dia) {
  if (!aldea || !esPobladorAldea(clave) || aldea.llegando || (aldea.pobladores || []).some((p) => p.clave === clave)) return null;
  aldea.llegando = { clave, dia: diaValido(dia, 1) };
  avisar('llego', { clave });
  return aldea.llegando;
}
// Aceptar al que espera: se marca su lote y se abre la obra. Devuelve { clave, lote, obra } o null.
export function aceptar(aldea, dia) {
  if (!aldea?.llegando || !esPobladorAldea(aldea.llegando.clave)) return null;
  const clave = aldea.llegando.clave, lote = LOTE_DE[clave], hoy = diaValido(dia, 1);
  aldea.pobladores = aldea.pobladores || [];
  aldea.obras = aldea.obras || {};
  aldea.pobladores.push({ clave, dia: hoy });
  aldea.obras[lote] = { etapa: etapaInicial(lote), aportado: {}, lista: null, desde: hoy };
  aldea.llegando = null;
  aldea.ultimaLlegada = hoy;
  aldea.llamado = false;
  avisar('aceptado', { clave, lote });
  return { clave, lote, obra: aldea.obras[lote] };
}

// ---------------------------------------------------------------- las obras del pueblo
const faltanDe = (pide, aportado) => {
  const f = {};
  for (const [k, n] of Object.entries(pide)) { const r = n - (aportado[k] || 0); if (r > 0) f[k] = r; }
  return f;
};
// El jugador aporta lo que tiene (con E): se toma lo que haga falta para la etapa, aunque no
// alcance para completarla. `disponibles`: { tronco, tabla, piedra… }. Devuelve
// { usados, faltan, completa }: `usados` es lo que hay que descontarle al jugador. Con la
// etapa completa, los vecinos trabajan y queda lista a las 7 del día siguiente (ver `OBRA`).
// `dia`: el de hoy (sin él se toma el 1 y la etapa queda lista en el próximo `avanzarObras`).
// 3.6.1: `hora`: la de ahora. Completada de madrugada (antes de las 7, cuando dormir no cambia
// el día: ver `dormir` en main.js), queda lista esa misma mañana: antes pedía el día siguiente
// y, después de dormir, la etapa seguía sin terminar un día entero aunque el aviso dijera
// «mañana a la mañana».
export function aportar(aldea, lote, disponibles, dia = 1, hora = 12) {
  const obra = aldea?.obras && Object.hasOwn(aldea.obras, lote) ? aldea.obras[lote] : null;
  if (!obra) return { usados: {}, faltan: {}, completa: false };
  const pide = pideEtapa(lote, obra.etapa);
  obra.aportado = obra.aportado || {};
  if (obra.lista) return { usados: {}, faltan: {}, completa: true };
  const usados = {};
  for (const [k, n] of Object.entries(pide)) {
    const usa = Math.max(0, Math.min(n - (obra.aportado[k] || 0), entero(disponibles?.[k])));
    if (usa > 0) { usados[k] = usa; obra.aportado[k] = (obra.aportado[k] || 0) + usa; }
  }
  const faltan = faltanDe(pide, obra.aportado);
  const completa = !Object.keys(faltan).length;
  if (Object.keys(usados).length) avisar('aporte', { lote, usados, faltan });
  if (completa) {
    const madrugada = Number.isFinite(num(hora)) && num(hora) >= 0 && num(hora) < OBRA.horaLista;
    obra.lista = { dia: diaValido(dia, 1) + (madrugada ? 0 : 1), hora: OBRA.horaLista };
    avisar('trabajando', { lote, etapa: obra.etapa, lista: obra.lista });
  }
  return { usados, faltan, completa };
}
// Pasa el tiempo: las etapas completas cuya hora llegó quedan hechas; con la última, abre el
// local y el poblador se muda. Devuelve los eventos ({ tipo: 'etapa'|'abierto', lote, … }).
export function avanzarObras(aldea, dia, hora = 12) {
  const eventos = [];
  if (!aldea?.obras) return eventos;
  const ahora = diaValido(dia, 1) * 24 + (Number.isFinite(num(hora)) ? num(hora) : 12);
  for (const lote of Object.keys(aldea.obras)) {
    const obra = aldea.obras[lote];
    if (!esLote(lote) || !obra?.lista) continue;
    if (ahora < obra.lista.dia * 24 + obra.lista.hora) continue;
    obra.etapa = (obra.etapa || 0) + 1;
    obra.aportado = {};
    obra.lista = null;
    const clave = pobladorDeLote(lote);
    if (obra.etapa >= ETAPAS_OBRA.length) {
      delete aldea.obras[lote];
      aldea.locales = aldea.locales || {};
      aldea.locales[lote] = diaValido(dia, 1);
      aldea.ultimaApertura = diaValido(dia, 1);
      eventos.push({ tipo: 'abierto', lote, clave });
      avisar('abierto', { lote, clave });
    } else {
      eventos.push({ tipo: 'etapa', lote, clave, etapa: obra.etapa });
      avisar('etapa', { lote, clave, etapa: obra.etapa });
    }
  }
  return eventos;
}
// ¿El local (o el edificio) está abierto? Los iniciales lo están siempre, salvo la escuela,
// que abre cuando la maestra termina su obra.
export function localAbierto(aldea, id) {
  if (!esEdificioAldea(id)) return false;
  if (esLote(id)) return !!aldea?.locales && Object.hasOwn(aldea.locales, id);
  return true;
}
// En qué anda cada edificio: 'abierto', 'obra' (levantándose), 'a-medio' (la escuela antes de
// la maestra) o 'lote' (el terreno marcado, todavía sin nadie).
export function estadoEdificio(aldea, id) {
  if (!esEdificioAldea(id)) return null;
  if (localAbierto(aldea, id)) return 'abierto';
  if (aldea?.obras && Object.hasOwn(aldea.obras, id)) return 'obra';
  return etapaInicial(id) > 0 ? 'a-medio' : 'lote';
}
// La etapa de un edificio: cuántas hay hechas (0 a 4), la que sigue, lo que pide, lo aportado
// y lo que falta, y si los vecinos ya están trabajando (`lista`: cuándo queda).
export function etapaDe(aldea, id) {
  const total = ETAPAS_OBRA.length;
  if (!esEdificioAldea(id)) return null;
  if (localAbierto(aldea, id)) return { hechas: total, total, estado: 'abierto', etapa: null, pide: {}, aportado: {}, faltan: {}, lista: null };
  const obra = aldea?.obras && Object.hasOwn(aldea.obras, id) ? aldea.obras[id] : null;
  const hechas = obra ? obra.etapa : etapaInicial(id);
  const pide = obra ? pideEtapa(id, hechas) : {};
  const aportado = obra ? { ...(obra.aportado || {}) } : {};
  return { hechas, total, estado: obra ? 'obra' : estadoEdificio(aldea, id), etapa: ETAPAS_OBRA[hechas] || null, pide, aportado, faltan: obra ? faltanDe(pide, aportado) : {}, lista: obra?.lista || null };
}

// ---------------------------------------------------------------- lo que ofrece cada uno
// Devuelve lo que dice y, si hay trato, los efectos que tiene aceptarlo:
//   { partes: [...], seguir?: texto del último renglón, efectos?: [...], titulo? }
// Efectos: { tipo: 'material'|'cosa'|'entrada', k, n } (se suma n), { tipo: 'cosa', k, fijar },
// { tipo: 'aldea', campo, valor }, { tipo: 'jugador', campo: 'descansado'|'entumecido', valor },
// { tipo: 'carta', k } (Ercilia: la carta pasa al cuaderno), { tipo: 'foto', k } (se despacha
// la foto pedida) y { tipo: 'partitura', k } (`anotarPartitura`). main.js/aldea-mundo.js los
// aplican. `extra.pronostico`: el texto del pronóstico de mañana, si el mundo lo sabe.
const cant = (progreso, tipo, k) => {
  if (tipo === 'material') return entero(progreso?.materiales?.[k]);
  if (tipo === 'cosa') return entero(progreso?.cosas?.[k]);
  return entero(progreso?.entradas?.[k]?.cantidad);
};
const yaHoy = (aldea, clave, dia) => !!aldea?.usos && Object.hasOwn(aldea.usos, clave) && aldea.usos[clave] === dia;
const DALE = 'E: dale · Escape: otro día';
// Las anotaciones que la maestra puede mandarte a buscar: lo que se ve y se encuentra.
const SECCIONES_MANDADO = ['flora', 'frutos', 'fauna', 'peces', 'lugares', 'cielo'];
export function pendientesDelCuaderno(entradas = {}, secciones = SECCIONES_MANDADO) {
  return ENTRADAS.filter((e) => secciones.includes(e.seccion) && !Object.hasOwn(entradas || {}, e.id));
}
// Lo que lleva el registro de la seccional: la fauna y los rastros.
const SECCIONES_REGISTRO = ['fauna', 'rastros'];
export const avistajesDe = (entradas = {}) => ENTRADAS.filter((e) => SECCIONES_REGISTRO.includes(e.seccion) && Object.hasOwn(entradas || {}, e.id)).length;

// 3.7.0: lo del cielo que se ve por el telescopio de Valentina (el rayo, la luna llena y la lluvia de
// estrellas no: ésos se anotan cuando pasan)
const CIELO_TELESCOPIO = ['cruz-del-sur', 'tres-marias', 'magallanes', 'escorpio'];
const minusc = (s) => (typeof s === 'string' && s ? s.charAt(0).toLowerCase() + s.slice(1) : '');
// 3.7.0: el vecino de la aldea con el que menos confianza tenés (para el dibujo de Abril): de los que viven
// en la aldea, el de menos puntos de amistad (lo que guarda vecindad.js), sin llegar a compadre.
function menosConfianza(progreso, aldea) {
  const fichas = objeto(progreso?.vecindad?.personas) ? progreso.vecindad.personas : {};
  const puntos = (k) => (Object.hasOwn(fichas, k) && Number.isFinite(num(fichas[k]?.p)) ? num(fichas[k].p) : 0);
  const lista = ORDEN_PERSONAS_ALDEA.filter((k) => k !== 'pintora' && (esVecinoAldea(k) || (aldea.pobladores || []).some((p) => p.clave === k && localAbierto(aldea, LOTE_DE[k]))) && puntos(k) < 140);
  if (!lista.length) return null;
  return lista.reduce((m, k) => (puntos(k) < puntos(m) ? k : m), lista[0]);
}
// 3.7.0: `extra`: { pronostico, hora (la del juego: la astrónoma, de noche), lugares (un Set con los lugares
// del cuaderno que tienen dónde en el mapa: la guía te los marca), fotoPendiente ({ nombre, pista }: la foto
// del álbum que falta, que la fotógrafa te cuenta), chisme ({ persona, quien, k, cosa, gusto }: lo que Pocha
// sabe de un vecino, de vecindad.js) }.
export function servicioDe(clave, progreso, dia, extra = {}) {
  const aldea = progreso?.aldea || aldeaNueva();
  const S = SERVICIO;
  if (!esPobladorAldea(clave)) return { partes: [] };
  const lote = LOTE_DE[clave];
  if (!(aldea.pobladores || []).some((p) => p.clave === clave)) return { partes: [] };
  if (!localAbierto(aldea, lote)) {
    const et = etapaDe(aldea, lote);
    return { partes: [`Primero levantemos ${EDIFICIOS_ALDEA[lote].nombre.toLowerCase()}. Van ${et.hechas} de ${et.total} etapas: ${et.lista ? 'los vecinos ya están trabajando en la que sigue.' : 'falta material para la que sigue.'}`] };
  }
  const uso = { tipo: 'aldea', campo: 'uso', valor: clave };
  switch (clave) {
    case 'carpintero': {
      if (yaHoy(aldea, clave, dia)) return { partes: ['Hoy ya aserré lo tuyo. La sierra también descansa: mañana traeme más.'] };
      const troncos = cant(progreso, 'material', 'tronco');
      if (!troncos) return { partes: [`Si me traés troncos, te los hago tablas: ${S.tablasPorTronco} por tronco. Hasta ${S.troncosPorDia} por día.`] };
      const n = Math.min(S.troncosPorDia, troncos);
      return {
        partes: [`Traés ${n === 1 ? 'un tronco' : `${n} troncos`}. Te los paso por la sierra: salen ${n * S.tablasPorTronco} tablas.`],
        seguir: DALE,
        efectos: [{ tipo: 'material', k: 'tronco', n: -n }, { tipo: 'material', k: 'tabla', n: n * S.tablasPorTronco }, uso],
        titulo: `${n * S.tablasPorTronco} tablas del carpintero`,
      };
    }
    case 'panadera': {
      if (yaHoy(aldea, clave, dia)) return { partes: ['La tanda de hoy ya salió. Mañana temprano hay más.'] };
      if (cant(progreso, 'cosa', 'yerba') < S.yerbaPorPan) return { partes: [`Por ${S.yerbaPorPan} de yerba te doy ${S.panes} panes. Yerba hay en el almacén de Ercilia.`] };
      return {
        partes: [`Te cambio ${S.panes} panes caseros por ${S.yerbaPorPan} de yerba. Están calentitos.`],
        seguir: DALE,
        efectos: [{ tipo: 'cosa', k: 'yerba', n: -S.yerbaPorPan }, { tipo: 'entrada', k: 'pan-casero', n: S.panes }, uso],
        titulo: `${S.panes} panes de la panadería`,
      };
    }
    case 'herrero': {
      const cantos = cant(progreso, 'entrada', 'canto');
      if (!cant(progreso, 'cosa', 'hacha')) {
        if (cantos < S.cantosHacha) return { partes: [`¿Sin hacha? Traeme ${S.cantosHacha} cantos rodados del río y te forjo una.`] };
        return { partes: [`Con ${S.cantosHacha} cantos rodados te forjo un hacha. Cabo de lenga, filo de acero.`], seguir: DALE,
          efectos: [{ tipo: 'entrada', k: 'canto', n: -S.cantosHacha }, { tipo: 'cosa', k: 'hacha', fijar: 1 }], titulo: 'El herrero te forjó un hacha' };
      }
      if (!cant(progreso, 'cosa', 'tijera') && cantos >= S.cantosTijera) {
        return { partes: [`Te veo sin tijera de esquilar. Con ${S.cantosTijera} cantos rodados te la forjo.`], seguir: DALE,
          efectos: [{ tipo: 'entrada', k: 'canto', n: -S.cantosTijera }, { tipo: 'cosa', k: 'tijera', fijar: 1 }], titulo: 'El herrero te forjó una tijera' };
      }
      if (yaHoy(aldea, clave, dia)) return { partes: ['El hacha ya te la afilé hoy. Mañana la vemos.'] };
      if (aldea.afilado >= S.filo) return { partes: ['Tu hacha todavía tiene el filo que le di. Usala y volvé.'] };
      return {
        partes: [`Dame esa hacha, que le paso la piedra. Los próximos ${S.filo} árboles caen con un hachazo menos.`],
        seguir: DALE,
        efectos: [{ tipo: 'aldea', campo: 'afilado', valor: S.filo }, uso],
        titulo: 'El herrero te afiló el hacha',
      };
    }
    case 'pescador': {
      if (yaHoy(aldea, clave, dia)) return { partes: ['Lo de hoy ya lo cambiamos. Mañana hay más.'] };
      if (cant(progreso, 'material', 'tronco') < S.troncosPorTruchas) return { partes: [`Por ${S.troncosPorTruchas} troncos de leña te doy ${S.truchas} truchas frescas. Para ahumar, o para el fuego.`] };
      return {
        partes: [`Te cambio ${S.truchas} truchas frescas por ${S.troncosPorTruchas} troncos. Salieron esta mañana.`],
        seguir: DALE,
        efectos: [{ tipo: 'material', k: 'tronco', n: -S.troncosPorTruchas }, { tipo: 'entrada', k: 'trucha-fresca', n: S.truchas }, uso],
        titulo: `${S.truchas} truchas del pescador`,
      };
    }
    case 'maestra': {
      const entradas = progreso?.entradas || {};
      const m = aldea.mandado;
      const E = m ? ENTRADAS.find((e) => e.id === m.id) : null;
      if (m && E && Object.hasOwn(entradas, m.id)) {
        return {
          partes: [`¡Anotaste ${E.nombre.toLowerCase()}! Así me gusta.`, `Tomá: ${S.yerbaMandado} de yerba, para el mate de la tarde.`],
          efectos: [{ tipo: 'cosa', k: 'yerba', n: S.yerbaMandado }, { tipo: 'aldea', campo: 'mandado', valor: null }, { tipo: 'aldea', campo: 'mandados', valor: 1 }],
          titulo: 'Mandado cumplido',
        };
      }
      if (m && E) return { partes: [`Todavía no anotaste ${E.nombre.toLowerCase()}.`, `Una pista: ${E.pista}`] };
      const pend = pendientesDelCuaderno(entradas);
      const total = Object.keys(entradas).length;
      if (!pend.length) return { partes: [`Llevás ${total} anotaciones. No te falta nada de lo que se ve en el valle: ya me enseñás vos a mí.`] };
      const e = pend[(aldea.mandados * 7) % pend.length];
      return {
        partes: [
          `A ver ese cuaderno… Llevás ${total} ${total === 1 ? 'anotación' : 'anotaciones'}. Bien.`,
          `Te falta, por ejemplo, ${e.nombre.toLowerCase()}. ${e.pista}`,
          'Cuando lo anotes, pasá a contarme: tengo algo para vos.',
        ],
        efectos: [{ tipo: 'aldea', campo: 'mandado', valor: { id: e.id, dia: diaValido(dia, 1) } }],
        titulo: `Mandado: ${e.nombre}`,
      };
    }
    case 'enfermera': {
      if (yaHoy(aldea, clave, dia)) return { partes: ['Por hoy ya te revisé. Dormí bien y comé caliente, que es la mitad del remedio.'] };
      return {
        partes: ['A ver… La presión bien, el pulso bien. Tomá este té de canelo con miel, despacito.', `Vas a andar descansado unas ${S.descanso} horas. Y si venías entumecido, se te pasa.`],
        seguir: DALE,
        efectos: [{ tipo: 'jugador', campo: 'descansado', valor: S.descanso }, { tipo: 'jugador', campo: 'entumecido', valor: 0 }, uso],
        titulo: 'La enfermera te dejó como nuevo',
      };
    }
    case 'telegrafista': {
      const correo = progreso?.correo || { llegadas: {}, fotos: {} };
      const carta = porRetirar(correo, progreso || {})[0];
      if (carta) {
        return {
          partes: [`Llegó carta para vos con el tren. Es de ${carta.de.charAt(0).toLowerCase()}${carta.de.slice(1)}. Te la sellé de recibida.`, ...carta.texto],
          efectos: [{ tipo: 'carta', k: carta.id }],
          titulo: 'Carta en la estafeta',
        };
      }
      const foto = porEnviar(correo)[0];
      if (foto) {
        return {
          partes: [`¿La foto para ${foto.de.charAt(0).toLowerCase()}${foto.de.slice(1)}? Dámela, que sale mañana en la saca del tren.`, foto.gracias].filter(Boolean),
          seguir: DALE,
          efectos: [{ tipo: 'foto', k: foto.id }],
          titulo: 'Foto despachada',
        };
      }
      const pron = typeof extra?.pronostico === 'string' && extra.pronostico ? extra.pronostico : 'que mañana sigue como hoy, más o menos';
      return { partes: ['No llegó nada para vos. Pero el telégrafo no para.', `De Bariloche pasan ${pron}.`] };
    }
    case 'tejedora': {
      if (yaHoy(aldea, clave, dia)) return { partes: ['El witral ya trabajó hoy. Mañana seguimos, que la lana no se apura.'] };
      const lana = cant(progreso, 'material', 'lana');
      if (!cant(progreso, 'cosa', 'manta') && lana >= S.lanaManta) {
        return { partes: [`¿Sin manta todavía? Con ${S.lanaManta} vellones te tejo una, de las que abrigan en cualquier lado.`], seguir: DALE,
          efectos: [{ tipo: 'material', k: 'lana', n: -S.lanaManta }, { tipo: 'cosa', k: 'manta', fijar: 1 }, uso], titulo: 'La tejedora te tejió una manta' };
      }
      if (lana < S.lanaPoncho) return { partes: [`Traeme ${S.lanaPoncho} vellones y te tejo un poncho. La majada está en el galpón de esquila.`] };
      return {
        partes: [`Con ${S.lanaPoncho} vellones te tejo un poncho, pura lana de acá. Para vos o para la feria.`],
        seguir: DALE,
        efectos: [{ tipo: 'material', k: 'lana', n: -S.lanaPoncho }, { tipo: 'cosa', k: 'poncho', n: 1 }, uso],
        titulo: 'Un poncho de la hilandería',
      };
    }
    case 'apicultor': {
      if (yaHoy(aldea, clave, dia)) return { partes: ['Hoy ya cosechamos lo que había. Las abejas no hacen horas extra.'] };
      if (cant(progreso, 'material', 'tabla') < S.tablasMiel) return { partes: [`Me faltan tablas para los marcos: por ${S.tablasMiel} tablas te doy ${S.miel} frascos de miel.`] };
      return {
        partes: [`Por ${S.tablasMiel} tablas te doy ${S.miel} frascos de miel de notro y rosa mosqueta. Es de esta semana.`],
        seguir: DALE,
        efectos: [{ tipo: 'material', k: 'tabla', n: -S.tablasMiel }, { tipo: 'entrada', k: 'miel', n: S.miel }, uso],
        titulo: `${S.miel} frascos de la sala de miel`,
      };
    }
    case 'guardaparque': {
      if (yaHoy(aldea, clave, dia)) return { partes: ['Hoy ya pasamos el registro. Mañana seguimos con lo que veas.'] };
      const entradas = progreso?.entradas || {};
      const nuevos = avistajesDe(entradas) - entero(aldea.fauna);
      if (nuevos > 0) {
        const n = Math.min(S.avistajesPorDia, nuevos);
        return {
          partes: [`${n === 1 ? 'Un avistaje nuevo' : `${n} avistajes nuevos`} para el registro de la seccional. Muy bien anotados.`, `Tomá ${n * S.yerbaPorAvistaje} de yerba, que el registro no se llena solo.`],
          efectos: [{ tipo: 'cosa', k: 'yerba', n: n * S.yerbaPorAvistaje }, { tipo: 'aldea', campo: 'fauna', valor: n }, uso],
          titulo: 'Avistajes al registro',
        };
      }
      const pend = pendientesDelCuaderno(entradas, SECCIONES_REGISTRO);
      if (!pend.length) return { partes: ['Tenés anotado más de lo que tiene la seccional. Te voy a tener que tomar de ayudante.'] };
      const e = pend[(diaValido(dia, 1) * 3) % pend.length];
      return { partes: ['Nada nuevo para el registro.', `¿Probaste con ${e.nombre.toLowerCase()}? ${e.pista}`] };
    }
    case 'musico': {
      const ultima = entero(aldea.partitura);
      if (ultima && diaValido(dia, 1) - ultima < S.diasPartitura) return { partes: ['Esta semana ya te enseñé una. Practicala, y el sábado a la tarde vení a la plaza.'] };
      const halladas = new Set(Array.isArray(progreso?.personal?.musica?.halladas) ? progreso.personal.musica.halladas : []);
      const m = MELODIAS.find((x) => !x.inicial && !halladas.has(x.id));
      if (!m) return { partes: ['Ya sabés todas las del valle. Ahora te falta bailarlas: el sábado, en la plaza.'] };
      return {
        partes: [`Escuchá esta: «${m.nombre}». Te la anoto en un papel, para el tocadiscos del refugio.`],
        seguir: DALE,
        efectos: [{ tipo: 'partitura', k: m.id }, { tipo: 'aldea', campo: 'partitura', valor: diaValido(dia, 1) }],
        titulo: `Melodía: ${m.nombre}`,
      };
    }
    // ---------------------------------------------------------------- 3.7.0: las de la calle de la Loma
    case 'veterinaria': {
      if (yaHoy(aldea, clave, dia)) return { partes: ['Por hoy ya revisé a tus animales. Están bien: los animales sanos se aburren de que los revisen.'] };
      const hoy = diaValido(dia, 1);
      const op = [];
      if (cant(progreso, 'cosa', 'caballo') && entero(aldea.herrado) !== hoy) op.push({ partes: ['Traeme al zaino, que le miro los vasos. Tenía una herradura floja: ya está.', 'Vas a ver que hasta la noche anda más liviano, como si tuviera ganas.'],
        efectos: [{ tipo: 'aldea', campo: 'herrado', valor: hoy }, uso], titulo: 'La veterinaria le revisó las herraduras al zaino' });
      if (Object.keys(objeto(progreso?.gallineros) ? progreso.gallineros : {}).length) op.push({ partes: ['Pasé por tus gallinas: les di conchilla molida y un poco de ortiga. Pusieron de más.', `Tomá, te traje ${S.huevosVet} huevos que encontré escondidos debajo del nidal.`],
        efectos: [{ tipo: 'entrada', k: 'huevo', n: S.huevosVet }, uso], titulo: `${S.huevosVet} huevos de tus gallinas` });
      if (cant(progreso, 'cosa', 'tijera')) op.push({ partes: ['Le revisé las pezuñas a la majada de Don Ramón. En el corral quedaban mechones de lana enganchados en el alambre.', 'Los cardé y salió un vellón. Es tuyo, que vos las esquilás.'],
        efectos: [{ tipo: 'material', k: 'lana', n: S.lanaVet }, uso], titulo: 'Un vellón de la majada' });
      if (!op.length) return { partes: ['Todavía no tenés animales que atender. Cuando Don Ramón te preste el zaino, o tengas gallinas, traémelos.', 'Mientras tanto, vigilá que tu perro tome agua limpia.'] };
      const o = op[hoy % op.length];
      return { ...o, seguir: DALE };
    }
    case 'fotografa': {
      if (!cant(progreso, 'cosa', 'lente') && entero(progreso?.fotos) >= S.fotosLente) {
        return { partes: ['A ver esa cámara… El lente está rayado. Tomá este, que era de mi abuelo: acerca el doble.', 'Con esto, los bichos que antes eran un punto ahora salen con ojos.'], seguir: DALE,
          efectos: [{ tipo: 'cosa', k: 'lente', fijar: 1 }, uso], titulo: 'Sofía te mejoró la cámara' };
      }
      if (yaHoy(aldea, clave, dia)) return { partes: ['Hoy ya miramos tu álbum. Salí a sacar, que las fotos no se sacan solas.'] };
      if (!cant(progreso, 'cosa', 'lente')) return { partes: [`Sacá unas fotos y traeme la cámara: con ${S.fotosLente} ya veo qué le falta.`, 'Y la próxima, no le pongas el dedo al lente.'] };
      const f = objeto(extra?.fotoPendiente) && typeof extra.fotoPendiente.nombre === 'string' ? extra.fotoPendiente : null;
      if (!f) return { partes: ['Tu álbum está completo. Ahora te falta la foto que nadie te pidió: ésa es la mejor.'] };
      return { partes: [`Miré tu álbum: te falta «${f.nombre}».`, `Un consejo de fotógrafa: ${minusc(f.pista || 'paciencia y luz de costado.')}`], efectos: [uso], titulo: `Foto que falta: ${f.nombre}` };
    }
    case 'andinista': {
      if (yaHoy(aldea, clave, dia)) return { partes: ['Hoy ya te conté un lugar. Andá y volvé, que el valle no se termina en un día.'] };
      const entradas = progreso?.entradas || {};
      const conLugar = extra?.lugares instanceof Set ? extra.lugares : null;
      const pend = pendientesDelCuaderno(entradas, ['lugares']).filter((e) => !conLugar || conLugar.has(e.id));
      if (!pend.length) return { partes: ['Conocés el valle mejor que yo. La próxima la guía la hacés vos y yo te sigo.'] };
      const e = pend[(diaValido(dia, 1) * 5) % pend.length];
      return {
        partes: [`¿Ya fuiste a ${minusc(e.nombre)}? Para llegar: ${minusc(e.pista)}`, conLugar ? 'Te lo marco en el mapa con una chinche. Llevá agua y avisá a dónde vas.' : 'Llevá agua y avisá a dónde vas.'],
        seguir: DALE, efectos: [...(conLugar ? [{ tipo: 'chinche', k: e.id, nombre: e.nombre }] : []), uso], titulo: `Rocío te contó cómo llegar a ${minusc(e.nombre)}`,
      };
    }
    case 'herbolaria': {
      if (yaHoy(aldea, clave, dia)) return { partes: ['Por hoy ya te di lo del monte. Lo que queda, queda para los pájaros.'] };
      const fruto = diaValido(dia, 1) % 2 ? 'calafate' : 'frutilla';
      const nombre = fruto === 'calafate' ? 'calafates' : 'frutillas del bosque';
      if (cant(progreso, 'cosa', 'yerba') >= S.yerbaPorFrutos) {
        return { partes: [`Por un poco de yerba te doy ${S.frutos} ${nombre} que junté esta mañana, antes de que salga el sol.`, 'Comelas despacio, que el monte las hizo despacio.'], seguir: DALE,
          efectos: [{ tipo: 'cosa', k: 'yerba', n: -S.yerbaPorFrutos }, { tipo: 'entrada', k: fruto, n: S.frutos }, uso], titulo: `${S.frutos} ${nombre} de la herboristería` };
      }
      const pend = pendientesDelCuaderno(progreso?.entradas || {}, ['flora', 'frutos']);
      if (!pend.length) return { partes: ['Ya anotaste todas las plantas del valle. Ahora aprendé para qué sirve cada una: eso no entra en ningún cuaderno.'] };
      const e = pend[(diaValido(dia, 1) * 3) % pend.length];
      return { partes: [`Si me traés yerba te doy frutos del monte. Mientras: ¿anotaste ${minusc(e.nombre)}?`, `${e.pista} Los bichos te los cuenta Julia; las plantas, yo.`] };
    }
    case 'pintora': {
      if (yaHoy(aldea, clave, dia)) return { partes: ['Hoy ya pinté uno. Si pinto dos, el segundo sale feo y lo tengo que regalar igual.'] };
      const quien = menosConfianza(progreso, aldea);
      if (!quien) return { partes: ['Ya te llevás bien con todos. Te pinto a vos, entonces, pero otro día: hoy la luz está rara.'] };
      const nombre = personaAldea(quien)?.nombre?.split(' ')[0] || quien;
      if (cant(progreso, 'material', 'tabla') < S.tablaBastidor) return { partes: [`Traeme una tabla para el bastidor y le pinto un dibujito a ${nombre} de tu parte. Así te va conociendo.`] };
      return { partes: [`Por una tabla le pinto a ${nombre} un dibujito de su casa, de tu parte. Nadie se resiste a un dibujo de su casa.`, 'Se lo llevo esta tarde, con el óleo todavía fresco.'], seguir: DALE,
        efectos: [{ tipo: 'material', k: 'tabla', n: -S.tablaBastidor }, { tipo: 'amistad', k: quien, n: S.amistadDibujo }, uso], titulo: `Abril le pintó un dibujo a ${nombre} de tu parte` };
    }
    case 'ceramista': {
      const tiene = cant(progreso, 'cosa', 'macetas-barro');
      if (tiene >= S.macetasMax) return { partes: ['Ya tenés todas las macetas que entran en tu vivero. Pasá cuando quieras a ver el horno: hoy hay jarros adentro.', 'El barro de acá es colorado por el hierro. Cocido queda como una teja vieja.'] };
      if (yaHoy(aldea, clave, dia)) return { partes: ['El horno ya está cargado por hoy. Mañana sale otra tanda.'] };
      if (cant(progreso, 'material', 'piedra') < S.piedrasMacetas) return { partes: [`Traeme ${S.piedrasMacetas} piedras para moler el esmalte y te hago ${S.macetasPorVez} macetas de barro para el vivero. Así sembrás más.`] };
      return { partes: [`Por ${S.piedrasMacetas} piedras te hago ${S.macetasPorVez} macetas de barro para el vivero. Mañana salen del horno, pero llevátelas hoy, que te las guardo yo.`, 'Mario dice que son las macetas más lindas de la cordillera. Mario no sabe nada de macetas, pero es mi primo.'], seguir: DALE,
        efectos: [{ tipo: 'material', k: 'piedra', n: -S.piedrasMacetas }, { tipo: 'cosa', k: 'macetas-barro', fijar: Math.min(S.macetasMax, tiene + S.macetasPorVez) }, uso], titulo: `${S.macetasPorVez} macetas de barro para el vivero` };
    }
    case 'botera': {
      const hoy = diaValido(dia, 1);
      if (entero(aldea.calafateado) === hoy) return { partes: ['El kayak ya está calafateado. Andá al agua antes de que se enfríe la brea, que corre como pez.'] };
      if (yaHoy(aldea, clave, dia)) return { partes: ['Hoy ya trabajé lo tuyo. Mañana me traés el kayak de nuevo.'] };
      if (cant(progreso, 'material', 'tabla') < S.tablaKayak) return { partes: ['Traeme una tabla para el parche y te calafateo el kayak. Vas a remar como si el lago te empujara.'] };
      return { partes: ['Por una tabla te emparcho la proa y le paso brea al casco. Hasta la noche remás más rápido.', 'Y no lo arrastres por las piedras, que la brea es buena pero no es de fierro.'], seguir: DALE,
        efectos: [{ tipo: 'material', k: 'tabla', n: -S.tablaKayak }, { tipo: 'aldea', campo: 'calafateado', valor: hoy }, uso], titulo: 'Martina te calafateó el kayak' };
    }
    case 'astronoma': {
      const h = Number.isFinite(num(extra?.hora)) ? (((num(extra.hora) % 24) + 24) % 24) : 12;
      const noche = h >= 20 || h < 5;
      if (yaHoy(aldea, clave, dia)) return { partes: ['Por hoy ya miramos. El telescopio también necesita que lo dejen pensar.'] };
      const pend = pendientesDelCuaderno(progreso?.entradas || {}, ['cielo']).filter((e) => CIELO_TELESCOPIO.includes(e.id));
      if (!noche) return { partes: ['De día no hay nada que mirar, salvo el sol, y al sol no se lo mira. Volvé de noche al observatorio.', pend.length ? `Esta noche, si está limpio, te muestro ${minusc(pend[0].nombre)}.` : 'Esta noche te muestro la Vía Láctea entera.'] };
      if (!pend.length) return { partes: ['Ya anotaste todo lo que se ve con este telescopio. Ahora mirá sin él: es otro cielo.'] };
      const e = pend[0];
      return { partes: ['Acercá el ojo, despacio, sin tocar el tubo.', `Eso es ${minusc(e.nombre)}. ${e.pista} Anotalo, que esta noche es tuya.`], seguir: DALE,
        efectos: [{ tipo: 'registrar', k: e.id }, uso], titulo: `Por el telescopio: ${e.nombre}` };
    }
    case 'modista': {
      if (yaHoy(aldea, clave, dia)) return { partes: ['Hoy ya te conté lo mío. Si te cuento más, después no tengo de qué hablar con Anselmo.'] };
      const ch = objeto(extra?.chisme) && typeof extra.chisme.quien === 'string' && typeof extra.chisme.cosa === 'string' ? extra.chisme : null;
      if (!ch) return { partes: ['Te arreglé el dobladillo del pantalón, que lo arrastrabas como una cola.', 'Y de chismes, hoy nada: esta aldea es tan tranquila que me tengo que inventar las novedades.'] };
      const verbo = ch.gusto === 'encanta' ? 'le encanta' : ch.gusto === 'noGusta' ? 'no le gusta nada' : 'le gusta';
      return { partes: ['Sentate que te cosí ese botón que te colgaba. Y escuchá, que esto no se lo conté a nadie… bueno, a casi nadie.', `A ${ch.quien} ${verbo} ${ch.cosa}. Yo no te dije nada, eh.`], efectos: [{ tipo: 'gusto', k: ch.persona, cosa: ch.k }, uso], titulo: `Pocha te contó un chisme de ${ch.quien}` };
    }
    default: return { partes: [] };
  }
}
// Aplica los efectos que tocan a la aldea (los demás los aplica quien tenga el mundo).
export function aplicarAlAldea(aldea, efectos, dia) {
  for (const f of efectos || []) {
    if (f?.tipo !== 'aldea') continue;
    if (f.campo === 'uso' && esPobladorAldea(f.valor)) aldea.usos = { ...(aldea.usos || {}), [f.valor]: diaValido(dia, 1) };
    else if (f.campo === 'afilado') aldea.afilado = Math.max(0, Math.min(SERVICIO.filo, entero(f.valor)));
    else if (f.campo === 'mandado') aldea.mandado = f.valor && typeof f.valor.id === 'string' ? { id: f.valor.id, dia: f.valor.dia } : null;
    else if (f.campo === 'mandados') aldea.mandados = Math.max(0, entero(aldea.mandados)) + Math.max(0, entero(f.valor));
    else if (f.campo === 'fauna') aldea.fauna = Math.max(0, entero(aldea.fauna)) + Math.max(0, entero(f.valor));
    else if (f.campo === 'partitura') aldea.partitura = Math.max(0, entero(f.valor));
    else if (f.campo === 'calafateado' || f.campo === 'herrado') aldea[f.campo] = Math.max(0, entero(f.valor));   // 3.7.0
  }
}
// Para las pruebas y para lo que no pasa por el mundo: aplica todo sobre una partida. Los
// efectos sobre el jugador (descansado, entumecido) los devuelve, porque viven en el mundo.
export function aplicarEfectos(progreso, efectos, dia) {
  const alJugador = [];
  for (const f of efectos || []) {
    if (f.tipo === 'material') {
      progreso.materiales = progreso.materiales || {};
      progreso.materiales[f.k] = Math.max(0, entero(progreso.materiales[f.k]) + entero(f.n));
    } else if (f.tipo === 'cosa') {
      progreso.cosas = progreso.cosas || {};
      progreso.cosas[f.k] = f.fijar !== undefined ? f.fijar : Math.max(0, entero(progreso.cosas[f.k]) + entero(f.n));
    } else if (f.tipo === 'entrada' || f.tipo === 'carta') {
      progreso.entradas = progreso.entradas || {};
      const e = progreso.entradas[f.k] || (progreso.entradas[f.k] = { dia: diaValido(dia, 1), hora: 12, cantidad: 0 });
      if (f.tipo === 'entrada') e.cantidad = Math.max(0, entero(e.cantidad) + entero(f.n));
    } else if (f.tipo === 'foto') {
      if (progreso.correo) enviarFoto(progreso.correo, f.k);
    } else if (f.tipo === 'partitura') {
      anotarPartitura(progreso, f.k);
    } else if (f.tipo === 'registrar') {
      // 3.7.0: lo que te mostró la astrónoma queda anotado
      progreso.entradas = progreso.entradas || {};
      if (!Object.hasOwn(progreso.entradas, f.k)) progreso.entradas[f.k] = { dia: diaValido(dia, 1), hora: 22, cantidad: 0 };
    } else if (f.tipo === 'jugador' || f.tipo === 'chinche' || f.tipo === 'amistad' || f.tipo === 'gusto') alJugador.push(f);   // 3.7.0: el mapa y la vecindad, de quien los tenga
  }
  progreso.aldea = progreso.aldea || aldeaNueva();
  aplicarAlAldea(progreso.aldea, efectos, dia);
  return alJugador;
}
// El filo del herrero: cuántos hachazos hacen falta con el hacha afilada.
export const golpesConFilo = (golpes, aldea) => (entero(aldea?.afilado) > 0 ? Math.max(1, golpes - 1) : golpes);
export function gastarFilo(aldea) {
  if (!aldea || entero(aldea.afilado) <= 0) return false;
  aldea.afilado = entero(aldea.afilado) - 1;
  return true;
}

// ---------------------------------------------------------------- los horarios
// La semana de la aldea: el día 1 de la partida es lunes. 5 = sábado, 6 = domingo.
export const SEMANA = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
export const diaSemanaDe = (dia) => ((diaValido(dia, 1) - 1) % 7 + 7) % 7;
// Un corrimiento propio de cada uno (entre −0,4 y +0,4 h): que no se muevan todos juntos.
export function desfaseDe(persona) {
  let h = 5381;
  for (const ch of String(persona)) h = ((h * 33) ^ ch.charCodeAt(0)) >>> 0;
  return ((h % 81) - 40) / 100;
}
const indicePersona = (persona) => Math.max(0, ORDEN_PERSONAS_ALDEA.indexOf(persona));
// Los que van a los cuentos del domingo, cada uno con su silla (ver `rutinaAldea`).
// 3.6.1 (vecinos): los chicos, al final: les tocan los almohadones de la alfombra (lectura-15 y 16), al
// pie del sillón; antes se sentaban en las sillas y dos grandes en los almohadones
// 3.7.0: con veinte pobladores no alcanzan las sillas: los catorce de siempre tienen la suya (y los chicos,
// los almohadones 15 y 16); los demás se quedan en la plaza
const OYENTES = [...ORDEN_PERSONAS_ALDEA.filter((k) => !['abuela', 'jefe', 'nelida', 'galesa', 'nene', 'nena'].includes(k)).slice(0, 14), 'nene', 'nena'];
// 3.7.0: dónde trabajan afuera a la tarde los que tienen algo propio (si no, en `trabajo`)
const PUNTO_AFUERA = { veterinaria: 'corral', ceramista: 'horno' };
// Quiénes ayudan en las obras: el padre de los Jones, el carpintero y el herrero (si ya
// tienen su local) y el dueño de la obra.
export function obrerosDe(aldea, lote) {
  const lista = ['padre'];
  for (const k of ['carpintero', 'herrero']) if (localAbierto(aldea, LOTE_DE[k])) lista.push(k);
  const dueno = pobladorDeLote(lote);
  if (dueno && !lista.includes(dueno)) lista.push(dueno);
  return lista;
}
const presente = (aldea, clave) => esVecinoAldea(clave) || (aldea?.pobladores || []).some((p) => p.clave === clave);
// Dónde está cada uno a cada hora. `persona`: la clave de un vecino o de un poblador;
// `diaSemana`: 0 (lunes) a 6 (domingo); `estado`: la aldea. Devuelve { lugar, edificio,
// punto }: `lugar` es 'casa'|'local'|'trabajo'|'plaza'|'biblioteca'|'almacen'|'escuela'|'obra'|'salon'|
// 'estacion', y `edificio`/`punto` dicen dónde pararse (ver `puntosDe`). Un poblador que todavía
// no vino da { lugar: null }.
// 3.7.0: `dia` (opcional): el día de la partida, para los cumpleaños (la fiesta de la tardecita).
export function rutinaAldea(persona, hora, diaSemana, estado, dia = null) {
  const a = estado || aldeaNueva();
  const fuera = { lugar: null, edificio: null, punto: null };
  if (!esPersonaAldea(persona)) return fuera;
  const h = (((num(hora) || 0) % 24) + 24) % 24;
  const t = h - desfaseDe(persona);
  const ds = ((Math.floor(num(diaSemana) || 0) % 7) + 7) % 7;
  const domingo = ds === 6, sabado = ds === 5, habil = ds < 5;
  const i = indicePersona(persona);
  const ir = (lugar, edificio, punto) => ({ lugar, edificio, punto });
  const plaza = () => ir('plaza', 'plaza', `estar-${(i % 20) + 1}`);
  const v = esVecinoAldea(persona) ? vecinoDe(persona) : null;
  const p = v ? null : POBLADORES_ALDEA[persona];
  // el que acaba de bajar del tren espera en el andén (de noche, adentro del galpón)
  if (p && a.llegando?.clave === persona) return t < 7 || t >= 21 ? ir('estacion', 'estacion-aldea', 'adentro') : ir('estacion', 'estacion-aldea', 'anden');
  if (p && !presente(a, persona)) return fuera;
  // 3.7.0: el chico que se fue a estudiar a la ciudad no está
  if (v?.chico && chicoAfuera(a, persona)) return fuera;
  const lote = p ? LOTE_DE[persona] : null;
  const abierto = p ? localAbierto(a, lote) : true;
  // dónde vive: su casa, su local (el cuarto de atrás) o, mientras se levanta, la estación
  const casa = v ? v.casa : abierto ? lote : 'estacion-aldea';
  const enCasa = (punto) => ir('casa', casa, punto);
  const cama = () => enCasa(persona === 'nene' || persona === 'nena' ? 'cama-chicos' : 'cama');
  const obra = obraEnCurso(a);
  // 3.6 (mecánicas): el sábado de 17 a 19 el músico toca en su salón y se baila (PLAN_ALDEA §14;
  // antes tocaba en la plaza): él en el escenario, ocho en la pista y el resto en las sillas
  const baileDelSabado = sabado && localAbierto(a, 'salon') && t >= 17 && t < 19;
  // 3.6 (mecánicas): la bandera de la plaza: el jefe de estación la iza a las 8 y la arría a las 19
  // (cuenta la hora del reloj, sin su corrimiento: la bandera no espera)
  const bandera = persona === 'jefe' && ((h >= 7.5 && h < 8.25) || (h >= 18.5 && h < 19.25));

  // 3.7.0: la astrónoma, con su observatorio abierto, trabaja de noche (de 20 a 3:30) y duerme hasta la siesta
  const noctambula = persona === 'astronoma' && abierto;
  if (noctambula) {
    if (t >= 3.5 && t < 13) return cama();
    // (3.7.0 (integración): de 21 a 2:30, arriba, en la torreta, con el telescopio; antes y después, con las cartas)
    if (t >= 20 || t < 3.5) return ir('local', lote, t >= 21 || t < 2.5 ? 'telescopio' : 'adentro');
  }
  // de noche, adentro (el músico duerme hasta más tarde)
  else if (t < 6.5 || t >= 22 || (persona === 'musico' && t < 8.5)) return cama();
  // domingo de 10 a 11, los cuentos en la biblioteca: la abuela Herminia lee (y cuenta la
  // leyenda de los duendes) y casi todos van a escucharla; el jefe se queda tomando mate en la
  // plaza, Nélida abre un rato el almacén y la galesa hornea la torta de la tarde
  if (domingo && t >= 10 && t < 11) {
    if (persona === 'abuela') return ir('biblioteca', 'biblioteca', 'cuentos');
    if (persona === 'jefe') return plaza();
    if (persona === 'nelida') return ir('trabajo', 'almacen', 'adentro');
    if (persona === 'galesa') return ir('trabajo', 'casa-te', 'cocina');
    const j = OYENTES.indexOf(persona);
    if (j < 0) return plaza();   // 3.7.0: los que no tienen silla, en la plaza
    return ir('biblioteca', 'biblioteca', `lectura-${j + 1}`);
  }
  if (bandera) return ir('plaza', 'plaza', 'soga');
  // 3.6.2: el sábado, tres cuartos de hora antes del baile se deja lo que se esté haciendo (para llegar
  // caminando sin que la ida se coma el baile: ver conTiempo en aldea-gente.js), y después del baile nadie
  // vuelve a trabajar (antes volvían al almacén o a la casa de té para una hora: más camino que trabajo)
  const sabadoDeBaile = sabado && localAbierto(a, 'salon') && persona !== 'musico' && !v?.chico;
  if (sabadoDeBaile && ((t >= 16.25 && t < 17) || (t >= 19 && t < 20 && !bandera))) return enCasa('adentro');
  // sábado a la tarde, todos al salón con el músico (3.6 (mecánicas): baile)
  if (baileDelSabado) {
    if (persona === 'musico') return ir('salon', 'salon', 'escenario');
    const j = ORDEN_PERSONAS_ALDEA.filter((k) => k !== 'musico').indexOf(persona);
    return j < 8 ? ir('salon', 'salon', `baile-${j + 1}`) : j < 16 ? ir('salon', 'salon', `lugar-${j - 7}`) : plaza();
  }
  // 3.7.0: el cumpleaños: a la tardecita, el que cumple festeja en la plaza con toda la aldea (los chicos, en
  // su casa, con la familia). El almacén, la casa de té y los locales cierran un rato.
  if (dia !== null && t >= HORA_FIESTA[0] && t < HORA_FIESTA[1]) {
    const fiesta = fiestaDeCumple(dia, a);
    if (fiesta?.claves.includes(persona)) return fiesta.donde === 'plaza' ? ir('fiesta', 'plaza', 'mastil') : ir('fiesta', fiesta.edificio, 'adentro');
    // (3.7.0 (integración): los 90 de la abuela: toda la aldea en la plaza)
    if (fiesta?.noventa) return ir('fiesta', 'plaza', `estar-${(i % 20) + 1}`);
    // (el cumpleaños de uno de los chicos: la familia, en casa)
    if (fiesta?.edificio === 'casa-familia' && ['padre', 'madre', 'nene', 'nena'].includes(persona)) return ir('fiesta', 'casa-familia', 'adentro');
  }
  // 3.7.0: los chicos que ya son jóvenes trabajan con el que les enseña el oficio, o en lo que estudiaron
  const etapa = v?.chico ? etapaDeChico(a, persona) : null;
  if (v?.chico && etapa >= 3) {
    const c = a.chicos?.[persona] || {};
    const mentor = esPobladorAldea(c.oficio) && localAbierto(a, LOTE_DE[c.oficio]) ? c.oficio : null;
    const lugarTrabajo = mentor ? [LOTE_DE[mentor], POBLADORES_ALDEA[mentor].afuera ? 'trabajo' : 'cliente'] : c.carrera ? [CARRERAS[persona].edificio, CARRERAS[persona].punto] : null;
    if (habil && lugarTrabajo && ((t >= 8.5 && t < 12.5) || (t >= 13.5 && t < 17.5))) return ir('trabajo', lugarTrabajo[0], lugarTrabajo[1]);
    if (t >= 12.5 && t < 13.5) return enCasa('adentro');
    if (t >= 18 && t < 20) return i % 2 ? enCasa('trabajo') : plaza();
    return enCasa('adentro');
  }
  // los chicos
  if (v?.chico) {
    const juego = ir('plaza', 'plaza', `juego-${persona === 'nene' ? 1 : 2}`);
    // (3.6.2: hasta las 12:30, y a las 13 almuerzan en casa: la media hora del medio es para volver caminando)
    if (habil && localAbierto(a, 'escuela') && t >= 8.5 && t < 12.5) return ir('escuela', 'escuela', `pupitre-${persona === 'nene' ? 1 : 2}`);
    if (t >= 13 && t < 14) return enCasa('adentro');
    // 3.7.0: de adolescente, a la tarde le da una mano al que más le gusta de los que tienen el local abierto
    if (etapa === 2 && habil && t >= 14 && t < 17) {
      const c = a.chicos?.[persona] || {};
      const con = Object.entries(c.junto || {}).filter(([q]) => esPobladorAldea(q) && localAbierto(a, LOTE_DE[q])).sort((x, y) => y[1] - x[1])[0]?.[0];
      if (con) return ir('trabajo', LOTE_DE[con], POBLADORES_ALDEA[con].afuera ? 'trabajo' : 'cliente');
    }
    if (t >= 14 && t < 18) return juego;
    if (!habil && t >= 10 && t < 12.5) return juego;
    if (t >= 18 && t < 20) return enCasa('trabajo');
    return enCasa('adentro');
  }
  // 3.6.2: el jefe de estación almuerza en la estación, con la vianda (su casa queda en la otra punta: iba y
  // volvía caminando toda la hora del almuerzo)
  if (persona === 'jefe' && !domingo && t >= 12.5 && t < 13.5) return ir('trabajo', 'estacion-aldea', 'adentro');
  // 3.7.0: Martina trabaja de día en el muelle del lago, y almuerza ahí, con la vianda (el varadero le queda a
  // medio kilómetro)
  if (persona === 'botera' && abierto && !domingo && t >= 8 && t < 17) return ir('trabajo', lote, 'trabajo-muelle');
  // el almuerzo, en casa
  if (t >= 12.5 && t < 13.5) return enCasa('adentro');
  // la obra del pueblo, de día y de lunes a sábado
  if (obra && !domingo && obrerosDe(a, obra).includes(persona) && ((t >= 8 && t < 12.5) || (t >= 13.5 && t < 17))) {
    return ir('obra', obra, `obra-${(i % 4) + 1}`);
  }
  if (domingo) {
    if (t >= 11 && t < 12.5) return plaza();
    if (t >= 15 && t < 19) return i % 2 ? enCasa('trabajo') : plaza();
    return enCasa('adentro');
  }
  // de lunes a sábado, cada uno con lo suyo
  if (v) {
    if (persona === 'jefe') {
      // 3.6.2: de su casa va derecho a izar la bandera, toma unos mates en la plaza y abre la estación a las
      // 8:45; a las 18 la cierra, espera en la plaza y arría (a las 19:15 ya está libre). En la estación
      // cambia del andén a adentro cada dos horas (antes cada hora, y entre la estación y la plaza: se pasaba
      // casi la mitad del horario caminando)
      if (h >= 8.75 && h < 18) return ir('trabajo', 'estacion-aldea', Math.floor((h - 1) / 2) % 2 ? 'anden' : 'adentro');
      if (h >= 8.25 && h < 8.75) return plaza();
      if (h >= 18 && h < 18.5) return plaza();
    } else if (persona === 'ercilia') {
      // horario de almacén de pueblo: de 8:30 a 12 y de 16 a 20, con siesta en el medio
      // (3.6.2: cierra a las 12 y la siesta es hasta las 15:15: su casa queda a 47 m por la calle, y la ida y la
      // vuelta se comían el almuerzo y la apertura de la tarde)
      if ((t >= 8.5 && t < 12) || (t >= 16 && t < 20)) return ir('trabajo', 'almacen', 'adentro');
      if (t >= 13.5 && t < 15.25) return cama();
    } else if (persona === 'nelida') {
      // la ayudante: barre la vereda, repone y atiende mientras Ercilia duerme la siesta
      if (t >= 8 && t < 9) return ir('trabajo', 'almacen', 'vereda');
      // (3.6.2: a las 12 se va a almorzar y vuelve a las 14: vive lejos, y la ida y la vuelta se comían el horario)
      if (t >= 9 && t < 12) return ir('trabajo', 'almacen', 'reponer');
      if (t >= 14 && t < 16) return ir('trabajo', 'almacen', 'adentro');
      if (t >= 16 && t < 18.5) return ir('trabajo', 'almacen', 'reponer');
    } else if (persona === 'galesa') {
      // a la mañana hornea; de 15 a 20 atiende la galería
      if (t >= 9 && t < 12.5) return ir('trabajo', 'casa-te', 'cocina');
      if (t >= 15 && t < 20) return ir('trabajo', 'casa-te', 'adentro');
    } else if (persona === 'abuela') {
      // cuenta la leyenda a quien quiera escuchar (3.6.2: desde las 15:30: su casa queda lejos de la plaza)
      if (t >= 15.5 && t < 18) return plaza();
      if (t >= 9 && t < 11.75) return ir('biblioteca', 'biblioteca', 'adentro');   // a la mañana atiende la biblioteca (3.6.2: hasta las 11:45, para llegar a almorzar)
      if (t >= 18 && t < 20) return enCasa('trabajo');
    } else if (persona === 'padre') {
      if ((t >= 8 && t < 12.5) || (t >= 13.5 && t < 18)) return enCasa('trabajo');
    } else if (persona === 'madre') {
      // (3.6.2: deja el telar media hora antes de las compras y vuelve a almorzar con tiempo)
      if (t >= 8 && t < 10.5) return enCasa('trabajo');
      if (t >= 11 && t < 12) return ir('almacen', 'almacen', 'cliente-1');
      if (t >= 16 && t < 18) return plaza();
    }
  } else if (abierto) {
    if (persona === 'musico') {
      if (t >= 15 && t < 20) return ir('local', lote, 'escenario');
    } else if (persona === 'modista' && habil && t >= 16.5 && t < 17.5 && localAbierto(a, 'herreria')) {
      // 3.7.0: Pocha le lleva unos mates a Anselmo a la herrería, a la tardecita (la pareja de la aldea)
      return ir('trabajo', 'herreria', 'cliente');
    } else if (persona === 'botera') {
      // (3.7.0: a la tardecita, adentro, con el bote a medio hacer: ahí calafatea; afuera no tenía nada que hacer)
      if (t >= 17 && t < 18) return ir('trabajo', lote, 'adentro');
    } else if (!noctambula && t >= 8 && t < 18 && !(t >= 12.5 && t < 13.5)) {
      if (p.afuera && t >= 13.5) return ir('trabajo', lote, Object.hasOwn(PUNTO_AFUERA, persona) ? PUNTO_AFUERA[persona] : 'trabajo');
      return ir('local', lote, 'adentro');
    }
  }
  // al caer la tarde, unos a la plaza y otros a la puerta de su casa
  if (t >= 18 && t < 20) return i % 2 ? enCasa('trabajo') : plaza();
  return enCasa('adentro');
}

// ---------------------------------------------------------------- las charlas entre vecinos
// Pares y tríos con líneas cortas: si pasás cerca, escuchás la charla. `cuando` limita el
// tema: `clima` ('lluvia'|'nieve'|'viento'|'sol'), `estacion` ('verano'|'otono'|'invierno'),
// `obra` (true: con una obra en curso) y `hora` ([desde, hasta)). Los pobladores sólo charlan
// si ya viven en la aldea.
export const CHARLAS_ALDEA = [
  { id: 'lluvia-tren', tema: 'clima', cuando: { clima: ['lluvia'] }, lineas: [['jefe', 'Llueve parejo, Ercilia. El tren va a llegar con barro hasta las ventanillas.'], ['ercilia', 'Mejor, Ernesto: con lluvia la gente compra más yerba.']] },
  { id: 'viento-chapas', tema: 'clima', cuando: { clima: ['viento'] }, lineas: [['padre', 'Hoy sopla como para volar las chapas, doña.'], ['abuela', 'Clavalas bien, entonces. El viento de acá no pide permiso.']] },
  { id: 'nieve-duende', tema: 'clima', cuando: { clima: ['nieve'] }, lineas: [['madre', 'Nahuel, ponete el gorro, que está nevando.'], ['nene', '¡Pero con nieve no se ve el duende de la plaza!'], ['abuela', 'Tranquilo, que el duende sabe esperar abajo de la nieve.']] },
  { id: 'sol-ropa', tema: 'clima', cuando: { clima: ['sol'] }, lineas: [['nelida', 'Qué día, Gladys. Hasta el lago se ve azul desde acá.'], ['madre', 'Aprovecho para tender la ropa, que mañana dicen que cambia.']] },
  { id: 'otono-lengas', tema: 'estacion', cuando: { estacion: ['otono'] }, lineas: [['abuela', 'Ya se pusieron coloradas las lengas del cerro.'], ['padre', 'Y hay que juntar leña antes de las heladas, doña.']] },
  { id: 'invierno-escarcha', tema: 'estacion', cuando: { estacion: ['invierno'] }, lineas: [['jefe', 'Esta mañana la vía estaba blanca de escarcha.'], ['padre', 'Lo mismo el tanque: tuve que romper el hielo con el hacha.']] },
  { id: 'invierno-kerosene', tema: 'estacion', cuando: { estacion: ['invierno'] }, lineas: [['ercilia', 'Doña Herminia, ¿le guardo kerosene para el farol?'], ['abuela', 'Guardame dos litros, que las noches ya son largas.']] },
  { id: 'verano-frambuesas', tema: 'estacion', cuando: { estacion: ['verano'] }, lineas: [['madre', 'Con este calor las frambuesas se pasan en dos días.'], ['ercilia', 'Traelas, que hacemos dulce y lo vendemos en el almacén.']] },
  { id: 'obra-vigas', tema: 'obra', cuando: { obra: true }, lineas: [['padre', 'La obra va bien. En cuanto llegue el material, seguimos.'], ['jefe', 'Si te faltan clavos, el tren de la tarde trae un cajón.']] },
  { id: 'obra-medir', tema: 'obra', cuando: { obra: true }, lineas: [['padre', 'Tito, ¿esta tabla va o la cortamos?'], ['carpintero', 'Va. Medí dos veces y cortá una, como decía mi viejo.']] },
  { id: 'obra-vecinos', tema: 'obra', cuando: { obra: true }, lineas: [['nelida', '¿Viste lo rápido que sube el local nuevo?'], ['abuela', 'Así se hacían los pueblos: entre todos, y con mate.']] },
  { id: 'leyenda-puertitas', tema: 'leyenda', lineas: [['abuela', 'Cuando llegaron las vías, los peones encontraron puertitas en las raíces de los coihues.'], ['nena', '¿Y adentro había duendes?'], ['abuela', 'Adentro había lo que cada uno quiso ver. Por eso le pusieron Aldea de los Duendes.']] },
  { id: 'leyenda-galleta', tema: 'leyenda', lineas: [['abuela', '¿Sigue dejando la galleta en el andén, Ernesto?'], ['jefe', 'Una por noche, doña. El primer jefe de estación lo hacía y a mí no me cuesta nada.']] },
  { id: 'leyenda-hongo', tema: 'leyenda', lineas: [['nene', 'Yo vi un gorrito colorado entre los helechos.'], ['nena', 'Era un hongo, Nahuel. Pero no le digas a la abuela.']] },
  { id: 'leyenda-talla', tema: 'leyenda', lineas: [['nena', '¿Quién talló el duende de la plaza?'], ['jefe', 'El primer jefe de estación, con un formón y mucha paciencia. Dicen que le copió la cara al panadero de entonces.']] },
  { id: 'biblioteca-cuentos', tema: 'biblioteca', lineas: [['nena', 'Abuela, ¿el domingo nos leés otra vez la de los duendes?'], ['abuela', 'Si me traen tortas fritas, les leo dos.']] },
  { id: 'biblioteca-libros', tema: 'biblioteca', lineas: [['jefe', 'Llegó en el tren una caja de libros para la biblioteca, Herminia. La manda la Popular de Esquel.'], ['abuela', '¡Qué alegría! Esta tarde los forro con papel madera.']] },
  { id: 'biblioteca-maestra', tema: 'biblioteca', lineas: [['maestra', 'Con la biblioteca frente a la plaza, los chicos leen más que en la escuela.'], ['abuela', 'Es que acá nadie les toma la lección, Delia.']] },
  { id: 'almacen-fiado', tema: 'almacen', lineas: [['ercilia', 'Nélida, anotá en la libreta: los Jones, un kilo de yerba y uno de azúcar.'], ['nelida', 'Ya está. Y la vereda la barrí dos veces: el viento la volvió a llenar de hojas.']] },
  { id: 'almacen-te', tema: 'almacen', lineas: [['ercilia', 'Ceinwen, llegaron las cajas de té con el tren. ¿Te separo dos?'], ['galesa', 'Tres, Ercilia: el sábado viene gente de la estación a tomar el té.']] },
  { id: 'te-torta', tema: 'te', lineas: [['galesa', 'Herminia, hoy hay torta negra recién cortada.'], ['abuela', 'Guardame una porción, Ceinwen, que después de los cuentos vengo con los chicos.']] },
  { id: 'tren-harina', tema: 'tren', lineas: [['jefe', 'Hoy el tren trae la encomienda de harina.'], ['ercilia', '¡Por fin! Ya estaba raspando la bolsa.']] },
  { id: 'tren-ultimo', tema: 'tren', cuando: { hora: [19, 22] }, lineas: [['jefe', 'Pasó el último tren. Apago el farol del andén.'], ['padre', 'Buenas noches, jefe. Mañana temprano le llevo la leña.']] },
  { id: 'pan-tortas', tema: 'oficio', lineas: [['panadera', 'Mañana hago tortas fritas si sigue gris.'], ['madre', 'Guardame una docena, que los chicos las esperan toda la semana.']] },
  { id: 'herrero-hacha', tema: 'oficio', lineas: [['herrero', 'Traeme el hacha, Mario, que te la dejo cortando el viento.'], ['padre', 'Mañana, Anselmo, que hoy la necesito.']] },
  { id: 'pescador-lago', tema: 'oficio', lineas: [['pescador', 'Salió una marrón de cuatro kilos. La devolví, que era la abuela del lago.'], ['abuela', 'Bien hecho. A las abuelas se las respeta.']] },
  { id: 'maestra-lee', tema: 'oficio', lineas: [['maestra', 'Lucía ya lee de corrido.'], ['madre', 'Lee hasta los carteles del tren, Delia. No para.']] },
  { id: 'enfermera-rodilla', tema: 'oficio', lineas: [['enfermera', '¿Cómo va esa rodilla, Herminia?'], ['abuela', 'Con el té de canelo que me diste, como nueva.']] },
  { id: 'telegrafo-atraso', tema: 'tren', lineas: [['telegrafista', 'Telegrama de Jacobacci: el tren viene con media hora de atraso.'], ['jefe', 'Media hora en la Patagonia es llegar puntual, Benigno.']] },
  { id: 'tejedora-lana', tema: 'oficio', lineas: [['tejedora', 'Este vellón está lindo, pero hay que lavarlo tres veces.'], ['nelida', 'Te guardo jabón blanco, Elvira. Del bueno.']] },
  { id: 'abejas-flores', tema: 'estacion', cuando: { estacion: ['verano'] }, lineas: [['apicultor', 'Floreció el notro y las abejas andan locas.'], ['nena', '¿Me dejás ver los cajones?'], ['apicultor', 'De lejito, y sin correr.']] },
  { id: 'guardaparque-huemul', tema: 'oficio', lineas: [['guardaparque', 'Ayer vi un huemul cerca de la vía, Mario. Si lo ven, no lo corran.'], ['padre', 'Quedate tranquila, que acá nadie anda corriendo bichos.']] },
  { id: 'musico-cueca', tema: 'oficio', lineas: [['musico', 'El sábado toco un chamamé para usted, doña Herminia.'], ['abuela', 'Tocá una cueca, que el chamamé me cansa las rodillas.']] },
  // ---------------------------------------------------------------- 3.7.0: las de la calle de la Loma
  // `radio`: los que hablan por la radio de la seccional y no están ahí (Josefina, que recorre el valle,
  // con Julia, que atiende la seccional): no hace falta que estén presentes.
  { id: 'radio-condor', tema: 'radio', radio: ['ema'], lineas: [['guardaparque', 'Seccional a Josefina, ¿me copiás?'], ['ema', 'Te copio, Julia. Estoy en el mirador: el cóndor volvió al nido de la pared.'], ['guardaparque', 'Anotado en el registro. Volvé antes de que oscurezca, que se viene el viento.']] },
  { id: 'radio-arroyo', tema: 'radio', radio: ['ema'], lineas: [['ema', 'Julia, acá Josefina. Bajó el arroyo: el vado del sendero se puede cruzar.'], ['guardaparque', 'Buenísimo. Le aviso a Rocío, que mañana sube con dos mochileros.'], ['ema', 'Decile que pasen callados por el mallín, que hay huemules.']] },
  { id: 'radio-mate', tema: 'radio', radio: ['ema'], cuando: { hora: [8, 12] }, lineas: [['guardaparque', 'Josefina, ¿pasás por la seccional al mediodía? Hay mate y pan de Rosa.'], ['ema', 'Si el pan es de Rosa, llego antes del mediodía. Cambio y fuera.']] },
  { id: 'pocha-anselmo', tema: 'pareja', lineas: [['modista', 'Anselmo, te traje unos mates, que con la fragua se te seca la garganta.'], ['herrero', 'Gracias, Pocha. ¿Y esa flor en el ojal?'], ['modista', 'La cosí yo. Es de tela: no se marchita, como algunas cosas.']] },
  { id: 'pocha-chisme', tema: 'chisme', lineas: [['modista', '¿Viste que la de la fotografía le saca fotos a todo el que pasa?'], ['nelida', 'Pocha, le saca fotos hasta al perro de Ernesto.'], ['modista', 'Por eso. El perro no se queja.']] },
  { id: 'pocha-elvira', tema: 'oficio', lineas: [['modista', 'Elvira, ¿me vendés… digo, me cambiás un ovillo de ese colorado?'], ['tejedora', 'Te lo regalo, Pocha, si me enseñás ese pespunte que hacés.']] },
  { id: 'malena-mario', tema: 'familia', lineas: [['ceramista', 'Mario, primo, ¿me prestás la carretilla para traer arcilla del arroyo?'], ['padre', 'Llevala, pero devolvémela limpia, que la última vez volvió colorada.']] },
  { id: 'malena-gladys', tema: 'familia', lineas: [['madre', 'Malena, los chicos quieren que les enseñes a hacer jarros.'], ['ceramista', 'Que vengan el sábado, con ropa vieja. Mucha ropa vieja.']] },
  { id: 'ayelen-chola', tema: 'oficio', lineas: [['veterinaria', 'Ernesto, la Chola está más mimosa que de costumbre. Me parece que hay cachorros en camino.'], ['jefe', '¡Mirá vos! Con razón se acuesta en la boletería, al lado de la estufa.']] },
  { id: 'ayelen-guido', tema: 'oficio', lineas: [['apicultor', 'Ayelén, ¿las abejas también son pacientes tuyas?'], ['veterinaria', 'Las abejas se curan solas, Guido. Vos sos el que me preocupa, con tantas picaduras.']] },
  { id: 'ines-abuela', tema: 'oficio', lineas: [['herbolaria', 'Doña Herminia, el canelo de su patio está pidiendo poda.'], ['abuela', 'Ese canelo lo plantó mi madre. Podalo vos, Inés, que tenés buena mano.']] },
  { id: 'ines-marta', tema: 'oficio', lineas: [['enfermera', 'Inés, se me terminó el té de canelo para los resfriados.'], ['herbolaria', 'Mañana te traigo, Marta. Y matico para las raspaduras de los chicos.']] },
  { id: 'rocio-julia', tema: 'oficio', lineas: [['andinista', 'Julia, mañana subo con dos mochileros al filo. ¿Algún aviso?'], ['guardaparque', 'Hay huemules del lado del arroyo. Que pasen callados y sin perro.']] },
  { id: 'rocio-nahuel', tema: 'oficio', lineas: [['nene', 'Rocío, ¿me llevás a la montaña?'], ['andinista', 'Cuando me alcances a la cintura sin ponerte en puntas de pie.']] },
  { id: 'sofia-benigno', tema: 'oficio', lineas: [['fotografa', 'Benigno, ¿salió mi sobre para Buenos Aires?'], ['telegrafista', 'En la saca de la tarde, Sofía. Con sello y todo.']] },
  { id: 'sofia-ceinwen', tema: 'te', lineas: [['fotografa', 'Ceinwen, ¿me dejás fotografiar la torta negra antes de cortarla?'], ['galesa', 'Rápido, cariad, que se enfría el té y la torta se pone celosa.']] },
  { id: 'abril-cholo', tema: 'oficio', lineas: [['pintora', 'Cholo, ¿me dejás pintarte mientras tocás?'], ['musico', 'Si me sacás más joven, sí.'], ['pintora', 'Te saco como sos. Es más difícil, pero más lindo.']] },
  { id: 'abril-lucia', tema: 'oficio', lineas: [['nena', 'Abril, ¿por qué pintás el cerro violeta si es marrón?'], ['pintora', 'Miralo a las siete de la tarde y después me contás.']] },
  { id: 'martina-aurelio', tema: 'oficio', lineas: [['botera', 'Aurelio, el bote tuyo tiene una tabla floja en la proa.'], ['pescador', 'Ya sé, Martina. Hace dos años que sé.'], ['botera', 'Mañana la cambio. Vos traé el mate.']] },
  { id: 'martina-tito', tema: 'oficio', lineas: [['botera', 'Tito, ¿te queda ciprés seco? Para un remo.'], ['carpintero', 'Para un remo, el mejor que tenga. Que el lago no perdona la madera mala.']] },
  { id: 'valentina-jefe', tema: 'cielo', lineas: [['astronoma', 'Ernesto, ¿podría apagar el farol del andén un rato a las once?'], ['jefe', 'Para usted y sus estrellas, lo que quiera. Mientras no pase el tren.']] },
  { id: 'valentina-delia', tema: 'cielo', lineas: [['maestra', 'Valentina, ¿vendrías una noche con los chicos de la escuela?'], ['astronoma', 'Encantada. Que traigan abrigo y ganas de quedarse callados mirando para arriba.']] },
  { id: 'loma-subida', tema: 'loma', lineas: [['madre', 'Cada vez hay más casas en la loma. Desde la plaza se ven las luces de noche.'], ['abuela', 'Así crece un pueblo, Gladys: para arriba y para los costados, como los álamos.']] },
];
// Azar con semilla (mulberry32): la misma semilla elige la misma charla.
export function azar(semilla) {
  let s = (Math.floor(num(semilla) || 0) >>> 0) + 0x6d2b79f5;
  s = Math.imul(s ^ (s >>> 15), s | 1);
  s ^= s + Math.imul(s ^ (s >>> 7), s | 61);
  return ((s ^ (s >>> 14)) >>> 0) / 4294967296;
}
// (3.7.0: sin los que hablan por la radio)
const conQuien = (c) => [...new Set(c.lineas.map(([q]) => q))].filter((q) => !(c.radio || []).includes(q));
export const quienesCharlan = conQuien;
// 3.7.0: cómo se nombra al que habla por la radio
export const NOMBRES_RADIO = { ema: 'Josefina' };
// Las charlas que pueden darse ahora. `presentes`: si se da, todos los de la charla tienen que
// estar ahí (los que el mundo ve juntos).
export function charlasPosibles({ aldea = null, hora = 12, estacion = null, clima = null, presentes = null } = {}) {
  const a = aldea || aldeaNueva();
  const h = (((num(hora) || 0) % 24) + 24) % 24;
  const obra = !!obraEnCurso(a);
  const ahi = Array.isArray(presentes) ? new Set(presentes) : null;
  return CHARLAS_ALDEA.filter((c) => {
    const q = c.cuando || {};
    if (q.clima && !q.clima.includes(clima)) return false;
    if (q.estacion && !q.estacion.includes(estacion)) return false;
    if (q.obra !== undefined && q.obra !== obra) return false;
    if (q.hora && !(h >= q.hora[0] && h < q.hora[1])) return false;
    return conQuien(c).every((k) => presente(a, k) && (!ahi || ahi.has(k)));
  });
}
// Elige una (o null). Las del clima, la estación y la obra pesan más: son de lo que se habla.
export function elegirCharla(opciones = {}) {
  const lista = charlasPosibles(opciones);
  if (!lista.length) return null;
  const pesos = lista.map((c) => (c.cuando ? 3 : 1));
  let r = azar(opciones.semilla) * pesos.reduce((s, x) => s + x, 0);
  for (let i = 0; i < lista.length; i++) { r -= pesos[i]; if (r < 0) return lista[i]; }
  return lista[lista.length - 1];
}
