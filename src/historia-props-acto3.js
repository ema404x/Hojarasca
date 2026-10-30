// 4.18.0 (C): los efectos `mundo:` del acto III que hasta la 4.17.0 sólo dejaban una marca (un tema `mundo:<id>` en la historia), ahora con su
// prop en el mundo; los faroles de la loma, las lucecitas ámbar de las raíces, Ramón sentado con la manta junto a la estufa y Fermín en el techo
// del galpón. Módulo PURO (sin three ni DOM; se prueba en Node): acá están el «dónde» y el «cuándo»; las mallas están en `historia-objetos.js`.
//
// Mismo formato que OBJETOS_ACTO2 (historia-disparadores-acto2.js): `forma` (la malla), `punto`/`lugar`/`lx, lz` (dónde, como siempre), `y` (altura
// sobre el piso), `visible(s, h)`. Ninguno tiene acción de E: son cosas que se miran. Campos nuevos (los entiende historia-objetos.js):
//   efecto     'mundo:<id>' | 'duende:<id>' (o una lista): el efecto de escena que lo muestra MIENTRAS DURA LA ESCENA, aunque `visible` todavía no dé
//   usaDonde   true: mientras dura la escena se pone donde la escena lo pide (`args.donde`; si no lo pide, `frente`); al terminar vuelve a su lugar
//   frente     { adelante, lado }: delante del jugador al momento del efecto (para los que no traen `donde`)
//   soloEscena true: sólo existe durante la escena (no tiene lugar fijo)
//   hacia, dist  el lugar fijo es `dist` metros desde `punto` hacia el lugar `hacia` (los faroles: entre tu galpón y la aldea)
//   brillo     true: además de la malla de siempre lleva una de brillo (MeshBasicMaterial con color de vértice, el programa de las brasas de la aldea)
//   apaga      { prop, hasta }: el efecto esconde `prop` hasta el efecto `hasta` (la broma de la luz del galpón)
// Rendimiento y shaders: lo mismo que los objetos de la historia (materialVegetal tipo 0 o 4) y, para lo que brilla, MeshBasicMaterial con color de
// vértice en una malla común: el mismo programa que las brasas de la aldea, que ya está desde la carga. 0 programas nuevos (lo mide la prueba en placa).
import { capituloActual } from './historia.js';

const enCap = (h, ...ids) => ids.includes(capituloActual(h).id);
const deNoche = (s) => s.horas >= 19 || s.horas < 6.5;
const tema = (s, id) => s.temas.has(`mundo:${id}`);
const antesDeLaNoche = (s) => s.nocheEstado !== 'ganada' && s.nocheEstado !== 'perdida';
const diaDeTema = (h, id) => Math.floor(Number(h?.temas?.[`mundo:${id}`]) || 0);

// Los muebles del refugio (coordenadas locales, x a la derecha y z hacia la puerta; ver `estructuras.js`): la mesa en (1,1; −0,98), la tabla a 0,89 m
// del piso de afuera (el piso de adentro está a 0,37); la ventana del frente entre la puerta y x = 1,65, en z = 2,75; la pared izquierda en x = −3,5.
const MESA = { lx: 1.1, lz: -0.98, y: 0.52 };

export const OBJETOS_PROPS_ACTO3 = {
  // ---- capítulo 9: Ramón en cama (la estufa, el banquito y la manta; Ramón se sienta con la pose `sentado` de la escena) y lo del Puesto Alto
  'ramon-estufa': { forma: 'manta-estufa', brillo: true, soloEscena: true, usaDonde: true, efecto: 'mundo:ramon-convaleciente', visible: () => false },
  'hojas-canelo': { forma: 'atado-canelo', punto: 'puesto-alto', dx: 2.2, dz: 1.4, usaDonde: true, efecto: 'mundo:hojas-canelo',
    visible: (s, h) => enCap(h, 'frios') && tema(s, 'hojas-canelo') },
  'corral-abierto': { forma: 'tranquera-abierta', punto: 'puesto', dx: 7, dz: 4, usaDonde: true, efecto: 'mundo:corral-abierto',
    visible: (s, h) => enCap(h, 'frios', 'golpea') && tema(s, 'corral-abierto') && !tema(s, 'ovejas-juntas') },   // (`mundo:ovejas-juntas`: la escena de B que la cierra)
  // ---- optativa «La masa madre» (acto I, B: `mundo:pan-de-rosa`): el pan casero que Rosa deja en el umbral tres mañanas
  'pan-umbral': { forma: 'pan', lx: -0.55, lz: 3.75, efecto: 'mundo:pan-de-rosa',
    visible: (s, h) => tema(s, 'pan-de-rosa') && s.dia - diaDeTema(h, 'pan-de-rosa') >= 0 && s.dia - diaDeTema(h, 'pan-de-rosa') < 3 && s.horas >= 6 && s.horas < 13 },
  // ---- capítulo 10: el galpón de noche (la luz por las rendijas, la puertita clavada al revés), la ventana con barro y el mapa en la mesa
  'galpon-luz': { forma: 'farol-galpon', brillo: true, punto: 'galpon-noche', dx: 0.4, dz: 0.3, efecto: 'mundo:galpon-luz-adentro',
    visible: (s, h) => enCap(h, 'golpea') && tema(s, 'galpon-luz-adentro') && deNoche(s) && !s.escenas.has('galpon-trato') && !s.escenas.has('galpon-pelea') },
  'galpon-luz-broma': { forma: null, efecto: 'mundo:galpon-luz-apagada', apaga: { prop: 'galpon-luz', hasta: 'mundo:galpon-luz-vuelve' }, soloEscena: true, visible: () => false },
  'puertita-reves': { forma: 'puertita-reves', punto: 'galpon-noche', hacia: 'sendero', dist: 2.7, lado: -1.3, usaDonde: true, efecto: 'mundo:puertita-al-reves',
    visible: (s, h) => enCap(h, 'golpea', 'arco', 'nevada') && tema(s, 'puertita-al-reves') },
  'ventana-barro': { forma: 'barro-bellotas', lx: 1.35, lz: 3.0, efecto: 'mundo:ventana-barro-y-bellotas',
    visible: (s, h) => enCap(h, 'golpea', 'arco') && tema(s, 'ventana-barro-y-bellotas') },
  'mapa-mesa': { forma: 'mapa', ...MESA, efecto: 'mundo:mesa-con-mapa',
    visible: (s, h) => enCap(h, 'golpea', 'arco', 'nevada') && tema(s, 'mesa-con-mapa') && antesDeLaNoche(s) },
  // ---- capítulo 11: el arco sin cuerda y las puntas sobre la mesa, el atado de flechas, lo prestado (durante la escena que lo trae) y la pirca más alta
  'arco-mesa': { forma: 'arco-mesa', lx: 0.65, lz: -0.88, y: MESA.y, efecto: 'mundo:arco-sin-cuerda',
    visible: (s, h) => enCap(h, 'arco') && tema(s, 'arco-sin-cuerda') && !s.armas.arco },
  'puntas-mesa': { forma: 'puntas', lx: 1.55, lz: -1.1, y: MESA.y, efecto: 'mundo:puntas-de-flecha',
    visible: (s, h) => enCap(h, 'arco', 'nevada') && tema(s, 'puntas-de-flecha') && antesDeLaNoche(s) },
  'flechas-atado': { forma: 'atado-flechas', lx: -0.9, lz: 2.45, efecto: 'mundo:flechas-extra',
    visible: (s, h) => enCap(h, 'arco', 'nevada') && tema(s, 'flechas-extra') && antesDeLaNoche(s) },
  'estacas-escena': { forma: 'estacas', soloEscena: true, usaDonde: true, efecto: 'mundo:estacas-prestadas', visible: () => false },
  'miel-escena': { forma: 'frascos-miel', soloEscena: true, usaDonde: true, efecto: 'mundo:trampas-de-miel', visible: () => false },
  'durmientes-escena': { forma: 'empalizada', soloEscena: true, usaDonde: true, efecto: 'mundo:empalizada-durmientes', visible: () => false },
  'campana-taller': { forma: 'campana-palo', punto: 'galpon-noche', hacia: 'sendero', dist: 3.4, lado: 2.4, efecto: 'mundo:campana-del-taller',
    visible: (s, h) => enCap(h, 'arco', 'nevada') && tema(s, 'campana-del-taller') && !s.escenas.has('noche-espera') },
  'pirca-alta': { forma: 'pirca-alta', lugar: 'coihue', efecto: 'mundo:pirca-reforzada', visible: (s) => tema(s, 'pirca-reforzada') && s.objetos.has('pirca') },
  // ---- capítulo 12: la aldea en la loma con faroles (D4 = a) y las lucecitas ámbar de las raíces (trato)
  'faroles-loma': { forma: 'faroles', brillo: true, punto: 'galpon-noche', hacia: 'aldea', dist: 34, frente: { adelante: 30, lado: -8 }, usaDonde: true, efecto: 'mundo:faroles-en-la-loma',
    visible: (s, h) => enCap(h, 'nevada') && tema(s, 'faroles-en-la-loma') && s.decisiones.cuaderno === 'a' && deNoche(s) && s.nocheEstado === 'pendiente' },
  'lucecitas-raices': { forma: 'lucecitas', brillo: true, punto: 'galpon-noche', hacia: 'molino-viejo', dist: 9, frente: { adelante: 9, lado: 0 }, usaDonde: true, efecto: 'duende:lucecitas-raices',
    visible: (s, h) => enCap(h, 'nevada') && s.trato === 'trato' && s.escenas.has('noche-espera') && deNoche(s) && s.nocheEstado === 'pendiente' },
  'lucecitas-mirador': { forma: 'lucecitas-tres', brillo: true, soloEscena: true, usaDonde: true, frente: { adelante: 2.4, lado: 0.7 }, efecto: 'duende:lucecitas-mirador', visible: () => false },
  'lucecitas-galpon': { forma: 'lucecitas-ronda', brillo: true, soloEscena: true, punto: 'galpon-noche', efecto: 'duende:lucecitas-rodean-galpon', visible: () => false },
  // ---- capítulo 13: los carteles, la puertita nueva o las puertitas vacías en la raíz, la bellota derecha, el umbral y la pared del refugio
  'cartel-catrileo': { forma: 'cartel-tabla', punto: 'galpon', dx: 3.2, dz: 2.6, efecto: 'mundo:cartel-puesto-catrileo', visible: (s) => tema(s, 'cartel-puesto-catrileo') },
  'cartel-notable': { forma: 'cartel-chapa', lugar: 'coihue', efecto: 'mundo:cartel-arbol-notable', visible: (s) => tema(s, 'cartel-arbol-notable') },
  'puertita-nueva': { forma: 'puertita-nueva', lugar: 'molino-viejo', dx: 0.5, dz: 0.3, efecto: 'mundo:puertita-nueva-en-la-raiz', visible: (s) => tema(s, 'puertita-nueva-en-la-raiz') },
  'puertitas-vacias': { forma: 'puertitas-abiertas', lugar: 'coihue', efecto: 'mundo:puertitas-vacias', visible: (s) => tema(s, 'puertitas-vacias') },
  'bellota-derecha': { forma: 'bellota', lugar: 'molino-viejo', dx: -0.5, dz: 0.4, efecto: 'mundo:bellota-derecha', visible: (s) => tema(s, 'bellota-derecha') },
  'ronda-final': { forma: 'ronda', lx: 0.1, lz: 3.7, efecto: 'mundo:ronda-ramitas-final', visible: (s, h) => tema(s, 'ronda-ramitas-final') && !(h?.costumbre && h.costumbre.bolsa) },
  'bolsa-doblada': { forma: 'bolsa-doblada', lx: 0.85, lz: 3.6, efecto: 'mundo:bolsa-vacia-doblada', visible: (s, h) => tema(s, 'bolsa-vacia-doblada') && !(h?.costumbre && h.costumbre.bolsa) },
  'regalito': { forma: 'canto', lx: 0.45, lz: 3.8, efecto: 'mundo:regalito-umbral', visible: (s, h) => tema(s, 'regalito-umbral') && diaDeTema(h, 'regalito-umbral') === s.dia },
  'arco-honda-pared': { forma: 'arco-honda', lx: -3.3, lz: -0.6, y: 0.95, efecto: 'mundo:arco-y-honda-en-la-pared', visible: (s) => tema(s, 'arco-y-honda-en-la-pared') },
  'repisa-puertita': { forma: 'repisa-puertita', lx: -0.1, lz: -2.55, y: 1.01, efecto: 'mundo:puertita-repisa-abre', visible: (s) => tema(s, 'puertita-repisa-abre') },
  'repisa-canto': { forma: 'repisa-canto', lx: -0.1, lz: -2.55, y: 1.01, efecto: 'mundo:canto-blanco-queda', visible: (s) => tema(s, 'canto-blanco-queda') },
};

// Los `mundo:` que no tienen prop a propósito (son de la mecánica, del mapa, de la gente o del clima): la prueba controla que cada `mundo:` de las
// escenas del acto III tenga prop o esté en esta lista con su razón.
export const MUNDO_SIN_PROP = {
  'majada-al-galpon': 'la majada la mueve el arreo (historia-arreo-mundo.js)',
  'majada-al-paso': 'la majada la mueve el arreo',
  'majada-vellones': 'mecánica: los vellones de la majada',
  'fermin-lana-amiga': 'mecánica: el precio de la lana',
  'fermin-oferta-rechazada': 'charla, sin cosa',
  'fermin-se-fue': 'gente: Fermín deja de estar en el galpón (es de la presencia de A)',
  'cobro-majada': 'mecánica: el pago',
  'galpon-puerta-entornada': 'tu galponcito es abierto: no tiene puerta que entornar',
  'galpon-luz-vuelve': 'vuelve la luz del galpón (la apaga `galpon-luz-apagada`)',
  'lado-del-arroyo-marcado': 'mecánica: el lado de ataque de la noche',
  'plan-de-la-noche': 'mecánica: el plan de la noche',
  'nevada-fuerte': 'el clima forzado de la noche',
  'defensas-armadas': 'las arma la noche (historia-noche-mundo.js)',
  'ramal-salvado': 'el ramal (mecánica)',
  'ramal-a-prueba': 'el ramal (mecánica)',
  'elsa-se-va': 'gente: Elsa se sube al tren (escena)',
  'graciela-se-queda': 'gente: Graciela se queda (mecánica de A)',
  'chicos-dibujan-puertitas': 'sólo se cuenta (no hay escuela con nombre en el mundo)',
  'costumbre-del-trato': 'mecánica: la bolsa del umbral cada cosecha (OBJETOS_ACTO3)',
  'bolsa-llena-en-umbral': 'la bolsa del umbral de la costumbre (OBJETOS_ACTO3, `bolsa-umbral`)',
  'ovejas-juntas': 'cierra el corral abierto (`corral-abierto` deja de verse) y las ovejas vuelven (optativa de B)',
};

// Los efectos de escena que muestran algún prop (para `historia-objetos.js`): efecto → [ids]
export function propsDeEfecto(efecto) {
  const salida = [];
  for (const [id, o] of Object.entries(OBJETOS_PROPS_ACTO3)) {
    const lista = Array.isArray(o.efecto) ? o.efecto : [o.efecto];
    if (lista.includes(efecto)) salida.push(id);
  }
  return salida;
}

// Dónde va un prop `usaDonde`/`frente` al momento del efecto: el punto que da la escena o, si no da ninguno, delante del jugador. `jug`: { pos, yaw }.
// Devuelve { x, z, rot } (rot: mirando al jugador) o null.
export function puestoDeEfecto(o, p, jug) {
  const j = jug?.pos, yaw = Number(jug?.yaw) || 0;
  if (!j || !Number.isFinite(j.x) || !Number.isFinite(j.z)) return p && Number.isFinite(p.x) ? { x: p.x, z: p.z, rot: 0 } : null;
  let q = p && Number.isFinite(p.x) && Number.isFinite(p.z) ? { x: p.x, z: p.z } : null;
  if (!q && o?.frente) {
    const fx = -Math.sin(yaw), fz = -Math.cos(yaw), a = Number(o.frente.adelante) || 0, l = Number(o.frente.lado) || 0;
    q = { x: j.x + fx * a - fz * l, z: j.z + fz * a + fx * l };
  }
  if (!q) return null;
  return { x: q.x, z: q.z, rot: Math.atan2(j.x - q.x, j.z - q.z) };
}

// El lugar fijo de los que van «desde `punto` hacia `hacia`, a `dist` metros» (los faroles entre tu galpón y la aldea). `puntos`: { nombre: {x, z} }.
export function puestoHacia(o, puntos) {
  const a = puntos?.[o?.punto], b = puntos?.[o?.hacia];
  if (!a || !Number.isFinite(a.x)) return null;
  if (!b || !Number.isFinite(b.x)) return { x: a.x + (Number(o.dx) || 0), z: a.z + (Number(o.dz) || 0) };
  const dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz) || 1, k = Math.min(Number(o.dist) || 10, d * 0.8), l = Number(o.lado) || 0;
  // (`lado`: metros hacia un costado, perpendicular a la línea; rot: el frente del prop, +z local, mira hacia `hacia`)
  return { x: a.x + (dx / d) * k - (dz / d) * l, z: a.z + (dz / d) * k + (dx / d) * l, rot: Math.atan2(dx, dz) };
}

// ---------------------------------------------------------------- Fermín en el techo del galpón (la noche, con lazo ≥ +2)
// `galpon`: los datos de tu galponcito (x, z, rot; la cumbrera del techo de dos aguas está a alto + 1,2 = 3,5 m: construccion.js) o null; `altura(x, z)`: el suelo; `dis`: el diseño
// de la noche (centro, ux, uz: hacia el lado de ataque). Devuelve { x, y, z, rumbo } (sobre la cumbrera, mirando al lado de ataque) o null sin galponcito.
export const TECHO_GALPONCITO = { cumbrera: 3.52, ancho: 4.6, fondo: 3.6 };
export function ferminEnElTecho(galpon, altura, dis) {
  if (!galpon || !Number.isFinite(galpon.x) || !Number.isFinite(galpon.z) || typeof altura !== 'function') return null;
  const rot = Number(galpon.rot) || 0;
  // sobre la cumbrera (corre a lo largo del z local del galpón), corrido 0,9 m: no queda justo arriba del centro, donde miran las escenas del galpón
  const lz = 0.9, x = galpon.x + lz * Math.sin(rot), z = galpon.z + lz * Math.cos(rot);
  const suelo = Number(altura(galpon.x, galpon.z));
  if (!Number.isFinite(suelo)) return null;
  const ux = Number(dis?.ux), uz = Number(dis?.uz);
  const rumbo = Number.isFinite(ux) && Number.isFinite(uz) && (ux || uz) ? Math.atan2(ux, uz) : rot;
  return { x, y: suelo + TECHO_GALPONCITO.cumbrera, z, rumbo };
}
