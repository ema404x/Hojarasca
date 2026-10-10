// 3.7.3 (tren): las reglas de "La trochita" mejorada, sin nada de three ni del DOM (se prueba en Node).
//
// Qué tiene el tren lo decide el taller (src/tren-mejoras.js, del equipo del taller) y se guarda en
// `progreso.tren` con este contrato:
//   loco: { caldera 0..3, freno 0..3, farol, silbato ('comun'|'grave'|'doble'|'pajaro'), quitanieves, arenero,
//           pintura: { cuerpo, franja, ruedas }, nombre, banderines }
//   vagones: { pasajeros, comedor, carga, caballo, mirador, dormitorio }   (los que tenés)
//   composicion: [ids de vagones, en orden]                                 (los que van enganchados)
// Acá se lee con valores por defecto (`sanearEstadoTren`), por si el taller todavía no lo guardó.
//
// Lo de acá:
//   · la composición que sale a la vía: ténder + hasta 4 vagones; sin vagones nuevos, los dos coches de
//     segunda de siempre (`composicionDe`);
//   · el manejo: la caldera da más tirón y más velocidad, el freno frena más fuerte; sin arenero, con
//     lluvia o helada, las ruedas patinan un poco (`manejoDe`, `agarreDe`);
//   · la vía nevada (la gran nevada de la 3.7.4 la tapa con `taparVia` de trochita.js): sin quitanieves
//     el tren se planta en la nieve; con quitanieves pasa despacio y la deja abierta (`tramoNevado`);
//   · los silbatos del taller (`silbatoDelTren`);
//   · lo del viaje: tu caballo en la jaula, el mate del comedor, los vecinos que viajan y charlan
//     (`sanearViaje`, `pasajerosDelDia`, `charlaDelViaje`).

export const TREN = {
  maxVagones: 4,            // ténder + 4 vagones: unos 57 m de tren (con los 6 serían 70)
  caldera: { traccion: 0.22, vmax: 0.12 },   // por nivel: +22 % de tirón y +12 % de velocidad máxima
  freno: 0.35,              // por nivel: +35 % de frenada
  patina: 0.5,              // sin arenero, con la vía mojada o helada del todo, el agarre baja a la mitad
  nieve: { vmax: 4.5, frena: 3.2, espera: 240 },   // con quitanieves, a paso de hombre; sin, se planta; la cuadrilla tarda
  mateCada: 1.5,            // horas de juego entre un mate y otro en el comedor
  charlaCada: 26,           // segundos entre una charla y otra de los vecinos que viajan
};

export const ID_VAGONES = ['pasajeros', 'comedor', 'carga', 'caballo', 'mirador', 'dormitorio'];
// los vagones (y el coche de segunda de siempre): `viaja` = se viaja adentro; `letrero` = lo que dice al costado
export const VAGONES = {
  segunda: { nombre: 'coche de segunda', viaja: true },
  segunda2: { nombre: 'coche de segunda', viaja: true },
  pasajeros: { nombre: 'coche de pasajeros con salamandra', viaja: true },
  comedor: { nombre: 'coche comedor', viaja: true },
  dormitorio: { nombre: 'coche dormitorio', viaja: true },
  mirador: { nombre: 'coche mirador', viaja: true },
  carga: { nombre: 'furgón de carga', viaja: false },
  caballo: { nombre: 'jaula para el caballo', viaja: false },
};
export const SILBATOS_DEL_TALLER = ['comun', 'grave', 'doble', 'pajaro'];

const objeto = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const entero = (v, a, b) => Math.max(a, Math.min(b, Math.floor(Number(v) || 0)));
const colorHex = (v) => (typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v) ? v.toLowerCase() : null);

export function estadoTrenNuevo() {
  return {
    loco: { caldera: 0, freno: 0, farol: false, silbato: 'comun', quitanieves: false, arenero: false, pintura: { cuerpo: null, franja: null, ruedas: null }, nombre: '', banderines: false },
    vagones: Object.fromEntries(ID_VAGONES.map((id) => [id, false])),
    composicion: [],
  };
}
// El estado del taller con valores por defecto (lo que falte o venga roto, como al principio). No saca lo
// que no conoce: el taller puede guardar más cosas.
export function sanearEstadoTren(v) {
  const b = estadoTrenNuevo();
  if (!objeto(v)) return b;
  const l = objeto(v.loco) ? v.loco : {};
  const p = objeto(l.pintura) ? l.pintura : {};
  const loco = {
    ...l,
    caldera: entero(l.caldera, 0, 3), freno: entero(l.freno, 0, 3),
    farol: !!l.farol, quitanieves: !!l.quitanieves, arenero: !!l.arenero, banderines: !!l.banderines,
    silbato: SILBATOS_DEL_TALLER.includes(l.silbato) ? l.silbato : 'comun',
    pintura: { cuerpo: colorHex(p.cuerpo), franja: colorHex(p.franja), ruedas: colorHex(p.ruedas) },
    nombre: typeof l.nombre === 'string' ? l.nombre.replace(/[\u0000-\u001f]/g, '').trim().slice(0, 18) : '',
  };
  const vv = objeto(v.vagones) ? v.vagones : {};
  const vagones = Object.fromEntries(ID_VAGONES.map((id) => [id, !!vv[id]]));
  const composicion = [];
  for (const id of Array.isArray(v.composicion) ? v.composicion : []) {
    if (ID_VAGONES.includes(id) && vagones[id] && !composicion.includes(id)) composicion.push(id);
  }
  return { ...v, loco, vagones, composicion: composicion.slice(0, TREN.maxVagones) };
}

// Los vagones que salen a la vía detrás del ténder, en orden (ids de VAGONES; 'segunda' y 'segunda2' son los
// de siempre). Sin vagones nuevos, los dos de segunda (3.8.4: con vagones y ninguno elegido, sólo la locomotora). Con
// alguno elegido siempre hay dónde viajar: si no va ningún coche de pasajeros, adelante va uno de segunda; y nunca menos
// de dos vagones (como el tren de antes).
// 3.8.4: con vagones hechos en el taller y ninguno enganchado, sale sólo la locomotora con su ténder (`[]`: sin carga y
// sin pasajeros, se viaja en la cabina). Antes salían todos los que tuvieras.
export function composicionDe(estado) {
  const e = sanearEstadoTren(estado);
  // (`composicion` vacía tal cual: no elegiste ninguno; una elegida con vagones que no tenés, como antes: los que tengas)
  if (Array.isArray(estado?.composicion) && !estado.composicion.length && ID_VAGONES.some((id) => e.vagones[id])) return [];
  if (!e.composicion.length) e.composicion = ID_VAGONES.filter((id) => e.vagones[id]);
  let lista = e.composicion.slice();
  lista = lista.slice(0, TREN.maxVagones);
  if (!lista.some((id) => VAGONES[id].viaja)) lista = ['segunda', ...lista].slice(0, TREN.maxVagones);
  if (lista.length < 2) lista.push(lista.includes('segunda') ? 'segunda2' : 'segunda');
  return lista;
}
export const viajaEn = (id) => Object.hasOwn(VAGONES, id) && VAGONES[id].viaja;
export const tieneVagon = (estado, id) => composicionDe(estado).includes(id);

// Cuánto rinde la locomotora manejando: multiplicadores de la cabina (ver maquinista.js)
export function manejoDe(estado) {
  const l = sanearEstadoTren(estado).loco;
  return { traccion: 1 + TREN.caldera.traccion * l.caldera, vmax: 1 + TREN.caldera.vmax * l.caldera, freno: 1 + TREN.freno * l.freno };
}
// El agarre de las ruedas (1: firme). Sin arenero, la lluvia o la helada (0..1) lo bajan.
export function agarreDe(estado, { lluvia = 0, helada = 0 } = {}) {
  if (sanearEstadoTren(estado).loco.arenero) return 1;
  const mojado = Math.max(0, Math.min(1, Math.max(Number(lluvia) || 0, Number(helada) || 0)));
  return 1 - TREN.patina * mojado;
}

// El silbato: el del taller si elegiste uno; si no ('comun'), el de "Personalizar" (2.8). Devuelve un id de
// SILBATOS (personal-trochita.js) o, el del pájaro, sus caños y toques.
// 3.8.4: tres campanitas chicas en fa mayor (fa, la, do), con el mismo vapor que los demás (ver `Sonido.silbato`)
export const SILBATO_PAJARO = { nombre: 'De pájaro, el del taller', canos: [[1397, 0.045], [1760, 0.03], [2093, 0.016]], toques: [[0, 0.16], [0.22, 0.16], [0.44, 0.16], [0.7, 0.55]], vibrato: 9, soplo: 1800 };
export function silbatoDelTren(estado, personal = 'clasico') {
  const s = sanearEstadoTren(estado).loco.silbato;
  if (s === 'pajaro') return SILBATO_PAJARO;
  if (s === 'grave' || s === 'doble') return s;
  return typeof personal === 'string' ? personal : 'clasico';
}

// ---------------------------------------------------------------- la vía nevada
// Tramos tapados de nieve: [{ desde, hasta }] en metros a lo largo de la vía (0..largo; `hasta` puede pasar
// el largo: la vía es un anillo). Sanea, ordena y descarta lo que no sirve.
export function sanearNevada(tramos, largo) {
  if (!Array.isArray(tramos) || !(largo > 0)) return [];
  const salida = [];
  for (const t of tramos) {
    if (!objeto(t)) continue;
    let d = Number(t.desde), h = Number(t.hasta);
    if (!Number.isFinite(d) || !Number.isFinite(h)) continue;
    d = ((d % largo) + largo) % largo;
    let l = h - Number(t.desde);
    if (!(l > 0)) continue;
    l = Math.min(l, largo * 0.5);
    salida.push({ desde: d, hasta: d + l });
    if (salida.length >= 8) break;
  }
  return salida.sort((a, b) => a.desde - b.desde);
}
const adelante = (de, a, largo) => (((a - de) % largo) + largo) % largo;
// El tramo nevado en que está `s` (o null), y cuánto falta hasta el próximo (Infinity si no hay).
export function tramoNevado(s, tramos, largo) {
  for (const t of tramos || []) {
    const d = adelante(t.desde, s, largo);
    if (d <= t.hasta - t.desde) return t;
  }
  return null;
}
export function distanciaANieve(s, tramos, largo) {
  let mejor = Infinity;
  for (const t of tramos || []) {
    if (tramoNevado(s, [t], largo)) return 0;
    mejor = Math.min(mejor, adelante(s, t.desde, largo));
  }
  return mejor;
}
// Lo que hace el tren en la nieve: con quitanieves va despacio (y la abre); sin, se planta.
export function enLaNieve(estado) {
  return sanearEstadoTren(estado).loco.quitanieves ? { pasa: true, vmax: TREN.nieve.vmax } : { pasa: false, vmax: 0 };
}

// ---------------------------------------------------------------- el viaje (progreso.trenViaje)
// `caballo`: tu caballo va en la jaula. `mate`: la hora (día × 24 + horas) del último mate en el comedor.
// 3.8.4: `subio`: cuándo te subiste (día × 24 + horas; marca el viaje). `siesta`: el `subio` del viaje en que dormiste la
// siesta en la cucheta (null: ninguna). Una siesta por viaje: antes cada E en la cucheta adelantaba dos horas más.
export function sanearViaje(v) {
  const o = objeto(v) ? v : {};
  const n = (x) => (x !== null && x !== undefined && x !== '' && Number.isFinite(Number(x)) ? Number(x) : null);
  return { caballo: !!o.caballo, mate: Number.isFinite(Number(o.mate)) ? Number(o.mate) : -1e9, subio: n(o.subio) ?? 0, siesta: n(o.siesta) };
}
// 3.8.4: lo de cada viaje: al subirte empieza uno nuevo (la siesta vuelve a estar)
export function empezarViaje(viaje, ahora) { if (objeto(viaje)) viaje.subio = Number.isFinite(Number(ahora)) ? Number(ahora) : 0; return viaje; }
export const puedeSiesta = (viaje) => { const v = sanearViaje(viaje); return v.siesta === null || v.siesta !== v.subio; };
export function anotarSiesta(viaje) { if (objeto(viaje)) viaje.siesta = sanearViaje(viaje).subio; return viaje; }
export function puedeMatear(viaje, ahora) {
  return ahora - sanearViaje(viaje).mate >= TREN.mateCada;
}
export const FRASES_MATE = [
  'El agua justa, ni hervida. El paisaje pasa despacio por la ventanilla.',
  'Un mate amargo y una torta frita. El traqueteo arrulla.',
  'Cebás uno para vos y otro para el guarda, que pasa revisando boletos.',
  'Con yuyos de la sierra. Afuera, el valle se pone de otro color.',
];
export const fraseMate = (n) => FRASES_MATE[((Math.floor(Number(n) || 0) % FRASES_MATE.length) + FRASES_MATE.length) % FRASES_MATE.length];

// Los vecinos que viajan en el coche de pasajeros: dos de la aldea, distintos cada día.
export const VIAJEROS = ['nelida', 'abuela', 'padre', 'madre', 'galesa'];
export function pasajerosDelDia(dia) {
  const d = Math.max(1, Math.floor(Number(dia) || 1));
  const a = d % VIAJEROS.length, b = (a + 1 + (Math.floor(d / VIAJEROS.length) % (VIAJEROS.length - 1))) % VIAJEROS.length;
  return [VIAJEROS[a], VIAJEROS[b === a ? (a + 1) % VIAJEROS.length : b]];
}
// Lo que charlan (por turno; `quien` y `otro` son los nombres de pila)
export const CHARLAS_DEL_VIAJE = [
  (q, o) => `${q}: Con la salamandra prendida da gusto viajar, ¿no, ${o}?`,
  (q) => `${q}: Mi abuelo decía que en la nevada grande el tren se quedó tres días en la meseta, y salieron todos jugando al truco.`,
  (q, o) => `${o}: ¿Vio que el guarda le echa leña a la estufa en cada parada? ${q}: Así tiene que ser.`,
  (q) => `${q}: Voy a la estación del valle a buscar una encomienda. Si llega, invito tortas fritas.`,
  (q, o) => `${q}: Mirá, ${o}, un cóndor. Allá, sobre la loma.`,
  (q) => `${q}: Antes la trochita traía la lana hasta acá. Ahora trae gente, que es mejor.`,
  (q, o) => `${o}: El maquinista silba antes de cada curva. ${q}: Es por las vacas, que se cruzan.`,
  (q) => `${q}: Arrimate a la estufa, que afuera hace un frío de perros.`,
];
export function charlaDelViaje(n, quien, otro) {
  const k = ((Math.floor(Number(n) || 0) % CHARLAS_DEL_VIAJE.length) + CHARLAS_DEL_VIAJE.length) % CHARLAS_DEL_VIAJE.length;
  return CHARLAS_DEL_VIAJE[k](quien || 'Una vecina', otro || 'vecina');
}

// ---------------------------------------------------------------- el furgón de carga
// Con el furgón enganchado, cada parada ofrece dos fletes de carga más por día y se pueden llevar más a la vez.
export const FURGON = { fletesExtra: 2, aLaVez: 5 };   // (aLaVez: el tope del saneo en comercio.js, COMERCIO.fletesConFurgon)
