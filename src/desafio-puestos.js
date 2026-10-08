// 3.0: el contraataque de día. Los puestos de avanzada de los invasores.
//
// Con las noches, los invasores levantan puestos en el bosque: una aguja que se ve de
// lejos, vainas de cría y, cuando crecen, un generador de cristal que blinda lo demás.
// De día los cuidan unos pocos dormidos. Son los chicos, los que se ven: el nido es la
// base grande y enterrada (desafio-nido.js), y después de la nodriza los puestos
// aparecen hacia su lado y cada uno que rompés te da una señal de dónde está.
//
//   · Cada puesto en pie manda invasores de más cada noche, desde donde está.
//   · Si nadie lo toca, crece: más estructuras, más guardias, manda más.
//   · Si lo rompés (todas sus estructuras), deja cristales y materiales, y la noche
//     siguiente vienen menos y más flojos: el aviso dice de qué lado.
//
// Módulo puro (sin THREE ni DOM). Donde se reparte en el mapa sale de la semilla del
// Desafío si la hay (el `azar` lo pasa quien llama, con `azarDe`).
import { LIMITE } from './config.js';

export const PUESTOS = {
  desdeNoche: 2,            // el primero aparece al amanecer de la segunda noche
  cada: 2,                  // y después, cada dos noches, si hay lugar
  maximos: [2, 3, 3, 4],    // cuántos en pie a la vez, por etapa de la campaña (de a cinco noches)
  distancia: [85, 200],     // del centro de la base (el nido anda a 260 o más)
  separacion: 60,           // entre puestos
  nivelMax: 3,
  creceCada: 2,             // noches que tarda en crecer un nivel si nadie lo toca
  radioVisto: 55,           // a esta distancia queda anotado en el mapa
  radioGuardias: 70,        // los guardias se ponen recién cuando te acercás de día
  radioUsar: 2.6,
  escudo: 0.5,              // con un generador en pie, lo demás recibe la mitad
  recorte: 2,               // al romperlo, la noche siguiente vienen tantos menos (+1 por nivel)
  debilitados: 0.85,        // y los que vienen, con menos vida
  maxPorNoche: 8,           // tope de los que mandan todos los puestos juntos en una noche
  quemar: 2.5,              // segundos que tarda en consumirse una vaina prendida
};

// Las tres estructuras. `alto` es para la malla y para dónde pegan las flechas.
export const ESTRUCTURAS = {
  aguja: { nombre: 'hongo alto', vida: 150, radio: 1.6, alto: 5.2 },
  vaina: { nombre: 'bolsa de esporas', vida: 80, radio: 1.0, alto: 1.7 },
  generador: { nombre: 'semilla dorada', vida: 110, radio: 1.2, alto: 2.3 },
};
// Lo que se agrega en cada nivel (el 1 arranca con la aguja y una vaina).
const POR_NIVEL = { 1: ['aguja', 'vaina'], 2: ['generador'], 3: ['vaina', 'vaina'] };

const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const acotar = (v, a, b) => (v < a ? a : v > b ? b : v);

export function etapaDe(noche) { return acotar(Math.floor((Math.max(1, num(noche, 1)) - 1) / 5), 0, PUESTOS.maximos.length - 1); }
export function maxPuestos(noche) { return PUESTOS.maximos[etapaDe(noche)]; }

export function puestosNuevos() { return { lista: [], proximoId: 1, golpes: [], rotos: 0 }; }
export function enPie(p) { return !!p && !p.roto && Array.isArray(p.estructuras) && p.estructuras.some((e) => e.vida > 0); }
export function activos(estado) { return (estado?.lista || []).filter(enPie); }

// ¿Al amanecer de esta noche aparece un puesto nuevo?
export function tocaPuesto(noche, cuantosEnPie) {
  const n = Math.floor(num(noche, 0));
  if (n < PUESTOS.desdeNoche || (n - PUESTOS.desdeNoche) % PUESTOS.cada !== 0) return false;
  return cuantosEnPie < maxPuestos(n);
}

// Dónde: en el bosque alrededor de la base, lejos de los otros puestos y del nido.
// `hacia` (radianes, opcional): con el nido ya en el valle, los puestos salen de su lado.
export function lugarDelPuesto(centro, { esBueno = () => true, azar = Math.random, otros = [], nido = null, hacia = null } = {}) {
  const cx = num(centro?.x, 0), cz = num(centro?.z, 0);
  for (let i = 0; i < 120; i++) {
    const a = hacia === null || !Number.isFinite(hacia) ? azar() * Math.PI * 2 : hacia + (azar() - 0.5) * (Math.PI * 2 / 3);
    const d = PUESTOS.distancia[0] + azar() * (PUESTOS.distancia[1] - PUESTOS.distancia[0]);
    const x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d;
    if (Math.abs(x) > LIMITE - 40 || Math.abs(z) > LIMITE - 40) continue;
    if (otros.some((o) => Math.hypot(o.x - x, o.z - z) < PUESTOS.separacion)) continue;
    if (nido && Math.hypot(nido.x - x, nido.z - z) < 50) continue;
    if (!esBueno(x, z)) continue;
    return { x: Math.round(x * 10) / 10, z: Math.round(z * 10) / 10 };
  }
  return null;
}

// Con el mapa de la semilla (desafio-mapa.js), los puestos salen de sus lugares: mismo
// código, mismos puestos. El primero de la lista que esté libre (ni usado por otro puesto,
// aunque esté roto, ni pegado a uno en pie ni al nido). Con el nido en el valle, primero
// los de su lado. Sin lugar libre, null (y se usa lugarDelPuesto).
export function sitioDelPuesto(sitios, { esBueno = () => true, otros = [], usados = [], nido = null, hacia = null, centro = null } = {}) {
  let lista = (Array.isArray(sitios) ? sitios : []).filter((s) => s && Number.isFinite(Number(s.x)) && Number.isFinite(Number(s.z)));
  if (hacia !== null && Number.isFinite(hacia) && centro) {
    const dif = (s) => { const a = Math.atan2(s.z - centro.z, s.x - centro.x) - hacia; return Math.abs(Math.atan2(Math.sin(a), Math.cos(a))); };
    const lado = (s) => (dif(s) <= Math.PI / 3 ? 0 : 1);   // los de su lado primero, en el orden del mapa
    lista = lista.map((s, i) => ({ s, i, k: lado(s) })).sort((a, b) => a.k - b.k || a.i - b.i).map((x) => x.s);
  }
  for (const s of lista) {
    const x = Number(s.x), z = Number(s.z);
    if (usados.some((u) => Math.hypot(u.x - x, u.z - z) < 1)) continue;
    if (otros.some((o) => Math.hypot(o.x - x, o.z - z) < PUESTOS.separacion)) continue;
    if (nido && Math.hypot(nido.x - x, nido.z - z) < 50) continue;
    if (!esBueno(x, z)) continue;
    return { x, z };
  }
  return null;
}

function sumarEstructuras(p, nivel, azar) {
  for (const tipo of POR_NIVEL[nivel] || []) {
    const E = ESTRUCTURAS[tipo];
    // la aguja en el medio; lo demás alrededor, a unos metros
    let dx = 0, dz = 0;
    if (tipo !== 'aguja') {
      for (let k = 0; k < 12; k++) {
        const a = azar() * Math.PI * 2, r = 3.2 + azar() * 2.6;
        dx = Math.round(Math.cos(a) * r * 10) / 10; dz = Math.round(Math.sin(a) * r * 10) / 10;
        if (!p.estructuras.some((e) => Math.hypot(e.dx - dx, e.dz - dz) < 2.4)) break;
      }
    }
    p.estructuras.push({ tipo, dx, dz, vida: E.vida, max: E.vida });
  }
}

export function puestoNuevo(id, pos, noche, azar = Math.random) {
  const nacio = Math.floor(num(noche, 0));
  const p = { id, x: num(pos?.x), z: num(pos?.z), nivel: 1, nacio, crecio: nacio, estructuras: [], guardias: 2, visto: false, roto: false };
  sumarEstructuras(p, 1, azar);
  return p;
}

// Al amanecer: los que nadie tocó crecen. Devuelve los que crecieron.
export function crecerPuestos(estado, noche, azar = Math.random) {
  const crecieron = [];
  for (const p of activos(estado)) {
    if (p.nivel >= PUESTOS.nivelMax) continue;
    if (Math.floor(num(noche)) - p.crecio < PUESTOS.creceCada) continue;
    p.nivel++;
    p.crecio = Math.floor(num(noche));
    sumarEstructuras(p, p.nivel, azar);
    p.guardias = Math.min(5, p.guardias + 1);
    crecieron.push(p);
  }
  return crecieron;
}

// Lo que manda cada puesto en pie esta noche: uno por nivel; desde el nivel 2 uno de
// ellos es tirador; en el 3, un bruto. Con tope entre todos.
export function queMandan(estado, azar = Math.random) {
  const salida = [];
  let total = 0;
  for (const p of activos(estado)) {
    const tipos = [];
    for (let i = 0; i < p.nivel && total < PUESTOS.maxPorNoche; i++, total++) {
      tipos.push(i === 1 ? 'tirador' : i === 2 ? 'bruto' : azar() < 0.3 ? 'saltador' : 'rastreador');
    }
    if (tipos.length) salida.push({ id: p.id, x: p.x, z: p.z, tipos });
  }
  return salida;
}

// Los guardias de día: dormidos, y del tipo del nivel.
export function guardiasDe(p) {
  const n = Math.max(0, Math.floor(num(p?.guardias)));
  const lista = [];
  for (let i = 0; i < n; i++) lista.push(i === 2 && p.nivel >= 2 ? 'bruto' : i === 1 ? 'tirador' : 'rastreador');
  return lista;
}

// Un golpe a una estructura. Con un generador en pie, lo demás recibe la mitad.
export function danarEstructura(p, i, dano) {
  const e = p?.estructuras?.[i];
  if (!e || e.vida <= 0 || p.roto) return { ok: false };
  let d = Math.max(0, num(dano));
  const blindado = e.tipo !== 'generador' && p.estructuras.some((q) => q.tipo === 'generador' && q.vida > 0);
  if (blindado) d *= PUESTOS.escudo;
  e.vida = Math.max(0, e.vida - d);
  const rota = e.vida <= 0;
  const destruido = rota && !enPie(p);
  if (destruido) p.roto = true;
  return { ok: true, rota, destruido, blindado, dano: d };
}

// Lo que deja un puesto roto.
export function premioPuesto(nivel) {
  const n = acotar(Math.floor(num(nivel, 1)), 1, PUESTOS.nivelMax);
  return { cristal: 2 + n * 2, piedra: 2 + n, tabla: 1 + n };
}

// El golpe que se anota al romperlo: la noche siguiente vienen menos desde ese lado.
// `noche` es d.oleadas (la última que empezó).
export function golpeDelPuesto(p, noche, centro = { x: 0, z: 0 }) {
  return {
    noche: Math.floor(num(noche)) + 1,
    menos: PUESTOS.recorte + acotar(Math.floor(num(p?.nivel, 1)), 1, PUESTOS.nivelMax),
    rumbo: Math.round(Math.atan2(num(p?.x) - num(centro.x), num(p?.z) - num(centro.z)) * 1000) / 1000,
  };
}
// Lo que suman los golpes de esa noche.
export function golpesDeLaNoche(estado, noche) {
  return (estado?.golpes || []).filter((g) => g.noche === Math.floor(num(noche)));
}
// La oleada con los golpes aplicados: se sacan invasores del final de la lista (los más
// raros), nunca el jefe y nunca por debajo de dos.
export function recortarOleada(tipos, estado, noche) {
  const menos = golpesDeLaNoche(estado, noche).reduce((s, g) => s + g.menos, 0);
  if (!menos || !Array.isArray(tipos)) return tipos;
  const jefes = tipos.filter((t) => t === 'jefe');
  const resto = tipos.filter((t) => t !== 'jefe');
  const quedan = Math.max(2 - jefes.length, resto.length - menos, 0);
  return [...resto.slice(0, quedan), ...jefes];
}

// E junto a una estructura: la vaina se quema con una ramita (como los capullos); al
// generador se le arranca el cristal (se rompe y te lo quedás).
export function usarEstructura(tipo, { ramitas = 0, lluvia = 0 } = {}) {
  if (tipo === 'generador') return { accion: 'arrancar' };
  if (tipo !== 'vaina') return { accion: 'nada' };
  if (lluvia > 0.55) return { accion: 'mojado' };
  if (ramitas < 1) return { accion: 'sinRamitas' };
  return { accion: 'quemar' };
}
export function avisoEstructura(tipo, { ramitas = 0, lluvia = 0 } = {}) {
  if (tipo === 'generador') return 'Arrancar la semilla dorada';
  if (tipo !== 'vaina') return null;
  if (lluvia > 0.55) return 'Bolsa de esporas: mojada no prende, rompela a golpes';
  return ramitas > 0 ? 'Quemar la bolsa de esporas (1 ramita)' : 'Bolsa de esporas: juntá una ramita para quemarla, o rompela a golpes';
}

export function sanearPuestos(v) {
  const x = v && typeof v === 'object' && !Array.isArray(v) ? v : {};
  const s = puestosNuevos();
  const lista = Array.isArray(x.lista) ? x.lista : [];
  let maxId = 0;
  for (const p of lista.slice(0, 12)) {
    if (!p || typeof p !== 'object' || !Number.isFinite(Number(p.x)) || !Number.isFinite(Number(p.z))) continue;
    const estructuras = (Array.isArray(p.estructuras) ? p.estructuras : [])
      .filter((e) => e && typeof e.tipo === 'string' && Object.hasOwn(ESTRUCTURAS, e.tipo))
      .slice(0, 8)
      .map((e) => {
        const max = ESTRUCTURAS[e.tipo].vida;
        return { tipo: e.tipo, dx: acotar(num(e.dx), -10, 10), dz: acotar(num(e.dz), -10, 10), vida: acotar(num(e.vida, max), 0, max), max };
      });
    if (!estructuras.length) continue;
    const id = Math.max(1, Math.floor(num(p.id, 0))) || 1;
    maxId = Math.max(maxId, id);
    const nacio = Math.max(0, Math.floor(num(p.nacio)));
    s.lista.push({
      id, x: acotar(Number(p.x), -LIMITE, LIMITE), z: acotar(Number(p.z), -LIMITE, LIMITE),
      nivel: acotar(Math.floor(num(p.nivel, 1)), 1, PUESTOS.nivelMax), nacio,
      crecio: Math.max(nacio, Math.floor(num(p.crecio, nacio))),
      estructuras, guardias: acotar(Math.floor(num(p.guardias)), 0, 5), visto: !!p.visto, roto: !!p.roto || !estructuras.some((e) => e.vida > 0),
    });
  }
  // los rotos no hace falta guardarlos para siempre: quedan los últimos
  const rotos = s.lista.filter((p) => p.roto);
  if (rotos.length > 4) s.lista = s.lista.filter((p) => !p.roto || rotos.slice(-4).includes(p));
  s.proximoId = Math.max(maxId + 1, Math.floor(num(x.proximoId, 1)));
  s.golpes = (Array.isArray(x.golpes) ? x.golpes : [])
    .filter((g) => g && Number.isFinite(Number(g.noche)))
    .slice(-6)
    .map((g) => ({ noche: Math.max(0, Math.floor(Number(g.noche))), menos: acotar(Math.floor(num(g.menos)), 0, 10), rumbo: num(g.rumbo) }));
  s.rotos = Math.max(0, Math.floor(num(x.rotos)));
  return s;
}
