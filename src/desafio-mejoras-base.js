// 4.10 base: las defensas que mejoran con las noches (reglas puras, se prueban en Node).
//
// Una defensa que aguanta varias noches se va curtiendo: gana experiencia y, hasta tres niveles, recibe menos daño y se
// repara un poco sola cuando sube de nivel. La experiencia viaja en la propia obra (`datos.curt`), así que si la defensa cae
// o se desarma se pierde con ella, y se guarda con la partida.
//
// Cuenta una noche cuando la defensa estuvo en pie desde el atardecer hasta el alba y en el medio recibió daño o participó
// (la ballesta que tiró). Los tres números de `datos.curt`:
//   n  las noches contadas (0 a CURTIDO.tope)
//   e  la noche en que la vio caer la tarde por última vez («estuvo en pie al anochecer»); -1: ninguna
//   t  1 si en esa noche recibió daño o participó
import { seRompe } from './desafio-roto.js';

export const CURTIDO = {
  // las noches contadas que hacen falta para el nivel 1, 2 y 3 (el índice es el nivel)
  noches: [0, 2, 4, 7],
  // lo que se multiplica el daño que recibe en cada nivel
  dano: [1, 0.9, 0.8, 0.7],
  // al subir de nivel, cuánto de su resistencia máxima recupera (es una mejora, no una reparación gratis)
  cura: 0.2,
  maximo: 3,
  tope: 7,   // las noches contadas no pasan de acá (el nivel 3 ya está en 7)
  cada: 1,   // cada cuántos segundos el mundo revisa qué obras hay que vestir con la marca
};

// ¿Esta obra puede curtirse? Lo mismo que se puede romper a la vista: las murallas, los portones, las torres y las máquinas
// (no las trampas que se gastan, ni lo que se pisa, ni lo oculto).
export const curtible = (plano) => seRompe(plano);

export function nivelPorNoches(n) {
  const c = Math.max(0, Math.floor(Number(n)) || 0);
  let nivel = 0;
  for (let i = 1; i <= CURTIDO.maximo; i++) if (c >= CURTIDO.noches[i]) nivel = i;
  return nivel;
}
export const nivelDe = (curt) => nivelPorNoches(curt?.n);
export function factorDano(nivel) {
  const i = Math.max(0, Math.min(CURTIDO.maximo, Math.floor(Number(nivel)) || 0));
  return CURTIDO.dano[i];
}
// Cuántas noches faltan para el nivel que viene (0 si ya está en el último).
export function nochesParaSubir(curt) {
  const nivel = nivelDe(curt);
  if (nivel >= CURTIDO.maximo) return 0;
  return CURTIDO.noches[nivel + 1] - (curt?.n || 0);
}

// Lo guardado en la obra: un objeto con tres números, o nada.
export function sanearCurtido(v) {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return undefined;
  const ent = (x, min, max, def) => { const n = Math.floor(Number(x)); return x === null || x === '' || typeof x === 'boolean' || !Number.isFinite(n) ? def : Math.max(min, Math.min(max, n)); };
  const n = ent(v.n, 0, CURTIDO.tope, 0), e = ent(v.e, -1, 1e6, -1), t = v.t ? 1 : 0;
  if (n === 0 && e < 0) return undefined;
  return { n, e, t };
}

// ---------------------------------------------------------------- el ciclo de una noche
// Al caer la noche: la defensa que está en pie queda anotada para esta noche (y todavía no recibió nada).
export function alAnochecer(curt, noche) {
  return { n: curt?.n || 0, e: Math.floor(noche), t: 0 };
}
// Recibió daño o participó: sólo cuenta si estaba anotada para esta noche.
export function tocar(curt, noche) {
  if (curt && curt.e === Math.floor(noche)) curt.t = 1;
  return curt;
}
// Con la primera luz: si estaba anotada, aguantó la noche y recibió daño o participó, suma una noche. Devuelve la obra
// con su experiencia nueva y si subió de nivel.
export function alAlba(curt, noche) {
  if (!curt || curt.e !== Math.floor(noche)) return { curt, subio: false, conto: false };
  const antes = nivelDe(curt);
  const conto = curt.t === 1;
  const nuevo = { n: conto ? Math.min(CURTIDO.tope, curt.n + 1) : curt.n, e: -1, t: 0 };
  const despues = nivelDe(nuevo);
  return { curt: nuevo.n > 0 ? nuevo : undefined, subio: despues > antes, nivel: despues, conto };
}

// ---------------------------------------------------------------- cómo se llama
// «Pirca curtida · nivel 2». El género sale de la primera palabra (casi todas las defensas son femeninas y terminan en a;
// el resto, las que no, están a mano).
const FEMENINAS = new Set(['torre', 'red', 'catapulta', 'ballesta', 'pirca', 'empalizada', 'campana', 'trampa', 'pasarela', 'rampa', 'losa', 'zanja']);
const MASCULINAS = new Set(['portón', 'muro', 'puente', 'espejo', 'tejado', 'puesto', 'contrafuerte', 'cerco', 'foso', 'pozo', 'barril', 'armero', 'señuelo']);
export function curtidoDe(nombre) {
  const p = String(nombre || '').trim().split(/\s+/)[0].toLowerCase();
  const plural = /s$/.test(p) && !FEMENINAS.has(p) && !MASCULINAS.has(p);
  const fem = FEMENINAS.has(p) || (!MASCULINAS.has(p) && /a$/.test(p));
  if (plural) return fem || /as$/.test(p) ? 'curtidas' : 'curtidos';
  return fem ? 'curtida' : 'curtido';
}
export function nombreCurtido(nombre, nivel) {
  const n = Math.max(0, Math.min(CURTIDO.maximo, Math.floor(Number(nivel)) || 0));
  const base = String(nombre || '').trim();
  return n > 0 ? `${base} ${curtidoDe(base)} · nivel ${n}` : base;
}
// El aviso cuando sube de nivel.
export function textoSubida(nombre, nivel) {
  const n = Math.max(1, Math.min(CURTIDO.maximo, Math.floor(Number(nivel)) || 1));
  const por = Math.round((1 - CURTIDO.dano[n]) * 100);
  return { titulo: nombreCurtido(nombre, n), texto: `Aguantó otra noche y se curtió: recibe ${por}% menos daño${n === CURTIDO.maximo ? ' (ya no sube más)' : ''}` };
}

// ---------------------------------------------------------------- la marca que se ve
// Una placa de madera con barritas de bronce (una por nivel) y, en el nivel 3, un adorno de ámbar. Las piezas están en el
// sistema de la obra (frente a -z); la placa va a media altura, pegada a la cara de adelante y a la de atrás.
export const PLACA = { ancho: 0.46, alto: 0.3, grueso: 0.045, y: 1.45, yMax: 0.62 };
// Dónde va: alto de la placa según la altura de la obra, y a qué distancia del centro (la mitad del fondo).
export function sitioDePlaca(plano) {
  const alto = Number(plano?.alto) || 1, fondo = Number(plano?.fondo) || 0.5;
  return { y: Math.min(PLACA.y, alto * PLACA.yMax), z: Math.min(2.5, Math.max(0.15, fondo / 2)) + PLACA.grueso / 2 };
}
// Las piezas de una placa del `nivel` (1 a 3), en el sistema de la placa, mirando a -z: { t, p, e, color, tipo }.
export function piezasDePlaca(nivel, piedra = false) {
  const n = Math.max(0, Math.min(CURTIDO.maximo, Math.floor(Number(nivel)) || 0));
  if (!n) return [];
  const tabla = piedra ? '#6f6a62' : '#7a5a3a';
  const marco = piedra ? '#4f4b45' : '#4a3b2c';
  const bronce = ['#b0793c', '#c89a48', '#e6c25a'][n - 1];
  const piezas = [
    { t: 'caja', p: [0, 0, 0], e: [PLACA.ancho, PLACA.alto, PLACA.grueso], color: tabla, tipo: piedra ? 4 : 0 },
    { t: 'caja', p: [0, PLACA.alto / 2 - 0.018, -0.008], e: [PLACA.ancho + 0.03, 0.036, PLACA.grueso + 0.016], color: marco, tipo: 0 },
    { t: 'caja', p: [0, -PLACA.alto / 2 + 0.018, -0.008], e: [PLACA.ancho + 0.03, 0.036, PLACA.grueso + 0.016], color: marco, tipo: 0 },
  ];
  // una barrita de bronce por nivel, de a una al lado de la otra
  for (let i = 0; i < n; i++) {
    const x = (i - (n - 1) / 2) * 0.115;
    piezas.push({ t: 'caja', p: [x, -0.01, -PLACA.grueso / 2 - 0.012], e: [0.06, 0.15, 0.024], color: bronce, tipo: 4 });
  }
  // el nivel 3: un rombo de ámbar arriba (una caja girada)
  if (n === CURTIDO.maximo) piezas.push({ t: 'caja', p: [0, 0.095, -PLACA.grueso / 2 - 0.016], e: [0.05, 0.05, 0.02], r: [0, 0, Math.PI / 4], color: '#f0b64a', tipo: 4 });
  return piezas;
}

// Las noches que le faltan al resumen de la pantalla de la base: cuántas defensas hay en cada nivel.
export function resumenNiveles(niveles) {
  const cuenta = [0, 0, 0, 0];
  for (const n of niveles || []) cuenta[Math.max(0, Math.min(CURTIDO.maximo, n | 0))]++;
  return cuenta;
}
