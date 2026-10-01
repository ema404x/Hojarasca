// 2.1: el grabador de cantos.
//
// Los que salen a ver aves lo saben: si le hacés escuchar a un ave su propio canto,
// contesta, y muchas veces se acerca a ver quién anda en su territorio. Con el grabador
// (se cambia en el almacén) se graba el canto de un ave que ya anotaste, y después se
// reproduce: la más cercana de esa especie contesta desde donde está —así sabés para
// qué lado ir— y las que pueden moverse, se acercan.
//
// Puro: sin audio ni THREE. El juego lo cablea en `main.js` y `fauna.js`.

// Qué se puede grabar: la especie del cuaderno, el método del motor de sonido que la
// hace cantar, y si viene a ver (las que están quietas en su lugar sólo contestan).
export const CANTOS = {
  chucao: { metodo: 'chucao', nombre: 'el chucao', viene: false },
  carpintero: { metodo: 'carpintero', nombre: 'el carpintero', viene: true },
  cachana: { metodo: 'cachanas', nombre: 'las cachañas', viene: true },
  concon: { metodo: 'concon', nombre: 'el concón', viene: false },
  bandurria: { metodo: 'bandurrias', nombre: 'las bandurrias', viene: false },
  cauquen: { metodo: 'cauquen', nombre: 'el cauquén', viene: false },
  cisne: { metodo: 'cisnes', nombre: 'los cisnes', viene: false },
  martin: { metodo: 'martin', nombre: 'el martín pescador', viene: false },
  picaflor: { metodo: 'picaflor', nombre: 'el picaflor', viene: false },
};
export const ESPECIE_DE_METODO = Object.fromEntries(Object.entries(CANTOS).map(([esp, c]) => [c.metodo, esp]));

export const ALCANCE_GRABAR = 60;     // metros: más lejos, el grabador junta puro viento
export const VIDA_CANTO = 6;          // segundos: después de eso el canto ya pasó
export const ALCANCE_RESPUESTA = 220; // metros: hasta dónde se oye y contesta

// Lo último que cantó en el valle, para poder grabarlo. Lista corta, lo más nuevo al final.
export function anotarCanto(lista, especie, pos, ahora) {
  if (!CANTOS[especie] || !pos) return lista;
  lista.push({ especie, x: pos.x, z: pos.z, t: ahora });
  if (lista.length > 16) lista.splice(0, lista.length - 16);
  return lista;
}

// ¿Qué se puede grabar ahora? El canto más cercano, reciente y al alcance. Devuelve
//   { especie }                       si se puede grabar,
//   { especie, motivo: 'sinAnotar' }  si cantó algo que todavía no está en el cuaderno,
//   { especie, motivo: 'yaGrabado' }  si ya lo tenés,
//   null                              si no cantó nada cerca.
export function queGrabar(cantos, pos, ahora, entradas = {}, grabaciones = {}) {
  let mejor = null;
  for (const c of cantos || []) {
    if (ahora - c.t > VIDA_CANTO) continue;
    const d = Math.hypot(c.x - pos.x, c.z - pos.z);
    if (d > ALCANCE_GRABAR) continue;
    // lo que falta grabar va antes que lo que ya está
    const peso = d + (grabaciones[c.especie] ? 1000 : 0) + (entradas[c.especie] ? 0 : 500);
    if (!mejor || peso < mejor.peso) mejor = { especie: c.especie, d, peso };
  }
  if (!mejor) return null;
  if (!entradas[mejor.especie]) return { especie: mejor.especie, motivo: 'sinAnotar' };
  if (grabaciones[mejor.especie]) return { especie: mejor.especie, motivo: 'yaGrabado' };
  return { especie: mejor.especie };
}

// Cuál se reproduce: se pasa de a una, en el orden del cuaderno.
export function siguienteGrabacion(grabaciones = {}, ultima = null) {
  const tengo = Object.keys(CANTOS).filter((e) => grabaciones[e]);
  if (!tengo.length) return null;
  const i = tengo.indexOf(ultima);
  return tengo[(i + 1) % tengo.length];
}

// Quién contesta: el individuo más cercano de la especie. `sujetos` es la lista de
// siempre ({ tipo, pos }). Contesta después de un momento, como un ave de verdad, que
// primero escucha.
export function quienContesta(especie, sujetos, pos, azar = Math.random) {
  let mejor = null;
  for (const s of sujetos || []) {
    if (s?.tipo !== especie || !s.pos) continue;
    const d = Math.hypot(s.pos.x - pos.x, s.pos.z - pos.z);
    if (d > ALCANCE_RESPUESTA) continue;
    if (!mejor || d < mejor.d) mejor = { pos: { x: s.pos.x, y: s.pos.y, z: s.pos.z }, d };
  }
  if (!mejor) return null;
  return { ...mejor, demora: 1.4 + azar() * 1.8 };
}

// Adónde viene el que se acerca: a unos metros tuyos, del lado de donde estaba.
export function adondeViene(desde, jugador, azar = Math.random) {
  const dx = desde.x - jugador.x, dz = desde.z - jugador.z;
  const d = Math.hypot(dx, dz) || 1;
  const r = 9 + azar() * 7;
  return { x: jugador.x + (dx / d) * r, z: jugador.z + (dz / d) * r };
}

export function sanearGrabaciones(v) {
  const s = {};
  if (!v || typeof v !== 'object') return s;
  for (const e of Object.keys(CANTOS)) if (v[e]) s[e] = { dia: Math.max(1, Math.floor(Number(v[e].dia) || 1)) };
  return s;
}
