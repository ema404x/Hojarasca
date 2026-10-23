// 4.10.1: mundo de mentira para las pruebas de los NPC (la aldea real, los empleados reales y los negocios de los vecinos reales).
const U = (f) => new URL('../' + f, import.meta.url).href;
const { registrarThree } = await import('./ayuda-three.mjs');
registrarThree();
export const A = await import(U('src/aldea.js'));
export const G = await import(U('src/aldea-gente.js'));
export const V = await import(U('src/vecindad.js'));
export const M = await import(U('src/empleados-negocio.js'));
export const J = await import(U('src/empleados-negocio-juego.js'));
export const N = await import(U('src/negocio-propio.js'));
export const PN = await import(U('src/planos-negocio.js'));
export const E = await import(U('src/economia.js'));
export const NJ = await import(U('src/noticias-juego.js'));
export const NV = await import(U('src/negocios-vecinos.js'));
export const NVJ = await import(U('src/negocios-vecinos-juego.js'));

export const vec = (x, y, z) => ({ x, y, z, set(a, b, c) { this.x = a; this.y = b; this.z = c; return this; } });

export function crearMundo({ amigos = true, todos = true, hora = 6, dia = 1 } = {}) {
  const a0 = A.aldeaNueva();
  if (todos) {
    a0.pobladores = A.ORDEN_POBLADORES_ALDEA.map((clave) => ({ clave, dia: 1 }));
    a0.locales = Object.fromEntries(A.LOTES_ALDEA.map((l) => [l, 1]));
  }
  a0.descubierta = 1;
  const P = { modo: 'relax', dia, horas: hora, aldea: A.sanearAldea(a0), entradas: {}, materiales: {}, cosas: {}, economia: { ...E.economiaNueva(), pesos: 500000 }, vecindad: V.vecindadNueva() };
  if (amigos) for (const k of V.PERSONAS_VECINDAD) for (let q = 0; q < 20; q++) V.sumarAmistadDe(P, k, 10, 1);
  const M0 = A.marcoAldea(A.PARADA_ALDEA);
  const c0 = M0.aMundo(6, 40);
  const jug = { estado: { pos: vec(c0.x, 0, c0.z), yaw: 0 } };
  const lista = [];
  const mk = (def) => {
    const n = { ...def, pos: vec(def.pos.x, 0, def.pos.z), camino: [], g: { rotation: {}, scale: { setScalar() {} }, visible: true }, poblador: true, dormido: false };
    lista.push(n); return n;
  };
  const gente = {
    gente: lista, agregarPoblador: mk,
    armarPobladorDeAPoco(def) { const t = { npc: null, hecho: false, avanzar() { if (t.hecho) return true; t.npc = mk(def); t.hecho = true; return true; } }; return t; },
    quitar(n) { const i = lista.indexOf(n); if (i >= 0) lista.splice(i, 1); n.quitado = true; },
  };
  return { P, M0, c0, jug, gente, lista };
}
// camina como gente.js (aprox.): dt en segundos, velocidad en m/s
export const mover = (n, dt) => { let q = (n.velocidad || 1) * dt; while (q > 0 && n.camino?.length) { const p = n.camino[0], dx = p.x - n.pos.x, dz = p.z - n.pos.z, dd = Math.hypot(dx, dz); if (dd <= q) { n.pos.x = p.x; n.pos.z = p.z; n.camino.shift(); q -= dd; } else { n.pos.x += (dx / dd) * q; n.pos.z += (dz / dd) * q; q = 0; } } };
