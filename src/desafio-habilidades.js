// 4.10 guardian: las habilidades del guardián (módulo puro: sin THREE ni DOM; se prueba en Node).
//
// REGLA DE LOS PUNTOS: un punto por cada noche aguantada. Se gana al amanecer de una noche en que la base no cayó
// (y vos tampoco: si caés, la noche se pierde y no hay punto). Se gana una sola vez por noche, aunque se recargue la
// partida. Se gasta en el cuaderno (J, pestaña «Guardián»).
//
// Tres ramas chicas, dos habilidades por rama, tres niveles por habilidad. Subir al nivel 1 cuesta 1 punto; al 2,
// 2; al 3, 3. Para tener todo hay que juntar 36 puntos (más noches de las que dura una partida normal): no se
// llega a todo, se elige.
//
//   Tiro      Pulso firme  (daño y alcance)      Mano ligera  (menos espera entre disparos)
//   Reparar   Manos hábiles (repara más rápido y gasta menos)   Material justo (un material rinde más golpes de martillo)
//   Aguante   Corazón de coihue (más salud máxima y un poco menos de daño)   Pies de zorro (corrés más)
//
// Casi todo sale por los BONOS (desafio-bonos.js, origen 'habilidad'); lo que no es un bono (el martillo que rinde más y
// el daño que se esquiva) se lee con `golpesPorMaterial` y `menosDano`.
import { bonosNuevos, sumarBono, quitarBonosDeOrigen } from './desafio-bonos.js';

export const ORIGEN_HABILIDAD = 'habilidad';
export const NIVEL_MAX_HABILIDAD = 3;
export const COSTOS = [1, 2, 3];   // lo que cuesta llegar al nivel 1, 2 y 3

export const RAMAS = [
  { id: 'tiro', nombre: 'Tiro', texto: 'Pegar más fuerte, más lejos y más seguido.' },
  { id: 'reparar', nombre: 'Reparar', texto: 'Arreglar las defensas, de día y en plena noche.' },
  { id: 'aguante', nombre: 'Aguante', texto: 'Aguantar más y moverte mejor.' },
];

// `bonos`: lo que suma cada nivel (el nivel 1 es el primero) a cada clave de bono. `extra`: lo que no es un bono.
// `texto`: lo que se lee en el cuaderno para cada nivel.
export const HABILIDADES = {
  pulso: {
    rama: 'tiro', nombre: 'Pulso firme',
    descripcion: 'Las armas pegan más fuerte y llegan más lejos (arcos, hondas, rayo y también las de golpe).',
    bonos: [{ dano: 0.06, alcance: 0.05 }, { dano: 0.12, alcance: 0.10 }, { dano: 0.20, alcance: 0.15 }],
    texto: ['6 % más de daño y 5 % más de alcance', '12 % más de daño y 10 % más de alcance', '20 % más de daño y 15 % más de alcance'],
  },
  manoligera: {
    rama: 'tiro', nombre: 'Mano ligera',
    descripcion: 'Menos espera entre un disparo y el siguiente.',
    bonos: [{ recarga: 0.06 }, { recarga: 0.12 }, { recarga: 0.20 }],
    texto: ['6 % menos de espera entre ataques', '12 % menos de espera entre ataques', '20 % menos de espera entre ataques'],
  },
  manos: {
    rama: 'reparar', nombre: 'Manos hábiles',
    descripcion: 'Cada golpe de martillo repara más y las reparaciones piden menos material.',
    bonos: [{ reparar: 0.25 }, { reparar: 0.5 }, { reparar: 0.8 }],
    texto: ['Repara un 25 % más por golpe y por material', 'Repara un 50 % más por golpe y por material', 'Repara un 80 % más por golpe y por material'],
  },
  material: {
    rama: 'reparar', nombre: 'Material justo',
    descripcion: 'Un tronco o una piedra rinde más golpes de martillo.',
    extra: { golpesPorMaterial: [4, 5, 6] },   // (sin la habilidad, un material rinde 3 golpes)
    texto: ['Cada material rinde 4 golpes de martillo (en vez de 3)', 'Cada material rinde 5 golpes de martillo', 'Cada material rinde 6 golpes de martillo'],
  },
  corazon: {
    rama: 'aguante', nombre: 'Corazón de coihue',
    descripcion: 'Más salud y golpes que duelen un poco menos.',
    bonos: [{ saludMax: 10 }, { saludMax: 20 }, { saludMax: 35 }],
    extra: { menosDano: [0, 0.05, 0.10] },
    texto: ['10 puntos más de salud máxima', '20 puntos más de salud máxima y 5 % menos de daño recibido', '35 puntos más de salud máxima y 10 % menos de daño recibido'],
  },
  pies: {
    rama: 'aguante', nombre: 'Pies de zorro',
    descripcion: 'Corrés más rápido: para llegar a tiempo o para salir de apuros.',
    bonos: [{ correr: 0.04 }, { correr: 0.08 }, { correr: 0.13 }],
    texto: ['Corrés un 4 % más rápido', 'Corrés un 8 % más rápido', 'Corrés un 13 % más rápido'],
  },
};
export const IDS_HABILIDAD = Object.keys(HABILIDADES);
export const GOLPES_BASE_POR_MATERIAL = 3;

// ---------------------------------------------------------------- el estado (D().habilidades)
// puntos: lo que se puede gastar; noche: la última noche que dio punto; niveles: { id: 1..3 }.
export function habilidadesNuevas() { return { puntos: 0, noche: 0, niveles: {} }; }
export function sanearHabilidades(v) {
  const r = habilidadesNuevas();
  if (!v || typeof v !== 'object' || Array.isArray(v)) return r;
  const ent = (x, max) => { const n = Number(x); return x !== null && x !== '' && typeof x !== 'boolean' && Number.isFinite(n) ? Math.max(0, Math.min(max, Math.floor(n))) : 0; };
  r.puntos = ent(v.puntos, 99);
  r.noche = ent(v.noche, 99999);
  if (v.niveles && typeof v.niveles === 'object' && !Array.isArray(v.niveles)) {
    for (const id of IDS_HABILIDAD) {
      const n = ent(v.niveles[id], NIVEL_MAX_HABILIDAD);
      if (n > 0) r.niveles[id] = n;
    }
  }
  return r;
}

export function nivelDe(h, id) {
  if (!h || !Object.hasOwn(HABILIDADES, id) || !h.niveles || !Object.hasOwn(h.niveles, id)) return 0;
  return Math.max(0, Math.min(NIVEL_MAX_HABILIDAD, Math.floor(Number(h.niveles[id]) || 0)));
}
// Lo que cuesta subir al nivel siguiente (null si ya está al máximo o no existe).
export function costoSiguiente(h, id) {
  if (!Object.hasOwn(HABILIDADES, id)) return null;
  const n = nivelDe(h, id);
  return n >= NIVEL_MAX_HABILIDAD ? null : COSTOS[n];
}
export function puedeSubir(h, id) {
  if (!Object.hasOwn(HABILIDADES, id)) return { ok: false, razon: 'no existe' };
  const costo = costoSiguiente(h, id);
  if (costo === null) return { ok: false, razon: 'maximo' };
  if ((h?.puntos || 0) < costo) return { ok: false, razon: 'puntos', costo, faltan: costo - (h?.puntos || 0) };
  return { ok: true, costo };
}
export function puntosGastados(h) {
  let s = 0;
  for (const id of IDS_HABILIDAD) for (let i = 0; i < nivelDe(h, id); i++) s += COSTOS[i];
  return s;
}

// ---------------------------------------------------------------- los bonos
// Vuelve a poner los bonos del origen 'habilidad' según los niveles (se llama al subir y al abrir la partida).
export function aplicarHabilidadesABonos(d) {
  if (!d || typeof d !== 'object') return d;
  quitarBonosDeOrigen(d, ORIGEN_HABILIDAD);
  const h = d.habilidades;
  for (const id of IDS_HABILIDAD) {
    const n = nivelDe(h, id);
    const b = n > 0 ? HABILIDADES[id].bonos?.[n - 1] : null;
    if (b) for (const [clave, valor] of Object.entries(b)) sumarBono(d, ORIGEN_HABILIDAD, clave, valor);
  }
  if (!d.bonos) d.bonos = bonosNuevos();
  return d;
}

// Sube una habilidad si alcanzan los puntos. Devuelve { ok, nivel, costo } o { ok: false, razon }.
export function subirHabilidad(d, id) {
  if (!d.habilidades) d.habilidades = habilidadesNuevas();
  const h = d.habilidades, p = puedeSubir(h, id);
  if (!p.ok) return p;
  h.puntos -= p.costo;
  h.niveles[id] = nivelDe(h, id) + 1;
  aplicarHabilidadesABonos(d);
  return { ok: true, nivel: h.niveles[id], costo: p.costo };
}

// ---------------------------------------------------------------- los puntos por noche
// Un punto por noche aguantada. `noche` es el número de la noche que acaba de pasar (d.oleadas al amanecer). Sólo cuenta
// una vez por noche. Devuelve true si dio el punto.
export function puntoPorNoche(d, noche) {
  const n = Math.floor(Number(noche));
  if (!d || !Number.isFinite(n) || n < 1) return false;
  if (!d.habilidades) d.habilidades = habilidadesNuevas();
  const h = d.habilidades;
  if (n <= h.noche) return false;
  h.noche = n;
  h.puntos = Math.min(99, h.puntos + 1);
  return true;
}

// ---------------------------------------------------------------- lo que no es un bono
export function golpesPorMaterial(d) {
  const n = nivelDe(d?.habilidades, 'material');
  return n > 0 ? HABILIDADES.material.extra.golpesPorMaterial[n - 1] : GOLPES_BASE_POR_MATERIAL;
}
// Fracción del daño recibido que se esquiva (0 a 0,1).
export function menosDano(d) {
  const n = nivelDe(d?.habilidades, 'corazon');
  return n > 0 ? HABILIDADES.corazon.extra.menosDano[n - 1] : 0;
}
